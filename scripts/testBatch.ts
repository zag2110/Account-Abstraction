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
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
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
 * Script pour tester les transactions BATCH via UserOp
 * 
 * Ce script montre comment :
 * 1. Mint PLUSIEURS NFTs en une seule transaction
 * 2. Utiliser executeBatch du SmartAccount
 * 3. Économiser du gas avec le batching
 */

async function main() {
  log('📦 TEST BATCH TRANSACTIONS', 'Starting...');

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
    batchSize: 3,
  });

  // 1) Préparer 3 appels de mint
  const batchSize = 3;
  const targets: Address[] = [];
  const values: bigint[] = [];
  const calldatas: Hash[] = [];

  for (let i = 0; i < batchSize; i++) {
    targets.push(NFT_ADDRESS);
    values.push(0n);
    
    const mintCallData = encodeFunctionData({
      abi: NFT_ABI,
      functionName: 'mint',
      args: [smartAccountAddress],
    });
    
    calldatas.push(mintCallData as Hash);
  }

  log('📝 Batch Prepared', {
    operations: batchSize,
    target: NFT_ADDRESS,
    function: 'mint(address)',
  });

  // 2) Encoder l'appel à executeBatch
  const executeBatchCallData = encodeFunctionData({
    abi: SMART_ACCOUNT_ABI,
    functionName: 'executeBatch',
    args: [targets, values, calldatas],
  });

  // 3) Récupérer le nonce
  const nonce = await publicClient.readContract({
    address: smartAccountAddress,
    abi: SMART_ACCOUNT_ABI,
    functionName: 'nonce',
  });

  log('🔢 Current Nonce', nonce.toString());

  // 4) Créer le UserOp (format packed pour le calcul de hash)
  const verificationGasLimit = 300000n;
  const callGasLimit = 300000n;
  const accountGasLimits = concat([
    pad(toHex(verificationGasLimit), { size: 16 }),
    pad(toHex(callGasLimit), { size: 16 }),
  ]);

  const maxPriorityFeePerGas = parseEther('0.000000002');
  const maxFeePerGas = parseEther('0.00000002');
  const gasFees = concat([
    pad(toHex(maxPriorityFeePerGas), { size: 16 }),
    pad(toHex(maxFeePerGas), { size: 16 }),
  ]);

  const paymasterVerificationGasLimit = 80000n;
  const paymasterPostOpGasLimit = 80000n;
  const paymasterAndData = concat([
    PAYMASTER_ADDRESS,
    pad(toHex(paymasterVerificationGasLimit), { size: 16 }),
    pad(toHex(paymasterPostOpGasLimit), { size: 16 }),
    '0x' as Hash,
  ]);

  const userOp = {
    sender: smartAccountAddress,
    nonce,
    initCode: '0x' as Hash,
    callData: executeBatchCallData as Hash,
    accountGasLimits,
    preVerificationGas: 80000n,
    gasFees,
    paymasterAndData,
    signature: '0x' as Hash,
  };

  log('📦 Batch UserOp Created', {
    operations: batchSize,
    estimatedGasPerOp: '~100k gas',
    totalEstimatedGas: '~300k gas',
  });

  // 5) Calculer le userOpHash pour v0.7 (méthode correcte)
  const chainId = await publicClient.getChainId();
  
  // Pack selon UserOperationLib.encode()
  const packedData = encodeAbiParameters(
    [
      { type: 'address' },
      { type: 'uint256' },
      { type: 'bytes32' },
      { type: 'bytes32' },
      { type: 'bytes32' },
      { type: 'uint256' },
      { type: 'bytes32' },
      { type: 'bytes32' },
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

  // 6) Signer le userOpHash avec signMessage (applique le préfixe Ethereum Signed Message)
  const signature = await owner.signMessage({
    message: { raw: userOpHash },
  });

  const fullSignature = encodeAbiParameters(
    [{ type: 'uint8' }, { type: 'bytes' }],
    [
      0,
      encodeAbiParameters(
        [{ type: 'address[]' }, { type: 'bytes[]' }],
        [[owner.address], [signature]]
      ),
    ]
  );

  userOp.signature = fullSignature as Hash;

  log('✍️  Batch UserOp Signed', 'Ready to send...');

  // 7) Préparer le UserOp pour Pimlico (format unpacked)
  const userOpForBundle = {
    sender: userOp.sender,
    nonce: toHex(userOp.nonce),
    callData: userOp.callData,
    callGasLimit: toHex(callGasLimit),
    verificationGasLimit: toHex(verificationGasLimit),
    preVerificationGas: toHex(userOp.preVerificationGas),
    maxFeePerGas: toHex(maxFeePerGas),
    maxPriorityFeePerGas: toHex(maxPriorityFeePerGas),
    paymaster: PAYMASTER_ADDRESS,
    paymasterData: '0x' as Hash,
    paymasterVerificationGasLimit: toHex(paymasterVerificationGasLimit),
    paymasterPostOpGasLimit: toHex(paymasterPostOpGasLimit),
    signature: userOp.signature,
  };

  // 8) Envoyer au bundler
  log('📡 Sending Batch UserOp to Bundler', 'Please wait...');

  try {
    const userOpReceipt = await bundlerClient.request({
      method: 'eth_sendUserOperation' as any,
      params: [userOpForBundle, ENTRYPOINT_ADDRESS],
    });

    log('✅ Batch UserOp Sent!', {
      userOpHash: userOpReceipt,
      operations: batchSize,
    });

    // 9) Attendre l'exécution
    log('⏳ Waiting for batch execution', 'This may take 5-15 seconds...');

    let receipt = null;
    for (let i = 0; i < 30; i++) {
      try {
        receipt = await bundlerClient.request({
          method: 'eth_getUserOperationReceipt' as any,
          params: [userOpReceipt],
        });
        if (receipt) break;
      } catch (e) {}
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (!receipt) {
      throw new Error('❌ Batch UserOp not executed after 30 seconds.');
    }

    log('🎉 BATCH EXECUTED SUCCESSFULLY!', {
      userOpHash: userOpReceipt,
      txHash: receipt.receipt.transactionHash,
      success: receipt.success,
      actualGasUsed: receipt.actualGasUsed,
      operationsExecuted: batchSize,
      gasPerOperation: `~${Number(receipt.actualGasUsed) / batchSize} gas`,
    });

    log('💰 Gas Savings', `
Single transactions: ${batchSize} × ~150k = ~450k gas
Batch transaction: ${receipt.actualGasUsed} gas
Savings: ~${450000 - Number(receipt.actualGasUsed)} gas (~${Math.round(((450000 - Number(receipt.actualGasUsed)) / 450000) * 100)}%)
    `);

    log('💡 Next Steps', `
1. Check your NFTs on Sepolia:
   https://sepolia.etherscan.io/address/${smartAccountAddress}#tokentxns

2. Try session keys:
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
