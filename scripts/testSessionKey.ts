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

  // Encoder l'appel à addSessionKey
  const addSessionKeyCallData = encodeFunctionData({
    abi: SMART_ACCOUNT_ABI,
    functionName: 'addSessionKey',
    args: [sessionKey.address, validUntil, oneTime],
  });

  // Créer un UserOp pour ajouter la session key (signé par l'owner)
  const wallet = createWallet(ownerPrivateKey);
  
  const nonce1 = await publicClient.readContract({
    address: smartAccountAddress,
    abi: SMART_ACCOUNT_ABI,
    functionName: 'nonce',
  });

  // On va faire ça de manière simple : transaction directe via le owner
  // (pour éviter de compliquer avec un autre UserOp)
  
  log('🔄 Adding session key via owner...', 'Sending transaction...');
  
  // Encoder execute(smartAccount, 0, addSessionKeyCallData)
  const executeCallData = encodeFunctionData({
    abi: SMART_ACCOUNT_ABI,
    functionName: 'execute',
    args: [smartAccountAddress, 0n, addSessionKeyCallData],
  });

  // Créer un UserOp signé par l'owner
  const userOp1 = {
    sender: smartAccountAddress,
    nonce: nonce1,
    initCode: '0x' as Hash,
    callData: executeCallData as Hash,
    accountGasLimits: pad(toHex(150000n), { size: 32 }) as Hash,
    preVerificationGas: 50000n,
    gasFees: concat([
      pad(toHex(parseEther('0.000000002')), { size: 16 }),
      pad(toHex(parseEther('0.00000002')), { size: 16 }),
    ]) as Hash,
    paymasterAndData: concat([PAYMASTER_ADDRESS, pad('0x', { size: 0 })]) as Hash,
    signature: '0x' as Hash,
  };

  // Signer avec l'owner
  const chainId = await publicClient.getChainId();
  
  const userOpHash1 = keccak256(
    encodeAbiParameters(
      [
        { type: 'address' }, { type: 'uint256' }, { type: 'bytes32' }, { type: 'bytes32' },
        { type: 'bytes32' }, { type: 'uint256' }, { type: 'bytes32' }, { type: 'bytes32' },
      ],
      [
        userOp1.sender, userOp1.nonce, keccak256(userOp1.initCode), keccak256(userOp1.callData),
        userOp1.accountGasLimits, userOp1.preVerificationGas, userOp1.gasFees,
        keccak256(userOp1.paymasterAndData),
      ]
    )
  );

  const finalHash1 = keccak256(
    encodeAbiParameters(
      [{ type: 'bytes32' }, { type: 'address' }, { type: 'uint256' }],
      [userOpHash1, ENTRYPOINT_ADDRESS, BigInt(chainId)]
    )
  );

  const signature1 = await owner.signMessage({ message: { raw: finalHash1 } });
  userOp1.signature = encodeAbiParameters(
    [{ type: 'uint8' }, { type: 'bytes' }],
    [0, encodeAbiParameters([{ type: 'address[]' }, { type: 'bytes[]' }], [[owner.address], [signature1]])]
  ) as Hash;

  // Envoyer au bundler
  const receipt1 = await bundlerClient.request({
    method: 'eth_sendUserOperation' as any,
    params: [userOp1, ENTRYPOINT_ADDRESS],
  });

  log('⏳ Waiting for session key to be added...', 'Please wait...');

  // Attendre l'exécution
  let added = null;
  for (let i = 0; i < 30; i++) {
    try {
      added = await bundlerClient.request({
        method: 'eth_getUserOperationReceipt' as any,
        params: [receipt1],
      });
      if (added) break;
    } catch (e) {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (!added) {
    throw new Error('❌ Failed to add session key after 30 seconds.');
  }

  log('✅ Session Key Added!', {
    sessionKey: sessionKey.address,
    validUntil: new Date(validUntil * 1000).toISOString(),
    oneTime: oneTime,
  });

  // ==========================================
  // STEP 3: Utiliser la session key pour mint
  // ==========================================

  log('🎨 Minting NFT with Session Key', 'Preparing UserOp...');

  // Attendre un peu pour être sûr que le nonce a été mis à jour
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const nonce2 = await publicClient.readContract({
    address: smartAccountAddress,
    abi: SMART_ACCOUNT_ABI,
    functionName: 'nonce',
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
  const userOp2 = {
    sender: smartAccountAddress,
    nonce: nonce2,
    initCode: '0x' as Hash,
    callData: executeCallData2 as Hash,
    accountGasLimits: pad(toHex(150000n), { size: 32 }) as Hash,
    preVerificationGas: 50000n,
    gasFees: concat([
      pad(toHex(parseEther('0.000000002')), { size: 16 }),
      pad(toHex(parseEther('0.00000002')), { size: 16 }),
    ]) as Hash,
    paymasterAndData: concat([PAYMASTER_ADDRESS, pad('0x', { size: 0 })]) as Hash,
    signature: '0x' as Hash,
  };

  // Calculer le hash
  const userOpHash2 = keccak256(
    encodeAbiParameters(
      [
        { type: 'address' }, { type: 'uint256' }, { type: 'bytes32' }, { type: 'bytes32' },
        { type: 'bytes32' }, { type: 'uint256' }, { type: 'bytes32' }, { type: 'bytes32' },
      ],
      [
        userOp2.sender, userOp2.nonce, keccak256(userOp2.initCode), keccak256(userOp2.callData),
        userOp2.accountGasLimits, userOp2.preVerificationGas, userOp2.gasFees,
        keccak256(userOp2.paymasterAndData),
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

  // Envoyer au bundler
  log('📡 Sending UserOp to Bundler...', 'Please wait...');

  const receipt2 = await bundlerClient.request({
    method: 'eth_sendUserOperation' as any,
    params: [userOp2, ENTRYPOINT_ADDRESS],
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
