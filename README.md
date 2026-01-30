# 🔐 ERC-4337 Smart Account - Sepolia Testnet

Une implémentation complète d'Account Abstraction (ERC-4337) avec fonctionnalités avancées incluant multisig, batching de transactions, session keys et récupération sociale.

![Solidity](https://img.shields.io/badge/Solidity-0.8.24-e6e6e6?logo=solidity)
![Foundry](https://img.shields.io/badge/Foundry-v1.5.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript)
![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#️-architecture)
- [Stack Technique](#️-stack-technique)
- [Installation](#-installation)
- [Smart Contracts](#-smart-contracts)
- [Scripts Backend](#-scripts-backend)
- [Frontend](#-frontend)
- [Contrats Déployés](#-contrats-déployés)
- [Tests](#-tests)
- [Dépannage](#-dépannage)
- [Ressources](#-ressources)

---

## ✨ Fonctionnalités

### Smart Contract Features

✅ **Multisig Support**: Signatures à seuil configurable  
✅ **Transaction Batching**: Exécution de multiples opérations en un UserOp  
✅ **Session Keys**: Accès temporaire avec expiration et utilisation unique  
✅ **Social Recovery**: Mécanisme de récupération basé sur les guardians  
✅ **ERC-4337 v0.7**: Entièrement compatible avec EntryPoint v0.7  
✅ **Gas Abstraction**: Sponsorisation des frais par Paymaster  

### Frontend Features

🎨 Interface React moderne avec TypeScript  
🌈 Connexion wallet via RainbowKit  
📱 Design responsive avec Tailwind CSS  
🔄 Statut de transaction en temps réel  
💰 Calculateur d'économies de gas  

---

## 🏛️ Architecture

```
┌─────────────────┐
│   EOA Wallet    │  (MetaMask, etc.)
└────────┬────────┘
         │ Signe UserOp
         ▼
┌─────────────────┐
│ Smart Account   │  (Votre compte ERC-4337)
│  - Multisig     │
│  - Batching     │
│  - Session Keys │
│  - Recovery     │
└────────┬────────┘
         │ Appelle
         ▼
┌─────────────────┐
│  EntryPoint     │  (v0.7)
│  0x00000000...  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│    Bundler      │────►│   Paymaster     │
│   (Pimlico)     │     │  (Gas sponsor)  │
└─────────────────┘     └─────────────────┘
```

### Flux ERC-4337

1. **L'utilisateur crée** une UserOperation (comme une transaction)
2. **L'owner signe** le UserOp avec son wallet
3. **Le Bundler** (Pimlico) reçoit et valide le UserOp
4. **Le Paymaster** (optionnel) sponsorise les frais de gas
5. **L'EntryPoint** exécute le UserOp on-chain
6. **Le Smart Account** effectue les opérations réelles

---

## 🛠️ Stack Technique

### Smart Contracts

- **Solidity 0.8.24**
- **Foundry** - Framework de développement
- **OpenZeppelin** - Bibliothèques de contrats sécurisés
- **Account Abstraction** - Interfaces ERC-4337 (v0.7)

### Backend

- **TypeScript 5.7**
- **Viem 2.x** - Bibliothèque Ethereum
- **Pimlico** - Service Bundler

### Frontend

- **React 18.3**
- **TypeScript 5.7**
- **Vite 6.0** - Outil de build
- **Tailwind CSS 3.4** - Styling
- **RainbowKit** - Connexion wallet
- **Wagmi** - Hooks React pour Ethereum

---

## 🚀 Installation

### Prérequis

- Node.js 18+ ([Télécharger](https://nodejs.org/))
- Foundry ([Installer](https://book.getfoundry.sh/getting-started/installation))
- MetaMask ou wallet compatible
- Sepolia ETH ([Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia))
- Clé API Pimlico ([Obtenir](https://dashboard.pimlico.io/))

### Installation

```bash
# Cloner le repository
git clone https://github.com/zag2110/Account-Abstraction.git
cd Account-Abstraction

# Installer les dépendances Node.js
npm install

# Installer les dépendances Foundry
cd contracts
forge install
cd ..
```

### Configuration de l'environnement

```bash
# Copier le template d'environnement
cp .env.example .env

# Éditer .env et remplir vos valeurs
nano .env
```

Variables d'environnement requises:

```env
# Deployment
PRIVATE_KEY=your_private_key_here_with_0x_prefix
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
ETHERSCAN_API_KEY=your_etherscan_api_key

# Pimlico Bundler
PIMLICO_API_KEY=your_pimlico_api_key

# Deployed Contracts (à remplir après déploiement)
FACTORY_ADDRESS=
PAYMASTER_ADDRESS=
NFT_ADDRESS=
SMART_ACCOUNT_ADDRESS=
```

---

## 📜 Smart Contracts

### Architecture des Contrats

| Contract | Description | Fonctionnalités |
|----------|-------------|-----------------|
| `SmartAccount.sol` | Contrat de compte principal | Multisig, batching, session keys, recovery |
| `SmartAccountFactory.sol` | Déploiement de comptes | CREATE2, adresses counterfactual |
| `DemoPaymaster.sol` | Sponsorisation gas | Approbation aveugle (demo uniquement) |
| `DemoNFT.sol` | NFT de test | Simple ERC-721 pour tests |

### Fonctions Clés

#### SmartAccount

```solidity
// Exécuter une transaction unique
function execute(address target, uint256 value, bytes calldata data)

// Exécuter des transactions en batch
function executeBatch(
    address[] calldata targets,
    uint256[] calldata values,
    bytes[] calldata datas
)

// Ajouter une session key
function addSessionKey(address key, uint48 validUntil, bool oneTime)

// Récupération sociale
function proposeRecovery(address[] calldata newOwners, uint256 newThreshold)
function approveRecovery(bytes32 recoveryHash)
function executeRecovery(address[] calldata newOwners, uint256 newThreshold)
```

---

## 💻 Scripts Backend

### Scripts Disponibles

```bash
# Créer un nouveau Smart Account
npm run create-account

# Minter un NFT via UserOp
npm run mint-nft

# Tester les transactions batch
npm run test-batch

# Tester les session keys
npm run test-session-key
```

### Détails des Scripts

#### 1. Create Account
```bash
npm run create-account
```
- Prédit l'adresse counterfactual
- Déploie le Smart Account via Factory
- Initialise avec votre wallet comme owner

#### 2. Mint NFT
```bash
npm run mint-nft
```
- Crée une UserOperation pour minter un NFT
- Signe avec votre wallet
- Envoie au bundler Pimlico
- Le Paymaster sponsorise les frais de gas

**Résultat**: ~160k gas par mint

#### 3. Test Batch
```bash
npm run test-batch
```
- Mint 3 NFTs en une seule transaction
- Démontre les économies de gas
- Exécution atomique

**Économies**: 45% de gas économisé (248k au lieu de 450k)

#### 4. Test Session Keys
```bash
npm run test-session-key
```
- Génère une clé temporaire
- L'ajoute au Smart Account
- L'utilise pour signer un UserOp
- Démontre la délégation de permissions

---

## 🎨 Frontend

### Lancer le Frontend

```bash
# Mode développement
npm run dev

# Build pour production
npm run build

# Prévisualiser le build
npm run preview
```

Le frontend sera disponible sur `http://localhost:3000`

### Fonctionnalités

- **Connexion Wallet**: Intégration RainbowKit avec MetaMask, WalletConnect, etc.
- **Créer un Compte**: Déployer votre Smart Account avec adresse prédite
- **Mint NFT**: Exécuter des UserOperations via le bundler
- **Transactions Batch**: Multiples opérations en un UserOp
- **Session Keys**: Gérer les clés d'accès temporaires

---

## 🏗️ Contrats Déployés

Tous les contrats sont déployés sur **Sepolia Testnet** et vérifiés sur Etherscan.

### Adresses des Contrats

| Contrat | Adresse | Etherscan |
|---------|---------|-----------|
| **EntryPoint v0.7** | `0x0000000071727De22E5E9d8BAf0edAc6f37da032` | [↗](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032) |
| **Implementation** | `0x50F0Af68179FE6771b5Ef31A232C17e59543a273` | [↗](https://sepolia.etherscan.io/address/0x50F0Af68179FE6771b5Ef31A232C17e59543a273) |
| **Factory** | `0x34b271bE0ce80156DBa7562298A1276c6Fe15C58` | [↗](https://sepolia.etherscan.io/address/0x34b271bE0ce80156DBa7562298A1276c6Fe15C58) |
| **Paymaster** | `0xf66fffBBd79Bc2014db0a44D66844b1050a8a1a3` | [↗](https://sepolia.etherscan.io/address/0xf66fffBBd79Bc2014db0a44D66844b1050a8a1a3) |
| **NFT Contract** | `0xEC7926eBc6E3f2C0BF669111E50DcB11466BcD19` | [↗](https://sepolia.etherscan.io/address/0xEC7926eBc6E3f2C0BF669111E50DcB11466BcD19) |
| **Smart Account** | `0xe61e60079C3d41241bd90D65a7417938B8eCA27b` | [↗](https://sepolia.etherscan.io/address/0xe61e60079C3d41241bd90D65a7417938B8eCA27b) |

### Statistiques

- **Paymaster Financé**: 0.05 ETH
- **NFTs Mintés**: 10+ (via différentes méthodes)
- **Gas Économisé**: ~45% avec batching
- **Session Keys Créées**: Multiples (expiration 1h)

### Transactions Notables

- **Premier Mint**: [0x86e8eab3...](https://sepolia.etherscan.io/tx/0x86e8eab36d6b2803aa096ee585f57478fd73bc9dfd42cd6062b9ea603b8638a7)
- **Batch de 3 NFTs**: [0xef5b3b88...](https://sepolia.etherscan.io/tx/0xef5b3b8807edef25c02e6e4d0b034073dc5e08f1170d8b25b489a492b9b0d615)
- **Session Key Mint**: [0x8306dbc8...](https://sepolia.etherscan.io/tx/0x8306dbc8288293ba5268aba5a334394c6db2af5099ede96163a748d45272b872)

---

## 🧪 Tests

### Tests Foundry

```bash
cd contracts
forge test -vvv
```

### Couverture de Tests

```bash
forge coverage
```

### Tests d'Intégration

```bash
# Tester le flux complet
npm run create-account
npm run mint-nft
npm run test-batch
npm run test-session-key
```

---

## 🐛 Dépannage

### Problèmes Courants

#### 1. "Contract function returned no data"

**Problème**: Contrats non déployés ou mauvaise adresse

**Solution**:
```bash
# Vérifier que le contrat existe
cast code $FACTORY_ADDRESS --rpc-url $SEPOLIA_RPC_URL

# Si retourne 0x, redéployer
forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC_URL --broadcast
```

#### 2. "UserOp simulation failed"

**Problème**: Paymaster non financé ou mauvais nonce

**Solution**:
```bash
# Vérifier le solde du paymaster
cast balance $PAYMASTER_ADDRESS --rpc-url $SEPOLIA_RPC_URL

# Financer si nécessaire
cast send $PAYMASTER_ADDRESS "deposit()" --value 0.1ether --private-key $PRIVATE_KEY
```

#### 3. "Insufficient funds for gas"

**Problème**: Pas assez de Sepolia ETH

**Solution**: Obtenir plus d'ETH depuis les faucets:
- [Google Cloud Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
- [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)

#### 4. "AA24 signature error"

**Problème**: Signature invalide ou format incorrect

**Solution**: 
- Utiliser `signMessage()` au lieu de `sign()` pour compatibilité avec `_ethSigned()`
- Vérifier que le format UserOp est correct (packed pour hash, unpacked pour API)

---

## 📚 Ressources

### Documentation Officielle

- [Spécification ERC-4337](https://eips.ethereum.org/EIPS/eip-4337)
- [EntryPoint v0.7](https://github.com/eth-infinitism/account-abstraction/releases/tag/v0.7.0)
- [Documentation Pimlico](https://docs.pimlico.io/)
- [Foundry Book](https://book.getfoundry.sh/)

### Ressources d'Apprentissage

- [Guide Account Abstraction](https://www.alchemy.com/overviews/account-abstraction)
- [ERC-4337 Deep Dive](https://www.erc4337.io/)
- [Documentation Viem](https://viem.sh/)

### Communauté

- [Discord Account Abstraction](https://discord.gg/account-abstraction)
- [Telegram Foundry](https://t.me/foundry_rs)

---

## 🤝 Contribution

Les contributions sont les bienvenues! N'hésitez pas à soumettre une Pull Request.

1. Fork le repository
2. Créez votre branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

---

## 📧 Contact

**Sacha** - GitHub: [@zag2110](https://github.com/zag2110)

**Project Link**: [https://github.com/zag2110/Account-Abstraction](https://github.com/zag2110/Account-Abstraction)

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 🙏 Remerciements

- [Ethereum Foundation](https://ethereum.org/) pour ERC-4337
- [Pimlico](https://pimlico.io/) pour le service bundler
- [Foundry](https://getfoundry.sh/) pour les outils de développement
- [OpenZeppelin](https://openzeppelin.com/) pour les bibliothèques sécurisées

---

<div align="center">
  <strong>⭐ Si ce projet vous a aidé, n'hésitez pas à lui donner une étoile! ⭐</strong>
</div>
