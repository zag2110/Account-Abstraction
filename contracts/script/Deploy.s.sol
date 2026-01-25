// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {SmartAccount} from "../src/SmartAccount.sol";
import {SmartAccountFactory} from "../src/SmartAccountFactory.sol";
import {DemoPaymaster} from "../src/DemoPaymaster.sol";
import {DemoNFT} from "../src/DemoNFT.sol";
import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";

/**
 * @title Deploy
 * @notice Script de déploiement complet pour ERC-4337 Smart Account
 * 
 * Usage:
 * forge script script/Deploy.s.sol:Deploy --rpc-url sepolia --broadcast --verify -vvvv
 * 
 * OU sans vérification:
 * forge script script/Deploy.s.sol:Deploy --rpc-url sepolia --broadcast -vvvv
 */
contract Deploy is Script {
    // EntryPoint v0.7 (déployé sur tous les réseaux à la même adresse)
    address constant ENTRYPOINT_V07 = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("\n====================================");
        console2.log("DEPLOYING ERC-4337 SMART ACCOUNT");
        console2.log("====================================");
        console2.log("Network: Sepolia");
        console2.log("Deployer:", deployer);
        console2.log("EntryPoint v0.7:", ENTRYPOINT_V07);
        
        // Vérifier le solde
        uint256 balance = deployer.balance;
        console2.log("Deployer balance:", balance / 1e18, "ETH");
        
        if (balance < 0.05 ether) {
            console2.log("\n>>> WARNING: Low balance! You need at least 0.05 ETH");
            console2.log(">>> Get Sepolia ETH from: https://sepoliafaucet.com/");
        }

        console2.log("\n>>> Starting deployment...\n");

        vm.startBroadcast(deployerPrivateKey);

        // 1) Déployer l'implementation du SmartAccount
        console2.log("1/4 Deploying SmartAccount implementation...");
        SmartAccount implementation = new SmartAccount();
        console2.log("    Implementation:", address(implementation));

        // 2) Déployer la Factory
        console2.log("\n2/4 Deploying SmartAccountFactory...");
        SmartAccountFactory factory = new SmartAccountFactory(address(implementation));
        console2.log("    Factory:", address(factory));

        // 3) Déployer le Paymaster
        console2.log("\n3/4 Deploying DemoPaymaster...");
        DemoPaymaster paymaster = new DemoPaymaster(IEntryPoint(ENTRYPOINT_V07));
        console2.log("    Paymaster:", address(paymaster));

        // 4) Déployer le NFT de démo
        console2.log("\n4/4 Deploying DemoNFT...");
        DemoNFT nft = new DemoNFT();
        console2.log("    NFT:", address(nft));

        // 5) Funder le paymaster avec 0.05 ETH (optionnel mais recommandé)
        uint256 paymasterFunding = 0.05 ether;
        if (balance > 0.1 ether) {
            console2.log("\n>>> Funding Paymaster with", paymasterFunding / 1e18, "ETH...");
            paymaster.deposit{value: paymasterFunding}();
            console2.log("    Paymaster funded successfully");
        } else {
            console2.log("\n>>> Skipping paymaster funding (low balance)");
            console2.log("    You can fund it later with:");
            console2.log("    cast send", address(paymaster), '"deposit()" --value 0.05ether --private-key $PRIVATE_KEY --rpc-url sepolia');
        }

        vm.stopBroadcast();

        // Afficher le résumé
        console2.log("\n====================================");
        console2.log("DEPLOYMENT SUCCESSFUL!");
        console2.log("====================================");
        console2.log("EntryPoint:     ", ENTRYPOINT_V07);
        console2.log("Implementation: ", address(implementation));
        console2.log("Factory:        ", address(factory));
        console2.log("Paymaster:      ", address(paymaster));
        console2.log("NFT:            ", address(nft));
        console2.log("====================================\n");

        // Instructions pour la suite
        console2.log(">>> NEXT STEPS:");
        console2.log("1. Copy these addresses to your .env file:");
        console2.log("   FACTORY_ADDRESS=", address(factory));
        console2.log("   PAYMASTER_ADDRESS=", address(paymaster));
        console2.log("   NFT_ADDRESS=", address(nft));
        console2.log("");
        console2.log("2. If paymaster not funded, run:");
        console2.log("   cast send", address(paymaster), '"deposit()" --value 0.1ether --private-key $PRIVATE_KEY --rpc-url sepolia');
        console2.log("");
        console2.log("3. Create your first smart account:");
        console2.log("   npm run create-account");
        console2.log("");

        // Sauvegarder dans un fichier JSON
        _saveDeploymentInfo(
            address(implementation),
            address(factory),
            address(paymaster),
            address(nft)
        );
    }

    function _saveDeploymentInfo(
        address implementation,
        address factory,
        address paymaster,
        address nft
    ) internal {
        string memory json = "deployment";
        
        vm.serializeString(json, "network", "sepolia");
        vm.serializeUint(json, "chainId", 11155111);
        vm.serializeAddress(json, "entryPoint", ENTRYPOINT_V07);
        vm.serializeAddress(json, "implementation", implementation);
        vm.serializeAddress(json, "factory", factory);
        vm.serializeAddress(json, "paymaster", paymaster);
        string memory finalJson = vm.serializeAddress(json, "nft", nft);
        
        // Créer le dossier deployments s'il n'existe pas
        string memory outputPath = "./deployments/sepolia.json";
        vm.writeJson(finalJson, outputPath);
        
        console2.log(">>> Deployment info saved to:", outputPath);
    }
}
