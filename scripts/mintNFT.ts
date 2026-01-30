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
  hexToBytes,
  toBytes,
  serializeSignature,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sign } from 'viem/accounts';
import {
  publicClient,
  bundlerClient,
  ENTRYPOINT_ADDRESS,
  NFT_ADDRESS,
  PAYMASTER_ADDRESS,
  SMART_ACCOUNT_ABI,
  NFT_ABI,
  log,
} from './utils.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script pour mint un NFT via un UserOp (ERC-4337)
 * 
 * Ce script montre le workflow complet ERC-4337 :
 * 1. Créer un UserOp pour mint un NFT
 * 2. Signer le UserOp avec l'owner
 * 3. Envoyer le UserOp au bundler Pimlico
 * 4. Attendre l'exécution
 */

async function main() {
  log('🎨 MINT NFT VIA USEROP', 'Starting...');

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
    nft: NFT_ADDRESS,
    paymaster: PAYMASTER_ADDRESS,
  });

  // 1) Préparer le callData pour mint(smartAccountAddress)
  const mintCallData = encodeFunctionData({
    abi: NFT_ABI,
    functionName: 'mint',
    args: [smartAccountAddress],
  });

  // 2) Encoder l'appel à execute(NFT, 0, mintCallData)
  const executeCallData = encodeFunctionData({
    abi: SMART_ACCOUNT_ABI,
    functionName: 'execute',
    args: [NFT_ADDRESS, 0n, mintCallData],
  });

  log('📝 Call Data Prepared', {
    target: NFT_ADDRESS,
    function: 'mint(address)',
    recipient: smartAccountAddress,
  });

  // 3) Récupérer le nonce du smart account
  const nonce = await publicClient.readContract({
    address: smartAccountAddress,
    abi: SMART_ACCOUNT_ABI,
    functionName: 'nonce',
  });

  log('🔢 Current Nonce', nonce.toString());

  // 4) Créer le UserOp (format v0.7 - PACKED)
  // Pack gas limits into bytes32
  const verificationGasLimit = 150000n;
  const callGasLimit = 150000n;
  const accountGasLimits = concat([
    pad(toHex(verificationGasLimit), { size: 16 }), // high 128 bits
    pad(toHex(callGasLimit), { size: 16 }),        // low 128 bits
  ]);

  const maxPriorityFeePerGas = parseEther('0.000000002');
  const maxFeePerGas = parseEther('0.00000002');
  const gasFees = concat([
    pad(toHex(maxPriorityFeePerGas), { size: 16 }), // high 128 bits
    pad(toHex(maxFeePerGas), { size: 16 }),         // low 128 bits
  ]);

  const paymasterVerificationGasLimit = 50000n;
  const paymasterPostOpGasLimit = 50000n;
  const paymasterAndData = concat([
    PAYMASTER_ADDRESS,
    pad(toHex(paymasterVerificationGasLimit), { size: 16 }),
    pad(toHex(paymasterPostOpGasLimit), { size: 16 }),
    '0x' as Hash, // paymasterData
  ]);

  const userOp = {
    sender: smartAccountAddress,
    nonce,
    initCode: '0x' as Hash,
    callData: executeCallData as Hash,
    accountGasLimits,
    preVerificationGas: 60000n, // Augmenté de 50000 à 60000
    gasFees,
    paymasterAndData,
    signature: '0x' as Hash, // On va le remplir après
  };

  log('📦 UserOp Created (unsigned)', {
    sender: userOp.sender,
    nonce: userOp.nonce.toString(),
  });

  // 5) Calculer le userOpHash pour v0.7 (méthode correcte)
  const chainId = await publicClient.getChainId();
  
  // Pack selon UserOperationLib.encode()
  const packedData = encodeAbiParameters(
    [
      { type: 'address' },  // sender
      { type: 'uint256' },  // nonce
      { type: 'bytes32' },  // keccak256(initCode)
      { type: 'bytes32' },  // keccak256(callData)
      { type: 'bytes32' },  // accountGasLimits
      { type: 'uint256' },  // preVerificationGas
      { type: 'bytes32' },  // gasFees
      { type: 'bytes32' },  // keccak256(paymasterAndData)
    ],
    [
      userOp.sender,
      userOp.nonce,
      keccak256(userOp.initCode),
      keccak256(userOp.callData),
      userOp.accountGasLimits,
      userOp.preVerificationGas,
      userOp.gasFees,
      keccak256(userOp.paymasterAndData),
    ]
  );

  // userOp.hash() = keccak256(encode(userOp))
  const userOpHashInternal = keccak256(packedData);

  // getUserOpHash() = keccak256(abi.encode(userOp.hash(), entryPoint, chainId))
  const userOpHash = keccak256(
    encodeAbiParameters(
      [{ type: 'bytes32' }, { type: 'address' }, { type: 'uint256' }],
      [userOpHashInternal, ENTRYPOINT_ADDRESS, BigInt(chainId)]
    )
  );

  log('🔐 UserOp Hash', userOpHash);

  // 6) Signer le userOpHash avec l'owner
  // Format de signature pour mode 0 (multisig):
  // abi.encode(uint8 mode, bytes payload)
  // où payload = abi.encode(address[] signers, bytes[] signatures)
  
  // IMPORTANT: Le contrat applique _ethSigned() qui ajoute le préfixe
  // "\x19Ethereum Signed Message:\n32" au userOpHash, puis fait recover().
  // Donc on doit signer en utilisant signMessage() qui applique aussi ce préfixe.
  // La signature sera valide car: sign(ethSigned(hash)) == ethSigned(hash) quand récupéré
  const sig = await owner.signMessage({
    message: { raw: userOpHash },
  });
  
  const fullSignature = encodeAbiParameters(
    [{ type: 'uint8' }, { type: 'bytes' }],
    [
      0, // mode 0 (multisig)
      encodeAbiParameters(
        [{ type: 'address[]' }, { type: 'bytes[]' }],
        [[owner.address], [sig]]
      ),
    ]
  );

  userOp.signature = fullSignature as Hash;

  log('✍️  UserOp Signed', {
    mode: 'multisig',
    signer: owner.address,
  });

  // 7) Préparer le UserOp pour l'envoi au bundler (format unpacked pour Pimlico)
  const userOpForBundle = {
    sender: userOp.sender,
    nonce: toHex(userOp.nonce),
    // Pour un compte déjà déployé, pas besoin d'initCode/factory
    callData: userOp.callData,
    // Unpacked fields for Pimlico API
    callGasLimit: toHex(callGasLimit),
    verificationGasLimit: toHex(verificationGasLimit),
    preVerificationGas: toHex(userOp.preVerificationGas),
    maxFeePerGas: toHex(maxFeePerGas),
    maxPriorityFeePerGas: toHex(maxPriorityFeePerGas),
    // Paymaster fields
    paymaster: PAYMASTER_ADDRESS,
    paymasterData: '0x' as Hash,
    paymasterVerificationGasLimit: toHex(paymasterVerificationGasLimit),
    paymasterPostOpGasLimit: toHex(paymasterPostOpGasLimit),
    signature: userOp.signature,
  };

  // 8) Envoyer le UserOp au bundler Pimlico
  log('📡 Sending UserOp to Pimlico Bundler', 'Please wait...');

  try {
    // Pimlico accepte les UserOps via eth_sendUserOperation
    const userOpReceipt = await bundlerClient.request({
      method: 'eth_sendUserOperation' as any,
      params: [userOpForBundle, ENTRYPOINT_ADDRESS],
    });

    log('✅ UserOp Sent to Bundler!', {
      userOpHash: userOpReceipt,
      message: 'Waiting for bundler to include it in a bundle...',
    });

    // 8) Attendre que le bundler exécute le UserOp
    log('⏳ Waiting for UserOp execution', 'This may take 5-15 seconds...');

    // Polling pour vérifier l'exécution
    let receipt = null;
    for (let i = 0; i < 30; i++) {
      try {
        receipt = await bundlerClient.request({
          method: 'eth_getUserOperationReceipt' as any,
          params: [userOpReceipt],
        });
        if (receipt) break;
      } catch (e) {
        // Pas encore exécuté
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (!receipt) {
      throw new Error('❌ UserOp not executed after 30 seconds. Check bundler status.');
    }

    log('🎉 NFT MINTED SUCCESSFULLY!', {
      userOpHash: userOpReceipt,
      txHash: receipt.receipt.transactionHash,
      success: receipt.success,
      actualGasUsed: receipt.actualGasUsed,
    });

    log('💡 Next Steps', `
1. Check your NFT on Sepolia:
   https://sepolia.etherscan.io/address/${smartAccountAddress}#tokentxns

2. Try batch execution:
   npm run test-batch

3. Try session keys:
   npm run test-session-key
    `);
  } catch (error: any) {
    log('❌ ERROR', {
      message: error.message,
      details: error.details || error.data || 'No additional details',
    });
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  });
