import { encodeFunctionData, parseEther, type Address, type Hash, keccak256, encodeAbiParameters } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  publicClient,
  createWallet,
  FACTORY_ADDRESS,
  ENTRYPOINT_ADDRESS,
  FACTORY_ABI,
  SMART_ACCOUNT_ABI,
  log,
  waitForTransaction,
} from './utils.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script pour créer un Smart Account via la Factory
 * 
 * Ce script :
 * 1. Calcule l'adresse du compte AVANT le déploiement (counterfactual)
 * 2. Déploie le compte via la factory
 * 3. Affiche l'adresse et les infos du compte
 */

async function main() {
  log('🚀 CREATE SMART ACCOUNT', 'Starting...');

  // Configuration
  const ownerPrivateKey = process.env.PRIVATE_KEY as Hash;
  const owner = privateKeyToAccount(ownerPrivateKey);
  
  log('👤 Owner Configuration', {
    address: owner.address,
    balance: `${(await publicClient.getBalance({ address: owner.address })) / BigInt(1e18)} ETH`,
  });

  // Paramètres du compte
  const owners: Address[] = [owner.address]; // Liste des propriétaires (triée)
  const threshold = 1; // Nombre de signatures requises
  const guardians: Address[] = []; // Pas de guardians pour ce test
  const guardianThreshold = 0;
  const salt: Hash = '0x0000000000000000000000000000000000000000000000000000000000000000'; // Salt unique

  // 1) Prédire l'adresse du compte AVANT le déploiement
  log('🔮 Predicting Account Address', 'Calculating counterfactual address...');
  
  const predictedAddress = await publicClient.readContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'predictAccountAddress',
    args: [salt, owners, BigInt(threshold), guardians, BigInt(guardianThreshold)],
  });

  log('✅ Predicted Address', {
    address: predictedAddress,
    note: 'This is the address BEFORE deployment (counterfactual)',
  });

  // 2) Vérifier si le compte existe déjà
  const code = await publicClient.getCode({ address: predictedAddress });
  const alreadyDeployed = code !== undefined && code !== '0x';

  if (alreadyDeployed) {
    log('ℹ️  Account Already Exists', {
      address: predictedAddress,
      message: 'This account was already deployed. You can use it!',
    });
    
    // Afficher les infos du compte
    const nonce = await publicClient.readContract({
      address: predictedAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: 'nonce',
    });

    log('📊 Account Info', {
      address: predictedAddress,
      nonce: nonce.toString(),
      balance: `${(await publicClient.getBalance({ address: predictedAddress })) / BigInt(1e18)} ETH`,
    });

    return;
  }

  // 3) Déployer le compte
  log('🏗️  Deploying Account', 'Creating smart account via factory...');

  const wallet = createWallet(ownerPrivateKey);

  const hash = await wallet.writeContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'createAccount',
    args: [ENTRYPOINT_ADDRESS, salt, owners, BigInt(threshold), guardians, BigInt(guardianThreshold)],
  });

  log('📝 Transaction Sent', { hash });

  // 4) Attendre la confirmation
  const receipt = await waitForTransaction(hash);

  // 5) Vérifier le déploiement
  const finalCode = await publicClient.getCode({ address: predictedAddress });
  const deployed = finalCode !== undefined && finalCode !== '0x';

  if (!deployed) {
    throw new Error('❌ Deployment failed - no code at predicted address');
  }

  log('✅ ACCOUNT CREATED SUCCESSFULLY!', {
    address: predictedAddress,
    owners: owners,
    threshold,
    txHash: hash,
    gasUsed: receipt.gasUsed.toString(),
  });

  log('💡 Next Steps', `
1. Save this address to your .env:
   SMART_ACCOUNT_ADDRESS=${predictedAddress}

2. Fund the account with some ETH:
   cast send ${predictedAddress} --value 0.01ether --private-key $PRIVATE_KEY --rpc-url sepolia

3. Try minting an NFT:
   npm run mint-nft
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  });
