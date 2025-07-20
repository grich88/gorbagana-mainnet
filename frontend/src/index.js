import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Wallet adapter imports
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// Buffer polyfill for browser
window.Buffer = require('buffer').Buffer;

// Network configuration with multiple RPC endpoints for failover
const network = WalletAdapterNetwork.Devnet;

// Primary and backup endpoints
const endpoints = [
  clusterApiUrl(network), // Default devnet endpoint
  'https://api.devnet.solana.com', // Backup
  'https://devnet.helius-rpc.com/?api-key=your-api-key-here', // Helius (you'd need to replace with actual key)
  'https://solana-devnet.g.alchemy.com/v2/your-api-key-here' // Alchemy (you'd need to replace with actual key)
];

// Use the primary endpoint
const primaryEndpoint = endpoints[0];

// Supported wallets
const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
];

// Lazy load the rate limited connection utilities
const initializeRateLimitedConnection = async () => {
  try {
    const { createRateLimitedConnection } = await import('./utils/rpcUtils');
    // Initialize the connection when the utility is imported
    createRateLimitedConnection(primaryEndpoint, {
      maxRequestsPerSecond: 2, // Very conservative for free devnet
      cacheTTL: 20000, // 20 seconds cache
      commitment: 'confirmed'
    });
    console.log('Rate-limited connection initialized');
  } catch (error) {
    console.warn('Could not initialize rate-limited connection:', error);
  }
};

// Initialize on load
initializeRateLimitedConnection();

// Custom connection provider
const CustomConnectionProvider = ({ children }) => {
  return (
    <ConnectionProvider endpoint={primaryEndpoint}>
      {children}
    </ConnectionProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <CustomConnectionProvider>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </CustomConnectionProvider>
  </React.StrictMode>
); 