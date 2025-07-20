# 🎮 GorbaDome Arcade Platform

**Web3 Gaming on Gorbagana Chain - Trash Bandidegen & More**

A decentralized arcade platform built on the Gorbagana Chain (Solana fork) featuring endless runner games, blockchain wagering, NFT integration, and a thriving community economy.

## 🚀 Features

### Phase 1: Core Game (✅ Complete)
- **Trash Bandidegen**: Endless runner with Crash Bandicoot-style mechanics
- **Meme-Infused Theme**: Crypto humor, trash world aesthetics
- **Core Gameplay**: Jump, slide, spin attack, collect trash coins
- **Progressive Difficulty**: Speed increases, obstacle frequency scaling
- **Local Leaderboards**: High score tracking and persistence
- **Polished UI/UX**: Modern interface with game state management

### Phase 2: Blockchain Integration (🔄 In Progress)
- **$GOR Wagering**: Stake tokens to compete for prizes
- **Smart Contracts**: Rust/Anchor programs on Gorganus Chain
- **Commit-Reveal Security**: Anti-cheat score verification
- **Trash Pass NFTs**: Membership benefits and status symbols
- **Continue Insurance**: Microtransactions for second chances
- **Wallet Integration**: Backpack, Phantom, and other Solana wallets
- **On-Chain Leaderboards**: Transparent, verifiable competition

### Phase 3: Arcade Expansion (📋 Planned)
- **Multiple Games**: Additional mini-games in the arcade
- **Unified Economy**: Shared tokenomics across games
- **Community Features**: Social sharing, tournaments
- **Mobile Support**: Cross-platform deployment
- **Marketplace**: NFT trading and cosmetics

## 🏗️ Architecture

### Smart Contracts (Rust/Anchor)
```
gorbadome-contracts/
├── gorbadome/
│   ├── programs/gorbadome/src/lib.rs    # Main game contract
│   ├── tests/gorbadome.ts               # Contract tests
│   ├── scripts/deploy.ts                # Deployment script
│   └── Anchor.toml                      # Anchor configuration
```

**Key Contract Features:**
- `initialize_game()`: Setup game state and parameters
- `enter_run()`: Submit wager and create player entry
- `submit_score()`: Commit-reveal score submission
- `end_contest()`: Distribute prizes to winners
- `buy_continue_insurance()`: Microtransaction for continues
- `mint_trash_pass()`: NFT membership minting

### Unity Game Client
```
gorbadome-game/
├── Assets/Scripts/
│   ├── Gameplay/           # Core game mechanics
│   │   ├── PlayerController.cs
│   │   ├── GameManager.cs
│   │   ├── LevelGenerator.cs
│   │   └── Obstacle.cs
│   ├── Blockchain/         # Web3 integration
│   │   └── BlockchainManager.cs
│   ├── UI/                 # User interface
│   │   └── UIManager.cs
│   └── Config/             # Game configuration
│       └── GameConfig.cs
```

## 🛠️ Development Setup

### Prerequisites
- **Unity 2022.3 LTS** or later
- **Node.js 16+** and npm/yarn
- **Rust** and Cargo
- **Anchor CLI** (`cargo install --git https://github.com/coral-xyz/anchor avm --locked --force`)
- **Solana CLI** tools

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/gorbagana/gorbadome-arcade.git
   cd gorbadome-arcade
   ```

2. **Setup Unity Project**
   ```bash
   # Open gorbadome-game/ in Unity
   # Install required packages via Package Manager
   ```

3. **Setup Smart Contracts**
   ```bash
   cd gorbadome-contracts/gorbadome
   npm install
   anchor build
   ```

4. **Deploy to Gorganus Devnet**
   ```bash
   # Configure Anchor.toml for Gorganus
   anchor deploy --provider.cluster gorganus-devnet
   ```

5. **Run Tests**
   ```bash
   anchor test
   ```

6. **Build WebGL Game**
   ```bash
   npm run build:webgl
   ```

## 🎯 Game Mechanics

### Trash Bandidegen Core Loop
1. **Movement**: Automatic forward progression with lane switching
2. **Actions**: Jump (space/up), Slide (down), Spin Attack (X/shift)
3. **Collection**: Gather trash coins for points and bonuses
4. **Obstacles**: Dodge or destroy obstacles to survive
5. **Scoring**: Distance + coins + bonuses + difficulty multiplier

### Blockchain Integration Flow
1. **Connect Wallet**: Backpack, Phantom, or other Solana wallets
2. **Submit Wager**: Stake $GOR tokens for competition entry
3. **Play Game**: Standard gameplay with blockchain tracking
4. **Submit Score**: Commit-reveal scheme for fair verification
5. **Claim Rewards**: Automatic prize distribution to winners

### NFT & Tokenomics
- **$GOR**: Native token for wagering and transactions
- **Trash Pass**: Membership NFT with exclusive benefits
- **Cosmetic NFTs**: Earn-to-mint collectibles from gameplay
- **House Fees**: 5% of wagers fund platform development

## 🔧 Configuration

### Game Settings (GameConfig.cs)
```csharp
[Header("Player Movement")]
public float baseForwardSpeed = 10f;
public float jumpForce = 12f;
public float slideTime = 1f;

[Header("Scoring System")]
public int trashCoinValue = 10;
public int obstacleDestroyBonus = 50;
public int perfectRunBonus = 100;

[Header("Blockchain Settings")]
public float minWagerAmount = 1f;
public float maxWagerAmount = 100f;
public float houseFeePercentage = 0.05f;
```

### Blockchain Settings (BlockchainManager.cs)
```csharp
[Header("Blockchain Settings")]
public string gorganusRPCUrl = "https://rpc.gorganus.com";
public string programId = "5Qewhf89dYVr16QF9hW34PvTUDmvxHpZWHE3y19crbss";
public bool useDevnet = true;
```

## 🚀 Deployment

### Smart Contract Deployment
```bash
# Deploy to Gorganus Devnet
anchor deploy --provider.cluster gorganus-devnet

# Deploy to Gorganus Mainnet (when available)
anchor deploy --provider.cluster gorganus-mainnet
```

### Game Deployment
```bash
# Build WebGL version
npm run build:webgl

# Deploy to hosting (GitHub Pages, Netlify, etc.)
npm run deploy:web
```

### xNFT Deployment
```bash
# Create xNFT manifest
# Deploy to Backpack xNFT store
```

## 🧪 Testing

### Smart Contract Tests
```bash
cd gorbadome-contracts/gorbadome
anchor test
```

### Game Tests
- Unity Play Mode testing
- Manual gameplay testing
- Performance testing (60fps target)

### Integration Tests
- Wallet connection flow
- Transaction submission
- Score verification
- Prize distribution

## 📊 Performance Targets

- **Frame Rate**: 60 FPS on mid-range hardware
- **Transaction Speed**: <2 seconds for blockchain operations
- **Load Times**: <5 seconds for game initialization
- **Memory Usage**: <500MB for WebGL build

## 🔒 Security Features

- **Commit-Reveal Scheme**: Prevents score manipulation
- **Smart Contract Audits**: Formal verification of on-chain logic
- **Input Validation**: Client and server-side validation
- **Rate Limiting**: Prevents spam and abuse
- **Secure Key Management**: Proper wallet integration

## 🌟 Community & Ecosystem

### Gorbagana Chain Integration
- **Native Token**: $GOR for all transactions
- **Low Fees**: <$0.001 per transaction
- **Fast Finality**: ~400-600ms confirmation times
- **High Throughput**: 65,000+ TPS capacity

### Backpack xNFT Support
- **Seamless Integration**: Direct wallet access
- **Enhanced UX**: Native wallet experience
- **Cross-Platform**: Web and in-wallet play

## 📈 Roadmap

### Phase 1 (✅ Complete)
- [x] Core game mechanics
- [x] Basic UI and menus
- [x] Local leaderboards
- [x] Game configuration system

### Phase 2 (🔄 In Progress)
- [x] Smart contract development
- [x] Blockchain integration framework
- [ ] Wallet connection implementation
- [ ] Real transaction handling
- [ ] NFT minting system
- [ ] Beta testing and refinement

### Phase 3 (📋 Planned)
- [ ] Additional mini-games
- [ ] Advanced tokenomics
- [ ] Community features
- [ ] Mobile deployment
- [ ] Marketplace integration

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Areas
- **Game Mechanics**: New features and improvements
- **Smart Contracts**: Security and optimization
- **UI/UX**: Interface enhancements
- **Testing**: Automated and manual testing
- **Documentation**: Code and user documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Discord**: [Gorbagana Community](https://discord.gg/gorbagana)
- **Twitter**: [@GorbaganaChain](https://twitter.com/GorbaganaChain)
- **Documentation**: [docs.gorbadome.com](https://docs.gorbadome.com)
- **Issues**: [GitHub Issues](https://github.com/gorbagana/gorbadome-arcade/issues)

## 🙏 Acknowledgments

- **Gorbagana Community**: For the amazing meme ecosystem
- **Solana Foundation**: For the underlying blockchain technology
- **Anchor Framework**: For smart contract development tools
- **Unity Technologies**: For the game engine and WebGL support
- **Backpack Team**: For xNFT platform and wallet integration

---

**🎮 Ready to become a Trash Bandidegen? Connect your wallet and start running! 🏃‍♂️💨** 