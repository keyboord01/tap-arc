// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {TapTestBase} from "./TapTestBase.sol";
import {Tap} from "../src/Tap.sol";
import {ITap} from "../src/interfaces/ITap.sol";
import {MockUSDC} from "./mocks/MockUSDC.sol";

contract EighteenDecimalToken is ERC20 {
    constructor() ERC20("Eighteen", "E18") {}
}

contract TapVaultTest is TapTestBase {
    // ------------------------------------------------------------ constructor

    function test_Constructor_SetsToken() public view {
        assertEq(address(tap.usdc()), address(usdc));
    }

    function test_Constructor_RejectsZeroToken() public {
        vm.expectRevert(ITap.ZeroAddress.selector);
        new Tap(IERC20(address(0)));
    }

    function test_Constructor_RejectsNon6DecimalToken() public {
        EighteenDecimalToken t = new EighteenDecimalToken();
        vm.expectRevert(ITap.InvalidToken.selector);
        new Tap(IERC20(address(t)));
    }

    // ------------------------------------------------------------ deposit

    function test_Deposit_CreditsVaultAndMovesTokens() public {
        vm.expectEmit(address(tap));
        emit ITap.Deposited(owner, 100 * USDC, 100 * USDC);
        _deposit(owner, 100 * USDC);

        assertEq(tap.vaultBalance(owner), 100 * USDC);
        assertEq(usdc.balanceOf(address(tap)), 100 * USDC);
        assertEq(usdc.balanceOf(owner), 900 * USDC);
    }

    function test_Deposit_Accumulates() public {
        _deposit(owner, 10 * USDC);
        vm.expectEmit(address(tap));
        emit ITap.Deposited(owner, 5 * USDC, 15 * USDC);
        _deposit(owner, 5 * USDC);
        assertEq(tap.vaultBalance(owner), 15 * USDC);
    }

    function test_Deposit_RevertsOnZero() public {
        vm.expectRevert(ITap.ZeroAmount.selector);
        _deposit(owner, 0);
    }

    function test_Deposit_RevertsWithoutApproval() public {
        usdc.mint(stranger, 10 * USDC);
        vm.expectRevert();
        _deposit(stranger, 10 * USDC);
        assertEq(tap.vaultBalance(stranger), 0);
    }

    function test_Deposit_RevertsWhenSenderBlocklisted() public {
        usdc.setBlocked(owner, true);
        vm.expectRevert(abi.encodeWithSelector(MockUSDC.Blocklisted.selector, owner));
        _deposit(owner, 10 * USDC);
        assertEq(tap.vaultBalance(owner), 0);
    }

    function test_Deposit_VaultsAreSeparatePerOwner() public {
        usdc.mint(stranger, 50 * USDC);
        vm.prank(stranger);
        usdc.approve(address(tap), type(uint256).max);

        _deposit(owner, 30 * USDC);
        _deposit(stranger, 50 * USDC);

        assertEq(tap.vaultBalance(owner), 30 * USDC);
        assertEq(tap.vaultBalance(stranger), 50 * USDC);
    }

    // ------------------------------------------------------------ withdraw

    function test_Withdraw_DebitsVaultAndReturnsTokens() public {
        _deposit(owner, 100 * USDC);

        vm.expectEmit(address(tap));
        emit ITap.Withdrawn(owner, 40 * USDC, 60 * USDC);
        vm.prank(owner);
        tap.withdraw(40 * USDC);

        assertEq(tap.vaultBalance(owner), 60 * USDC);
        assertEq(usdc.balanceOf(owner), 940 * USDC);
        assertEq(usdc.balanceOf(address(tap)), 60 * USDC);
    }

    function test_Withdraw_FullBalance() public {
        _deposit(owner, 100 * USDC);
        vm.prank(owner);
        tap.withdraw(100 * USDC);
        assertEq(tap.vaultBalance(owner), 0);
        assertEq(usdc.balanceOf(owner), 1_000 * USDC);
    }

    function test_Withdraw_RevertsOnZero() public {
        _deposit(owner, 1 * USDC);
        vm.prank(owner);
        vm.expectRevert(ITap.ZeroAmount.selector);
        tap.withdraw(0);
    }

    function test_Withdraw_RevertsAboveBalance() public {
        _deposit(owner, 10 * USDC);
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(ITap.InsufficientVaultBalance.selector, 10 * USDC, 10 * USDC + 1)
        );
        tap.withdraw(10 * USDC + 1);
    }

    function test_Withdraw_CannotTouchAnotherOwnersVault() public {
        _deposit(owner, 10 * USDC);
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(ITap.InsufficientVaultBalance.selector, 0, 1));
        tap.withdraw(1);
    }

    function test_Withdraw_RevertsWhenOwnerBlocklisted() public {
        _deposit(owner, 10 * USDC);
        usdc.setBlocked(owner, true);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(MockUSDC.Blocklisted.selector, owner));
        tap.withdraw(10 * USDC);
        assertEq(tap.vaultBalance(owner), 10 * USDC);
    }

    function test_Withdraw_IgnoresOutstandingAllowances() public {
        // Allowances never lock funds: the owner can always withdraw everything.
        _deposit(owner, 20 * USDC);
        _createWeekly();
        vm.prank(owner);
        tap.withdraw(20 * USDC);
        assertEq(tap.vaultBalance(owner), 0);
    }

    // ------------------------------------------------------------ 6-decimal edge cases

    function test_SixDecimals_SmallestUnitRoundTrip() public {
        _deposit(owner, 1); // 0.000001 USDC
        assertEq(tap.vaultBalance(owner), 1);
        vm.prank(owner);
        tap.withdraw(1);
        assertEq(tap.vaultBalance(owner), 0);
        assertEq(usdc.balanceOf(owner), 1_000 * USDC);
    }

    function test_SixDecimals_FractionalAmounts() public {
        _deposit(owner, 12_345_678); // 12.345678 USDC
        vm.prank(owner);
        tap.withdraw(345_678);
        assertEq(tap.vaultBalance(owner), 12 * USDC);
    }

    function test_SixDecimals_LargeBalance() public {
        uint256 big = 100_000_000_000 * USDC; // 100B USDC, beyond real supply
        usdc.mint(owner, big);
        _deposit(owner, big);
        assertEq(tap.vaultBalance(owner), big);
    }

    // ------------------------------------------------------------ native value rejection

    function test_Native_PlainSendReverts() public {
        vm.deal(stranger, 1 ether);
        vm.prank(stranger);
        (bool ok,) = address(tap).call{value: 1}("");
        assertFalse(ok);
        assertEq(address(tap).balance, 0);
    }

    function test_Native_UnknownCalldataReverts() public {
        vm.deal(stranger, 1 ether);
        vm.prank(stranger);
        (bool ok,) = address(tap).call{value: 1}(hex"deadbeef");
        assertFalse(ok);
    }

    function test_Native_ValueOnDepositReverts() public {
        vm.deal(owner, 1 ether);
        vm.prank(owner);
        (bool ok,) = address(tap).call{value: 1}(abi.encodeCall(Tap.deposit, (1 * USDC)));
        assertFalse(ok);
        assertEq(tap.vaultBalance(owner), 0);
    }

    function test_Native_ValueOnSpendReverts() public {
        _deposit(owner, 50 * USDC);
        uint256 id = _createWeekly();
        vm.deal(spender, 1 ether);
        vm.prank(spender);
        (bool ok,) = address(tap).call{value: 1}(abi.encodeCall(Tap.spend, (id, recipient, 1 * USDC)));
        assertFalse(ok);
    }

    // ------------------------------------------------------------ internal accounting

    function test_DirectTransfer_DoesNotChangeVaultBalances() public {
        _deposit(owner, 10 * USDC);
        vm.prank(owner);
        assertTrue(usdc.transfer(address(tap), 500 * USDC));

        assertEq(usdc.balanceOf(address(tap)), 510 * USDC);
        assertEq(tap.vaultBalance(owner), 10 * USDC);
    }

    function test_DirectTransfer_CannotBeWithdrawn() public {
        _deposit(owner, 10 * USDC);
        vm.prank(owner);
        assertTrue(usdc.transfer(address(tap), 500 * USDC));

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(ITap.InsufficientVaultBalance.selector, 10 * USDC, 11 * USDC));
        tap.withdraw(11 * USDC);

        usdc.mint(stranger, 1);
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(ITap.InsufficientVaultBalance.selector, 0, 1));
        tap.withdraw(1);
    }

    function test_DirectTransfer_CannotBeSpent() public {
        _deposit(owner, 5 * USDC);
        uint256 id = _createWeekly();
        vm.prank(owner);
        assertTrue(usdc.transfer(address(tap), 500 * USDC));

        vm.prank(spender);
        vm.expectRevert(abi.encodeWithSelector(ITap.InsufficientVaultBalance.selector, 5 * USDC, 6 * USDC));
        tap.spend(id, recipient, 6 * USDC);
        assertEq(tap.spendable(id), 5 * USDC);
    }
}
