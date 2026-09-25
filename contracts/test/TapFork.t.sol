// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import {Tap} from "../src/Tap.sol";

/// @notice End-to-end check against real USDC on an Arc testnet fork.
/// @dev Skipped unless ARC_TESTNET_RPC_URL is set, so offline runs stay green.
contract TapForkTest is Test {
    address internal constant ARC_USDC = 0x3600000000000000000000000000000000000000;
    uint256 internal constant ARC_TESTNET_CHAIN_ID = 5042002;

    function test_Fork_EndToEndWithRealUsdc() public {
        string memory rpc = vm.envOr("ARC_TESTNET_RPC_URL", string(""));
        if (bytes(rpc).length == 0) {
            vm.skip(true);
            return;
        }
        vm.createSelectFork(rpc);
        assertEq(block.chainid, ARC_TESTNET_CHAIN_ID);

        IERC20 usdc = IERC20(ARC_USDC);
        assertEq(IERC20Metadata(ARC_USDC).decimals(), 6);
        Tap tap = new Tap(usdc);

        address owner = makeAddr("fork-owner");
        address spender = makeAddr("fork-spender");
        address recipient = makeAddr("fork-recipient");

        // Test-only funding. Arc's native gas balance and the USDC ERC-20 balance are the
        // same funds: 100 USDC natively (18 decimals) should read as 100e6 via ERC-20.
        // If the fork does not reflect that, fall back to writing the ERC-20 storage.
        vm.deal(owner, 100e18);
        if (usdc.balanceOf(owner) < 100e6) deal(ARC_USDC, owner, 100e6);
        uint256 recipientBefore = usdc.balanceOf(recipient);

        vm.startPrank(owner);
        usdc.approve(address(tap), 50e6);
        tap.deposit(50e6);
        uint256 id = tap.createAllowance(spender, 20e6, 7 days, 0, 0);
        vm.stopPrank();

        assertEq(tap.vaultBalance(owner), 50e6);
        assertEq(usdc.balanceOf(address(tap)), 50e6);

        vm.prank(spender);
        tap.spend(id, recipient, 12_500_000); // 12.5 USDC
        assertEq(usdc.balanceOf(recipient) - recipientBefore, 12_500_000);
        assertEq(tap.remaining(id), 7_500_000);

        vm.prank(owner);
        tap.withdraw(37_500_000);
        assertEq(tap.vaultBalance(owner), 0);
        assertEq(usdc.balanceOf(address(tap)), 0);
    }
}
