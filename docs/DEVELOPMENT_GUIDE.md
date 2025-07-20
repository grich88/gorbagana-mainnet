# GorbaDome Development Guide

## 🏗️ Project Architecture

GorbaDome follows a modular architecture designed for scalability and maintainability:

```
gorbadome-game/
├── Assets/
│   ├── Scripts/
│   │   ├── Gameplay/          # Core game mechanics
│   │   ├── UI/                # User interface components
│   │   ├── Audio/             # Audio management
│   │   ├── Blockchain/        # Web3 integration (Phase 2)
│   │   ├── Config/            # Game configuration
│   │   └── Utilities/         # Helper classes
│   ├── Scenes/                # Unity scenes
│   ├── Prefabs/              # Reusable game objects
│   ├── Materials/            # Visual materials
│   └── Audio/                # Sound files
├── ProjectSettings/          # Unity project settings
└── Packages/                 # Unity packages
```

## 🎮 Core Systems

### 1. Player Controller (`PlayerController.cs`)
- **Purpose**: Handles player movement, collision, and input
- **Key Features**:
  - Lane-based movement (3 lanes)
  - Jump, slide, and spin mechanics
  - Collision detection with obstacles/collectibles
  - Speed progression over time

### 2. Game Manager (`GameManager.cs`)
- **Purpose**: Central game state management
- **Key Features**:
  - Game state machine (Menu, Playing, Paused, GameOver)
  - Score calculation and tracking
  - Difficulty progression
  - Save/load functionality

### 3. Level Generator (`LevelGenerator.cs`)
- **Purpose**: Procedural infinite track generation
- **Key Features**:
  - Segment-based track creation
  - Dynamic obstacle/collectible spawning
  - Difficulty-based spawn probability adjustment
  - Object pooling for performance

### 4. UI Manager (`UIManager.cs`)
- **Purpose**: Complete user interface management
- **Key Features**:
  - Menu navigation
  - HUD updates
  - Blockchain integration UI (Phase 2)
  - Settings management

### 5. Audio Manager (`AudioManager.cs`)
- **Purpose**: Audio system with pooling and volume control
- **Key Features**:
  - Music and SFX management
  - Audio source pooling
  - Volume controls
  - Dynamic music switching

## 🔧 Key Components

### Obstacles (`Obstacle.cs`)
Different obstacle types with varying behaviors:
- **Solid**: Standard blocking obstacles
- **Destructible**: Can be destroyed with spin attack
- **Moving**: Moves back and forth
- **Temporary**: Appears and disappears
- **Bouncy**: Bounces player back
- **Collectible**: Fake obstacle that gives points

### Collectibles (`TrashCoin.cs`)
Multiple coin types with different values:
- **Basic** (10 pts): Standard brown trash coin
- **Silver** (25 pts): Silver shitcoin
- **Gold** (50 pts): Golden meme coin
- **Diamond** (100 pts): Diamond hands coin
- **Legendary** (250 pts): Ultra rare pepe coin
- **Multiplier**: Special coin that multiplies current score

### Power-ups (`PowerUp.cs`)
Temporary abilities and bonuses:
- **Speed Boost**: Increases forward speed
- **Score Multiplier**: Multiplies score gain
- **Coin Magnet**: Attracts coins from further away
- **Invincibility**: Temporary invulnerability
- **Double Jump**: Allows double jumping
- **Slow Motion**: Slows down time

## 📱 Platform Integration

### WebGL Build
- Optimized for web deployment
- Compatible with xNFT framework
- Responsive design for different screen sizes

### xNFT Integration (Backpack)
- Deployable as executable NFT
- Direct wallet integration
- Seamless transaction signing

## 🌐 Blockchain Integration (Phase 2)

### Smart Contract Architecture
```rust
// Anchor program structure
pub struct GameState {
    pub authority: Pubkey,
    pub total_pool: u64,
    pub contest_start: i64,
    pub contest_end: i64,
}

pub struct PlayerEntry {
    pub player: Pubkey,
    pub wager_amount: u64,
    pub score_hash: [u8; 32],
    pub submitted: bool,
}

pub struct Leaderboard {
    pub entries: Vec<LeaderboardEntry>,
    pub last_updated: i64,
}
```

### Wallet Integration
- **Backpack**: Primary xNFT deployment
- **Phantom**: Web fallback option
- **Solflare**: Additional support

### Transaction Flow
1. **Entry**: Player submits wager + score commitment
2. **Gameplay**: Standard game mechanics
3. **Submission**: Score revealed with proof
4. **Verification**: On-chain validation
5. **Payout**: Automatic reward distribution

## 🎯 Monetization Strategy

### Low-Liquidity Design
- **Player vs Player**: No house funds required
- **Entry Fees**: Small $GOR wagers create prize pools
- **NFT Sales**: Trash Pass for premium features
- **Rage-Quit Insurance**: Micro-transactions for continues

### Revenue Streams
1. **Platform Fees**: 5% cut from wagers
2. **NFT Sales**: Trash Pass and cosmetics
3. **Insurance**: Continue-on-death payments
4. **Premium Features**: Enhanced gameplay for NFT holders

## 🔒 Security Considerations

### Client-Side
- Input validation and sanitization
- Anti-cheat measures (score bounds, plausibility)
- Secure random number generation

### Blockchain
- Commit-reveal scheme for score submission
- Time-bounded game sessions
- Proper access controls on smart contracts

## 🧪 Testing Strategy

### Unit Testing
```csharp
[Test]
public void PlayerController_Jump_IncreasesYVelocity()
{
    // Arrange
    var player = CreatePlayerController();
    
    // Act
    player.Jump();
    
    // Assert
    Assert.Greater(player.velocity.y, 0);
}
```

### Integration Testing
- Game flow testing (start to finish)
- Blockchain transaction testing
- UI interaction testing

### Performance Testing
- Frame rate optimization
- Memory usage monitoring
- WebGL build testing

## 🚀 Deployment Process

### Phase 1 (Current)
1. Unity WebGL build
2. Static hosting (GitHub Pages/Netlify)
3. Basic functionality testing

### Phase 2 (Blockchain)
1. Smart contract deployment to Gorganus devnet
2. Wallet integration testing
3. xNFT minting and distribution

### Phase 3 (Full Platform)
1. Mainnet deployment
2. Multi-game platform launch
3. Community features rollout

## 🛠️ Development Tools

### Required Software
- Unity 2022.3 LTS
- Visual Studio Code or JetBrains Rider
- Git for version control
- Node.js (for blockchain development)

### Recommended Extensions
- Unity C# extensions
- Rust Analyzer (for smart contracts)
- Solana CLI tools
- Anchor framework

## 📊 Performance Optimization

### Unity Optimization
- Object pooling for frequently spawned objects
- Efficient collision detection
- Optimized UI rendering
- Audio source pooling

### WebGL Optimization
- Texture compression
- Audio compression
- Code stripping
- Build size minimization

## 🐛 Common Issues & Solutions

### Build Issues
**Problem**: WebGL build fails
**Solution**: Check Player Settings, ensure no unsupported libraries

**Problem**: xNFT deployment issues
**Solution**: Verify manifest.json format, check CORS settings

### Performance Issues
**Problem**: Frame rate drops
**Solution**: Profile using Unity Profiler, optimize object pooling

**Problem**: Memory leaks
**Solution**: Proper object disposal, event unsubscription

### Blockchain Issues
**Problem**: Transaction timeouts
**Solution**: Implement retry logic, adjust timeout values

**Problem**: Wallet connection fails
**Solution**: Check network settings, verify RPC endpoints

## 📈 Analytics & Monitoring

### Key Metrics
- **Player Retention**: Daily/weekly active users
- **Session Length**: Average playtime per session
- **Transaction Volume**: $GOR wagered per day
- **Performance**: Frame rate, load times

### Implementation
```csharp
public class AnalyticsManager
{
    public void TrackEvent(string eventName, Dictionary<string, object> parameters)
    {
        // Send to analytics service
    }
    
    public void TrackGameStart(bool isWagered, float wagerAmount)
    {
        var parameters = new Dictionary<string, object>
        {
            {"is_wagered", isWagered},
            {"wager_amount", wagerAmount}
        };
        TrackEvent("game_start", parameters);
    }
}
```

## 🔄 Continuous Integration

### Automated Testing
- Unity Cloud Build integration
- Automated WebGL builds
- Smart contract testing pipeline

### Deployment Pipeline
1. Code commit triggers build
2. Automated testing suite runs
3. Successful builds deploy to staging
4. Manual approval for production

## 📚 Resources

### Documentation
- [Unity Documentation](https://docs.unity3d.com/)
- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Backpack xNFT Guide](https://docs.xnft.gg/)

### Community
- [Gorbagana Discord](#)
- [Solana Developer Discord](https://discord.gg/solana)
- [Unity Developer Community](https://unity.com/community)

## 🎯 Next Steps

### Immediate (Phase 1 Completion)
- [ ] Complete Unity scene setup
- [ ] Asset integration and testing
- [ ] WebGL build optimization
- [ ] Basic gameplay balancing

### Short-term (Phase 2 Preparation)
- [ ] Smart contract development
- [ ] Wallet integration testing
- [ ] xNFT deployment preparation
- [ ] Security audit planning

### Long-term (Phase 3 Vision)
- [ ] Multi-game platform architecture
- [ ] Community features development
- [ ] Mobile app consideration
- [ ] Advanced tokenomics implementation

---

*This guide is a living document that will be updated as the project evolves through its development phases.* 