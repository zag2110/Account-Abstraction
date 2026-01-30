# ERC-4337 Smart Account

Implémentation d'Account Abstraction (ERC-4337 v0.7) sur Sepolia avec multisig, batch transactions, session keys et social recovery.

Stack: Solidity 0.8.24, Foundry, TypeScript, React, Viem, Pimlico

## Ce que ça fait

Le projet implémente un Smart Account ERC-4337 qui permet:
- Signatures multiples avec seuil configurable
- Batching de transactions (économie de ~45% de gas)
- Session keys temporaires pour déléguer des permissions
- Récupération sociale via guardians
- Paymaster pour sponsoriser les frais de gas

Frontend React avec RainbowKit pour connecter son wallet et interagir avec le compte.  

## Architecture

```
EOA Wallet (MetaMask)
    |
    | signe UserOp
    v
Smart Account
  - Multisig
  - Batching
  - Session Keys
  - Recovery
    |
    v
EntryPoint (v0.7)
    |
    v
Bundler (Pimlico) --> Paymaster (sponsor gas)
```

Un UserOp fonctionne comme une transaction normale, mais passe par l'EntryPoint qui valide puis exécute. Le Paymaster peut payer les frais à la place de l'utilisateur.

## Installation

Prérequis:
- Node.js 18+
- Foundry
- Un peu de Sepolia ETH
- Une clé API Pimlico (gratuit sur leur site)

```bash
git clone https://github.com/zag2110/Account-Abstraction.git
cd Account-Abstraction
npm install
cd contracts && forge install && cd ..
```

Configuration:
```bash
cp .env.example .env
# Éditer .env avec vos clés
```

Le `.env` doit contenir:
- `PRIVATE_KEY` - Votre clé privée (avec 0x)
- `PIMLICO_API_KEY` - Clé API Pimlico
- Les adresses de contrats (après déploiement)

## Smart Contracts

Contrats principaux:
- `SmartAccount.sol` - Compte avec multisig, batching, session keys
- `SmartAccountFactory.sol` - Déploiement avec CREATE2
- `DemoPaymaster.sol` - Sponsorisation gas (demo)
- `DemoNFT.sol` - NFT de test ERC-721


#### SmartAccount

Les fonctions principales:

```solidity
execute(address target, uint256 value, bytes calldata data)
executeBatch(address[] targets, uint256[] values, bytes[] datas)
addSessionKey(address key, uint48 validUntil, bool oneTime)
proposeRecovery(address[] newOwners, uint256 newThreshold)
```

## Utilisation

### Créer votre Smart Account

Frontend:
```bash
npm run dev
# http://localhost:5173, connecter wallet, cliquer "Create Account"
```

CLI:
```bash
npm run create-account
```

### Minter un NFT

```bash
npm run mint-nft
```

### Batch transactions (économise ~45% de gas)

```bash
npm run test-batch  # mint 3 NFTs d'un coup
```

### Session keys

```bash
npm run test-session-key
```

## Adresses des contrats (Sepolia)

Tous déployés et vérifiés:

- **EntryPoint**: `0x0000000071727De22E5E9d8BAf0edAc6f37da032`
- **Implementation**: `0x50F0Af68179FE6771b5Ef31A232C17e59543a273`
- **Factory**: `0x34b271bE0ce80156DBa7562298A1276c6Fe15C58`
- **Paymaster**: `0xf66fffBBd79Bc2014db0a44D66844b1050a8a1a3` (0.05 ETH dedans)
- **NFT**: `0xEC7926eBc6E3f2C0BF669111E50DcB11466BcD19`
- **Smart Account**: `0xe61e60079C3d41241bd90D65a7417938B8eCA27b`

## Détails techniques

### UserOperation v0.7

La v0.7 utilise un format "packed" on-chain mais Pimlico veut "unpacked". Le code gère ça:

1. Pack les gas limits pour calculer le hash
2. Signe avec `signMessage()` (pas `sign()` !)
3. Unpack pour envoyer à Pimlico

### Session Keys

Les session keys permettent de déléguer des droits temporairement. Important: il faut les ajouter avec une transaction normale (pas UserOp) à cause du `onlyOwner`.

### Gas

- Single NFT: ~160k gas
- Batch 3 NFTs: ~248k gas
- Économie: 45%

## Problèmes connus

- Le frontend mint ne marche pas super bien, utiliser le CLI
- Les session keys doivent être ajoutées par le owner directement
- Pimlico est parfois lent

## Tests

```bash
cd contracts
forge test -vvv
```

## License

MIT

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
