// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @title ITap
/// @notice Types, events and errors for Tap: USDC vaults with rule-based spending allowances.
interface ITap {
    /// @notice A spending allowance granted by a vault owner to a spender.
    /// @dev Periods are fixed windows of `periodLength` seconds counted from `start`.
    ///      `spentThisPeriod` belongs to period `periodIndex`; once the current period
    ///      index moves past it, the spent amount is treated as zero.
    struct Allowance {
        address owner;
        uint64 start;
        bool paused;
        bool revoked;
        address spender;
        uint64 periodLength;
        uint64 expiry; // 0 = never expires; otherwise unusable from this timestamp on
        uint64 periodIndex;
        uint256 amountPerPeriod;
        uint256 spentThisPeriod;
    }

    // ---------------------------------------------------------------- events

    event Deposited(address indexed owner, uint256 amount, uint256 newBalance);
    event Withdrawn(address indexed owner, uint256 amount, uint256 newBalance);

    event AllowanceCreated(
        uint256 indexed id,
        address indexed owner,
        address indexed spender,
        uint256 amountPerPeriod,
        uint64 periodLength,
        uint64 start,
        uint64 expiry
    );
    event AllowanceEdited(
        uint256 indexed id, uint256 amountPerPeriod, uint64 periodLength, uint64 start, uint64 expiry
    );
    event AllowancePaused(uint256 indexed id);
    event AllowanceUnpaused(uint256 indexed id);
    event AllowanceRevoked(uint256 indexed id);

    event Spent(
        uint256 indexed id,
        address indexed owner,
        address indexed spender,
        address to,
        uint256 amount,
        uint64 periodIndex,
        uint256 spentThisPeriod
    );

    // ---------------------------------------------------------------- errors

    error ZeroAmount();
    error ZeroAddress();
    error ZeroPeriod();
    error InvalidExpiry();
    error InvalidToken();
    error InsufficientVaultBalance(uint256 available, uint256 requested);
    error AllowanceNotFound(uint256 id);
    error NotOwner(uint256 id, address caller);
    error NotSpender(uint256 id, address caller);
    error NotStarted(uint256 id, uint64 start);
    error Expired(uint256 id, uint64 expiry);
    error Paused(uint256 id);
    error NotPaused(uint256 id);
    error Revoked(uint256 id);
    error LimitExceeded(uint256 id, uint256 remaining, uint256 requested);

    // ---------------------------------------------------------------- vault

    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function vaultBalance(address owner) external view returns (uint256);

    // ---------------------------------------------------------------- allowances

    function createAllowance(
        address spender,
        uint256 amountPerPeriod,
        uint64 periodLength,
        uint64 start,
        uint64 expiry
    ) external returns (uint256 id);
    function editAllowance(uint256 id, uint256 amountPerPeriod, uint64 periodLength, uint64 expiry) external;
    function pause(uint256 id) external;
    function unpause(uint256 id) external;
    function revoke(uint256 id) external;
    function spend(uint256 id, address to, uint256 amount) external;

    // ---------------------------------------------------------------- views

    function getAllowance(uint256 id) external view returns (Allowance memory);
    function allowanceCount() external view returns (uint256);
    function allowancesByOwner(address owner) external view returns (uint256[] memory);
    function allowancesBySpender(address spender) external view returns (uint256[] memory);
    function currentPeriod(uint256 id)
        external
        view
        returns (uint64 index, uint64 periodStart, uint64 periodEnd);
    function remaining(uint256 id) external view returns (uint256);
    function spendable(uint256 id) external view returns (uint256);
}
