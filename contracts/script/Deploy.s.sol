// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {Tap} from "../src/Tap.sol";

/// @notice Deploys Tap against Arc's USDC.
/// @dev Signs with a Foundry keystore account; no private key is read from the environment.
///
///      forge script script/Deploy.s.sol --rpc-url arc_testnet --account <keystore-name> --broadcast
///
///      Omit --broadcast for a dry run. Use --rpc-url arc_mainnet for mainnet.
contract Deploy is Script {
    /// @dev USDC's ERC-20 interface (6 decimals), same address on Arc mainnet and testnet.
    address public constant ARC_USDC = 0x3600000000000000000000000000000000000000;
    uint256 public constant ARC_MAINNET_CHAIN_ID = 5042;
    uint256 public constant ARC_TESTNET_CHAIN_ID = 5042002;

    error UnsupportedChain(uint256 chainId);

    function run() external returns (Tap tap) {
        if (block.chainid != ARC_MAINNET_CHAIN_ID && block.chainid != ARC_TESTNET_CHAIN_ID) {
            revert UnsupportedChain(block.chainid);
        }

        vm.startBroadcast();
        tap = new Tap(IERC20(ARC_USDC));
        vm.stopBroadcast();

        console.log("Tap deployed at", address(tap));
        console.log("Chain ID", block.chainid);
        console.log("USDC", ARC_USDC);
    }
}
