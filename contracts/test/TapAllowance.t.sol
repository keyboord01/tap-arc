// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {TapTestBase} from "./TapTestBase.sol";
import {ITap} from "../src/interfaces/ITap.sol";

contract TapAllowanceTest is TapTestBase {
    function setUp() public override {
        super.setUp();
        _deposit(owner, 100 * USDC);
    }

    // ------------------------------------------------------------ create

    function test_Create_StoresFieldsAndEmits() public {
        uint64 expiry = T0 + 30 * DAY;
        vm.expectEmit(address(tap));
        emit ITap.AllowanceCreated(1, owner, spender, 20 * USDC, WEEK, T0, expiry);
        vm.prank(owner);
        uint256 id = tap.createAllowance(spender, 20 * USDC, WEEK, 0, expiry);

        assertEq(id, 1);
        assertEq(tap.allowanceCount(), 1);
        ITap.Allowance memory a = tap.getAllowance(id);
        assertEq(a.owner, owner);
        assertEq(a.spender, spender);
        assertEq(a.amountPerPeriod, 20 * USDC);
        assertEq(a.periodLength, WEEK);
        assertEq(a.start, T0, "start 0 means now");
        assertEq(a.expiry, expiry);
        assertFalse(a.paused);
        assertFalse(a.revoked);
        assertEq(a.spentThisPeriod, 0);
        assertEq(a.periodIndex, 0);
    }

    function test_Create_IdsIncrement() public {
        assertEq(_createWeekly(), 1);
        assertEq(_createWeekly(), 2);
        assertEq(tap.allowanceCount(), 2);
    }

    function test_Create_WithFutureStart() public {
        vm.prank(owner);
        uint256 id = tap.createAllowance(spender, 20 * USDC, WEEK, T0 + DAY, 0);
        assertEq(tap.getAllowance(id).start, T0 + DAY);
    }

    function test_Create_DoesNotRequireFunds() public {
        // Allowances are promises, not locks: total promised may exceed the vault.
        vm.startPrank(owner);
        tap.createAllowance(spender, 80 * USDC, WEEK, 0, 0);
        tap.createAllowance(stranger, 80 * USDC, WEEK, 0, 0);
        tap.createAllowance(recipient, 1_000_000 * USDC, WEEK, 0, 0);
        vm.stopPrank();
        assertEq(tap.vaultBalance(owner), 100 * USDC);

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(ITap.NotSpender.selector, 1, stranger));
        tap.spend(1, recipient, 1);
    }

    function test_Create_RevertsOnZeroSpender() public {
        vm.prank(owner);
        vm.expectRevert(ITap.ZeroAddress.selector);
        tap.createAllowance(address(0), 20 * USDC, WEEK, 0, 0);
    }

    function test_Create_RevertsOnZeroAmount() public {
        vm.prank(owner);
        vm.expectRevert(ITap.ZeroAmount.selector);
        tap.createAllowance(spender, 0, WEEK, 0, 0);
    }

    function test_Create_RevertsOnZeroPeriod() public {
        vm.prank(owner);
        vm.expectRevert(ITap.ZeroPeriod.selector);
        tap.createAllowance(spender, 20 * USDC, 0, 0, 0);
    }

    function test_Create_RevertsOnExpiryNotAfterStart() public {
        vm.startPrank(owner);
        vm.expectRevert(ITap.InvalidExpiry.selector);
        tap.createAllowance(spender, 20 * USDC, WEEK, 0, T0); // expiry == start
        vm.expectRevert(ITap.InvalidExpiry.selector);
        tap.createAllowance(spender, 20 * USDC, WEEK, T0 + 10 * DAY, T0 + 5 * DAY);
        vm.expectRevert(ITap.InvalidExpiry.selector);
        tap.createAllowance(spender, 20 * USDC, WEEK, T0 - 10 * DAY, T0 - 1); // already expired
        vm.stopPrank();
    }

    // ------------------------------------------------------------ spend / limits

    function test_Spend_TransfersAndEmits() public {
        uint256 id = _createWeekly();
        vm.expectEmit(address(tap));
        emit ITap.Spent(id, owner, spender, recipient, 5 * USDC, 0, 5 * USDC);
        _spend(id, 5 * USDC);

        assertEq(usdc.balanceOf(recipient), 5 * USDC);
        assertEq(tap.vaultBalance(owner), 95 * USDC);
        assertEq(tap.remaining(id), 15 * USDC);
        assertEq(tap.getAllowance(id).spentThisPeriod, 5 * USDC);
    }

    function test_Spend_UpToExactLimit() public {
        uint256 id = _createWeekly();
        _spend(id, 12 * USDC);
        _spend(id, 8 * USDC);
        assertEq(tap.remaining(id), 0);
        assertEq(tap.spendable(id), 0);
    }

    function test_Spend_RevertsOverLimit() public {
        uint256 id = _createWeekly();
        _spend(id, 15 * USDC);
        vm.prank(spender);
        vm.expectRevert(abi.encodeWithSelector(ITap.LimitExceeded.selector, id, 5 * USDC, 5 * USDC + 1));
        tap.spend(id, recipient, 5 * USDC + 1);
    }

    function test_Spend_RevertsOverLimitInOneShot() public {
        uint256 id = _createWeekly();
        vm.prank(spender);
        vm.expectRevert(abi.encodeWithSelector(ITap.LimitExceeded.selector, id, 20 * USDC, 21 * USDC));
        tap.spend(id, recipient, 21 * USDC);
    }

    function test_Spend_SmallestUnitOverLimitReverts() public {
        uint256 id = _createWeekly();
        _spend(id, 20 * USDC - 1); // 19.999999 USDC
        _spend(id, 1); // 0.000001 USDC
        vm.prank(spender);
        vm.expectRevert(abi.encodeWithSelector(ITap.LimitExceeded.selector, id, 0, 1));
        tap.spend(id, recipient, 1);
    }

    function test_Spend_RevertsOnZeroAmount() public {
        uint256 id = _createWeekly();
        vm.prank(spender);
        vm.expectRevert(ITap.ZeroAmount.selector);
        tap.spend(id, recipient, 0);
    }

    function test_Spend_RevertsOnZeroRecipient() public {
        uint256 id = _createWeekly();
        vm.prank(spender);
        vm.expectRevert(ITap.ZeroAddress.selector);
        tap.spend(id, address(0), 1 * USDC);
    }

    function test_Spend_RevertsOnUnknownId() public {
        vm.prank(spender);
        vm.expectRevert(abi.encodeWithSelector(ITap.AllowanceNotFound.selector, 42));
        tap.spend(42, recipient, 1 * USDC);
    }

    function test_Spend_RevertsWhenVaultShort() public {
        vm.prank(owner);
        tap.withdraw(95 * USDC);
        uint256 id = _createWeekly();

        vm.prank(spender);
        vm.expectRevert(abi.encodeWithSelector(ITap.InsufficientVaultBalance.selector, 5 * USDC, 6 * USDC));
        tap.spend(id, recipient, 6 * USDC);

        assertEq(tap.remaining(id), 20 * USDC, "failed spend must not consume the limit");
        assertEq(tap.spendable(id), 5 * USDC);
        _spend(id, 5 * USDC);
    }

    function test_Spend_SharedVaultAcrossAllowances() public {
        vm.startPrank(owner);
        tap.withdraw(70 * USDC); // 30 USDC left
        uint256 a = tap.createAllowance(spender, 20 * USDC, WEEK, 0, 0);
        uint256 b = tap.createAllowance(stranger, 20 * USDC, WEEK, 0, 0);
        vm.stopPrank();

        _spend(a, 20 * USDC);
        assertEq(tap.spendable(b), 10 * USDC);
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(ITap.InsufficientVaultBalance.selector, 10 * USDC, 20 * USDC));
        tap.spend(b, recipient, 20 * USDC);
    }

    function test_Spend_RevertsWhenRecipientBlocklisted() public {
        uint256 id = _createWeekly();
        usdc.setBlocked(recipient, true);
        vm.prank(spender);
        vm.expectRevert();
        tap.spend(id, recipient, 1 * USDC);
        assertEq(tap.vaultBalance(owner), 100 * USDC);
        assertEq(tap.remaining(id), 20 * USDC);
    }

    function test_Spend_SpenderCanPayThemselves() public {
        uint256 id = _createWeekly();
        vm.prank(spender);
        tap.spend(id, spender, 3 * USDC);
        assertEq(usdc.balanceOf(spender), 3 * USDC);
    }

    // ------------------------------------------------------------ period rollover

    function test_Rollover_ResetsAtExactBoundary() public {
        uint256 id = _createWeekly();
        _spend(id, 20 * USDC);

        vm.warp(T0 + WEEK - 1);
        assertEq(tap.remaining(id), 0);
        vm.prank(spender);
        vm.expectRevert(abi.encodeWithSelector(ITap.LimitExceeded.selector, id, 0, 1));
        tap.spend(id, recipient, 1);

        vm.warp(T0 + WEEK);
        assertEq(tap.remaining(id), 20 * USDC);
        vm.expectEmit(address(tap));
        emit ITap.Spent(id, owner, spender, recipient, 20 * USDC, 1, 20 * USDC);
        _spend(id, 20 * USDC);
        assertEq(tap.getAllowance(id).periodIndex, 1);
    }

    function test_Rollover_UnusedAmountDoesNotCarryOver() public {
        uint256 id = _createWeekly();
        _spend(id, 5 * USDC);
        vm.warp(T0 + WEEK);
        vm.prank(spender);
        vm.expectRevert(abi.encodeWithSelector(ITap.LimitExceeded.selector, id, 20 * USDC, 21 * USDC));
        tap.spend(id, recipient, 21 * USDC);
    }

    function test_Rollover_SkipsIdlePeriods() public {
        uint256 id = _createWeekly();
        _spend(id, 20 * USDC);
        vm.warp(T0 + 10 * WEEK + 3 * DAY);
        (uint64 index, uint64 periodStart, uint64 periodEnd) = tap.currentPeriod(id);
        assertEq(index, 10);
        assertEq(periodStart, T0 + 10 * WEEK);
        assertEq(periodEnd, T0 + 11 * WEEK);
        _spend(id, 20 * USDC);
        assertEq(tap.getAllowance(id).periodIndex, 10);
    }

    function test_Rollover_WindowsAreFixedFromStartNotFromFirstSpend() public {
        uint256 id = _createWeekly();
        vm.warp(T0 + 6 * DAY); // first spend late in period 0
        _spend(id, 20 * USDC);
        vm.warp(T0 + WEEK); // one day later, a new window already began
        _spend(id, 20 * USDC);
    }

    function test_CurrentPeriod_BeforeStart() public {
        vm.prank(owner);
        uint256 id = tap.createAllowance(spender, 20 * USDC, WEEK, T0 + DAY, 0);
        (uint64 index, uint64 periodStart, uint64 periodEnd) = tap.currentPeriod(id);
        assertEq(index, 0);
        assertEq(periodStart, T0 + DAY);
        assertEq(periodEnd, T0 + DAY + WEEK);
    }

    function test_Spend_RevertsBeforeStart() public {
        vm.prank(owner);
        uint256 id = tap.createAllowance(spender, 20 * USDC, WEEK, T0 + DAY, 0);
        assertEq(tap.spendable(id), 0);

        vm.prank(spender);
        vm.expectRevert(abi.encodeWithSelector(ITap.NotStarted.selector, id, T0 + DAY));
        tap.spend(id, recipient, 1);

        vm.warp(T0 + DAY);
        _spend(id, 1);
    }

    function test_PastStart_AlignsWindows() public {
        vm.prank(owner);
        uint256 id = tap.createAllowance(spender, 20 * USDC, WEEK, T0 - 3 * DAY, 0);
        _spend(id, 20 * USDC);
        vm.warp(T0 + 4 * DAY); // window started at T0 - 3 days ends here
        assertEq(tap.remaining(id), 20 * USDC);
    }

    // ------------------------------------------------------------ repeated timestamps

    function test_RepeatedTimestamp_SpendsShareOnePeriod() public {
        uint256 id = _createWeekly();
        // Several blocks with the same 1-second timestamp.
        for (uint256 i = 0; i < 4; i++) {
            vm.roll(block.number + 1);
            _spend(id, 5 * USDC);
        }
        vm.roll(block.number + 1);
        vm.prank(spender);
        vm.expectRevert(abi.encodeWithSelector(ITap.LimitExceeded.selector, id, 0, 1));
        tap.spend(id, recipient, 1);
    }

    function test_RepeatedTimestamp_AtBoundaryDoesNotDoubleReset() public {
        uint256 id = _createWeekly();
        vm.warp(T0 + WEEK);
        _spend(id, 15 * USDC);
        vm.roll(block.number + 1); // new block, same timestamp
        _spend(id, 5 * USDC);
        vm.roll(block.number + 1);
        vm.prank(spender);
        vm.expectRevert(abi.encodeWithSelector(ITap.LimitExceeded.selector, id, 0, 1));
        tap.spend(id, recipient, 1);
    }

    function test_RepeatedTimestamp_CreateAndSpendInSameSecond() public {
        uint256 id = _createWeekly();
        _spend(id, 20 * USDC); // same timestamp as creation: period 0 is live
        assertEq(tap.getAllowance(id).periodIndex, 0);
    }

    function test_OneSecondPeriod() public {
        vm.prank(owner);
        uint256 id = tap.createAllowance(spender, 1 * USDC, 1, 0, 0);
        _spend(id, 1 * USDC);
        vm.prank(spender);
        vm.expectRevert(abi.encodeWithSelector(ITap.LimitExceeded.selector, id, 0, 1));
        tap.spend(id, recipient, 1);
        vm.warp(T0 + 1);
        _spend(id, 1 * USDC);
    }

    // ------------------------------------------------------------ expiry

    function test_Expiry_UsableUntilLastSecond() public {
        vm.prank(owner);
        uint256 id = tap.createAllowance(spender, 20 * USDC, WEEK, 0, T0 + DAY);
        vm.warp(T0 + DAY - 1);
        _spend(id, 1 * USDC);

        vm.warp(T0 + DAY);
        assertEq(tap.spendable(id), 0);
        vm.prank(spender);
        vm.expectRevert(abi.encodeWithSelector(ITap.Expired.selector, id, T0 + DAY));
        tap.spend(id, recipient, 1 * USDC);
    }

    function test_Expiry_ZeroMeansNever() public {
        uint256 id = _createWeekly();
        vm.warp(T0 + 3650 * DAY);
        _spend(id, 20 * USDC);
    }

    // ------------------------------------------------------------ pause / unpause

    function test_Pause_BlocksSpendingAndEmits() public {
        uint256 id = _createWeekly();
        vm.expectEmit(address(tap));
        emit ITap.AllowancePaused(id);
        vm.prank(owner);
        tap.pause(id);

        assertTrue(tap.getAllowance(id).paused);
        assertEq(tap.spendable(id), 0);
        vm.prank(spender);
        vm.expectRevert(abi.encodeWithSelector(ITap.Paused.selector, id));
        tap.spend(id, recipient, 1 * USDC);
    }

    function test_Unpause_RestoresSpendingAndEmits() public {
        uint256 id = _createWeekly();
        _spend(id, 5 * USDC);
        vm.prank(owner);
        tap.pause(id);

        vm.expectEmit(address(tap));
        emit ITap.AllowanceUnpaused(id);
        vm.prank(owner);
        tap.unpause(id);

        assertFalse(tap.getAllowance(id).paused);
        assertEq(tap.remaining(id), 15 * USDC, "pause keeps the period's spent amount");
        _spend(id, 15 * USDC);
    }

    function test_Pause_PeriodsKeepRollingWhilePaused() public {
        uint256 id = _createWeekly();
        _spend(id, 20 * USDC);
        vm.prank(owner);
        tap.pause(id);
        vm.warp(T0 + 3 * WEEK);
        vm.prank(owner);
        tap.unpause(id);
        assertEq(tap.remaining(id), 20 * USDC);
        _spend(id, 20 * USDC);
    }

    function test_Pause_RevertsWhenAlreadyPaused() public {
        uint256 id = _createWeekly();
        vm.startPrank(owner);
        tap.pause(id);
        vm.expectRevert(abi.encodeWithSelector(ITap.Paused.selector, id));
        tap.pause(id);
        vm.stopPrank();
    }

    function test_Unpause_RevertsWhenNotPaused() public {
        uint256 id = _createWeekly();
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(ITap.NotPaused.selector, id));
        tap.unpause(id);
    }

    // ------------------------------------------------------------ revoke

    function test_Revoke_IsPermanentAndEmits() public {
        uint256 id = _createWeekly();
        vm.expectEmit(address(tap));
        emit ITap.AllowanceRevoked(id);
        vm.prank(owner);
        tap.revoke(id);

        assertTrue(tap.getAllowance(id).revoked);
        assertEq(tap.spendable(id), 0);

        vm.prank(spender);
        vm.expectRevert(abi.encodeWithSelector(ITap.Revoked.selector, id));
        tap.spend(id, recipient, 1);

        vm.startPrank(owner);
        vm.expectRevert(abi.encodeWithSelector(ITap.Revoked.selector, id));
        tap.revoke(id);
        vm.expectRevert(abi.encodeWithSelector(ITap.Revoked.selector, id));
        tap.pause(id);
        vm.expectRevert(abi.encodeWithSelector(ITap.Revoked.selector, id));
        tap.unpause(id);
        vm.expectRevert(abi.encodeWithSelector(ITap.Revoked.selector, id));
        tap.editAllowance(id, 50 * USDC, WEEK, 0);
        vm.stopPrank();
    }

    function test_Revoke_WorksWhilePaused() public {
        uint256 id = _createWeekly();
        vm.startPrank(owner);
        tap.pause(id);
        tap.revoke(id);
        vm.stopPrank();
        assertTrue(tap.getAllowance(id).revoked);
    }

    function test_Revoke_LeavesVaultIntact() public {
        uint256 id = _createWeekly();
        _spend(id, 5 * USDC);
        vm.prank(owner);
        tap.revoke(id);
        assertEq(tap.vaultBalance(owner), 95 * USDC);
        vm.prank(owner);
        tap.withdraw(95 * USDC);
    }

    // ------------------------------------------------------------ unauthorized callers

    function test_Unauthorized_OwnerActions() public {
        uint256 id = _createWeekly();
        address[2] memory callers = [spender, stranger];
        for (uint256 i = 0; i < callers.length; i++) {
            address c = callers[i];
            vm.startPrank(c);
            vm.expectRevert(abi.encodeWithSelector(ITap.NotOwner.selector, id, c));
            tap.pause(id);
            vm.expectRevert(abi.encodeWithSelector(ITap.NotOwner.selector, id, c));
            tap.unpause(id);
            vm.expectRevert(abi.encodeWithSelector(ITap.NotOwner.selector, id, c));
            tap.revoke(id);
            vm.expectRevert(abi.encodeWithSelector(ITap.NotOwner.selector, id, c));
            tap.editAllowance(id, 1_000 * USDC, WEEK, 0);
            vm.stopPrank();
        }
    }

    function test_Unauthorized_Spend() public {
        uint256 id = _createWeekly();
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(ITap.NotSpender.selector, id, stranger));
        tap.spend(id, stranger, 1 * USDC);

        // The owner is not the spender either; owners withdraw instead.
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(ITap.NotSpender.selector, id, owner));
        tap.spend(id, owner, 1 * USDC);
    }

    function test_Unauthorized_OwnerActionsOnUnknownId() public {
        vm.startPrank(owner);
        vm.expectRevert(abi.encodeWithSelector(ITap.AllowanceNotFound.selector, 7));
        tap.pause(7);
        vm.expectRevert(abi.encodeWithSelector(ITap.AllowanceNotFound.selector, 7));
        tap.revoke(7);
        vm.expectRevert(abi.encodeWithSelector(ITap.AllowanceNotFound.selector, 7));
        tap.editAllowance(7, 1, 1, 0);
        vm.stopPrank();
    }

    function test_Views_RevertOnUnknownId() public {
        vm.expectRevert(abi.encodeWithSelector(ITap.AllowanceNotFound.selector, 0));
        tap.getAllowance(0);
        vm.expectRevert(abi.encodeWithSelector(ITap.AllowanceNotFound.selector, 3));
        tap.remaining(3);
    }

    // ------------------------------------------------------------ lookups

    function test_Lookups_ByOwnerAndSpender() public {
        usdc.mint(stranger, 10 * USDC);
        vm.prank(owner);
        uint256 a = tap.createAllowance(spender, 1 * USDC, DAY, 0, 0);
        vm.prank(stranger);
        uint256 b = tap.createAllowance(spender, 2 * USDC, DAY, 0, 0);
        vm.prank(owner);
        uint256 c = tap.createAllowance(recipient, 3 * USDC, DAY, 0, 0);

        uint256[] memory byOwner = tap.allowancesByOwner(owner);
        assertEq(byOwner.length, 2);
        assertEq(byOwner[0], a);
        assertEq(byOwner[1], c);

        uint256[] memory bySpender = tap.allowancesBySpender(spender);
        assertEq(bySpender.length, 2);
        assertEq(bySpender[0], a);
        assertEq(bySpender[1], b);

        assertEq(tap.allowancesByOwner(stranger)[0], b);
        assertEq(tap.allowancesBySpender(recipient)[0], c);
        assertEq(tap.allowancesBySpender(stranger).length, 0);
    }

    function test_Lookups_KeepRevokedAllowances() public {
        uint256 id = _createWeekly();
        vm.prank(owner);
        tap.revoke(id);
        assertEq(tap.allowancesByOwner(owner).length, 1);
        assertEq(tap.allowancesBySpender(spender)[0], id);
    }
}
