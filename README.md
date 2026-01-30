# Account Abstraction ERC-4337
TD Cours Monnaies Numériques 2026  
Par Sacha (zag2110)

## Description

Implémentation d'Account Abstraction (ERC-4337 v0.7) déployée sur Sepolia. C'est un Smart Account qui permet d'utiliser des signatures multiples, de batching de transactions, des session keys temporaires et du social recovery.

Le principe : au lieu d'avoir juste un wallet EOA classique, on a un smart contract qui gère le compte. Ça permet de faire des trucs impossibles avec un wallet normal (payer le gas avec des tokens, batching, délégation de droits, etc).

Stack : Solidity 0.8.24, Foundry, TypeScript, React, Viem, Pimlico

## Fonctionnalités

- **Multisig** : Plusieurs owners avec seuil configurable
- **Batch transactions** : Grouper plusieurs opérations en une seule (économie de ~45% de gas)
- **Session keys** : Déléguer des permissions temporaires à d'autres clés
- **Social recovery** : Récupérer le compte via des guardians
- **Paymaster** : Quelqu'un d'autre peut payer le gas à votre place

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

Le flow : au lieu d'envoyer une transaction classique, on crée une UserOperation qu'on signe avec notre wallet. Le Bundler (Pimlico) prend le UserOp, le valide, et l'exécute via l'EntryPoint. Le Paymaster peut sponsoriser les frais.

## Installation

Prérequis :
- Node.js 18+
- Foundry
- Un peu de Sepolia ETH
- Clé API Pimlico (gratuit sur leur site)

```bash
git clone https://github.com/zag2110/Account-Abstraction.git
cd Account-Abstraction
npm install
cd contracts && forge install && cd ..
```

Config :
```bash
cp .env.example .env
# Éditer .env avec vos clés
```

Le `.env` doit contenir :
- `PRIVATE_KEY` - Votre clé privée (avec 0x)
- `PIMLICO_API_KEY` - Clé API Pimlico
- Les adresses de contrats déployés

## Utilisation

### Créer un Smart Account

Frontend :
```bash
npm run dev
# http://localhost:5173, connecter wallet, "Create Account"
```

CLI :
```bash
npm run create-account
```

### Minter un NFT (via UserOp)

```bash
npm run mint-nft
```

### Batch de 3 NFTs (économise du gas)

```bash
npm run test-batch
```

### Tester les session keys

```bash
npm run test-session-key
```

## Contrats déployés (Sepolia)

| Contrat | Adresse |
|---------|---------|
| EntryPoint | `0x0000000071727De22E5E9d8BAf0edAc6f37da032` |
| Implementation | `0x50F0Af68179FE6771b5Ef31A232C17e59543a273` |
| Factory | `0x34b271bE0ce80156DBa7562298A1276c6Fe15C58` |
| Paymaster | `0xf66fffBBd79Bc2014db0a44D66844b1050a8a1a3` |
| NFT | `0xEC7926eBc6E3f2C0BF669111E50DcB11466BcD19` |
| Smart Account | `0xe61e60079C3d41241bd90D65a7417938B8eCA27b` |

Le Paymaster a 0.05 ETH pour sponsoriser les transactions.

## Résultats

**Gas économisé avec batching :**
- Single mint : ~160k gas
- Batch 3 mints : ~248k gas
- **Économie : 45%**

**Transactions notables :**
- Premier mint : [0x86e8eab3...](https://sepolia.etherscan.io/tx/0x86e8eab36d6b2803aa096ee585f57478fd73bc9dfd42cd6062b9ea603b8638a7)
- Batch 3 NFTs : [0xef5b3b88...](https://sepolia.etherscan.io/tx/0xef5b3b8807edef25c02e6e4d0b034073dc5e08f1170d8b25b489a492b9b0d615)
- Session key mint : [0x8306dbc8...](https://sepolia.etherscan.io/tx/0x8306dbc8288293ba5268aba5a334394c6db2af5099ede96163a748d45272b872)

## Notes techniques

### UserOperation v0.7

La v0.7 de ERC-4337 utilise un format "packed" on-chain (les gas limits sont combinés en bytes32) mais l'API Pimlico veut du unpacked.

Le code gère ça automatiquement :
1. Pack les gas limits pour calculer le hash
2. Signe avec `signMessage()` (pas `sign()` !) parce que le contrat utilise `_ethSigned()`
3. Unpack avant d'envoyer à Pimlico

### Session Keys

Les session keys c'est pour déléguer temporairement des droits. Important : faut les ajouter avec une transaction normale (pas un UserOp) à cause du modifier `onlyOwner` qui check `msg.sender`.

Si on passe par un UserOp, `msg.sender` serait l'EntryPoint, pas l'owner.

### Smart Contracts

Contrats principaux :
- `SmartAccount.sol` - Le compte avec toutes les features
- `SmartAccountFactory.sol` - Déploiement avec CREATE2
- `DemoPaymaster.sol` - Pour sponsoriser le gas
- `DemoNFT.sol` - NFT de test ERC-721

## Problèmes connus

- Le frontend mint marche pas super, utiliser le CLI
- Pimlico est parfois lent pendant les heures de pointe
- Les session keys doivent être ajoutées directement par l'owner

## Tests

```bash
cd contracts
forge test -vvv
```

## Notes

Projet éducatif pour le cours Monnaies Numériques - Account Abstraction

Le Paymaster est en mode "approve all" pour la demo. ⚠️ NE PAS UTILISER EN PROD ⚠️

## License

MIT

## Crédits

Basé sur ERC-4337 par Ethereum Foundation  
Adapté par Sacha pour usage personnel et éducatif
