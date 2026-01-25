import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'ERC-4337 Smart Account',
  projectId: 'YOUR_PROJECT_ID', // Get from https://cloud.walletconnect.com/
  chains: [sepolia],
  ssr: false,
});
