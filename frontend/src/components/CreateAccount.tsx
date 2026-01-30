import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseEther, encodeFunctionData, type Address } from 'viem';

// Adresses des contrats déployés sur Sepolia
const FACTORY_ADDRESS = '0x34b271bE0ce80156DBa7562298A1276c6Fe15C58' as Address;
const ENTRYPOINT_ADDRESS = '0x0000000071727De22E5E9d8BAf0edAc6f37da032' as Address;

const FACTORY_ABI = [
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

export default function CreateAccount() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [loading, setLoading] = useState(false);
  const [predictedAddress, setPredictedAddress] = useState<Address | null>(null);
  const [createdAddress, setCreatedAddress] = useState<Address | null>(null);
  const [accountExists, setAccountExists] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predictAddress = async () => {
    if (!address || !publicClient) return;

    try {
      setLoading(true);
      setError(null);

      const predicted = await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'predictAccountAddress',
        args: [
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          [address],
          1n,
          [],
          0n,
        ],
      });

      setPredictedAddress(predicted as Address);
      
      // Vérifier si le compte existe déjà
      const code = await publicClient.getBytecode({ address: predicted as Address });
      if (code && code !== '0x') {
        setAccountExists(true);
        setCreatedAddress(predicted as Address);
      } else {
        setAccountExists(false);
      }
    } catch (err: any) {
      console.error('Predict error:', err);
      setError(err.message || 'Failed to predict address');
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async () => {
    if (!address || !walletClient) return;

    try {
      setLoading(true);
      setError(null);

      const hash = await walletClient.writeContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'createAccount',
        args: [
          ENTRYPOINT_ADDRESS,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          [address],
          1n,
          [],
          0n,
        ],
        gas: 500000n, // Limite de gas explicite pour éviter l'erreur
      });

      // Attendre la confirmation
      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        setCreatedAddress(predictedAddress);
        alert('Smart Account created successfully! 🎉');
      }
    } catch (err: any) {
      console.error('Create error:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">🏗️ Create Smart Account</h2>

      <div className="space-y-4">
        <div>
          <p className="text-slate-300 mb-4">
            Create your ERC-4337 Smart Account with advanced features like multisig, batching, session keys, and social recovery.
          </p>
        </div>

        {/* Predict Address */}
        <div className="bg-slate-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">Step 1: Predict Address</h3>
          <p className="text-sm text-slate-400 mb-4">
            Calculate your account address before deployment (counterfactual address).
          </p>
          <button
            onClick={predictAddress}
            disabled={loading || !address}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Predicting...' : 'Predict Address'}
          </button>

          {predictedAddress && (
            <div className="mt-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
              <p className="text-xs text-green-400 mb-1">
                {accountExists ? '✅ Your Existing Smart Account:' : 'Predicted Address:'}
              </p>
              <p className="text-sm text-white font-mono break-all">{predictedAddress}</p>
              {accountExists && (
                <div className="mt-2">
                  <p className="text-xs text-yellow-400">
                    ℹ️ This account already exists! You can use it directly.
                  </p>
                  <a 
                    href={`https://sepolia.etherscan.io/address/${predictedAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    View on Etherscan →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Account */}
        {predictedAddress && !accountExists && (
          <div className="bg-slate-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Step 2: Deploy Account</h3>
            <p className="text-sm text-slate-400 mb-4">
              Deploy your Smart Account on Sepolia testnet.
            </p>
            <button
              onClick={createAccount}
              disabled={loading || !walletClient}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        )}

        {/* Account Already Exists */}
        {predictedAddress && accountExists && (
          <div className="bg-slate-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-400 mb-2">✅ Account Ready!</h3>
            <p className="text-sm text-slate-300 mb-4">
              Your Smart Account is already deployed and ready to use.
            </p>
            <div className="space-y-2">
              <div className="text-sm text-slate-400">
                <strong>Address:</strong>
                <p className="font-mono text-white break-all mt-1">{predictedAddress}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <a
                  href={`https://sepolia.etherscan.io/address/${predictedAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex-1 text-center"
                >
                  View on Etherscan
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(predictedAddress);
                    alert('Address copied to clipboard!');
                  }}
                  className="btn-primary flex-1"
                >
                  Copy Address
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Created Address */}
        {createdAddress && !accountExists && (
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-400 mb-2">✅ Account Created!</h3>
            <p className="text-sm text-slate-300 mb-2">Your Smart Account:</p>
            <p className="text-sm text-white font-mono break-all mb-3">{createdAddress}</p>
            <a
              href={`https://sepolia.etherscan.io/address/${createdAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm"
            >
              View on Etherscan →
            </a>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h4 className="text-blue-400 font-semibold mb-2">ℹ️ Features</h4>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• Multisig support (configurable threshold)</li>
            <li>• Transaction batching (save gas!)</li>
            <li>• Session keys for temporary access</li>
            <li>• Social recovery with guardians</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
