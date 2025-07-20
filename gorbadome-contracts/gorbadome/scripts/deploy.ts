import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GorbaDome } from "../target/types/gorbadome";
import { PublicKey, Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount } from "@solana/spl-token";
import * as fs from "fs";

async function main() {
  // Setup provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GorbaDome as Program<GorbaDome>;
  
  console.log("🚀 Deploying GorbaDome to Gorganus Chain...");
  console.log("Program ID:", program.programId.toString());
  
  // Generate authority keypair
  const authority = Keypair.generate();
  
  // Airdrop SOL to authority
  console.log("💰 Airdropping SOL to authority...");
  const signature = await provider.connection.requestAirdrop(
    authority.publicKey,
    10 * anchor.web3.LAMPORTS_PER_SOL
  );
  await provider.connection.confirmTransaction(signature);
  
  // Derive PDAs
  const [gameStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("game_state")],
    program.programId
  );
  
  const [leaderboardPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("leaderboard")],
    program.programId
  );
  
  const [gameTokenAccountPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("game_token_account")],
    program.programId
  );
  
  console.log("📊 Game State PDA:", gameStatePda.toString());
  console.log("🏆 Leaderboard PDA:", leaderboardPda.toString());
  console.log("💎 Game Token Account PDA:", gameTokenAccountPda.toString());
  
  try {
    // Initialize game
    console.log("🎮 Initializing game...");
    await program.methods
      .initializeGame(5, 86400) // 5% house fee, 24 hour contest duration
      .accounts({
        gameState: gameStatePda,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([authority])
      .rpc();
    
    console.log("✅ Game initialized successfully!");
    
    // Save deployment info
    const deploymentInfo = {
      programId: program.programId.toString(),
      authority: authority.publicKey.toString(),
      gameStatePda: gameStatePda.toString(),
      leaderboardPda: leaderboardPda.toString(),
      gameTokenAccountPda: gameTokenAccountPda.toString(),
      network: "gorganus-devnet",
      deployedAt: new Date().toISOString(),
    };
    
    fs.writeFileSync(
      "deployment-info.json",
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("📝 Deployment info saved to deployment-info.json");
    console.log("🎉 GorbaDome deployment completed successfully!");
    
    // Save authority keypair for future use
    const authorityKeypair = {
      publicKey: authority.publicKey.toString(),
      secretKey: Array.from(authority.secretKey),
    };
    
    fs.writeFileSync(
      "authority-keypair.json",
      JSON.stringify(authorityKeypair, null, 2)
    );
    
    console.log("🔑 Authority keypair saved to authority-keypair.json");
    console.log("⚠️  Keep this file secure - it controls the game!");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 