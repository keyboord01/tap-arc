// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {Tap} from "../src/Tap.sol";
import {MockUSDC} from "../test/mocks/MockUSDC.sol";

/// @notice Local development only: deploys a mock 6-decimal USDC and Tap to anvil,
///         and mints test USDC to anvil's first three default accounts.
/// @dev Uses anvil's unlocked accounts, so no key is needed:
///
///      anvil
///      forge script script/DeployLocal.s.sol --rpc-url http://127.0.0.1:8545 --broadcast \
///        --unlocked --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
contract DeployLocal is Script {
    error NotLocal(uint256 chainId);

    function run() external returns (Tap tap, MockUSDC usdc) {
        if (block.chainid != 31337) revert NotLocal(block.chainid);

        address[3] memory accounts = [
            0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266,
            0x70997970C51812dc3A010C7d01b50e0d17dc79C8,
            0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
        ];

        vm.startBroadcast();
        usdc = new MockUSDC();
        tap = new Tap(IERC20(address(usdc)));
        for (uint256 i = 0; i < accounts.length; i++) {
            usdc.mint(accounts[i], 10_000e6);
        }
        vm.stopBroadcast();

        console.log("NEXT_PUBLIC_CHAIN=local");
        console.log("NEXT_PUBLIC_TAP_ADDRESS=%s", address(tap));
        console.log("NEXT_PUBLIC_USDC_ADDRESS=%s", address(usdc));
    }
}
