// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuardTransient} from "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";

import {Tap} from "../src/Tap.sol";
import {ReentrantToken} from "./mocks/ReentrantToken.sol";

/// @notice Acts as both vault owner and spender, and tries to re-enter Tap from a token callback.
contract Attacker {
    Tap internal tap;
    uint256 public id;

    constructor(Tap tap_) {
        tap = tap_;
    }

    function setup(uint256 amount) external {
        IERC20(address(tap.usdc())).approve(address(tap), type(uint256).max);
        tap.deposit(amount);
        id = tap.createAllowance(address(this), amount, 1 days, 0, 0);
    }

    function spend(uint256 amount) external {
        tap.spend(id, address(this), amount);
    }

    function withdraw(uint256 amount) external {
        tap.withdraw(amount);
    }

    function deposit(uint256 amount) external {
        tap.deposit(amount);
    }
}

contract TapReentrancyTest is Test {
    ReentrantToken internal token;
    Tap internal tap;
    Attacker internal attacker;

    function setUp() public {
        vm.warp(1_767_225_600);
        token = new ReentrantToken();
        tap = new Tap(IERC20(address(token)));
        attacker = new Attacker(tap);
        token.mint(address(attacker), 100e6);
        attacker.setup(50e6);
    }

    function _expectReentrancyRevert() internal {
        vm.expectRevert(ReentrancyGuardTransient.ReentrancyGuardReentrantCall.selector);
    }

    function test_Reentrancy_SpendIntoSpend() public {
        token.arm(address(attacker), abi.encodeCall(Attacker.spend, (10e6)));
        _expectReentrancyRevert();
        attacker.spend(10e6);
        assertEq(tap.vaultBalance(address(attacker)), 50e6);
    }

    function test_Reentrancy_SpendIntoWithdraw() public {
        token.arm(address(attacker), abi.encodeCall(Attacker.withdraw, (50e6)));
        _expectReentrancyRevert();
        attacker.spend(10e6);
        assertEq(tap.vaultBalance(address(attacker)), 50e6);
    }

    function test_Reentrancy_WithdrawIntoWithdraw() public {
        token.arm(address(attacker), abi.encodeCall(Attacker.withdraw, (50e6)));
        _expectReentrancyRevert();
        attacker.withdraw(50e6);
        assertEq(tap.vaultBalance(address(attacker)), 50e6);
    }

    function test_Reentrancy_DepositIntoWithdraw() public {
        token.arm(address(attacker), abi.encodeCall(Attacker.withdraw, (60e6)));
        _expectReentrancyRevert();
        attacker.deposit(10e6);
        assertEq(tap.vaultBalance(address(attacker)), 50e6);
    }

    function test_Reentrancy_DirectCallFromToken() public {
        token.arm(address(tap), abi.encodeCall(Tap.withdraw, (1)));
        _expectReentrancyRevert();
        attacker.withdraw(1e6);
    }

    function test_Reentrancy_NormalFlowStillWorks() public {
        attacker.spend(10e6);
        attacker.withdraw(40e6);
        assertEq(tap.vaultBalance(address(attacker)), 0);
        assertEq(token.balanceOf(address(attacker)), 100e6);
    }
}
