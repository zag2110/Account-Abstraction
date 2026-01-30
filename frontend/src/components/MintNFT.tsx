import { type Address } from 'viem';

const NFT_ADDRESS = '0xEC7926eBc6E3f2C0BF669111E50DcB11466BcD19' as Address;
const SMART_ACCOUNT_ADDRESS = '0xe61e60079C3d41241bd90D65a7417938B8eCA27b' as Address;

export default function MintNFT() {
  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">🎨 Mint NFT via UserOp</h2>

      <div className="space-y-4">
        {/* Success Notice */}
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-400 mb-2">✅ CLI Script Available</h3>
          <p className="text-sm text-slate-300 mb-3">
            Le mint de NFT fonctionne via le script CLI TypeScript qui utilise correctement l'API Pimlico et ERC-4337 v0.7.
          </p>
        </div>

        <div>
          <p className="text-slate-300 mb-4">
            Utilisez votre Smart Account pour minter des NFTs via une UserOperation (ERC-4337).
            La transaction sera envoyée via le bundler Pimlico et le Paymaster paiera les frais de gas !
          </p>
        </div>

        {/* Smart Account Address Input */}
        <div className="bg-slate-900 rounded-lg p-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Votre Smart Account
          </label>
          <div className="flex items-center gap-2">
            <code className="text-sm text-white font-mono bg-slate-800 px-3 py-2 rounded flex-1 break-all">
              {SMART_ACCOUNT_ADDRESS}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(SMART_ACCOUNT_ADDRESS);
                alert('Adresse copiée !');
              }}
              className="btn-secondary px-4 py-2"
            >
              Copy
            </button>
          </div>
          <a
            href={`https://sepolia.etherscan.io/address/${SMART_ACCOUNT_ADDRESS}#tokentxnsErc721`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm mt-2 inline-block"
          >
            Voir vos NFTs sur Etherscan →
          </a>
        </div>

        {/* NFT Info */}
        <div className="bg-slate-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">NFT Contract</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Contract:</span>
              <a
                href={`https://sepolia.etherscan.io/address/${NFT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-mono text-xs hover:text-primary"
              >
                {NFT_ADDRESS}
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Network:</span>
              <span className="text-white">Sepolia Testnet</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gas Fees:</span>
              <span className="text-green-400">✓ Paymaster sponsorisé</span>
            </div>
          </div>
        </div>

        {/* Instructions CLI */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h4 className="text-blue-400 font-semibold mb-3">📋 Comment minter un NFT</h4>
          <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
            <li>Ouvrez un terminal dans le dossier du projet</li>
            <li>Exécutez la commande suivante:</li>
          </ol>
          <div className="mt-3 bg-slate-900 p-3 rounded">
            <code className="text-sm text-green-400 font-mono">npm run mint-nft</code>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            ✓ Le script créera automatiquement une UserOperation ERC-4337
            <br />
            ✓ Signature avec votre clé privée (depuis .env)
            <br />
            ✓ Envoi au bundler Pimlico
            <br />
            ✓ Le Paymaster paiera les frais de gas !
          </p>
        </div>

        {/* Info */}
        <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
          <h4 className="text-purple-400 font-semibold mb-2">🔧 ERC-4337 Architecture</h4>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• <strong>Smart Account:</strong> Wallet multi-signature avec threshold</li>
            <li>• <strong>UserOperation:</strong> Transaction ERC-4337 signée</li>
            <li>• <strong>Bundler (Pimlico):</strong> Agrège et soumet les UserOps</li>
            <li>• <strong>Paymaster:</strong> Sponsorise vos frais de gas</li>
            <li>• <strong>EntryPoint v0.7:</strong> 0x0000000071727De22E5E9d8BAf0edAc6f37da032</li>
          </ul>
        </div>

        {/* Other Scripts */}
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <h4 className="text-yellow-400 font-semibold mb-2">⚡ Autres scripts disponibles</h4>
          <div className="space-y-2 text-sm text-slate-300">
            <div>
              <code className="text-xs bg-slate-900 px-2 py-1 rounded">npm run test-batch</code>
              <span className="ml-2">- Batch de transactions multiples</span>
            </div>
            <div>
              <code className="text-xs bg-slate-900 px-2 py-1 rounded">npm run test-session-key</code>
              <span className="ml-2">- Test des session keys temporaires</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
