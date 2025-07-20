# 🎮 Gorbadome Frontend

A modern React frontend for the Gorbadome Solana contest platform.

## 🚀 Features

- **Wallet Integration**: Connect with Phantom, Solflare, and other Solana wallets
- **Contest Management**: Initialize games and enter contests with SOL wagers
- **Score Submission**: Secure commit-reveal score submission system
- **Live Leaderboard**: Real-time display of top 3 players
- **Beautiful UI**: Modern gradient design with glass morphism effects
- **Responsive**: Works on desktop and mobile devices

## 🏗️ Architecture

- **Frontend**: React 18 with modern hooks
- **Wallet**: Solana Wallet Adapter for universal wallet support
- **Network**: Connects to Solana Devnet (configurable)
- **Program**: Interacts with deployed Gorbadome Solana program
- **Styling**: CSS Grid and Flexbox with custom animations

## 📦 Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🎯 How to Use

### 1. Connect Wallet
- Click "Select Wallet" and choose your preferred Solana wallet
- Make sure you're on Devnet and have some SOL for transactions

### 2. Initialize Game (First Time)
- If the game isn't initialized, click "Initialize Game"
- This sets up the program state and leaderboard

### 3. Enter Contest
- Set your wager amount (minimum 0.01 SOL)
- Click "Enter Contest" to join with your wager
- A random salt will be generated for score verification

### 4. Submit Score
- Enter your score from the game you played
- The salt is used to verify your score authentically
- Click "Submit Score" to add to the leaderboard

### 5. View Leaderboard
- See the top 3 players with their scores and wagers
- Rankings are updated in real-time

## 🛠️ Configuration

### Program ID
Update the `PROGRAM_ID` in `src/App.js`:
```javascript
const PROGRAM_ID = new PublicKey('YOUR_PROGRAM_ID_HERE');
```

### Network
Change the network in `src/index.js`:
```javascript
const network = WalletAdapterNetwork.Devnet; // or Mainnet
```

## 🎨 Customization

### Styling
- Main styles in `src/App.css`
- Uses CSS custom properties for easy theming
- Gradient backgrounds and glass morphism effects

### Components
- `App.js` - Main application component
- Modular structure for easy expansion

## 🔧 Development

### Build for Production
```bash
npm run build
```

### Run Tests
```bash
npm test
```

## 📱 Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Wallet Connection Issues
- Make sure your wallet is on Devnet
- Clear browser cache and try again
- Check that your wallet has SOL for transactions

### Transaction Failures
- Ensure sufficient SOL balance
- Check that the program is deployed and accessible
- Verify you're on the correct network

### Build Issues
- Run `npm install` to ensure all dependencies are installed
- Clear `node_modules` and reinstall if needed
- Check Node.js version compatibility

## 🔗 Links

- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- [Solana Web3.js](https://github.com/solana-labs/solana-web3.js)
- [React Documentation](https://reactjs.org/docs) 