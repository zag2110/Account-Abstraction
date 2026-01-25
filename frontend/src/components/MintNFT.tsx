import { useState } from 'react';
import { useAccount } from 'wagmi';
import { type Address } from 'viem';

const NFT_ADDRESS = '0x8FAF5b6b434941F1A36a6A15E569C478Eb677481' as Address;

export default function MintNFT() {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [smartAccountAddress, setSmartAccountAddress] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mintNFT = async () => {
    if (!smartAccountAddress) {
      setError('Please enter your Smart Account address');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Cette partie nécessite l'intégration avec Pimlico bundler
      // Pour l'instant, on affiche juste les infos
      alert('This feature requires Pimlico bundler integration. Check the backend scripts!');
      
    } catch (err: any) {
      console.error('Mint error:', err);
      setError(err.message || 'Failed to mint NFT');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">🎨 Mint NFT via UserOp</h2>

      <div className="space-y-4">
        <div>
          <p className="text-slate-300 mb-4">
            Mint an NFT using your Smart Account through a UserOperation (ERC-4337).
            The transaction will be sent via the Pimlico bundler.
          </p>
        </div>

        {/* Smart Account Address Input */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Smart Account Address
          </label>
          <input
            type="text"
            value={smartAccountAddress}
            onChange={(e) => setSmartAccountAddress(e.target.value)}
            placeholder="0x..."
            className="input w-full"
          />
          <p className="text-xs text-slate-400 mt-1">
            Enter the address of your Smart Account created in the previous step
          </p>
        </div>

        {/* NFT Info */}
        <div className="bg-slate-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">NFT Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Contract:</span>
              <span className="text-white font-mono text-xs">{NFT_ADDRESS}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Network:</span>
              <span className="text-white">Sepolia</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gas:</span>
              <span className="text-green-400">Paid by Paymaster 🎉</span>
            </div>
          </div>
        </div>

        {/* Mint Button */}
        <button
          onClick={mintNFT}
          disabled={loading || !smartAccountAddress}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Minting...' : 'Mint NFT via UserOp'}
        </button>

        {/* Transaction Hash */}
        {txHash && (
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-400 mb-2">✅ NFT Minted!</h3>
            <p className="text-sm text-slate-300 mb-2">Transaction Hash:</p>
            <p className="text-sm text-white font-mono break-all mb-3">{txHash}</p>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
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
          <h4 className="text-blue-400 font-semibold mb-2">ℹ️ How it works</h4>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• Creates a UserOperation to mint the NFT</li>
            <li>• Signs it with your wallet</li>
            <li>• Sends it to the Pimlico bundler</li>
            <li>• Bundler includes it in a bundle and executes</li>
            <li>• Paymaster pays the gas fees!</li>
          </ul>
        </div>

        {/* Backend Scripts Info */}
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <h4 className="text-yellow-400 font-semibold mb-2">⚡ Backend Scripts</h4>
          <p className="text-sm text-slate-300 mb-2">
            For full functionality, use the TypeScript backend scripts:
          </p>
          <code className="text-xs bg-slate-900 p-2 rounded block">
            npm run mint-nft
          </code>
        </div>
      </div>
    </div>
  );
}
