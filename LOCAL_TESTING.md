# 🧪 Local Testing Guide

This guide will help you test the GorbaDome game locally without requiring the full blockchain setup. Perfect for getting started quickly!

## 🚀 Quick Start (No Blockchain Required)

### 1. Unity Game Testing

#### Open Unity Project
1. Open Unity Hub
2. Click "Add" and select the `gorbadome-game/` folder
3. Unity will import the project (this may take a few minutes)
4. Once imported, open the `MainGame` scene

#### Test Basic Gameplay
1. Click the **Play** button in Unity Editor
2. The game should start with mock blockchain mode enabled
3. Test the controls:
   - **Arrow Keys** or **WASD**: Change lanes
   - **Space** or **Up Arrow**: Jump
   - **Down Arrow**: Slide
   - **X** or **Shift**: Spin attack

#### Expected Behavior
- Player character moves forward automatically
- Can switch between 3 lanes
- Can jump over obstacles
- Can slide under barriers
- Can collect trash coins for points
- Game over on obstacle collision

### 2. Mock Blockchain Testing

The game includes a `MockWalletAdapter` that simulates blockchain interactions:

#### Test Wallet Connection
1. In the game menu, click **"Connect Wallet"**
2. The mock wallet should connect instantly
3. You should see a mock wallet address displayed
4. Mock $GOR balance should show (default: 1000 GOR)

#### Test Wagered Game
1. Click **"Play with Wager"** 
2. Select a wager amount (e.g., 10 GOR)
3. The game should start after simulating transaction confirmation
4. Play the game normally
5. At game end, score should be "submitted" to mock blockchain

#### Test Features
- **Continue Insurance**: Try buying continue when you die
- **Trash Pass**: Mock system shows you have a Trash Pass
- **Leaderboards**: Scores are tracked locally

## 🔧 Configuration Options

### Test Config Settings

You can modify test behavior by editing the `TestConfig` asset:

1. In Unity, go to Project window
2. Navigate to `Assets/Resources/`
3. Find `TestConfig` asset (create if missing)
4. Adjust these settings:

```
Testing Mode:
☑ Enable Test Mode
☑ Mock Blockchain Mode  
☑ Skip Wallet Connection
☐ Auto Start Game

Mock Data:
Wallet Address: "GorbaDegen123456789"
GOR Balance: 1000
Has Trash Pass: ☑
Default Wager: 10

Game Testing:
☐ Unlimited Lives
☐ Max Speed
☑ All Powerups Enabled
Speed Multiplier: 1.0

Debug Settings:
☑ Show Debug UI
☑ Verbose Logging
☑ Simulate Network Delay
Network Delay: 2.0 seconds
```

### Quick Test Modes

Use these preset configurations:

#### Development Mode
```csharp
TestConfig.Instance.SetDevelopmentMode();
```
- Full logging and debug UI
- Mock blockchain enabled
- Easy testing setup

#### Speed Test Mode  
```csharp
TestConfig.Instance.SetSpeedTestMode();
```
- 3x speed multiplier
- Unlimited lives
- Fast gameplay testing

## 🎮 Testing Checklist

### Core Gameplay ✅
- [ ] Player moves forward automatically
- [ ] Lane switching works (left/right)
- [ ] Jumping works (space/up)
- [ ] Sliding works (down)
- [ ] Spin attack works (X/shift)
- [ ] Collision detection working
- [ ] Coins can be collected
- [ ] Score increases correctly

### UI/Menus ✅
- [ ] Main menu displays
- [ ] Settings menu works
- [ ] Game HUD shows score/distance
- [ ] Pause menu functional
- [ ] Game over screen appears
- [ ] Leaderboard displays scores

### Mock Blockchain ✅
- [ ] Wallet connects instantly
- [ ] Balance shows correctly
- [ ] Wager selection works
- [ ] "Transaction" confirms quickly
- [ ] Score "submission" works
- [ ] Mock features respond

### Performance ✅
- [ ] Game runs at 60 FPS
- [ ] No major frame drops
- [ ] Smooth lane transitions
- [ ] Responsive controls
- [ ] Quick menu navigation

## 🐛 Common Issues & Solutions

### Unity Issues

#### "Script compilation errors"
- Check all C# files are in correct folders
- Ensure using Unity 2022.3 LTS or newer
- Wait for Unity to finish importing

#### "Missing references"
- All references should be internal to the project
- If errors persist, restart Unity Editor

#### "Game doesn't start"
- Check console for error messages
- Ensure MainGame scene is loaded
- Verify TestConfig is properly set up

### Performance Issues

#### "Low FPS in editor"
- Close other applications
- Use "Game" view instead of "Scene" view when testing
- Check if other Unity projects are open

#### "Controls feel laggy"
- Unity Editor can add input delay
- Test a build for better performance
- Check if VSync is causing issues

### Mock Blockchain Issues

#### "Wallet won't connect"
- Check TestConfig has "Skip Wallet Connection" enabled
- Verify MockWalletAdapter is being used
- Check console for error messages

#### "Transactions don't confirm"
- Ensure "Simulate Network Delay" is reasonable (1-3 seconds)
- Check if mock mode is enabled
- Verify transaction flow in console logs

## 📊 Performance Targets

When testing locally, aim for these targets:

- **Frame Rate**: 60+ FPS in Unity Editor
- **Memory**: <500MB RAM usage
- **Startup Time**: <10 seconds to main menu
- **Input Lag**: <50ms response time
- **Load Time**: <3 seconds between scenes

## 🚀 Next Steps

Once local testing is working:

1. **Install Solana Tools**: Follow the SETUP.md guide
2. **Build Smart Contracts**: Get the blockchain components working
3. **Integration Testing**: Connect real blockchain to Unity
4. **WebGL Build**: Test the web version
5. **Deploy to Devnet**: Test on real Gorganus network

## 💡 Quick Tips

### For Faster Testing
- Use TestConfig presets for different scenarios
- Enable unlimited lives for gameplay testing
- Use speed multiplier for quick iteration
- Turn on verbose logging to understand flow

### For Better Performance
- Close unnecessary browser tabs
- Restart Unity Editor periodically
- Use Fast Enter Play Mode (Project Settings)
- Profile with Unity Profiler if needed

### For Debugging
- Check Unity Console for errors/warnings
- Use Debug.Log statements in code
- Enable verbose logging in TestConfig
- Test one feature at a time

---

## 🎯 Ready to Test!

You should now be able to test the core Trash Bandidegen gameplay locally without any blockchain setup. This lets you:

✅ Verify the game is fun and working
✅ Test all core mechanics  
✅ Ensure UI/UX is smooth
✅ Debug any issues quickly
✅ Prepare for blockchain integration

**Happy testing! 🎮🗑️** 