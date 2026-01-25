# 🚀 QUICKSTART - ERC-4337 Smart Account

Guide rapide pour déployer et tester ton smart account en **15 minutes** !

---

## ✅ Prérequis

1. **Node.js** installé (v18+)
2. **Foundry** installé ([getfoundry.sh](https://getfoundry.sh/))
3. **~0.1 ETH sur Sepolia** (pour déployer les contrats)
   - Faucet: https://sepoliafaucet.com/
4. **Pimlico API Key** (gratuit)
   - Dashboard: https://dashboard.pimlico.io/
5. **Alchemy RPC** (optionnel, ou utiliser un RPC public)

---

## 📦 Étape 1 : Installation

```bash
# Cloner le repo
git clone https://github.com/alineuh/erc4337-smart-account-v07-sepolia.git
cd erc4337-smart-account-v07-sepolia

# Installer les dépendances Foundry
cd contracts
forge install
cd ..

# Installer les dépendances Node
npm install
```

---

## ⚙️ Étape 2 : Configuration

### Créer le fichier `.env`

```bash
cp .env.example .env
```

### Remplir les variables :

```bash
# Ta private key (SANS 0x) - celle qui va déployer les contrats
PRIVATE_KEY=ton_private_key_ici

# RPC Sepolia (choisis-en un)
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
# OU avec Alchemy:
# SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/TON_API_KEY

# Pimlico API Key (obtenue sur dashboard.pimlico.io)
PIMLICO_API_KEY=ton_api_key_pimlico_ici

# EntryPoint v0.7 (déjà rempli, ne change pas)
ENTRYPOINT_ADDRESS=0x0000000071727De22E5E9d8BAf0edAc6f37da032

# Etherscan (optionnel, pour vérifier les contrats)
ETHERSCAN_API_KEY=ton_api_key_etherscan_ici
```

---

## 🏗️ Étape 3 : Déployer les contrats

### Build les contrats

```bash
cd contracts
forge build
```

### Déployer sur Sepolia

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url sepolia \
  --broadcast \
  --verify \
  -vvvv
```

**OU** sans vérification Etherscan :

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url sepolia \
  --broadcast \
  -vvvv
```

### ✅ Résultat attendu

```
====================================
DEPLOYMENT SUCCESSFUL!
====================================
EntryPoint:      0x0000000071727De22E5E9d8BAf0edAc6f37da032
Implementation:  0x...
Factory:         0x...
Paymaster:       0x...
NFT:             0x...
====================================
```

### 📝 IMPORTANT : Copier les adresses dans `.env`

Après le déploiement, copie les adresses dans ton `.env` :

```bash
FACTORY_ADDRESS=0x...
PAYMASTER_ADDRESS=0x...
NFT_ADDRESS=0x...
```

---

## 💰 Étape 4 : Funder le Paymaster (si pas fait automatiquement)

Le paymaster a besoin d'ETH pour payer les gas fees :

```bash
cast send <PAYMASTER_ADDRESS> \
  "deposit()" \
  --value 0.1ether \
  --private-key $PRIVATE_KEY \
  --rpc-url sepolia
```

---

## 🎯 Étape 5 : Créer ton Smart Account

```bash
npm run create-account
```

### ✅ Résultat attendu

```
🚀 CREATE SMART ACCOUNT
...
✅ ACCOUNT CREATED SUCCESSFULLY!
{
  address: '0x...',
  owners: ['0x...'],
  threshold: 1
}
```

### 📝 Copier l'adresse dans `.env`

```bash
SMART_ACCOUNT_ADDRESS=0x...
```

---

## 🎨 Étape 6 : Mint un NFT via UserOp

```bash
npm run mint-nft
```

### ✅ Résultat attendu

```
🎨 MINT NFT VIA USEROP
...
🎉 NFT MINTED SUCCESSFULLY!
{
  userOpHash: '0x...',
  txHash: '0x...',
  success: true
}
```

**🎉 Félicitations !** Tu viens d'exécuter ta première transaction ERC-4337 !

---

## 🧪 Tests supplémentaires

### Test Batch Execution

```bash
npm run test-batch
```

### Test Session Keys

```bash
npm run test-session-key
```

---

## 🔍 Vérifier sur Etherscan

### Ton Smart Account

```
https://sepolia.etherscan.io/address/<TON_SMART_ACCOUNT_ADDRESS>
```

### Tes NFTs

```
https://sepolia.etherscan.io/address/<TON_SMART_ACCOUNT_ADDRESS>#tokentxns
```

### Le Paymaster

```
https://sepolia.etherscan.io/address/<PAYMASTER_ADDRESS>
```

---

## 🐛 Troubleshooting

### "Insufficient funds for gas"

- Assure-toi d'avoir au moins 0.05 ETH sur ton wallet deployer
- Vérifie que le paymaster est fundé : `cast balance <PAYMASTER_ADDRESS> --rpc-url sepolia`

### "UserOp simulation failed"

- Vérifie que le paymaster a assez d'ETH
- Vérifie que les adresses dans `.env` sont correctes
- Vérifie ta Pimlico API key

### "Account already exists"

- C'est normal ! Le script détecte si le compte existe déjà
- Tu peux continuer avec `npm run mint-nft`

### "Cannot find module utils.js"

- Assure-toi d'avoir fait `npm install`
- Vérifie que tous les fichiers `.ts` sont dans le dossier `scripts/`

---

## 📚 Next Steps

1. **Lancer le frontend** : `npm run dev`
2. **Lire le README complet** : `README.md`
3. **Explorer le code** :
   - Smart contracts : `contracts/src/`
   - Scripts : `scripts/`
   - Frontend : `frontend/src/`

---

## 🆘 Besoin d'aide ?

- Documentation ERC-4337 : https://eips.ethereum.org/EIPS/eip-4337
- Documentation Pimlico : https://docs.pimlico.io/
- Foundry Book : https://book.getfoundry.sh/

---

**🎉 Enjoy building with ERC-4337!**
