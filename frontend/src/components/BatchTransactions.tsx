import { useState } from 'react';
import { useAccount } from 'wagmi';

export default function BatchTransactions() {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [smartAccountAddress, setSmartAccountAddress] = useState('');
  const [batchSize, setBatchSize] = useState(3);

  const executeBatch = async () => {
    if (!smartAccountAddress) {
      alert('Please enter your Smart Account address');
      return;
    }

    try {
      setLoading(true);
      alert(`This feature requires backend integration. Run: npm run test-batch`);
    } catch (err: any) {
      console.error('Batch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">📦 Batch Transactions</h2>

      <div className="space-y-4">
        <div>
          <p className="text-slate-300 mb-4">
            Execute multiple transactions in a single UserOperation to save gas!
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
        </div>

        {/* Batch Size */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Number of NFTs to Mint
          </label>
          <input
            type="number"
            value={batchSize}
            onChange={(e) => setBatchSize(parseInt(e.target.value) || 1)}
            min="1"
            max="10"
            className="input w-full"
          />
          <p className="text-xs text-slate-400 mt-1">
            Mint multiple NFTs in one transaction
          </p>
        </div>

        {/* Gas Savings Estimation */}
        <div className="bg-slate-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">💰 Gas Savings</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Individual Transactions:</span>
              <span className="text-white">{batchSize} × ~150k gas = ~{batchSize * 150}k gas</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Batch Transaction:</span>
              <span className="text-green-400">~{100 + batchSize * 80}k gas</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-slate-400">Estimated Savings:</span>
              <span className="text-green-400">
                ~{Math.round(((batchSize * 150 - (100 + batchSize * 80)) / (batchSize * 150)) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Execute Button */}
        <button
          onClick={executeBatch}
          disabled={loading || !smartAccountAddress}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Executing...' : `Execute Batch (${batchSize} NFTs)`}
        </button>

        {/* Info */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h4 className="text-blue-400 font-semibold mb-2">ℹ️ Batching Benefits</h4>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• Significant gas savings on multiple operations</li>
            <li>• All transactions execute atomically</li>
            <li>• Better UX - one signature for multiple actions</li>
            <li>• Reduces blockchain congestion</li>
          </ul>
        </div>

        {/* Backend Scripts Info */}
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <h4 className="text-yellow-400 font-semibold mb-2">⚡ Backend Script</h4>
          <p className="text-sm text-slate-300 mb-2">
            To execute batch transactions with the bundler:
          </p>
          <code className="text-xs bg-slate-900 p-2 rounded block">
            npm run test-batch
          </code>
        </div>

        {/* Example */}
        <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
          <h4 className="text-purple-400 font-semibold mb-2">💡 Example Use Cases</h4>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• Mint multiple NFTs at once</li>
            <li>• Approve token + swap in one transaction</li>
            <li>• Update multiple settings together</li>
            <li>• Batch airdrops to multiple addresses</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
