import {
  type Address,
  type Hash,
  keccak256,
  encodeAbiParameters,
  encodePacked,
  hexToBytes,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  publicClient,
  SMART_ACCOUNT_ABI,
  log,
} from './utils.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script de test pour comprendre comment le contrat valide les signatures
 */

async function main() {
  log('🔬 TEST SIGNATURE VALIDATION', 'Starting...');

  const smartAccountAddress = process.env.SMART_ACCOUNT_ADDRESS as Address;
  const ownerPrivateKey = process.env.PRIVATE_KEY as Hash;
  const owner = privateKeyToAccount(ownerPrivateKey);

  log('📍 Configuration', {
    smartAccount: smartAccountAddress,
    owner: owner.address,
  });

  // Test 1: Vérifier que l'owner est bien enregistré
  const isOwner = await publicClient.readContract({
    address: smartAccountAddress,
    abi: SMART_ACCOUNT_ABI,
    functionName: 'isOwner',
    args: [owner.address],
  });

  log('👤 Owner Status', {
    address: owner.address,
    isOwner,
  });

  if (!isOwner) {
    throw new Error('❌ The provided private key is not an owner of this Smart Account!');
  }

  // Test 2: Vérifier le threshold
  const threshold = await publicClient.readContract({
    address: smartAccountAddress,
    abi: SMART_ACCOUNT_ABI,
    functionName: 'threshold',
  });

  log('🎯 Threshold', threshold.toString());

  // Test 3: Créer un message simple et tester la signature
  const testMessage = 'Hello ERC-4337';
  const messageHash = keccak256(encodePacked(['string'], [testMessage]));

  log('📝 Test Message', {
    message: testMessage,
    hash: messageHash,
  });

  // Test avec signMessage (ajoute le préfixe Ethereum Signed Message)
  const sig1 = await owner.signMessage({ message: testMessage });
  log('✍️  Signature 1 (signMessage)', sig1);

  // Test avec sign (signature brute sans préfixe)
  const sig2 = await owner.sign({ hash: messageHash });
  log('✍️  Signature 2 (sign raw hash)', sig2);

  // Test avec sign sur le hash avec préfixe manuel
  const ethSignedHash = keccak256(
    encodePacked(
      ['string', 'bytes32'],
      ['\x19Ethereum Signed Message:\n32', messageHash]
    )
  );
  const sig3 = await owner.sign({ hash: ethSignedHash });
  log('✍️  Signature 3 (sign with manual prefix)', sig3);

  log('✅ Test Complete', {
    note: 'Compare these signatures to understand which format the contract expects',
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  });
