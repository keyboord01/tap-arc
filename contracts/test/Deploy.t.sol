// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";

import {Deploy} from "../script/Deploy.s.sol";
import {Tap} from "../src/Tap.sol";
import {MockUSDC} from "./mocks/MockUSDC.sol";

/// @notice Runs the deploy script locally, with a mock standing in for USDC. Broadcasts nothing.
contract DeployTest is Test {
    Deploy internal deployer;

    function setUp() public {
        deployer = new Deploy();
        // MockUSDC keeps `decimals` in code, so etching its runtime bytecode is enough.
        vm.etch(deployer.ARC_USDC(), address(new MockUSDC()).code);
    }

    function test_Deploy_OnTestnet() public {
        vm.chainId(5042002);
        Tap tap = deployer.run();
        assertEq(address(tap.usdc()), deployer.ARC_USDC());
        assertEq(tap.allowanceCount(), 0);
    }

    function test_Deploy_OnMainnet() public {
        vm.chainId(5042);
        Tap tap = deployer.run();
        assertEq(address(tap.usdc()), deployer.ARC_USDC());
    }

    function test_Deploy_RejectsOtherChains() public {
        vm.chainId(1);
        vm.expectRevert(abi.encodeWithSelector(Deploy.UnsupportedChain.selector, 1));
        deployer.run();
    }
}
