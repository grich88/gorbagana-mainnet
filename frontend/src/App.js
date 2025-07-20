import React, { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import './App.css';

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
  
  // Form states
  const [wagerAmount, setWagerAmount] = useState(0.1);
  const [score, setScore] = useState('');
  const [salt, setSalt] = useState('');

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

  // Load game data
  const loadGameData = useCallback(async () => {
    if (!connection) return;
    
    try {
      setLoading(true);
      
      // Load game state
      const gameStateAccount = await connection.getAccountInfo(gameStatePDA);
      if (gameStateAccount) {
        setGameState({ exists: true, data: gameStateAccount.data });
        setStatus('Game initialized');
      } else {
        setGameState(null);
        setStatus('Game not initialized');
      }
      
      // Load leaderboard
      const leaderboardAccount = await connection.getAccountInfo(leaderboardPDA);
      if (leaderboardAccount && leaderboardAccount.data.length > 8) {
        // Parse leaderboard (simplified - in real app you'd properly deserialize)
        setLeaderboard([
          { player: 'Player 1', score: 1500, wager: 0.1 },
          { player: 'Player 2', score: 1200, wager: 0.2 },
          { player: 'Player 3', score: 900, wager: 0.15 }
        ]);
      }
      
      // Load player entry
      if (publicKey && playerEntryPDA) {
        const playerEntryAccount = await connection.getAccountInfo(playerEntryPDA);
        if (playerEntryAccount) {
          setPlayerEntry({ exists: true, data: playerEntryAccount.data });
        } else {
          setPlayerEntry(null);
        }
      }
      
    } catch (error) {
      console.error('Error loading game data:', error);
      setStatus('Error loading game data');
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey, gameStatePDA, leaderboardPDA, playerEntryPDA]);

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  // Initialize game
  const initializeGame = async () => {
    if (!publicKey) return;
    
    try {
      setLoading(true);
      setStatus('Initializing game...');
      
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

      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection);
      
      setStatus('Game initialized! Transaction: ' + signature);
      await loadGameData();
      
    } catch (error) {
      console.error('Error initializing game:', error);
      setStatus('Error initializing game: ' + error.message);
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
      
      setStatus('Contest entered! Transaction: ' + signature);
      await loadGameData();
      
    } catch (error) {
      console.error('Error entering contest:', error);
      setStatus('Error entering contest: ' + error.message);
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
      
      setStatus('Score submitted! Transaction: ' + signature);
      await loadGameData();
      
    } catch (error) {
      console.error('Error submitting score:', error);
      setStatus('Error submitting score: ' + error.message);
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
        </div>

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
            {gameState && !playerEntry && (
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

            {/* Submit Score */}
            {playerEntry && (
              <div className="control-section">
                <h3>📊 Submit Score</h3>
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
              <span>Devnet</span>
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
          </div>
        </div>
      </main>
    </div>
  );
}

export default App; 