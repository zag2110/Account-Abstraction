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

  // 4) Créer le UserOp
  // Structure PackedUserOperation pour EntryPoint v0.7:
  // - sender: address
  // - nonce: uint256
  // - initCode: bytes (vide si compte déjà déployé)
  // - callData: bytes
  // - accountGasLimits: bytes32 (packed: verificationGasLimit | callGasLimit)
  // - preVerificationGas: uint256
  // - gasFees: bytes32 (packed: maxPriorityFeePerGas | maxFeePerGas)
  // - paymasterAndData: bytes (paymaster address + data)
  // - signature: bytes

  const userOp = {
    sender: smartAccountAddress,
    nonce: nonce,
    initCode: '0x' as Hash, // Vide car compte déjà déployé
    callData: executeCallData as Hash,
    // Gas limits (on met des valeurs génériques, Pimlico les ajustera)
    accountGasLimits: pad(toHex(150000n), { size: 32 }) as Hash, // verificationGasLimit + callGasLimit
    preVerificationGas: 50000n,
    gasFees: concat([
      pad(toHex(parseEther('0.000000002')), { size: 16 }), // maxPriorityFeePerGas
      pad(toHex(parseEther('0.00000002')), { size: 16 }), // maxFeePerGas
    ]) as Hash,
    // Paymaster
    paymasterAndData: concat([
      PAYMASTER_ADDRESS,
      pad('0x', { size: 0 }), // Pas de data supplémentaire
    ]) as Hash,
    signature: '0x' as Hash, // On va le remplir après
  };

  log('📦 UserOp Created (unsigned)', {
    sender: userOp.sender,
    nonce: userOp.nonce.toString(),
    paymaster: PAYMASTER_ADDRESS,
  });

  // 5) Calculer le userOpHash
  // userOpHash = keccak256(abi.encode(userOp, entryPoint, chainId))
  const chainId = await publicClient.getChainId();
  
  const userOpHash = keccak256(
    encodeAbiParameters(
      [
        { type: 'address' }, // sender
        { type: 'uint256' }, // nonce
        { type: 'bytes32' }, // initCode hash
        { type: 'bytes32' }, // callData hash
        { type: 'bytes32' }, // accountGasLimits
        { type: 'uint256' }, // preVerificationGas
        { type: 'bytes32' }, // gasFees
        { type: 'bytes32' }, // paymasterAndData hash
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

  // Hash final avec entryPoint et chainId
  const finalHash = keccak256(
    encodeAbiParameters(
      [{ type: 'bytes32' }, { type: 'address' }, { type: 'uint256' }],
      [userOpHash, ENTRYPOINT_ADDRESS, BigInt(chainId)]
    )
  );

  log('🔐 UserOp Hash', finalHash);

  // 6) Signer le userOpHash avec l'owner
  // Format de signature pour mode 0 (multisig):
  // abi.encode(uint8 mode, bytes payload)
  // où payload = abi.encode(address[] signers, bytes[] signatures)

  const signature = await owner.signMessage({
    message: { raw: finalHash },
  });

  const fullSignature = encodeAbiParameters(
    [{ type: 'uint8' }, { type: 'bytes' }],
    [
      0, // mode 0 (multisig)
      encodeAbiParameters(
        [{ type: 'address[]' }, { type: 'bytes[]' }],
        [[owner.address], [signature]]
      ),
    ]
  );

  userOp.signature = fullSignature as Hash;

  log('✍️  UserOp Signed', {
    mode: 'multisig',
    signer: owner.address,
  });

  // 7) Envoyer le UserOp au bundler Pimlico
  log('📡 Sending UserOp to Pimlico Bundler', 'Please wait...');

  try {
    // Pimlico accepte les UserOps via eth_sendUserOperation
    const userOpReceipt = await bundlerClient.request({
      method: 'eth_sendUserOperation' as any,
      params: [userOp, ENTRYPOINT_ADDRESS],
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
