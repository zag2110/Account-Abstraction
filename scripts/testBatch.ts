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

  // 4) Créer le UserOp
  const userOp = {
    sender: smartAccountAddress,
    nonce: nonce,
    initCode: '0x' as Hash,
    callData: executeBatchCallData as Hash,
    accountGasLimits: pad(toHex(300000n), { size: 32 }) as Hash, // Plus de gas pour le batch
    preVerificationGas: 80000n, // Plus de gas pour les 3 ops
    gasFees: concat([
      pad(toHex(parseEther('0.000000002')), { size: 16 }),
      pad(toHex(parseEther('0.00000002')), { size: 16 }),
    ]) as Hash,
    paymasterAndData: concat([
      PAYMASTER_ADDRESS,
      pad('0x', { size: 0 }),
    ]) as Hash,
    signature: '0x' as Hash,
  };

  log('📦 Batch UserOp Created', {
    operations: batchSize,
    estimatedGasPerOp: '~100k gas',
    totalEstimatedGas: '~300k gas',
  });

  // 5) Calculer le userOpHash
  const chainId = await publicClient.getChainId();
  
  const userOpHash = keccak256(
    encodeAbiParameters(
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
    )
  );

  const finalHash = keccak256(
    encodeAbiParameters(
      [{ type: 'bytes32' }, { type: 'address' }, { type: 'uint256' }],
      [userOpHash, ENTRYPOINT_ADDRESS, BigInt(chainId)]
    )
  );

  // 6) Signer
  const signature = await owner.signMessage({
    message: { raw: finalHash },
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

  // 7) Envoyer au bundler
  log('📡 Sending Batch UserOp to Bundler', 'Please wait...');

  try {
    const userOpReceipt = await bundlerClient.request({
      method: 'eth_sendUserOperation' as any,
      params: [userOp, ENTRYPOINT_ADDRESS],
    });

    log('✅ Batch UserOp Sent!', {
      userOpHash: userOpReceipt,
      operations: batchSize,
    });

    // 8) Attendre l'exécution
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
