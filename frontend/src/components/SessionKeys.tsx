import { useState } from 'react';
import { useAccount } from 'wagmi';

export default function SessionKeys() {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [smartAccountAddress, setSmartAccountAddress] = useState('');
  const [sessionKeyAddress, setSessionKeyAddress] = useState('');
  const [validHours, setValidHours] = useState(1);
  const [oneTime, setOneTime] = useState(false);

  const addSessionKey = async () => {
    if (!smartAccountAddress) {
      alert('Please enter your Smart Account address');
      return;
    }

    try {
      setLoading(true);
      alert('This feature requires backend integration. Run: npm run test-session-key');
    } catch (err: any) {
      console.error('Session key error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateKey = () => {
    // Generate a random Ethereum address for demo
    const randomAddress = '0x' + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    setSessionKeyAddress(randomAddress);
  };

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">🔑 Session Keys</h2>

      <div className="space-y-4">
        <div>
          <p className="text-slate-300 mb-4">
            Grant temporary access to a key without exposing your main owner key.
            Perfect for dApp integrations, games, or automated trading bots.
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

        {/* Session Key Address */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Session Key Address
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={sessionKeyAddress}
              onChange={(e) => setSessionKeyAddress(e.target.value)}
              placeholder="0x..."
              className="input flex-1"
            />
            <button
              onClick={generateKey}
              className="btn-secondary whitespace-nowrap"
            >
              Generate
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            The temporary key that will have limited access
          </p>
        </div>

        {/* Validity Duration */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Valid for (hours)
          </label>
          <input
            type="number"
            value={validHours}
            onChange={(e) => setValidHours(parseInt(e.target.value) || 1)}
            min="1"
            max="168"
            className="input w-full"
          />
          <p className="text-xs text-slate-400 mt-1">
            Session key will expire after {validHours} hour{validHours > 1 ? 's' : ''}
          </p>
        </div>

        {/* One-Time Use */}
        <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-4">
          <input
            type="checkbox"
            id="oneTime"
            checked={oneTime}
            onChange={(e) => setOneTime(e.target.checked)}
            className="w-5 h-5 text-primary bg-slate-700 border-slate-600 rounded focus:ring-primary focus:ring-2"
          />
          <label htmlFor="oneTime" className="text-slate-300 cursor-pointer flex-1">
            <div className="font-medium">One-Time Use</div>
            <div className="text-sm text-slate-400">
              Key will be invalidated after first use
            </div>
          </label>
        </div>

        {/* Add Button */}
        <button
          onClick={addSessionKey}
          disabled={loading || !smartAccountAddress || !sessionKeyAddress}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add Session Key'}
        </button>

        {/* Info */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h4 className="text-blue-400 font-semibold mb-2">ℹ️ How Session Keys Work</h4>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• Temporary keys with limited permissions</li>
            <li>• Set expiration time for automatic revocation</li>
            <li>• Option for one-time use keys</li>
            <li>• Keep your main key secure</li>
            <li>• Revoke anytime if needed</li>
          </ul>
        </div>

        {/* Use Cases */}
        <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
          <h4 className="text-purple-400 font-semibold mb-2">💡 Use Cases</h4>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• <strong>Gaming:</strong> Let game contracts interact without full control</li>
            <li>• <strong>Trading Bots:</strong> Limited access for automated trading</li>
            <li>• <strong>DApp Integration:</strong> Grant temporary permissions</li>
            <li>• <strong>Multi-Device:</strong> Use different keys on different devices</li>
          </ul>
        </div>

        {/* Security Note */}
        <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-4">
          <h4 className="text-orange-400 font-semibold mb-2">⚠️ Security</h4>
          <p className="text-sm text-slate-300">
            Always use short expiration times and one-time keys when possible.
            Monitor your session keys and revoke any suspicious ones immediately.
          </p>
        </div>

        {/* Backend Scripts Info */}
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <h4 className="text-yellow-400 font-semibold mb-2">⚡ Backend Script</h4>
          <p className="text-sm text-slate-300 mb-2">
            To test session keys with the bundler:
          </p>
          <code className="text-xs bg-slate-900 p-2 rounded block">
            npm run test-session-key
          </code>
        </div>
      </div>
    </div>
  );
}
