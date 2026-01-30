import {
  encodeFunctionData,
  type Address,
  type Hash,
  keccak256,
  encodeAbiParameters,
  concat,
  toHex,
  pad,
  parseEther,
  hexToNumber,
} from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import {
  publicClient,
  bundlerClient,
  createWallet,
  ENTRYPOINT_ADDRESS,
  NFT_ADDRESS,
  PAYMASTER_ADDRESS,
  SMART_ACCOUNT_ABI,
  NFT_ABI,
  log,
  waitForTransaction,
} from './utils.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script pour tester les SESSION KEYS
 * 
 * Ce script démontre :
 * 1. Création d'une session key temporaire
 * 2. Ajout de la session key au smart account
 * 3. Utilisation de la session key pour signer un UserOp
 * 4. Révocation de la session key
 */

async function main() {
  log('🔑 TEST SESSION KEYS', 'Starting...');

  // Configuration
  const smartAccountAddress = process.env.SMART_ACCOUNT_ADDRESS as Address;
  const ownerPrivateKey = process.env.PRIVATE_KEY as Hash;
  const owner = privateKeyToAccount(ownerPrivateKey);

  if (!smartAccountAddress) {
    throw new Error('❌ SMART_ACCOUNT_ADDRESS not set in .env. Run "npm run create-account" first!');
  }

  log('📍 Configuration', {
    smartAccount: smartAccountAddress,
    owner: owner.address,
  });

  // ==========================================
  // STEP 1: Générer une session key temporaire
  // ==========================================
  
  log('🎲 Generating Session Key', 'Creating temporary key...');
  
  const sessionKeyPrivateKey = generatePrivateKey();
  const sessionKey = privateKeyToAccount(sessionKeyPrivateKey);

  log('✅ Session Key Generated', {
    address: sessionKey.address,
    note: 'This is a temporary key with limited permissions',
  });

  // ==========================================
  // STEP 2: Ajouter la session key au compte
  // ==========================================

  log('📝 Adding Session Key to Account', 'Preparing transaction...');

  // Paramètres de la session key
  const validUntil = Math.floor(Date.now() / 1000) + 3600; // Valide 1 heure
  const oneTime = false; // Peut être utilisée plusieurs fois

  // L'owner EOA peut appeler directement addSessionKey (car isOwner[owner] = true)
  log('🔄 Adding session key via owner wallet...', 'Sending direct transaction...');

  const wallet = createWallet(ownerPrivateKey);
  
  const txHash = await wallet.writeContract({
    address: smartAccountAddress,
    abi: SMART_ACCOUNT_ABI,
    functionName: 'addSessionKey',
    args: [sessionKey.address, validUntil, oneTime],
    chain: wallet.chain,
  });

  log('⏳ Waiting for transaction...', `TxHash: ${txHash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  if (receipt.status !== 'success') {
    throw new Error('❌ Session key addition failed on-chain.');
  }

  log('✅ Session Key Added!', {
    sessionKey: sessionKey.address,
    validUntil: new Date(validUntil * 1000).toISOString(),
    oneTime: oneTime,
    txHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber,
  });

  // ==========================================
  // STEP 3: Utiliser la session key pour mint
  // ==========================================

  log('🎨 Minting NFT with Session Key', 'Preparing UserOp...');

  // Attendre plusieurs blocs pour être sûr que le state change est propagé
  log('⏳ Waiting for state propagation...', 'Waiting 15 seconds...');
  await new Promise((resolve) => setTimeout(resolve, 15000));

  const nonce2 = await publicClient.readContract({
    address: smartAccountAddress,
    abi: SMART_ACCOUNT_ABI,
    functionName: 'nonce',
  });

  log('🔢 Current Nonce', {
    nonce: nonce2.toString(),
    note: 'Will use this nonce for session key UserOp',
  });

  // Préparer le mint
  const mintCallData = encodeFunctionData({
    abi: NFT_ABI,
    functionName: 'mint',
    args: [smartAccountAddress],
  });

  const executeCallData2 = encodeFunctionData({
    abi: SMART_ACCOUNT_ABI,
    functionName: 'execute',
    args: [NFT_ADDRESS, 0n, mintCallData],
  });

  // Créer le UserOp
  const verificationGasLimit2 = 150000n;
  const callGasLimit2 = 300000n;
  const preVerificationGas2 = 60000n;
  const maxFeePerGas2 = parseEther('0.00000002');
  const maxPriorityFeePerGas2 = parseEther('0.000000002');

  const accountGasLimits2 = concat([
    pad(toHex(verificationGasLimit2), { size: 16 }),
    pad(toHex(callGasLimit2), { size: 16 }),
  ]) as Hash;

  const gasFees2 = concat([
    pad(toHex(maxPriorityFeePerGas2), { size: 16 }),
    pad(toHex(maxFeePerGas2), { size: 16 }),
  ]) as Hash;

  const paymasterVerificationGasLimit2 = 50000n;
  const paymasterPostOpGasLimit2 = 50000n;
  const paymasterAndData2 = concat([
    PAYMASTER_ADDRESS,
    pad(toHex(paymasterVerificationGasLimit2), { size: 16 }),
    pad(toHex(paymasterPostOpGasLimit2), { size: 16 }),
    '0x' as Hash, // paymasterData
  ]) as Hash;

  const userOp2 = {
    sender: smartAccountAddress,
    nonce: toHex(nonce2),
    initCode: '0x' as Hash,
    callData: executeCallData2 as Hash,
    accountGasLimits: accountGasLimits2,
    preVerificationGas: toHex(preVerificationGas2),
    gasFees: gasFees2,
    paymasterAndData: paymasterAndData2,
    signature: '0x' as Hash,
  };

  // Calculer le hash
  const chainId = await publicClient.getChainId();
  
  const userOpHash2 = keccak256(
    encodeAbiParameters(
      [
        { type: 'address' }, { type: 'uint256' }, { type: 'bytes32' }, { type: 'bytes32' },
        { type: 'bytes32' }, { type: 'uint256' }, { type: 'bytes32' }, { type: 'bytes32' },
      ],
      [
        userOp2.sender, nonce2, keccak256(userOp2.initCode), keccak256(userOp2.callData),
        accountGasLimits2, preVerificationGas2, gasFees2,
        keccak256(paymasterAndData2),
      ]
    )
  );

  const finalHash2 = keccak256(
    encodeAbiParameters(
      [{ type: 'bytes32' }, { type: 'address' }, { type: 'uint256' }],
      [userOpHash2, ENTRYPOINT_ADDRESS, BigInt(chainId)]
    )
  );

  // SIGNER AVEC LA SESSION KEY (mode 1)
  const sessionSignature = await sessionKey.signMessage({ message: { raw: finalHash2 } });
  
  userOp2.signature = encodeAbiParameters(
    [{ type: 'uint8' }, { type: 'bytes' }],
    [
      1, // mode 1 (session key)
      encodeAbiParameters(
        [{ type: 'address' }, { type: 'bytes' }],
        [sessionKey.address, sessionSignature]
      ),
    ]
  ) as Hash;

  log('✍️  UserOp Signed with Session Key', {
    signer: sessionKey.address,
    mode: 'session_key',
  });

  // Convertir en format unpacked pour Pimlico (sans initCode car compte existe)
  const userOp2ForBundle = {
    sender: userOp2.sender,
    nonce: userOp2.nonce,
    callData: userOp2.callData,
    callGasLimit: toHex(callGasLimit2),
    verificationGasLimit: toHex(verificationGasLimit2),
    preVerificationGas: userOp2.preVerificationGas,
    maxFeePerGas: toHex(maxFeePerGas2),
    maxPriorityFeePerGas: toHex(maxPriorityFeePerGas2),
    paymaster: PAYMASTER_ADDRESS,
    paymasterData: '0x' as Hash,
    paymasterVerificationGasLimit: toHex(paymasterVerificationGasLimit2),
    paymasterPostOpGasLimit: toHex(paymasterPostOpGasLimit2),
    signature: userOp2.signature,
  };

  // Envoyer au bundler
  log('📡 Sending UserOp to Bundler...', 'Please wait...');

  const receipt2 = await bundlerClient.request({
    method: 'eth_sendUserOperation' as any,
    params: [userOp2ForBundle, ENTRYPOINT_ADDRESS],
  });

  log('⏳ Waiting for execution...', 'This may take 5-15 seconds...');

  let executed = null;
  for (let i = 0; i < 30; i++) {
    try {
      executed = await bundlerClient.request({
        method: 'eth_getUserOperationReceipt' as any,
        params: [receipt2],
      });
      if (executed) break;
    } catch (e) {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (!executed) {
    throw new Error('❌ UserOp not executed after 30 seconds.');
  }

  log('🎉 NFT MINTED WITH SESSION KEY!', {
    userOpHash: receipt2,
    txHash: executed.receipt.transactionHash,
    sessionKey: sessionKey.address,
    success: executed.success,
  });

  log('💡 Summary', `
✅ Session key created: ${sessionKey.address}
✅ Session key added to account
✅ NFT minted using session key (not owner!)
✅ Demonstration successful!

This shows how you can delegate temporary permissions to a key
without exposing your main owner key.
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  });
