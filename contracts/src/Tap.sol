// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuardTransient} from "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";

import {ITap} from "./interfaces/ITap.sol";

/// @title Tap
/// @notice Owners lock USDC in a vault and grant spenders recurring, rule-bound allowances.
/// @dev Vault balances live only in `vaultBalance`; the contract never reads its own token
///      balance, so tokens sent here directly are not credited to anyone. Allowances do not
///      reserve funds: every spend is checked against both the allowance and the vault.
///      All amounts use the USDC ERC-20 interface (6 decimals). The contract has no payable
///      functions and no receive/fallback, so native value sent to it reverts.
contract Tap is ITap, ReentrancyGuardTransient {
    using SafeERC20 for IERC20;

    // forge-lint: disable-next-line(screaming-snake-case-immutable)
    IERC20 public immutable usdc;

    mapping(address owner => uint256 balance) public vaultBalance;

    uint256 public allowanceCount;

    mapping(uint256 id => Allowance) private _allowances;
    mapping(address owner => uint256[] ids) private _byOwner;
    mapping(address spender => uint256[] ids) private _bySpender;

    constructor(IERC20 usdc_) {
        if (address(usdc_) == address(0)) revert ZeroAddress();
        if (IERC20Metadata(address(usdc_)).decimals() != 6) revert InvalidToken();
        usdc = usdc_;
    }

    // ------------------------------------------------------------------ vault

    /// @notice Move `amount` USDC from the caller into their vault. Requires prior approval.
    function deposit(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        uint256 newBalance = vaultBalance[msg.sender] + amount;
        vaultBalance[msg.sender] = newBalance;
        emit Deposited(msg.sender, amount, newBalance);
        usdc.safeTransferFrom(msg.sender, address(this), amount);
    }

    /// @notice Move `amount` USDC from the caller's vault back to the caller.
    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        uint256 balance = vaultBalance[msg.sender];
        if (amount > balance) revert InsufficientVaultBalance(balance, amount);
        uint256 newBalance = balance - amount;
        vaultBalance[msg.sender] = newBalance;
        emit Withdrawn(msg.sender, amount, newBalance);
        usdc.safeTransfer(msg.sender, amount);
    }

    // ------------------------------------------------------------------ allowances

    /// @notice Let `spender` spend up to `amountPerPeriod` from the caller's vault every
    ///         `periodLength` seconds, counted from `start` (0 = now), until `expiry` (0 = never).
    function createAllowance(
        address spender,
        uint256 amountPerPeriod,
        uint64 periodLength,
        uint64 start,
        uint64 expiry
    ) external nonReentrant returns (uint256 id) {
        if (spender == address(0)) revert ZeroAddress();
        _checkTerms(amountPerPeriod, periodLength);
        if (start == 0) start = uint64(block.timestamp);
        _checkExpiry(start, expiry);

        id = ++allowanceCount;
        _allowances[id] = Allowance({
            owner: msg.sender,
            start: start,
            paused: false,
            revoked: false,
            spender: spender,
            periodLength: periodLength,
            expiry: expiry,
            periodIndex: 0,
            amountPerPeriod: amountPerPeriod,
            spentThisPeriod: 0
        });
        _byOwner[msg.sender].push(id);
        _bySpender[spender].push(id);

        emit AllowanceCreated(id, msg.sender, spender, amountPerPeriod, periodLength, start, expiry);
    }

    /// @notice Change an allowance's limit, period length and expiry. The spender cannot be
    ///         changed; grant a new allowance instead.
    /// @dev Lowering the limit below what was spent this period leaves 0 remaining.
    ///      Changing `periodLength` starts a fresh period (nothing spent) from now, or from
    ///      `start` if the allowance has not started yet.
    function editAllowance(uint256 id, uint256 amountPerPeriod, uint64 periodLength, uint64 expiry)
        external
        nonReentrant
    {
        Allowance storage a = _ownedLive(id);
        _checkTerms(amountPerPeriod, periodLength);

        uint64 start = a.start;
        if (periodLength != a.periodLength) {
            if (start < block.timestamp) start = uint64(block.timestamp);
            a.start = start;
            a.periodLength = periodLength;
            a.periodIndex = 0;
            a.spentThisPeriod = 0;
        }
        _checkExpiry(start, expiry);
        a.amountPerPeriod = amountPerPeriod;
        a.expiry = expiry;

        emit AllowanceEdited(id, amountPerPeriod, periodLength, start, expiry);
    }

    /// @notice Stop spending on an allowance until it is unpaused. Periods keep rolling.
    function pause(uint256 id) external nonReentrant {
        Allowance storage a = _ownedLive(id);
        if (a.paused) revert Paused(id);
        a.paused = true;
        emit AllowancePaused(id);
    }

    /// @notice Resume a paused allowance.
    function unpause(uint256 id) external nonReentrant {
        Allowance storage a = _ownedLive(id);
        if (!a.paused) revert NotPaused(id);
        a.paused = false;
        emit AllowanceUnpaused(id);
    }

    /// @notice Permanently disable an allowance. It cannot be edited or re-enabled afterwards.
    function revoke(uint256 id) external nonReentrant {
        Allowance storage a = _ownedLive(id);
        a.revoked = true;
        emit AllowanceRevoked(id);
    }

    /// @notice Spend `amount` from allowance `id`, sending it to `to`. Only the spender may call.
    function spend(uint256 id, address to, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (to == address(0)) revert ZeroAddress();
        Allowance storage a = _get(id);
        if (msg.sender != a.spender) revert NotSpender(id, msg.sender);
        if (a.revoked) revert Revoked(id);
        if (a.paused) revert Paused(id);
        if (block.timestamp < a.start) revert NotStarted(id, a.start);
        if (_isExpired(a)) revert Expired(id, a.expiry);

        uint64 index = _periodIndex(a);
        uint256 spent = _spentIn(a, index);
        uint256 left = _remaining(a.amountPerPeriod, spent);
        if (amount > left) revert LimitExceeded(id, left, amount);

        address owner = a.owner;
        uint256 balance = vaultBalance[owner];
        if (amount > balance) revert InsufficientVaultBalance(balance, amount);

        spent += amount;
        a.periodIndex = index;
        a.spentThisPeriod = spent;
        vaultBalance[owner] = balance - amount;
        emit Spent(id, owner, msg.sender, to, amount, index, spent);

        usdc.safeTransfer(to, amount);
    }

    // ------------------------------------------------------------------ views

    function getAllowance(uint256 id) external view returns (Allowance memory) {
        return _get(id);
    }

    function allowancesByOwner(address owner) external view returns (uint256[] memory) {
        return _byOwner[owner];
    }

    function allowancesBySpender(address spender) external view returns (uint256[] memory) {
        return _bySpender[spender];
    }

    /// @notice The current period's index and its [periodStart, periodEnd) window.
    ///         Before `start`, this describes period 0.
    function currentPeriod(uint256 id)
        external
        view
        returns (uint64 index, uint64 periodStart, uint64 periodEnd)
    {
        Allowance storage a = _get(id);
        index = _periodIndex(a);
        periodStart = a.start + index * a.periodLength;
        uint256 end = uint256(periodStart) + a.periodLength;
        // forge-lint: disable-next-line(unsafe-typecast) -- saturated to uint64 max just above
        periodEnd = end > type(uint64).max ? type(uint64).max : uint64(end);
    }

    /// @notice What is left of this period's limit, ignoring vault balance and status.
    function remaining(uint256 id) external view returns (uint256) {
        Allowance storage a = _get(id);
        return _remaining(a.amountPerPeriod, _spentIn(a, _periodIndex(a)));
    }

    /// @notice What the spender could spend right now: 0 if the allowance is not usable,
    ///         otherwise the smaller of the remaining limit and the owner's vault balance.
    function spendable(uint256 id) external view returns (uint256) {
        Allowance storage a = _get(id);
        if (a.revoked || a.paused || block.timestamp < a.start || _isExpired(a)) return 0;
        uint256 left = _remaining(a.amountPerPeriod, _spentIn(a, _periodIndex(a)));
        uint256 balance = vaultBalance[a.owner];
        return left < balance ? left : balance;
    }

    // ------------------------------------------------------------------ internal

    function _get(uint256 id) private view returns (Allowance storage a) {
        a = _allowances[id];
        if (a.owner == address(0)) revert AllowanceNotFound(id);
    }

    /// @dev An existing, non-revoked allowance owned by the caller.
    function _ownedLive(uint256 id) private view returns (Allowance storage a) {
        a = _get(id);
        if (msg.sender != a.owner) revert NotOwner(id, msg.sender);
        if (a.revoked) revert Revoked(id);
    }

    function _checkTerms(uint256 amountPerPeriod, uint64 periodLength) private pure {
        if (amountPerPeriod == 0) revert ZeroAmount();
        if (periodLength == 0) revert ZeroPeriod();
    }

    /// @dev Expiry is 0 (never) or strictly after both the start and the current time.
    function _checkExpiry(uint64 start, uint64 expiry) private view {
        if (expiry != 0 && (expiry <= start || expiry <= block.timestamp)) revert InvalidExpiry();
    }

    function _isExpired(Allowance storage a) private view returns (bool) {
        return a.expiry != 0 && block.timestamp >= a.expiry;
    }

    /// @dev Periods are fixed windows from `start`. Uses only `>=`/division on timestamps,
    ///      so equal timestamps across blocks always land in the same period.
    function _periodIndex(Allowance storage a) private view returns (uint64) {
        if (block.timestamp < a.start) return 0;
        return uint64((block.timestamp - a.start) / a.periodLength);
    }

    /// @dev The amount spent in period `index`: the stored amount belongs to `a.periodIndex` only.
    function _spentIn(Allowance storage a, uint64 index) private view returns (uint256) {
        return index == a.periodIndex ? a.spentThisPeriod : 0;
    }

    /// @dev Saturating: a limit lowered below what was already spent leaves 0, never underflows.
    function _remaining(uint256 limit, uint256 spent) private pure returns (uint256) {
        return limit > spent ? limit - spent : 0;
    }
}
