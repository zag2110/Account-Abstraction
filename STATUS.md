# 📋 État du Projet - ERC-4337 Smart Account (Sacha)

## ✅ Ce qui fonctionne

### 1. **Contrats déployés sur Sepolia**
Tous les contrats sont déployés et fonctionnels :

| Contrat | Adresse | Statut |
|---------|---------|--------|
| **EntryPoint v0.7** | `0x0000000071727De22E5E9d8BAf0edAc6f37da032` | ✅ |
| **SmartAccount Implementation** | `0x50F0Af68179FE6771b5Ef31A232C17e59543a273` | ✅ |
| **SmartAccountFactory** | `0x34b271bE0ce80156DBa7562298A1276c6Fe15C58` | ✅ |
| **DemoPaymaster** | `0xf66fffBBd79Bc2014db0a44D66844b1050a8a1a3` | ✅ Financé |
| **DemoNFT** | `0xEC7926eBc6E3f2C0BF669111E50DcB11466BcD19` | ✅ |

### 2. **Smart Account créé**
Votre Smart Account personnel :
- **Adresse** : `0xe61e60079C3d41241bd90D65a7417938B8eCA27b`
- **Owner** : `0xe6ae6AD6D1F3d016813515c1A3D8624477E14195`
- **Threshold** : 1 (signature requise)

Voir sur Sepolia : https://sepolia.etherscan.io/address/0xe61e60079C3d41241bd90D65a7417938B8eCA27b

### 3. **Infrastructure**
- ✅ Foundry installé (via WSL)
- ✅ Dépendances Node.js installées
- ✅ Dépendances Foundry installées
- ✅ Configuration .env complète
- ✅ Frontend compilé et prêt

## ⚠️ Limitations actuelles

### Scripts TypeScript (scripts/)
Les scripts `mint-nft`, `test-batch`, et `test-session-key` ont un problème de compatibilité :
- **Cause** : Format UserOperation v0.7 vs v0.6 incompatibilité avec viem@2.45
- **Statut** : Nécessite mise à jour de la bibliothèque permissionless ou réécriture

### Solution de contournement
**Utiliser le frontend web** qui gère correctement v0.7

## 🚀 Comment utiliser le projet

### Option 1 : Frontend (RECOMMANDÉ)

1. **Lancer le serveur de développement** :
   ```powershell
   npm run dev
   ```

2. **Ouvrir le navigateur** :
   - URL : http://localhost:3000/
   - Connecter MetaMask
   - Interagir avec votre Smart Account

### Option 2 : Scripts CLI (partiellement fonctionnel)

```powershell
# ✅ Fonctionne
npm run create-account

# ⚠️ Nécessite correction
npm run mint-nft
npm run test-batch
npm run test-session-key
```

### Option 3 : Déployer de nouveaux contrats

```powershell
wsl bash -c "cd '/mnt/c/Sacha/Cours/Monnaies Numériques/Account Abstraction/erc4337-smart-account-v07-sepolia' && source ~/.zshenv && forge script contracts/script/Deploy.s.sol:Deploy --rpc-url https://ethereum-sepolia-rpc.publicnode.com --broadcast --legacy"
```

## 📚 Ressources

### Documentation
- [ERC-4337 Spec](https://eips.ethereum.org/EIPS/eip-4337)
- [EntryPoint v0.7](https://github.com/eth-infinitism/account-abstraction/tree/releases/v0.7)
- [Pimlico Docs](https://docs.pimlico.io/)

### Explorer les contrats
- Sepolia Etherscan : https://sepolia.etherscan.io/
- Votre Factory : https://sepolia.etherscan.io/address/0x34b271bE0ce80156DBa7562298A1276c6Fe15C58
- Votre Smart Account : https://sepolia.etherscan.io/address/0xe61e60079C3d41241bd90D65a7417938B8eCA27b

### Obtenir des ETH Sepolia
- https://cloud.google.com/application/web3/faucet/ethereum/sepolia
- https://www.alchemy.com/faucets/ethereum-sepolia

## 🔧 Configuration actuelle

### Fichier .env
```env
# Wallet de déploiement
PRIVATE_KEY=0xc9ebeb30b6173991979b445c585f62c46738b00eed2cccc2770b3b08e909a419

# RPC Sepolia
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# API Keys
ETHERSCAN_API_KEY=-M4YpoCtOVy9DESxADK3QOmBNTMuZcpZ
PIMLICO_API_KEY=pim_aQrtQrUfU7v1LRxvFfsSDM

# Contrats déployés
FACTORY_ADDRESS=0x34b271bE0ce80156DBa7562298A1276c6Fe15C58
PAYMASTER_ADDRESS=0xf66fffBBd79Bc2014db0a44D66844b1050a8a1a3
NFT_ADDRESS=0xEC7926eBc6E3f2C0BF669111E50DcB11466BcD19
SMART_ACCOUNT_ADDRESS=0xe61e60079C3d41241bd90D65a7417938B8eCA27b
```

## 🎯 Prochaines étapes suggérées

1. **Tester le frontend**
   - Se connecter avec MetaMask
   - Mint un NFT via l'interface
   - Tester les fonctionnalités multisig

2. **Corriger les scripts TypeScript**
   - Mettre à jour permissionless vers une version compatible v0.7
   - Ou utiliser directement les SDK de Pimlico

3. **Ajouter des fonctionnalités**
   - Session keys
   - Social recovery
   - Batch transactions

4. **Déployer sur d'autres réseaux**
   - Ethereum Mainnet
   - Arbitrum
   - Optimism

---

**Date de création** : 30 janvier 2026  
**Auteur** : Sacha  
**Projet** : Cours Monnaies Numériques - Account Abstraction
