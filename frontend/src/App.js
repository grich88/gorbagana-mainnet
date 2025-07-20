import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import './App.css';

// Import our rate-limited connection utilities
import { getRateLimitedConnection, batchAccountRequests } from './utils/rpcUtils';

// Import the game component
import TrashBandidegenGame from './components/TrashBandidegenGame';

// Your deployed program ID
const PROGRAM_ID = new PublicKey('Ea5RPgxRQm4hNXB51Az9p2t8mkSXwMQKriXMiYhweWf6');

function App() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  
  // Game state
  const [gameState, setGameState] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [playerEntry, setPlayerEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [cacheStats, setCacheStats] = useState({ size: 0, keys: [] });
  
  // Form states
  const [wagerAmount, setWagerAmount] = useState(0.1);
  const [score, setScore] = useState('');
  const [salt, setSalt] = useState('');
  
  // Game states
  const [isPlayingGame, setIsPlayingGame] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [gameSalt, setGameSalt] = useState('');
  const [gameResults, setGameResults] = useState(null);

  // Polling control
  const pollingIntervalRef = useRef(null);
  const [isPolling, setIsPolling] = useState(false);

  // Generate PDAs
  const gameStatePDA = PublicKey.findProgramAddressSync(
    [Buffer.from("game_state")],
    PROGRAM_ID
  )[0];
  
  const leaderboardPDA = PublicKey.findProgramAddressSync(
    [Buffer.from("leaderboard")],
    PROGRAM_ID
  )[0];

  const playerEntryPDA = publicKey ? PublicKey.findProgramAddressSync(
    [Buffer.from("player_entry"), publicKey.toBuffer()],
    PROGRAM_ID
  )[0] : null;

  // Debug PDA addresses
  console.log('🔑 PDA Addresses:', {
    programId: PROGRAM_ID.toString(),
    gameStatePDA: gameStatePDA.toString(),
    leaderboardPDA: leaderboardPDA.toString(),
    playerEntryPDA: playerEntryPDA?.toString(),
    connectedWallet: publicKey?.toString()
  });

  // Get rate-limited connection
  const getRateLimitedConn = useCallback(() => {
    try {
      return getRateLimitedConnection();
    } catch (error) {
      console.warn('Rate limited connection not available, using fallback');
      return connection;
    }
  }, [connection]);

  // Load game data with batching and rate limiting
  const loadGameData = useCallback(async (showLoading = true) => {
    const rateLimitedConn = getRateLimitedConn();
    
    try {
      if (showLoading) setLoading(true);
      setStatus('Loading game data...');
      
      // Prepare batch requests
      const requests = [
        { publicKey: gameStatePDA, name: 'gameState' },
        { publicKey: leaderboardPDA, name: 'leaderboard' }
      ];

      // Add player entry if wallet is connected
      if (publicKey && playerEntryPDA) {
        requests.push({ publicKey: playerEntryPDA, name: 'playerEntry' });
      }

      // Batch the account info requests
      const results = await batchAccountRequests(rateLimitedConn, requests);
      
      // Process results
      const gameStateResult = results.find(r => r.publicKey.equals(gameStatePDA));
      const leaderboardResult = results.find(r => r.publicKey.equals(leaderboardPDA));
      const playerEntryResult = publicKey ? results.find(r => r.publicKey.equals(playerEntryPDA)) : null;

      // Update game state with debugging
      console.log('🔍 Game State Debug:', {
        gameStateResult,
        hasAccountInfo: !!gameStateResult?.accountInfo,
        accountData: gameStateResult?.accountInfo?.data,
        dataLength: gameStateResult?.accountInfo?.data?.length
      });
      
      if (gameStateResult?.accountInfo) {
        setGameState({ exists: true, data: gameStateResult.accountInfo.data });
        setStatus('✅ Game initialized');
        console.log('✅ Game state set to initialized');
      } else {
        setGameState(null);
        setStatus('❌ Game not initialized - Click "Initialize Game" button');
        console.log('❌ Game state set to not initialized');
      }
      
      // Update leaderboard (simplified parsing for demo)
      console.log('🏆 Leaderboard Debug:', {
        leaderboardResult,
        hasAccountInfo: !!leaderboardResult?.accountInfo,
        dataLength: leaderboardResult?.accountInfo?.data?.length
      });
      
      if (leaderboardResult?.accountInfo && leaderboardResult.accountInfo.data.length > 8) {
        setLeaderboard([
          { player: 'Player 1', score: 1500, wager: 0.1 },
          { player: 'Player 2', score: 1200, wager: 0.2 },
          { player: 'Player 3', score: 900, wager: 0.15 }
        ]);
        console.log('🏆 Leaderboard set with mock data');
      } else {
        setLeaderboard([]);
        console.log('🏆 Leaderboard set to empty');
      }
      
      // Update player entry
      console.log('👤 Player Entry Debug:', {
        playerEntryResult,
        hasAccountInfo: !!playerEntryResult?.accountInfo,
        publicKey: publicKey?.toString()
      });
      
      if (playerEntryResult?.accountInfo) {
        setPlayerEntry({ exists: true, data: playerEntryResult.accountInfo.data });
        console.log('👤 Player entry found');
      } else {
        setPlayerEntry(null);
        console.log('👤 No player entry found');
      }

      setLastUpdateTime(new Date().toLocaleTimeString());
      
      // Update cache stats
      if (rateLimitedConn.getCacheStats) {
        setCacheStats(rateLimitedConn.getCacheStats());
      }
      
    } catch (error) {
      console.error('Error loading game data:', error);
      if (error.message.includes('Rate limit exceeded')) {
        setStatus('⚠️ Rate limit exceeded. Slowing down requests...');
      } else {
        setStatus('❌ Error loading game data: ' + error.message);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [publicKey, gameStatePDA, leaderboardPDA, playerEntryPDA, getRateLimitedConn]);

  // Controlled polling logic moved to useEffect and manual controls

  // Start/stop polling based on wallet connection - fix dependency issue
  useEffect(() => {
    if (publicKey) {
      // Only start if not already polling
      if (!pollingIntervalRef.current) {
        setIsPolling(true);
        console.log('Starting controlled polling every 30 seconds');
        
        // Initial load
        loadGameData(true);
        
        // Set up interval
        pollingIntervalRef.current = setInterval(() => {
          loadGameData(false); // Background updates without loading spinner
        }, 30000); // Poll every 30 seconds
      }
    } else {
      // Stop polling when wallet disconnects
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        setIsPolling(false);
        console.log('Stopped polling - wallet disconnected');
      }
    }

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        setIsPolling(false);
        console.log('Stopped polling - component unmount');
      }
    };
  }, [publicKey]); // Only depend on publicKey, not the functions

  // Manual refresh function
  const refreshData = () => {
    const rateLimitedConn = getRateLimitedConn();
    if (rateLimitedConn.clearCache) {
      rateLimitedConn.clearCache();
    }
    loadGameData(true);
  };

  // Game functions
  const generateSalt = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const startGame = async () => {
    if (!publicKey || !gameState) return;
    
    try {
      setLoading(true);
      setStatus('Starting game...');
      
      // Generate a new salt for this game session
      const newSalt = generateSalt();
      setGameSalt(newSalt);
      setSalt(newSalt); // Also set the form salt for manual entry
      
      // Enter contest if not already entered
      if (!playerEntry) {
        await enterContest();
      }
      
      // Start the game
      setIsPlayingGame(true);
      setGameScore(0);
      setGameResults(null);
      setStatus('🎮 Game started! Good luck!');
      
    } catch (error) {
      console.error('Error starting game:', error);
      setStatus('❌ Error starting game: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGameScoreUpdate = (newScore) => {
    setGameScore(newScore);
  };

  const handleGameEnd = async (results) => {
    setIsPlayingGame(false);
    setGameResults(results);
    
    try {
      setLoading(true);
      setStatus('Submitting your score...');
      
      // Automatically submit the score using the game's salt
      await submitGameScore(results.score, gameSalt);
      
      setStatus(`🎉 Game completed! Score: ${results.score.toLocaleString()} points`);
      
    } catch (error) {
      console.error('Error submitting game score:', error);
      setStatus('❌ Error submitting score: ' + error.message);
      
      // Allow manual score entry as fallback
      setScore(results.score.toString());
    } finally {
      setLoading(false);
    }
  };

  const submitGameScore = async (gameScore, gameSalt) => {
    if (!publicKey || !playerEntry) return;
    
    try {
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: playerEntryPDA, isSigner: false, isWritable: true },
          { pubkey: leaderboardPDA, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.concat([
          Buffer.from([2]), // Submit score instruction
          Buffer.from(gameScore.toString().padStart(8, '0')), // Score as 8-byte number
          Buffer.from(gameSalt, 'hex') // Salt as 32-byte hex
        ])
      });

      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection);
      
      console.log('Score submitted:', signature);
      
      // Wait a moment then refresh data
      setTimeout(() => refreshData(), 2000);
      
      return signature;
      
    } catch (error) {
      console.error('Error submitting game score:', error);
      throw error;
    }
  };

  // Manual polling controls
  const togglePolling = () => {
    if (pollingIntervalRef.current) {
      // Stop polling
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setIsPolling(false);
      console.log('Manually stopped polling');
    } else if (publicKey) {
      // Start polling
      setIsPolling(true);
      console.log('Manually started controlled polling every 30 seconds');
      
      // Initial load
      loadGameData(true);
      
      // Set up interval
      pollingIntervalRef.current = setInterval(() => {
        loadGameData(false); // Background updates without loading spinner
      }, 30000); // Poll every 30 seconds
    }
  };

  // Initialize game with detailed debugging
  const initializeGame = async () => {
    if (!publicKey) {
      console.log('❌ No wallet connected');
      return;
    }
    
    try {
      setLoading(true);
      setStatus('🚀 Initializing game...');
      console.log('🎮 Starting game initialization...');
      
      // Check wallet balance first
      const balance = await connection.getBalance(publicKey);
      console.log('💰 Wallet balance:', balance / 1000000000, 'SOL');
      
      if (balance < 10000000) { // Less than 0.01 SOL
        throw new Error('Insufficient SOL balance. Need at least 0.01 SOL for transaction fees.');
      }
      
      console.log('📝 Creating transaction instruction...');
      console.log('PDAs:', {
        gameStatePDA: gameStatePDA.toString(),
        leaderboardPDA: leaderboardPDA.toString(),
        programId: PROGRAM_ID.toString(),
        wallet: publicKey.toString()
      });
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: gameStatePDA, isSigner: false, isWritable: true },
          { pubkey: leaderboardPDA, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.from([0]) // Initialize instruction
      });

      console.log('📋 Instruction created:', instruction);
      
      const transaction = new Transaction().add(instruction);
      console.log('📦 Transaction created, sending...');
      
      const signature = await sendTransaction(transaction, connection);
      console.log('✅ Transaction sent! Signature:', signature);
      
      setStatus('🎉 Game initialized! Transaction: ' + signature);
      
      // Wait for confirmation
      console.log('⏳ Waiting for transaction confirmation...');
      await connection.confirmTransaction(signature, 'confirmed');
      console.log('✅ Transaction confirmed!');
      
      // Refresh data
      setTimeout(() => {
        console.log('🔄 Refreshing game data...');
        refreshData();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error initializing game:', error);
      console.log('Error details:', {
        message: error.message,
        code: error.code,
        logs: error.logs
      });
      
      if (error.message.includes('insufficient')) {
        setStatus('❌ Insufficient SOL balance. Please add some SOL to your wallet.');
      } else if (error.message.includes('User rejected')) {
        setStatus('❌ Transaction cancelled by user.');
      } else {
        setStatus('❌ Error initializing game: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Enter contest
  const enterContest = async () => {
    if (!publicKey || !playerEntryPDA) return;
    
    try {
      setLoading(true);
      setStatus('Entering contest...');
      
      // Generate random score hash for commit-reveal
      const randomSalt = Array.from(crypto.getRandomValues(new Uint8Array(32)));
      const randomHash = Array.from(crypto.getRandomValues(new Uint8Array(32)));
      setSalt(randomSalt.map(b => b.toString(16).padStart(2, '0')).join(''));
      
      const wagerLamports = wagerAmount * 1e9; // Convert SOL to lamports
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: gameStatePDA, isSigner: false, isWritable: true },
          { pubkey: playerEntryPDA, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.concat([
          Buffer.from([1]), // Enter contest instruction
          Buffer.from(new Uint8Array(new BigUint64Array([BigInt(wagerLamports)]).buffer)),
          Buffer.from(randomHash)
        ])
      });

      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection);
      
      setStatus('✅ Contest entered! Transaction: ' + signature);
      
      // Wait a moment then refresh data
      setTimeout(() => refreshData(), 2000);
      
    } catch (error) {
      console.error('Error entering contest:', error);
      setStatus('❌ Error entering contest: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit score
  const submitScore = async () => {
    if (!publicKey || !playerEntryPDA || !score || !salt) return;
    
    try {
      setLoading(true);
      setStatus('Submitting score...');
      
      const saltBytes = new Uint8Array(salt.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: playerEntryPDA, isSigner: false, isWritable: true },
          { pubkey: leaderboardPDA, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.concat([
          Buffer.from([2]), // Submit score instruction
          Buffer.from(new Uint8Array(new BigUint64Array([BigInt(score)]).buffer)),
          Buffer.from(saltBytes)
        ])
      });

      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection);
      
      setStatus('✅ Score submitted! Transaction: ' + signature);
      
      // Wait a moment then refresh data
      setTimeout(() => refreshData(), 2000);
      
    } catch (error) {
      console.error('Error submitting score:', error);
      setStatus('❌ Error submitting score: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎮 Gorbadome Contest Platform</h1>
        <p>Compete, Submit Scores, Win Prizes!</p>
        <WalletMultiButton />
      </header>

      <main className="App-main">
        {/* Status Display */}
        <div className="status-section">
          <h3>📊 Status</h3>
          <p className={loading ? 'loading' : ''}>{status || 'Ready'}</p>
          {lastUpdateTime && (
            <div style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '10px' }}>
              Last updated: {lastUpdateTime}
              {isPolling && ' • Auto-refresh: ON'}
            </div>
          )}
          <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '5px' }}>
            Cache: {cacheStats.size} items | 
            <button 
              onClick={refreshData} 
              style={{ marginLeft: '10px', padding: '2px 8px', fontSize: '0.8rem' }}
              disabled={loading}
            >
              🔄 Refresh
            </button>
            {publicKey && (
              <button 
                onClick={togglePolling} 
                style={{ 
                  marginLeft: '10px', 
                  padding: '2px 8px', 
                  fontSize: '0.8rem',
                  backgroundColor: isPolling ? '#ff6b6b' : '#51cf66'
                }}
              >
                {isPolling ? '⏸️ Stop Auto-refresh' : '▶️ Start Auto-refresh'}
              </button>
            )}
          </div>
        </div>

        {/* Game Section */}
        {publicKey && gameState && (
          <div className="game-section">
            <h3>🎮 Trash Bandidegen Game</h3>
            
            {!isPlayingGame && !gameResults && (
              <div className="game-start">
                <p>Ready to play? Start your endless runner adventure!</p>
                <div className="game-info">
                  <p>🏃‍♂️ <strong>How to Play:</strong></p>
                  <ul>
                    <li>• Use arrow keys or WASD to move between lanes</li>
                    <li>• Space/W/↑ to jump over obstacles</li>
                    <li>• S/↓ to slide under barriers</li>
                    <li>• X/Shift for spin attack to destroy obstacles</li>
                    <li>• Collect trash coins for points</li>
                    <li>• Grab power-ups for special abilities</li>
                  </ul>
                </div>
                <button 
                  onClick={startGame}
                  disabled={loading}
                  className="action-button play-game"
                  style={{ 
                    fontSize: '18px', 
                    padding: '15px 30px',
                    background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: '10px'
                  }}
                >
                  🎮 Start Game
                </button>
              </div>
            )}
            
            {isPlayingGame && (
              <div className="game-playing">
                <p style={{ textAlign: 'center', marginBottom: '10px' }}>
                  🎯 Current Score: <strong>{gameScore.toLocaleString()}</strong>
                </p>
                <TrashBandidegenGame 
                  onGameEnd={handleGameEnd}
                  onScoreUpdate={handleGameScoreUpdate}
                />
              </div>
            )}
            
            {gameResults && !isPlayingGame && (
              <div className="game-results">
                <h4>🎉 Game Complete!</h4>
                <div className="results-stats">
                  <p>📊 <strong>Final Score:</strong> {gameResults.score.toLocaleString()} points</p>
                  <p>📏 <strong>Distance:</strong> {gameResults.distance}m</p>
                  <p>⚡ <strong>Max Speed:</strong> {gameResults.maxSpeed.toFixed(1)}x</p>
                </div>
                <button 
                  onClick={startGame}
                  disabled={loading}
                  className="action-button play-again"
                  style={{ 
                    marginTop: '15px',
                    background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '10px 20px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Play Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Game Controls */}
        {publicKey && (
          <div className="game-controls">
            
            {/* Initialize Game */}
            {!gameState && (
              <div className="control-section">
                <h3>🚀 Initialize Game</h3>
                <button 
                  onClick={initializeGame}
                  disabled={loading}
                  className="action-button init"
                >
                  Initialize Game
                </button>
              </div>
            )}

            {/* Enter Contest */}
            {gameState && !playerEntry && !isPlayingGame && (
              <div className="control-section">
                <h3>🏁 Enter Contest</h3>
                <div className="input-group">
                  <label>Wager Amount (SOL):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={wagerAmount}
                    onChange={(e) => setWagerAmount(parseFloat(e.target.value))}
                  />
                </div>
                <button 
                  onClick={enterContest}
                  disabled={loading}
                  className="action-button enter"
                >
                  Enter Contest ({wagerAmount} SOL)
                </button>
              </div>
            )}

            {/* Manual Score Submit (Fallback) */}
            {gameState && !isPlayingGame && (
              <div className="control-section">
                <h3>📊 Manual Score Entry</h3>
                <p style={{ fontSize: '0.9rem', opacity: '0.8' }}>
                  Use this if automatic submission failed
                </p>
                <div className="input-group">
                  <label>Your Score:</label>
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="Enter your score"
                  />
                </div>
                <div className="input-group">
                  <label>Salt (auto-generated):</label>
                  <input
                    type="text"
                    value={salt}
                    onChange={(e) => setSalt(e.target.value)}
                    placeholder="Salt for score verification"
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
                <button 
                  onClick={submitScore}
                  disabled={loading || !score || !salt}
                  className="action-button submit"
                >
                  Submit Score
                </button>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard */}
        <div className="leaderboard-section">
          <h3>🏆 Leaderboard</h3>
          {leaderboard.length > 0 ? (
            <div className="leaderboard">
              {leaderboard.map((entry, index) => (
                <div key={index} className={`leaderboard-entry rank-${index + 1}`}>
                  <span className="rank">#{index + 1}</span>
                  <span className="player">{entry.player}</span>
                  <span className="score">{entry.score} pts</span>
                  <span className="wager">{entry.wager} SOL</span>
                </div>
              ))}
            </div>
          ) : (
            <p>No entries yet. Be the first to compete!</p>
          )}
        </div>

        {/* Game Info */}
        <div className="info-section">
          <h3>📋 Game Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>Program ID:</strong>
              <span className="monospace">{PROGRAM_ID.toString()}</span>
            </div>
            <div className="info-item">
              <strong>Network:</strong>
              <span>Devnet (Rate Limited)</span>
            </div>
            <div className="info-item">
              <strong>Game State:</strong>
              <span className={gameState ? 'active' : 'inactive'}>
                {gameState ? 'Active' : 'Not Initialized'}
              </span>
            </div>
            {publicKey && (
              <div className="info-item">
                <strong>Your Entry:</strong>
                <span className={playerEntry ? 'entered' : 'not-entered'}>
                  {playerEntry ? 'Entered' : 'Not Entered'}
                </span>
              </div>
            )}
            <div className="info-item">
              <strong>Polling:</strong>
              <span className={isPolling ? 'active' : 'inactive'}>
                {isPolling ? '✅ Active (30s)' : '❌ Stopped'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App; 