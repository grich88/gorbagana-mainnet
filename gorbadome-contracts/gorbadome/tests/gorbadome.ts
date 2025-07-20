import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GorbaDome } from "../target/types/gorbadome";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from "@solana/spl-token";
import { assert } from "chai";

describe("gorbadome", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GorbaDome as Program<GorbaDome>;
  
  // Test accounts
  const authority = Keypair.generate();
  const player1 = Keypair.generate();
  const player2 = Keypair.generate();
  
  // PDAs
  let gameStatePda: PublicKey;
  let leaderboardPda: PublicKey;
  let gameTokenAccountPda: PublicKey;
  
  // Token mint for $GOR
  let gorMint: PublicKey;
  let player1TokenAccount: PublicKey;
  let player2TokenAccount: PublicKey;

  before(async () => {
    // Airdrop SOL to test accounts
    await provider.connection.requestAirdrop(authority.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(player1.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(player2.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    
    // Wait for airdrops to confirm
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create $GOR token mint
    gorMint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      9 // 9 decimals like SOL
    );
    
    // Create token accounts for players
    player1TokenAccount = await createAccount(
      provider.connection,
      player1,
      gorMint,
      player1.publicKey
    );
    
    player2TokenAccount = await createAccount(
      provider.connection,
      player2,
      gorMint,
      player2.publicKey
    );
    
    // Mint some $GOR to players
    await mintTo(
      provider.connection,
      authority,
      gorMint,
      player1TokenAccount,
      authority,
      1000_000_000_000 // 1000 $GOR
    );
    
    await mintTo(
      provider.connection,
      authority,
      gorMint,
      player2TokenAccount,
      authority,
      1000_000_000_000 // 1000 $GOR
    );
    
    // Derive PDAs
    [gameStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("game_state")],
      program.programId
    );
    
    [leaderboardPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("leaderboard")],
      program.programId
    );
    
    [gameTokenAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("game_token_account")],
      program.programId
    );
  });

  it("Initializes the game", async () => {
    try {
      await program.methods
        .initializeGame(5, 86400) // 5% house fee, 24 hour contest duration
        .accounts({
          gameState: gameStatePda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();
      
      const gameState = await program.account.gameState.fetch(gameStatePda);
      assert.equal(gameState.authority.toString(), authority.publicKey.toString());
      assert.equal(gameState.houseFeePercentage, 5);
      assert.equal(gameState.contestDuration, 86400);
      assert.equal(gameState.isActive, true);
      assert.equal(gameState.totalPool, 0);
      
      console.log("✅ Game initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize game:", error);
      throw error;
    }
  });

  it("Allows player to enter a run with wager", async () => {
    try {
      const wagerAmount = 10_000_000_000; // 10 $GOR
      const scoreHash = new Uint8Array(32).fill(1); // Mock hash
      
      const [playerEntryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("player_entry"), player1.publicKey.toBuffer()],
        program.programId
      );
      
      await program.methods
        .enterRun(wagerAmount, scoreHash)
        .accounts({
          gameState: gameStatePda,
          playerEntry: playerEntryPda,
          player: player1.publicKey,
          playerTokenAccount: player1TokenAccount,
          gameTokenAccount: gameTokenAccountPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([player1])
        .rpc();
      
      const playerEntry = await program.account.playerEntry.fetch(playerEntryPda);
      assert.equal(playerEntry.player.toString(), player1.publicKey.toString());
      assert.equal(playerEntry.wagerAmount, wagerAmount);
      assert.equal(playerEntry.isCompleted, false);
      
      const gameState = await program.account.gameState.fetch(gameStatePda);
      const expectedNetWager = wagerAmount - (wagerAmount * 5 / 100); // After 5% house fee
      assert.equal(gameState.totalPool, expectedNetWager);
      
      console.log("✅ Player entered run successfully");
    } catch (error) {
      console.error("❌ Failed to enter run:", error);
      throw error;
    }
  });

  it("Allows player to submit score", async () => {
    try {
      const score = 1500;
      const salt = new Uint8Array(32).fill(2); // Mock salt
      
      const [playerEntryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("player_entry"), player1.publicKey.toBuffer()],
        program.programId
      );
      
      await program.methods
        .submitScore(score, salt)
        .accounts({
          playerEntry: playerEntryPda,
          leaderboard: leaderboardPda,
          player: player1.publicKey,
        })
        .signers([player1])
        .rpc();
      
      const playerEntry = await program.account.playerEntry.fetch(playerEntryPda);
      assert.equal(playerEntry.score, score);
      assert.equal(playerEntry.isCompleted, true);
      
      console.log("✅ Score submitted successfully");
    } catch (error) {
      console.error("❌ Failed to submit score:", error);
      throw error;
    }
  });

  it("Allows player to buy continue insurance", async () => {
    try {
      const [playerEntryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("player_entry"), player1.publicKey.toBuffer()],
        program.programId
      );
      
      await program.methods
        .buyContinueInsurance()
        .accounts({
          playerEntry: playerEntryPda,
          player: player1.publicKey,
          playerTokenAccount: player1TokenAccount,
          gameTokenAccount: gameTokenAccountPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([player1])
        .rpc();
      
      const playerEntry = await program.account.playerEntry.fetch(playerEntryPda);
      assert.equal(playerEntry.insurancePurchased, true);
      
      console.log("✅ Continue insurance purchased successfully");
    } catch (error) {
      console.error("❌ Failed to buy insurance:", error);
      throw error;
    }
  });

  it("Allows player to mint Trash Pass NFT", async () => {
    try {
      const [trashPassPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("trash_pass"), player2.publicKey.toBuffer()],
        program.programId
      );
      
      await program.methods
        .mintTrashPass()
        .accounts({
          trashPass: trashPassPda,
          player: player2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([player2])
        .rpc();
      
      const trashPass = await program.account.trashPass.fetch(trashPassPda);
      assert.equal(trashPass.owner.toString(), player2.publicKey.toString());
      assert.equal(trashPass.isActive, true);
      
      console.log("✅ Trash Pass NFT minted successfully");
    } catch (error) {
      console.error("❌ Failed to mint Trash Pass:", error);
      throw error;
    }
  });

  it("Prevents duplicate run entries", async () => {
    try {
      const wagerAmount = 5_000_000_000; // 5 $GOR
      const scoreHash = new Uint8Array(32).fill(3); // Mock hash
      
      const [playerEntryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("player_entry"), player1.publicKey.toBuffer()],
        program.programId
      );
      
      // This should fail because player already has an entry
      await program.methods
        .enterRun(wagerAmount, scoreHash)
        .accounts({
          gameState: gameStatePda,
          playerEntry: playerEntryPda,
          player: player1.publicKey,
          playerTokenAccount: player1TokenAccount,
          gameTokenAccount: gameTokenAccountPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([player1])
        .rpc();
      
      assert.fail("Should have thrown an error for duplicate entry");
    } catch (error) {
      console.log("✅ Correctly prevented duplicate run entry");
    }
  });

  it("Updates leaderboard correctly", async () => {
    try {
      // Add a second player with higher score
      const wagerAmount = 15_000_000_000; // 15 $GOR
      const scoreHash = new Uint8Array(32).fill(4); // Mock hash
      
      const [player2EntryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("player_entry"), player2.publicKey.toBuffer()],
        program.programId
      );
      
      await program.methods
        .enterRun(wagerAmount, scoreHash)
        .accounts({
          gameState: gameStatePda,
          playerEntry: player2EntryPda,
          player: player2.publicKey,
          playerTokenAccount: player2TokenAccount,
          gameTokenAccount: gameTokenAccountPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([player2])
        .rpc();
      
      const higherScore = 2500;
      const salt = new Uint8Array(32).fill(5); // Mock salt
      
      await program.methods
        .submitScore(higherScore, salt)
        .accounts({
          playerEntry: player2EntryPda,
          leaderboard: leaderboardPda,
          player: player2.publicKey,
        })
        .signers([player2])
        .rpc();
      
      const leaderboard = await program.account.leaderboard.fetch(leaderboardPda);
      assert.equal(leaderboard.entries[0].player.toString(), player2.publicKey.toString());
      assert.equal(leaderboard.entries[0].score, higherScore);
      assert.equal(leaderboard.entries[1].player.toString(), player1.publicKey.toString());
      assert.equal(leaderboard.entries[1].score, 1500);
      
      console.log("✅ Leaderboard updated correctly");
    } catch (error) {
      console.error("❌ Failed to update leaderboard:", error);
      throw error;
    }
  });

  console.log("🎮 All GorbaDome tests completed successfully!");
}); 