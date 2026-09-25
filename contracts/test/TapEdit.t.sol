// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {TapTestBase} from "./TapTestBase.sol";
import {ITap} from "../src/interfaces/ITap.sol";

contract TapEditTest is TapTestBase {
    uint256 internal id;

    function setUp() public override {
        super.setUp();
        _deposit(owner, 100 * USDC);
        id = _createWeekly(); // 20 USDC / 7 days from T0
    }

    function _edit(uint256 amount, uint64 period, uint64 expiry) internal {
        vm.prank(owner);
        tap.editAllowance(id, amount, period, expiry);
    }

    function test_Edit_RaiseLimitKeepsSpent() public {
        _spend(id, 15 * USDC);
        vm.expectEmit(address(tap));
        emit ITap.AllowanceEdited(id, 50 * USDC, WEEK, T0, 0);
        _edit(50 * USDC, WEEK, 0);

        ITap.Allowance memory a = tap.getAllowance(id);
        assertEq(a.amountPerPeriod, 50 * USDC);
        assertEq(a.spentThisPeriod, 15 * USDC);
        assertEq(tap.remaining(id), 35 * USDC);
        _spend(id, 35 * USDC);
    }

    function test_Edit_LowerLimitAboveSpent() public {
        _spend(id, 5 * USDC);
        _edit(8 * USDC, WEEK, 0);
        assertEq(tap.remaining(id), 3 * USDC);
    }

    function test_Edit_LowerLimitBelowSpentLeavesZeroRemaining() public {
        _spend(id, 15 * USDC);
        _edit(10 * USDC, WEEK, 0);

        assertEq(tap.remaining(id), 0, "never underflows");
        assertEq(tap.spendable(id), 0);
        vm.prank(spender);
        vm.expectRevert(abi.encodeWithSelector(ITap.LimitExceeded.selector, id, 0, 1));
        tap.spend(id, recipient, 1);

        // Next period the new, lower limit applies in full.
        vm.warp(T0 + WEEK);
        assertEq(tap.remaining(id), 10 * USDC);
        _spend(id, 10 * USDC);
    }

    function test_Edit_LowerLimitToExactlySpent() public {
        _spend(id, 15 * USDC);
        _edit(15 * USDC, WEEK, 0);
        assertEq(tap.remaining(id), 0);
    }

    function test_Edit_SamePeriodKeepsWindows() public {
        vm.warp(T0 + 3 * DAY);
        _spend(id, 20 * USDC);
        _edit(30 * USDC, WEEK, 0);
        assertEq(tap.getAllowance(id).start, T0);
        (, uint64 periodStart, uint64 periodEnd) = tap.currentPeriod(id);
        assertEq(periodStart, T0);
        assertEq(periodEnd, T0 + WEEK);
    }

    function test_Edit_ChangingPeriodStartsFreshPeriodFromNow() public {
        vm.warp(T0 + 3 * DAY);
        _spend(id, 20 * USDC);

        vm.expectEmit(address(tap));
        emit ITap.AllowanceEdited(id, 20 * USDC, DAY, T0 + 3 * DAY, 0);
        _edit(20 * USDC, DAY, 0);

        ITap.Allowance memory a = tap.getAllowance(id);
        assertEq(a.start, T0 + 3 * DAY);
        assertEq(a.periodLength, DAY);
        assertEq(a.periodIndex, 0);
        assertEq(a.spentThisPeriod, 0);
        (uint64 index, uint64 periodStart, uint64 periodEnd) = tap.currentPeriod(id);
        assertEq(index, 0);
        assertEq(periodStart, T0 + 3 * DAY);
        assertEq(periodEnd, T0 + 4 * DAY);

        _spend(id, 20 * USDC);
        vm.warp(T0 + 4 * DAY - 1);
        assertEq(tap.remaining(id), 0);
        vm.warp(T0 + 4 * DAY);
        assertEq(tap.remaining(id), 20 * USDC);
    }

    function test_Edit_ChangingPeriodAfterIdlePeriods() public {
        _spend(id, 20 * USDC);
        vm.warp(T0 + 5 * WEEK + 2 * DAY);
        _edit(20 * USDC, 30 * DAY, 0);
        ITap.Allowance memory a = tap.getAllowance(id);
        assertEq(a.start, T0 + 5 * WEEK + 2 * DAY);
        assertEq(a.periodIndex, 0);
        assertEq(tap.remaining(id), 20 * USDC);
    }

    function test_Edit_ChangingPeriodBeforeStartKeepsFutureStart() public {
        vm.prank(owner);
        uint256 future = tap.createAllowance(spender, 20 * USDC, WEEK, T0 + 10 * DAY, 0);
        vm.prank(owner);
        tap.editAllowance(future, 20 * USDC, DAY, 0);
        assertEq(tap.getAllowance(future).start, T0 + 10 * DAY);
        assertEq(tap.getAllowance(future).periodLength, DAY);
    }

    function test_Edit_SpenderIsImmutable() public {
        _edit(99 * USDC, DAY, T0 + 30 * DAY);
        assertEq(tap.getAllowance(id).spender, spender);
        assertEq(tap.getAllowance(id).owner, owner);

        // The old spender keeps access; a different spender needs a new allowance.
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(ITap.NotSpender.selector, id, stranger));
        tap.spend(id, recipient, 1);

        vm.prank(owner);
        uint256 fresh = tap.createAllowance(stranger, 99 * USDC, DAY, 0, 0);
        vm.prank(stranger);
        tap.spend(fresh, recipient, 1);
        _spend(id, 1);
    }

    function test_Edit_SetAndClearExpiry() public {
        _edit(20 * USDC, WEEK, T0 + DAY);
        assertEq(tap.getAllowance(id).expiry, T0 + DAY);
        vm.warp(T0 + DAY);
        vm.prank(spender);
        vm.expectRevert(abi.encodeWithSelector(ITap.Expired.selector, id, T0 + DAY));
        tap.spend(id, recipient, 1);

        // An expired allowance can be extended by the owner.
        _edit(20 * USDC, WEEK, 0);
        _spend(id, 1);
    }

    function test_Edit_KeepsPausedState() public {
        vm.prank(owner);
        tap.pause(id);
        _edit(50 * USDC, WEEK, 0);
        assertTrue(tap.getAllowance(id).paused);
    }

    function test_Edit_RevertsOnZeroAmount() public {
        vm.prank(owner);
        vm.expectRevert(ITap.ZeroAmount.selector);
        tap.editAllowance(id, 0, WEEK, 0);
    }

    function test_Edit_RevertsOnZeroPeriod() public {
        vm.prank(owner);
        vm.expectRevert(ITap.ZeroPeriod.selector);
        tap.editAllowance(id, 20 * USDC, 0, 0);
    }

    function test_Edit_RevertsOnPastExpiry() public {
        vm.warp(T0 + DAY);
        vm.startPrank(owner);
        vm.expectRevert(ITap.InvalidExpiry.selector);
        tap.editAllowance(id, 20 * USDC, WEEK, T0 + DAY);
        vm.expectRevert(ITap.InvalidExpiry.selector);
        tap.editAllowance(id, 20 * USDC, WEEK, T0 + 1);
        vm.stopPrank();
    }
}
