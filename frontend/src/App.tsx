import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import CreateAccount from './components/CreateAccount';
import MintNFT from './components/MintNFT';
import BatchTransactions from './components/BatchTransactions';
import SessionKeys from './components/SessionKeys';

function App() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'create' | 'mint' | 'batch' | 'session'>('create');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">ERC-4337 Smart Account</h1>
              <p className="text-sm text-slate-400">Account Abstraction Demo</p>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="card max-w-md w-full text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Welcome! 👋</h2>
              <p className="text-slate-300 mb-6">
                Connect your wallet to create and manage your ERC-4337 Smart Account on Sepolia testnet.
              </p>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="card">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'create'
                      ? 'bg-primary text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  🏗️ Create Account
                </button>
                <button
                  onClick={() => setActiveTab('mint')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'mint'
                      ? 'bg-primary text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  🎨 Mint NFT
                </button>
                <button
                  onClick={() => setActiveTab('batch')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'batch'
                      ? 'bg-primary text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  📦 Batch Transactions
                </button>
                <button
                  onClick={() => setActiveTab('session')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'session'
                      ? 'bg-primary text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  🔑 Session Keys
                </button>
              </div>
            </div>

            {/* Content */}
            <div>
              {activeTab === 'create' && <CreateAccount />}
              {activeTab === 'mint' && <MintNFT />}
              {activeTab === 'batch' && <BatchTransactions />}
              {activeTab === 'session' && <SessionKeys />}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-slate-400">
          <p>Built with React + TypeScript + Vite + ERC-4337</p>
          <p className="text-sm mt-2">
            <a
              href="https://github.com/alineuh/erc4337-smart-account-v07-sepolia"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              View on GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
