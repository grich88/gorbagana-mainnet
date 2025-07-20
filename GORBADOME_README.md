# 🎮 Gorbadome - Solana Contest Platform

A complete blockchain-based contest platform built on Solana featuring secure score submission, leaderboards, and prize distribution.

## 🌟 Features

### 🏗️ Core Functionality
- **Contest Management**: Automated contest cycles with configurable duration
- **Secure Entry System**: SOL-based wagers with commit-reveal score submission
- **Real-time Leaderboard**: Top 3 player tracking with score and wager data
- **Prize Distribution**: Automated 50/30/20% prize distribution to winners
- **Anti-Cheat Protection**: Cryptographic commit-reveal scheme prevents score manipulation

### 🎨 Frontend Features
- **Modern UI**: Beautiful gradient design with glass morphism effects
- **Wallet Integration**: Support for Phantom, Solflare, and other Solana wallets
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Updates**: Live contest state and leaderboard updates
- **Transaction Feedback**: Clear status messages for all operations

### 🔧 Technical Features
- **Solana Program**: Rust-based smart contract using Anchor framework
- **React Frontend**: Modern web interface with wallet adapter integration
- **Automated Deployment**: Scripts for easy program and frontend deployment
- **Comprehensive Testing**: Full game flow tests and unit tests

## 📁 Project Structure

```
Gorbagana-mainnet/
├── gorbadome-contracts/         # Solana program
│   └── gorbadome/
│       ├── programs/gorbadome/  # Rust program source
│       ├── tests/               # Anchor tests
│       └── target/deploy/       # Build artifacts
├── frontend/                    # React web interface
│   ├── src/                     # React components
│   ├── public/                  # Static assets
│   └── build/                   # Production build
├── test_client/                 # Test scripts
│   ├── simple_test.js          # Basic connectivity test
│   ├── comprehensive_test.js   # Function testing
│   └── full_game_test.js       # Complete game flow test
├── deploy.sh                   # Deployment script
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor Framework](https://book.anchor-lang.com/getting_started/installation.html)
- [Node.js](https://nodejs.org/) (v18+)
- [Git](https://git-scm.com/)

### 1. Clone and Setup
```bash
git clone <your-repo>
cd Gorbagana-mainnet
```

### 2. Deploy Program
```bash
# Option A: Use automated script (Linux/WSL)
./deploy.sh

# Option B: Manual deployment
cd gorbadome-contracts/gorbadome
anchor build
solana program deploy target/deploy/gorbadome.so
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm start
```

### 4. Test the System
```bash
cd test_client
export ANCHOR_WALLET=~/.config/solana/id.json
node full_game_test.js
```

## 🎯 How It Works

### Game Flow
1. **Initialization**: Authority initializes the game state and leaderboard
2. **Contest Entry**: Players enter with SOL wagers and commit score hashes
3. **Score Submission**: Players reveal scores with salt for verification
4. **Leaderboard Update**: Scores are ranked and top 3 players tracked
5. **Contest End**: Authority ends contest and distributes prizes

### Security Model
- **Commit-Reveal**: Prevents score manipulation by requiring cryptographic commitments
- **Authority Control**: Only designated authority can manage contests
- **PDA Security**: Program Derived Addresses ensure account security
- **Wager Escrow**: Player funds held securely until prize distribution

### Prize Distribution
- **1st Place**: 50% of total prize pool
- **2nd Place**: 30% of total prize pool  
- **3rd Place**: 20% of total prize pool

## 🔧 Configuration

### Network Settings
Configure in `frontend/src/index.js`:
```javascript
const network = WalletAdapterNetwork.Devnet; // or Mainnet
```

### Program ID
Update in `frontend/src/App.js`:
```javascript
const PROGRAM_ID = new PublicKey('YOUR_PROGRAM_ID');
```

### Contest Duration
Modify in the Rust program (`lib.rs`):
```rust
game_state.contest_duration = 3600; // 1 hour in seconds
```

## 🧪 Testing

### Unit Tests
```bash
cd gorbadome-contracts/gorbadome
anchor test
```

### Integration Tests
```bash
cd test_client
node comprehensive_test.js  # Test all functions
node full_game_test.js      # Complete game simulation
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 🚢 Deployment

### Devnet Deployment
1. Configure Solana CLI for devnet:
   ```bash
   solana config set --url devnet
   ```

2. Request airdrop:
   ```bash
   solana airdrop 2
   ```

3. Deploy using script:
   ```bash
   ./deploy.sh
   ```

### Mainnet Deployment
1. Switch to mainnet:
   ```bash
   solana config set --url mainnet-beta
   ```

2. Fund your wallet with real SOL

3. Update network in frontend config

4. Deploy with caution:
   ```bash
   ./deploy.sh
   ```

## 🛠️ Development

### Building the Program
```bash
cd gorbadome-contracts/gorbadome
anchor build
```

### Running Frontend Locally
```bash
cd frontend
npm start
```

### Building for Production
```bash
cd frontend
npm run build
```

## 📊 Monitoring

### Program Logs
```bash
solana logs <PROGRAM_ID>
```

### Transaction Explorer
- Devnet: `https://explorer.solana.com/address/<PROGRAM_ID>?cluster=devnet`
- Mainnet: `https://explorer.solana.com/address/<PROGRAM_ID>`

### Account Inspection
```bash
solana program show <PROGRAM_ID>
solana account <ACCOUNT_ADDRESS>
```

## 🔍 Troubleshooting

### Common Issues

**Build Failures**:
- Ensure Rust version compatibility
- Check Anchor version (0.31.1 recommended)
- Clear build cache: `anchor clean`

**Memory Issues (WSL)**:
- Increase WSL memory allocation
- Use single-threaded builds: `CARGO_BUILD_JOBS=1`
- Build in Linux filesystem

**Frontend Issues**:
- Clear node_modules and reinstall
- Check Node.js version (18+)
- Verify wallet connection

**Transaction Failures**:
- Ensure sufficient SOL balance
- Check network configuration
- Verify program is deployed

### Debug Commands
```bash
# Check Solana config
solana config get

# Check wallet balance
solana balance

# Validate program
solana program show <PROGRAM_ID>

# View transaction details
solana transaction <SIGNATURE>
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Solana Labs](https://solana.com/) for the blockchain platform
- [Anchor Protocol](https://anchor-lang.com/) for the development framework
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter) for wallet integration

## 🔗 Links

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Book](https://book.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [React Documentation](https://reactjs.org/docs)

---

**Built with ❤️ for the Solana ecosystem**

🎮 **Ready to compete? Connect your wallet and start playing!** 