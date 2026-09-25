// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {Tap} from "../src/Tap.sol";
import {ITap} from "../src/interfaces/ITap.sol";
import {MockUSDC} from "./mocks/MockUSDC.sol";

abstract contract TapTestBase is Test {
    uint256 internal constant USDC = 1e6; // one whole USDC in 6-decimal units
    uint64 internal constant DAY = 1 days;
    uint64 internal constant WEEK = 7 days;
    uint64 internal constant T0 = 1_767_225_600; // 2026-01-01 00:00:00 UTC

    MockUSDC internal usdc;
    Tap internal tap;

    address internal owner = makeAddr("owner");
    address internal spender = makeAddr("spender");
    address internal recipient = makeAddr("recipient");
    address internal stranger = makeAddr("stranger");

    function setUp() public virtual {
        vm.warp(T0);
        usdc = new MockUSDC();
        tap = new Tap(IERC20(address(usdc)));

        usdc.mint(owner, 1_000 * USDC);
        vm.prank(owner);
        usdc.approve(address(tap), type(uint256).max);
    }

    function _deposit(address who, uint256 amount) internal {
        vm.prank(who);
        tap.deposit(amount);
    }

    /// @dev 20 USDC every 7 days starting now, no expiry.
    function _createWeekly() internal returns (uint256 id) {
        vm.prank(owner);
        id = tap.createAllowance(spender, 20 * USDC, WEEK, 0, 0);
    }

    function _spend(uint256 id, uint256 amount) internal {
        vm.prank(spender);
        tap.spend(id, recipient, amount);
    }

    function _now() internal view returns (uint64) {
        return uint64(block.timestamp);
    }
}
