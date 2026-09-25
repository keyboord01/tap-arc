// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {TapTestBase} from "./TapTestBase.sol";
import {ITap} from "../src/interfaces/ITap.sol";

contract TapFuzzTest is TapTestBase {
    uint256 internal constant FUNDS = 1_000_000_000 * USDC;

    function setUp() public override {
        super.setUp();
        usdc.mint(owner, FUNDS);
        _deposit(owner, FUNDS);
    }

    function _create(uint256 limit, uint64 period, uint64 start) internal returns (uint256 id) {
        vm.prank(owner);
        id = tap.createAllowance(spender, limit, period, start, 0);
    }

    /// @dev Period index and window bounds follow (now - start) / periodLength exactly.
    function testFuzz_PeriodMath(uint64 period, uint64 elapsed, uint64 startOffset) public {
        period = uint64(bound(period, 1, 3650 days));
        startOffset = uint64(bound(startOffset, 0, 365 days));
        elapsed = uint64(bound(elapsed, 0, 100 * 365 days));
        uint64 start = T0 - startOffset;
        uint256 id = _create(1 * USDC, period, start);

        vm.warp(uint256(start) + elapsed);
        (uint64 index, uint64 periodStart, uint64 periodEnd) = tap.currentPeriod(id);
        assertEq(index, elapsed / period);
        assertEq(periodStart, start + index * period);
        assertEq(periodEnd, periodStart + period);
        assertLe(periodStart, block.timestamp);
        assertGt(periodEnd, block.timestamp);
    }

    /// @dev A full spend is blocked one second before the boundary and fully reset on it.
    function testFuzz_RolloverBoundary(uint64 period, uint256 limit, uint32 k) public {
        period = uint64(bound(period, 1, 365 days));
        limit = bound(limit, 1, 1_000_000 * USDC);
        k = uint32(bound(k, 1, 1_000));
        uint256 id = _create(limit, period, 0);
        _spend(id, limit);

        uint256 boundary = uint256(T0) + uint256(k) * period;
        vm.warp(boundary - 1);
        if (k == 1) assertEq(tap.remaining(id), 0);
        else assertEq(tap.remaining(id), limit); // an earlier window already reset it

        vm.warp(boundary);
        assertEq(tap.remaining(id), limit);
        _spend(id, limit);
        assertEq(tap.remaining(id), 0);
        assertEq(tap.getAllowance(id).periodIndex, k);
    }

    /// @dev Random spends at random (possibly repeated) timestamps never exceed the per-period limit
    ///      and succeed exactly when a reference model says they should.
    function testFuzz_SpendMatchesModel(
        uint256 limit,
        uint64 period,
        uint256[12] memory amounts,
        uint64[12] memory gaps
    ) public {
        limit = bound(limit, 1, 10_000 * USDC);
        period = uint64(bound(period, 1, 30 days));
        uint256 id = _create(limit, period, 0);

        uint256 modelIndex;
        uint256 modelSpent;
        uint256 totalSpent;
        for (uint256 i = 0; i < amounts.length; i++) {
            vm.warp(block.timestamp + bound(gaps[i], 0, uint256(period) * 2)); // 0 = repeated timestamp
            vm.roll(block.number + 1);
            uint256 amount = bound(amounts[i], 1, limit + limit / 2 + 1);

            uint256 index = (block.timestamp - T0) / period;
            if (index != modelIndex) {
                modelIndex = index;
                modelSpent = 0;
            }

            if (modelSpent + amount <= limit) {
                _spend(id, amount);
                modelSpent += amount;
                totalSpent += amount;
            } else {
                vm.prank(spender);
                vm.expectRevert(
                    abi.encodeWithSelector(ITap.LimitExceeded.selector, id, limit - modelSpent, amount)
                );
                tap.spend(id, recipient, amount);
            }
            assertEq(tap.remaining(id), limit - modelSpent);
            assertLe(modelSpent, limit);
        }
        assertEq(usdc.balanceOf(recipient), totalSpent);
        assertEq(tap.vaultBalance(owner), FUNDS - totalSpent);
    }

    /// @dev Editing the limit below what was already spent never underflows.
    function testFuzz_EditLimitRemaining(uint256 limit, uint256 spent, uint256 newLimit) public {
        limit = bound(limit, 1, 1_000_000 * USDC);
        spent = bound(spent, 1, limit);
        newLimit = bound(newLimit, 1, 2_000_000 * USDC);
        uint256 id = _create(limit, WEEK, 0);
        _spend(id, spent);

        vm.prank(owner);
        tap.editAllowance(id, newLimit, WEEK, 0);
        assertEq(tap.remaining(id), newLimit > spent ? newLimit - spent : 0);
    }

    /// @dev Spends move exactly `amount` out of the vault and token balances stay consistent.
    function testFuzz_SpendAccounting(uint256 vault, uint256 amount) public {
        vm.prank(owner);
        tap.withdraw(FUNDS); // leave only the initial setUp funds out of the picture
        vault = bound(vault, 1, 1_000 * USDC);
        amount = bound(amount, 1, 2_000 * USDC);
        usdc.mint(owner, vault);
        _deposit(owner, vault);
        uint256 id = _create(type(uint128).max, WEEK, 0);

        if (amount > vault) {
            vm.prank(spender);
            vm.expectRevert(abi.encodeWithSelector(ITap.InsufficientVaultBalance.selector, vault, amount));
            tap.spend(id, recipient, amount);
            assertEq(tap.spendable(id), vault);
        } else {
            _spend(id, amount);
            assertEq(tap.vaultBalance(owner), vault - amount);
            assertEq(usdc.balanceOf(address(tap)), vault - amount);
            assertEq(usdc.balanceOf(recipient), amount);
        }
    }
}
