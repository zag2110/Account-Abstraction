// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {SmartAccount} from "../src/SmartAccount.sol";
import {SmartAccountFactory} from "../src/SmartAccountFactory.sol";
import {DemoPaymaster} from "../src/DemoPaymaster.sol";
import {DemoNFT} from "../src/DemoNFT.sol";
import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";

contract Deploy is Script {
    // EntryPoint v0.7 (Sepolia) :contentReference[oaicite:3]{index=3}
    address constant ENTRYPOINT_V07 = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;

    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(pk);

        // 1) implementation
        SmartAccount impl = new SmartAccount();

        // 2) factory
        SmartAccountFactory factory = new SmartAccountFactory(address(impl));

        // 3) paymaster
        DemoPaymaster paymaster = new DemoPaymaster(IEntryPoint(ENTRYPOINT_V07));

        // 4) demo NFT
        DemoNFT nft = new DemoNFT();

        vm.stopBroadcast();

        console2.log("ENTRYPOINT_V07:", ENTRYPOINT_V07);
        console2.log("SmartAccount implementation:", address(impl));
        console2.log("Factory:", address(factory));
        console2.log("Paymaster:", address(paymaster));
        console2.log("DemoNFT:", address(nft));
    }
}
