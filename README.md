# 🏗️ ERC-4337 Smart Account - Sepolia Testnet

A complete implementation of ERC-4337 Account Abstraction with advanced features including multisig, transaction batching, session keys, and social recovery.

![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)
![Foundry](https://img.shields.io/badge/Foundry-Latest-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![React](https://img.shields.io/badge/React-18.3-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Smart Contracts](#-smart-contracts)
- [Backend Scripts](#-backend-scripts)
- [Frontend](#-frontend)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Resources](#-resources)

---

## ✨ Features

### Smart Contract Features
- ✅ **Multisig Support**: Configurable threshold signatures
- ✅ **Transaction Batching**: Execute multiple operations in one UserOp
- ✅ **Session Keys**: Temporary access with expiration and one-time use
- ✅ **Social Recovery**: Guardian-based account recovery mechanism
- ✅ **ERC-4337 v0.7**: Fully compatible with EntryPoint v0.7
- ✅ **Gas Abstraction**: Paymaster sponsorship for gasless transactions

### Frontend Features
- 🎨 Modern React UI with TypeScript
- 🌈 RainbowKit wallet connection
- 📱 Responsive design with Tailwind CSS
- 🔄 Real-time transaction status
- 💰 Gas estimation and savings calculator

---

## 🏛️ Architecture

```
┌─────────────────┐
│   EOA Wallet    │  (MetaMask, etc.)
└────────┬────────┘
         │ Signs UserOp
         ▼
┌─────────────────┐
│ Smart Account   │  (Your ERC-4337 account)
│  - Multisig     │
│  - Batching     │
│  - Session Keys │
│  - Recovery     │
└────────┬────────┘
         │ Calls
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

### ERC-4337 Flow

1. **User** creates a `UserOperation` (like a transaction)
2. **Owner** signs the UserOp with their wallet
3. **Bundler** (Pimlico) receives and validates the UserOp
4. **Paymaster** (optional) sponsors the gas fees
5. **EntryPoint** executes the UserOp on-chain
6. **Smart Account** performs the actual operations

---

## 🛠️ Tech Stack

### Smart Contracts
- **Solidity** 0.8.24
- **Foundry** - Development framework
- **OpenZeppelin** - Secure contract libraries
- **Account Abstraction** - ERC-4337 interfaces (v0.7)

### Backend
- **TypeScript** 5.7
- **Viem** 2.x - Ethereum library
- **Pimlico** - Bundler service

### Frontend
- **React** 18.3
- **TypeScript** 5.7
- **Vite** 6.0 - Build tool
- **Tailwind CSS** 3.4 - Styling
- **RainbowKit** - Wallet connection
- **Wagmi** - React hooks for Ethereum

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- Foundry ([Install](https://getfoundry.sh/))
- MetaMask or compatible wallet
- Sepolia ETH ([Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia))
- Pimlico API Key ([Get one](https://dashboard.pimlico.io/))

### Installation

```bash
# Clone the repository
git clone https://github.com/alineuh/erc4337-smart-account-v07-sepolia.git
cd erc4337-smart-account-v07-sepolia

# Install Node.js dependencies
npm install

# Install Foundry dependencies
cd contracts
forge install
cd ..
```

### Environment Setup

```bash
# Copy the environment template
cp .env.example .env

# Edit .env and fill in your values
nano .env
```

**Required environment variables:**
```env
# Deployment
PRIVATE_KEY=0xyour_private_key_here
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Pimlico Bundler
PIMLICO_API_KEY=your_pimlico_api_key

# Deployed Contracts (fill after deployment)
FACTORY_ADDRESS=
PAYMASTER_ADDRESS=
NFT_ADDRESS=
SMART_ACCOUNT_ADDRESS=
```

---

## 📜 Smart Contracts

### Contract Architecture

| Contract | Description | Features |
|----------|-------------|----------|
| `SmartAccount.sol` | Main account contract | Multisig, batching, session keys, recovery |
| `SmartAccountFactory.sol` | Account deployment | CREATE2, counterfactual addresses |
| `DemoPaymaster.sol` | Gas sponsorship | Blind approval (demo only) |
| `DemoNFT.sol` | Test NFT | Simple ERC-721 for testing |

### Key Functions

#### SmartAccount

```solidity
// Execute single transaction
function execute(address target, uint256 value, bytes calldata data)

// Execute batch transactions
function executeBatch(
    address[] calldata targets,
    uint256[] calldata values,
    bytes[] calldata datas
)

// Add session key
function addSessionKey(address key, uint48 validUntil, bool oneTime)

// Social recovery
function proposeRecovery(address[] calldata newOwners, uint256 newThreshold)
function approveRecovery(bytes32 recoveryHash)
function executeRecovery(address[] calldata newOwners, uint256 newThreshold)
```

---

## 💻 Backend Scripts

### Available Scripts

```bash
# Create a new Smart Account
npm run create-account

# Mint an NFT via UserOp
npm run mint-nft

# Test batch transactions
npm run test-batch

# Test session keys
npm run test-session-key
```

### Script Details

#### 1. Create Account
```bash
npm run create-account
```
- Predicts the counterfactual address
- Deploys the Smart Account via Factory
- Initializes with your wallet as owner

#### 2. Mint NFT
```bash
npm run mint-nft
```
- Creates a UserOperation to mint an NFT
- Signs with your wallet
- Sends to Pimlico bundler
- Paymaster sponsors gas fees

#### 3. Test Batch
```bash
npm run test-batch
```
- Mints multiple NFTs in one transaction
- Demonstrates gas savings
- Shows atomic execution

#### 4. Test Session Keys
```bash
npm run test-session-key
```
- Generates a temporary key
- Adds it to the Smart Account
- Uses it to sign a UserOp
- Demonstrates delegation

---

## 🎨 Frontend

### Running the Frontend

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The frontend will be available at `http://localhost:3000`

### Features

- **Connect Wallet**: RainbowKit integration with MetaMask, WalletConnect, etc.
- **Create Account**: Deploy your Smart Account with predicted address
- **Mint NFT**: Execute UserOperations via the bundler
- **Batch Transactions**: Multiple operations in one UserOp
- **Session Keys**: Manage temporary access keys

### Configuration

Update contract addresses in `frontend/src/components/` files:

```typescript
const FACTORY_ADDRESS = '0x...' as Address;
const NFT_ADDRESS = '0x...' as Address;
const PAYMASTER_ADDRESS = '0x...' as Address;
```

---

## 🏗️ Deployment

### Step 1: Build Contracts

```bash
cd contracts
forge build
```

### Step 2: Deploy to Sepolia

```bash
# Make sure you have at least 0.05 ETH on Sepolia
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  -vvvv
```

### Step 3: Fund the Paymaster

```bash
cast send $PAYMASTER_ADDRESS \
  "deposit()" \
  --value 0.1ether \
  --private-key $PRIVATE_KEY \
  --rpc-url $SEPOLIA_RPC_URL
```

### Step 4: Update .env

Copy the deployed addresses to your `.env` file:

```env
FACTORY_ADDRESS=0x...
PAYMASTER_ADDRESS=0x...
NFT_ADDRESS=0x...
```

### Deployed Addresses (Example)

```
EntryPoint:     0x0000000071727De22E5E9d8BAf0edAc6f37da032
Factory:        0xE7dac0983B69a7c56E1D840A3A4500F7AF4993c5
Paymaster:      0x167D0ECb831758AB496ED99befceB5F1c076021A
NFT:            0x8FAF5b6b434941F1A36a6A15E569C478Eb677481
```

---

## 🧪 Testing

### Run Foundry Tests

```bash
cd contracts
forge test -vvv
```

### Test Coverage

```bash
forge coverage
```

### Integration Testing

```bash
# Test the complete flow
npm run create-account
npm run mint-nft
npm run test-batch
npm run test-session-key
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Contract function returned no data"

**Problem**: Contracts not deployed or wrong address

**Solution**:
```bash
# Verify contract exists
cast code $FACTORY_ADDRESS --rpc-url $SEPOLIA_RPC_URL

# If returns 0x, redeploy
forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC_URL --broadcast
```

#### 2. "UserOp simulation failed"

**Problem**: Paymaster not funded or wrong nonce

**Solution**:
```bash
# Check paymaster balance
cast balance $PAYMASTER_ADDRESS --rpc-url $SEPOLIA_RPC_URL

# Fund if needed
cast send $PAYMASTER_ADDRESS "deposit()" --value 0.1ether
```

#### 3. "Insufficient funds for gas"

**Problem**: Not enough Sepolia ETH

**Solution**: Get more ETH from faucets:
- https://cloud.google.com/application/web3/faucet/ethereum/sepolia
- https://www.alchemy.com/faucets/ethereum-sepolia

#### 4. Foundry doesn't broadcast transactions

**Problem**: Foundry simulating instead of broadcasting

**Solution**: Use `cast` directly or ensure `--broadcast` flag is used

---

## 📚 Resources

### Official Documentation
- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [EntryPoint v0.7](https://github.com/eth-infinitism/account-abstraction/tree/releases/v0.7)
- [Pimlico Documentation](https://docs.pimlico.io/)
- [Foundry Book](https://book.getfoundry.sh/)

### Learning Resources
- [Account Abstraction Guide](https://www.alchemy.com/overviews/account-abstraction)
- [ERC-4337 Deep Dive](https://eip4337.substack.com/)
- [Viem Documentation](https://viem.sh/)

### Community
- [Ethereum Account Abstraction Discord](https://discord.gg/TQkHtJVq)
- [Foundry Telegram](https://t.me/foundry_rs)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## 📧 Contact

Aline - [@alineuh](https://github.com/alineuh)
Project Link: [https://github.com/alineuh/erc4337-smart-account-v07-sepolia](https://github.com/alineuh/erc4337-smart-account-v07-sepolia)
Linkedin : https://www.linkedin.com/in/aline-spano-a1493025b/
