# 🚀 GorbaDome Development Setup Guide

This guide will help you set up the complete development environment for the GorbaDome Arcade Platform.

## 📋 Prerequisites

### Required Software
- **Node.js 16+**: [Download from nodejs.org](https://nodejs.org/)
- **Rust**: [Install from rustup.rs](https://rustup.rs/)
- **Unity 2022.3 LTS**: [Download Unity Hub](https://unity.com/download)
- **Git**: For version control

### Platform-Specific Requirements

#### Windows
- **Visual Studio Build Tools** or **Visual Studio Code** with C++ extensions
- **Windows Subsystem for Linux (WSL)** recommended for better compatibility

#### macOS
- **Xcode Command Line Tools**: `xcode-select --install`

#### Linux
- **build-essential**: `sudo apt-get install build-essential`

## 🔧 Step-by-Step Setup

### 1. Install Solana CLI Tools

#### Windows (PowerShell as Administrator)
```powershell
# Download and install Solana CLI
cmd /c "curl https://release.solana.com/v1.18.22/solana-install-init-x86_64-pc-windows-msvc.exe --output C:\solana-install-tmp.exe"
C:\solana-install-tmp.exe v1.18.22

# Add to PATH (restart terminal after this)
$env:PATH = $env:PATH + ";C:\Users\$env:USERNAME\.local\share\solana\install\active_release\bin"
```

#### macOS/Linux
```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.22/install)"

# Add to PATH
export PATH="/home/$USER/.local/share/solana/install/active_release/bin:$PATH"
echo 'export PATH="/home/$USER/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
```

### 2. Install Anchor Framework

```bash
# Install Anchor Version Manager (avm)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Install and use Anchor v0.31.1
avm install 0.31.1
avm use 0.31.1
```

### 3. Install Yarn (Alternative to npm)
```bash
npm install -g yarn
```

### 4. Configure Solana for Local Development

```bash
# Create a local keypair for development
solana-keygen new --no-bip39-passphrase

# Set configuration to use localhost for development
solana config set --url localhost

# Check configuration
solana config get
```

## 🏗️ Project Setup

### 1. Clone and Setup Repository

```bash
git clone <repository-url>
cd gorbadome-arcade
```

### 2. Setup Smart Contracts

```bash
cd gorbadome-contracts/gorbadome

# Install dependencies
npm install

# Build contracts (this will also install missing Solana tools)
anchor build

# Run tests
anchor test
```

### 3. Setup Unity Project

1. **Open Unity Hub**
2. **Add Project**: Click "Add" and select `gorbadome-game/` folder
3. **Open Project**: Unity will download required packages automatically
4. **Test Game**: Click Play button in Unity Editor

## 🧪 Local Testing Workflow

### 1. Start Local Solana Validator

```bash
# In a separate terminal
solana-test-validator

# Keep this running for local blockchain testing
```

### 2. Build and Deploy Contracts Locally

```bash
cd gorbadome-contracts/gorbadome

# Build contracts
anchor build

# Deploy to local validator
anchor deploy --provider.cluster localnet

# Run comprehensive tests
anchor test --skip-local-validator
```

### 3. Test Unity Game

```bash
# In Unity Editor
1. Open Main scene
2. Click Play
3. Test basic gameplay mechanics
4. Check console for any errors
```

### 4. Test Integration (Manual)

```bash
# In Unity Editor
1. Enable blockchain mode in GameManager
2. Connect mock wallet
3. Start wagered game
4. Complete run and submit score
5. Verify blockchain interactions in console
```

## 🐛 Troubleshooting

### Common Issues

#### "anchor: command not found"
```bash
# Reinstall Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.31.1
avm use 0.31.1
```

#### "solana: command not found"
```bash
# Add Solana to PATH (adjust path for your system)
export PATH="/home/$USER/.local/share/solana/install/active_release/bin:$PATH"
```

#### "build-sbf command not found"
```bash
# Install Solana tools
solana install init

# Or manually install build tools
cargo install --git https://github.com/solana-labs/cargo-build-sbf --tag v1.16.0 cargo-build-sbf
```

#### Unity Build Errors
1. **Check Unity version**: Must be 2022.3 LTS or newer
2. **Missing packages**: Let Unity install required packages automatically
3. **Compilation errors**: Check that all scripts are in correct folders

#### Contract Deployment Fails
```bash
# Check validator is running
solana cluster-version

# Check wallet has SOL
solana balance

# Airdrop SOL to local wallet
solana airdrop 10
```

### Performance Issues

#### Slow Unity Editor
- Close unnecessary browser tabs
- Restart Unity Editor periodically
- Use "Fast Enter Play Mode" in Project Settings

#### Slow Contract Compilation
- Use `anchor build --verifiable` for faster builds during development
- Enable incremental compilation in Cargo.toml

## 📊 Development Tools

### Recommended VS Code Extensions
- **Rust Analyzer**: Rust language support
- **Solana Snippets**: Solana development helpers
- **Anchor Snippets**: Anchor framework helpers
- **Unity Tools**: Unity development support

### Useful Commands

```bash
# Contract development
anchor build                          # Build contracts
anchor test                          # Run all tests
anchor deploy --provider.cluster localnet  # Deploy locally
anchor clean                         # Clean build artifacts

# Solana tools
solana-test-validator                # Start local blockchain
solana logs                         # View transaction logs
solana balance                      # Check wallet balance
solana airdrop 10                   # Get test SOL

# Unity development
# (Use Unity Editor GUI for most operations)
```

## 🚀 Quick Test Commands

### Test Everything Locally
```bash
# Terminal 1: Start validator
solana-test-validator

# Terminal 2: Test contracts
cd gorbadome-contracts/gorbadome
anchor test --skip-local-validator

# Terminal 3: Open Unity and test game
# (Open Unity Editor and click Play)
```

### Build for Production
```bash
# Build contracts
cd gorbadome-contracts/gorbadome
anchor build

# Build Unity game
# (Use Unity Editor: File > Build Settings > Build)
```

## 📚 Next Steps

Once your development environment is set up:

1. **Explore the Code**: Read through the smart contracts and Unity scripts
2. **Run Tests**: Execute the test suite to understand the system
3. **Make Changes**: Try modifying game parameters or adding features
4. **Deploy**: Test deployment to Gorganus devnet

## 🆘 Getting Help

If you encounter issues:

1. **Check logs**: Unity Console, Terminal output, Solana logs
2. **Search docs**: [Anchor Book](https://book.anchor-lang.com/), [Solana Docs](https://docs.solana.com/)
3. **Community**: [Solana Discord](https://discord.gg/solana), [Anchor Discord](https://discord.gg/anchor)

---

**Happy coding! 🎮✨** 