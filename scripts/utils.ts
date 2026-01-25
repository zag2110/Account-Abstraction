import { createPublicClient, createWalletClient, http, type Address, type Hash } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';

dotenv.config();

// ========================================
// CONFIGURATION
// ========================================

export const ENTRYPOINT_ADDRESS = process.env.ENTRYPOINT_ADDRESS as Address;
export const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS as Address;
export const PAYMASTER_ADDRESS = process.env.PAYMASTER_ADDRESS as Address;
export const NFT_ADDRESS = process.env.NFT_ADDRESS as Address;

export const PIMLICO_API_KEY = process.env.PIMLICO_API_KEY!;
export const PIMLICO_BUNDLER_URL = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${PIMLICO_API_KEY}`;

// ========================================
// CLIENTS
// ========================================

/**
 * Client public pour lire la blockchain
 */
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL),
});

/**
 * Client bundler Pimlico pour envoyer les UserOps
 */
export const bundlerClient = createPublicClient({
  chain: sepolia,
  transport: http(PIMLICO_BUNDLER_URL),
});

/**
 * Créer un wallet client à partir d'une private key
 */
export function createWallet(privateKey: string) {
  const account = privateKeyToAccount(privateKey as Hash);
  return createWalletClient({
    account,
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL),
  });
}

// ========================================
// FACTORY ABI
// ========================================

export const FACTORY_ABI = [
  {
    inputs: [
      { name: 'entryPoint', type: 'address' },
      { name: 'userSalt', type: 'bytes32' },
      { name: 'owners', type: 'address[]' },
      { name: 'threshold', type: 'uint256' },
      { name: 'guardians', type: 'address[]' },
      { name: 'guardianThreshold', type: 'uint256' },
    ],
    name: 'createAccount',
    outputs: [{ name: 'account', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'userSalt', type: 'bytes32' },
      { name: 'owners', type: 'address[]' },
      { name: 'threshold', type: 'uint256' },
      { name: 'guardians', type: 'address[]' },
      { name: 'guardianThreshold', type: 'uint256' },
    ],
    name: 'predictAccountAddress',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ========================================
// SMART ACCOUNT ABI
// ========================================

export const SMART_ACCOUNT_ABI = [
  {
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'datas', type: 'bytes[]' },
    ],
    name: 'executeBatch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'key', type: 'address' },
      { name: 'validUntil', type: 'uint48' },
      { name: 'oneTime', type: 'bool' },
    ],
    name: 'addSessionKey',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nonce',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ========================================
// NFT ABI
// ========================================

export const NFT_ABI = [
  {
    inputs: [{ name: 'to', type: 'address' }],
    name: 'mint',
    outputs: [{ name: 'tokenId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// ========================================
// PAYMASTER ABI
// ========================================

export const PAYMASTER_ABI = [
  {
    inputs: [],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Prédire l'adresse d'un smart account AVANT son déploiement
 */
export async function predictAccountAddress(
  owners: Address[],
  threshold: number,
  guardians: Address[] = [],
  guardianThreshold: number = 0,
  salt: Hash = '0x0000000000000000000000000000000000000000000000000000000000000000'
): Promise<Address> {
  const address = await publicClient.readContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'predictAccountAddress',
    args: [salt, owners, BigInt(threshold), guardians, BigInt(guardianThreshold)],
  });

  return address;
}

/**
 * Logger formaté
 */
export function log(title: string, data: any) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(title);
  console.log('='.repeat(50));
  console.log(data);
}

/**
 * Attendre qu'une transaction soit minée
 */
export async function waitForTransaction(hash: Hash) {
  log('⏳ Waiting for transaction', hash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  log('✅ Transaction mined', {
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    status: receipt.status,
  });
  return receipt;
}
