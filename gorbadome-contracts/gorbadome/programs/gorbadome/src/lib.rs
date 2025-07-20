use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("5Qewhf89dYVr16QF9hW34PvTUDmvxHpZWHE3y19crbss");

#[program]
pub mod gorbadome {
    use super::*;

    /// Initialize the GorbaDome game state
    pub fn initialize_game(
        ctx: Context<InitializeGame>,
        house_fee_percentage: u8,
        contest_duration: i64,
    ) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;
        game_state.authority = ctx.accounts.authority.key();
        game_state.house_fee_percentage = house_fee_percentage;
        game_state.contest_duration = contest_duration;
        game_state.current_contest_start = Clock::get()?.unix_timestamp;
        game_state.total_pool = 0;
        game_state.is_active = true;
        
        msg!("GorbaDome game initialized with {}% house fee", house_fee_percentage);
        Ok(())
    }

    /// Player enters a run with a wager
    pub fn enter_run(
        ctx: Context<EnterRun>,
        wager_amount: u64,
        score_hash: [u8; 32],
    ) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;
        let player_entry = &mut ctx.accounts.player_entry;
        let clock = Clock::get()?;

        // Check if contest is active
        require!(game_state.is_active, GorbaDomeError::ContestNotActive);

        // Check if contest period has ended
        let contest_end = game_state.current_contest_start + game_state.contest_duration;
        require!(clock.unix_timestamp < contest_end, GorbaDomeError::ContestEnded);

        // Transfer wager to game state
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.player_token_account.to_account_info(),
                to: ctx.accounts.game_token_account.to_account_info(),
                authority: ctx.accounts.player.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, wager_amount)?;

        // Calculate house fee
        let house_fee = (wager_amount as u128 * game_state.house_fee_percentage as u128) / 100;
        let net_wager = wager_amount - house_fee as u64;

        // Update game state
        game_state.total_pool += net_wager;

        // Create player entry
        player_entry.player = ctx.accounts.player.key();
        player_entry.wager_amount = wager_amount;
        player_entry.net_wager = net_wager;
        player_entry.score_hash = score_hash;
        player_entry.entry_time = clock.unix_timestamp;
        player_entry.is_completed = false;
        player_entry.score = 0;

        msg!("Player {} entered run with {} $GOR wager", ctx.accounts.player.key(), wager_amount);
        
        emit!(RunEntered {
            player: ctx.accounts.player.key(),
            wager_amount,
            entry_time: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Player submits their score after completing a run
    pub fn submit_score(
        ctx: Context<SubmitScore>,
        score: u64,
        salt: [u8; 32],
    ) -> Result<()> {
        // Verify the player has an active entry
        require!(!ctx.accounts.player_entry.is_completed, GorbaDomeError::RunAlreadyCompleted);
        require!(ctx.accounts.player_entry.player == ctx.accounts.player.key(), GorbaDomeError::UnauthorizedPlayer);

        // Verify score hash (commit-reveal scheme)
        let computed_hash = {
            let mut hasher = anchor_lang::solana_program::hash::Hasher::default();
            hasher.hash(&salt);
            hasher.hash(&score.to_le_bytes());
            hasher.hash(&ctx.accounts.player_entry.player.to_bytes());
            hasher.result().to_bytes()
        };
        
        require!(computed_hash == ctx.accounts.player_entry.score_hash, GorbaDomeError::InvalidScoreHash);

        // Update leaderboard first to minimize stack usage
        update_leaderboard(
            &mut ctx.accounts.leaderboard,
            ctx.accounts.player.key(),
            score,
            ctx.accounts.player_entry.net_wager
        )?;

        // Mark entry as completed
        let clock = Clock::get()?;
        let player_entry = &mut ctx.accounts.player_entry;
        player_entry.is_completed = true;
        player_entry.score = score;
        player_entry.submission_time = clock.unix_timestamp;

        msg!("Score {} submitted for player {}", score, ctx.accounts.player.key());

        emit!(ScoreSubmitted {
            player: ctx.accounts.player.key(),
            score,
            submission_time: clock.unix_timestamp,
        });

        Ok(())
    }

    /// End current contest and distribute prizes
    pub fn end_contest(ctx: Context<EndContest>) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;
        let leaderboard = &ctx.accounts.leaderboard;
        let clock = Clock::get()?;

        // Only authority can end contest
        require!(ctx.accounts.authority.key() == game_state.authority, GorbaDomeError::Unauthorized);

        // Check if contest period has ended
        let contest_end = game_state.current_contest_start + game_state.contest_duration;
        require!(clock.unix_timestamp >= contest_end, GorbaDomeError::ContestNotEnded);

        let total_pool = game_state.total_pool;
        
        // Distribute prizes based on leaderboard
        if total_pool > 0 && leaderboard.top_players.len() > 0 {
            // Prize distribution: 50% to 1st, 30% to 2nd, 20% to 3rd
            let first_prize = total_pool * 50 / 100;
            let second_prize = total_pool * 30 / 100;
            let third_prize = total_pool * 20 / 100;

            // Log prize distribution (actual SOL transfers would need additional accounts)
            if leaderboard.top_players.len() >= 1 {
                msg!("1st place: {} wins {} lamports", leaderboard.top_players[0].player, first_prize);
            }
            if leaderboard.top_players.len() >= 2 {
                msg!("2nd place: {} wins {} lamports", leaderboard.top_players[1].player, second_prize);
            }
            if leaderboard.top_players.len() >= 3 {
                msg!("3rd place: {} wins {} lamports", leaderboard.top_players[2].player, third_prize);
            }

            msg!("Total prizes distributed: {} lamports", first_prize + second_prize + third_prize);
        }

        // Reset for next contest
        game_state.current_contest_start = clock.unix_timestamp;
        game_state.total_pool = 0;
        game_state.is_active = true;

        emit!(ContestEnded {
            total_pool,
            end_time: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Distribute prize to a specific winner (separate instruction for cleaner account handling)
    pub fn distribute_prize(ctx: Context<DistributePrize>, rank: u8) -> Result<()> {
        let game_state = &ctx.accounts.game_state;
        let leaderboard = &ctx.accounts.leaderboard;

        // Only authority can distribute prizes
        require!(ctx.accounts.authority.key() == game_state.authority, GorbaDomeError::Unauthorized);

        // Verify rank is valid and player exists
        require!(rank >= 1 && rank <= 3, GorbaDomeError::InvalidRank);
        let player_index = (rank - 1) as usize;
        require!(leaderboard.top_players.len() > player_index, GorbaDomeError::PlayerNotFound);

        // Verify the winner account matches the leaderboard
        let winner = &leaderboard.top_players[player_index];
        require!(ctx.accounts.winner.key() == winner.player, GorbaDomeError::UnauthorizedPlayer);

        // Calculate prize based on rank
        let total_pool = game_state.total_pool;
        let prize_amount = match rank {
            1 => total_pool * 50 / 100,  // 50% for 1st place
            2 => total_pool * 30 / 100,  // 30% for 2nd place  
            3 => total_pool * 20 / 100,  // 20% for 3rd place
            _ => 0,
        };

        if prize_amount > 0 {
            // Transfer SOL from game state account to winner
            **ctx.accounts.game_state.to_account_info().try_borrow_mut_lamports()? -= prize_amount;
            **ctx.accounts.winner.try_borrow_mut_lamports()? += prize_amount;

            msg!("Prize distributed: {} lamports to rank {} player {}", 
                 prize_amount, rank, ctx.accounts.winner.key());

            emit!(PrizeDistributed {
                winner: ctx.accounts.winner.key(),
                rank,
                amount: prize_amount,
            });
        }

        Ok(())
    }

    /// Buy continue insurance for a run
    pub fn buy_continue_insurance(ctx: Context<BuyContinueInsurance>) -> Result<()> {
        let player_entry = &mut ctx.accounts.player_entry;
        let insurance_fee = 1_000_000; // 0.001 $GOR (assuming 9 decimals)

        // Verify the player has an active entry
        require!(!player_entry.is_completed, GorbaDomeError::RunAlreadyCompleted);
        require!(player_entry.player == ctx.accounts.player.key(), GorbaDomeError::UnauthorizedPlayer);
        require!(!player_entry.insurance_purchased, GorbaDomeError::InsuranceAlreadyPurchased);

        // Transfer insurance fee
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.player_token_account.to_account_info(),
                to: ctx.accounts.game_token_account.to_account_info(),
                authority: ctx.accounts.player.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, insurance_fee)?;

        // Mark insurance as purchased
        player_entry.insurance_purchased = true;

        msg!("Continue insurance purchased for player {}", ctx.accounts.player.key());

        emit!(InsurancePurchased {
            player: ctx.accounts.player.key(),
            fee: insurance_fee,
        });

        Ok(())
    }

    /// Mint Trash Pass NFT
    pub fn mint_trash_pass(ctx: Context<MintTrashPass>) -> Result<()> {
        let trash_pass = &mut ctx.accounts.trash_pass;
        let clock = Clock::get()?;

        // Initialize Trash Pass NFT
        trash_pass.owner = ctx.accounts.player.key();
        trash_pass.mint_time = clock.unix_timestamp;
        trash_pass.is_active = true;

        msg!("Trash Pass NFT minted for player {}", ctx.accounts.player.key());

        emit!(TrashPassMinted {
            player: ctx.accounts.player.key(),
            mint_time: clock.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeGame<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + GameState::LEN,
        seeds = [b"game_state"],
        bump
    )]
    pub game_state: Account<'info, GameState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EnterRun<'info> {
    #[account(
        mut,
        seeds = [b"game_state"],
        bump,
        constraint = game_state.is_active @ GorbaDomeError::ContestNotActive
    )]
    pub game_state: Account<'info, GameState>,
    
    #[account(
        init,
        payer = player,
        space = 8 + PlayerEntry::LEN,
        seeds = [b"player_entry", player.key().as_ref()],
        bump
    )]
    pub player_entry: Account<'info, PlayerEntry>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    #[account(
        mut,
        constraint = player_token_account.owner == player.key()
    )]
    pub player_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"game_token_account"],
        bump
    )]
    pub game_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitScore<'info> {
    #[account(
        mut,
        seeds = [b"player_entry", player.key().as_ref()],
        bump,
        constraint = player_entry.player == player.key() @ GorbaDomeError::UnauthorizedPlayer
    )]
    pub player_entry: Account<'info, PlayerEntry>,
    
    #[account(
        mut,
        seeds = [b"leaderboard"],
        bump
    )]
    pub leaderboard: Account<'info, Leaderboard>,
    
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct EndContest<'info> {
    #[account(
        mut,
        seeds = [b"game_state"],
        bump,
        constraint = game_state.authority == authority.key() @ GorbaDomeError::Unauthorized
    )]
    pub game_state: Account<'info, GameState>,
    
    #[account(
        seeds = [b"leaderboard"],
        bump
    )]
    pub leaderboard: Account<'info, Leaderboard>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub game_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DistributePrize<'info> {
    #[account(
        mut,
        seeds = [b"game_state"],
        bump,
        constraint = game_state.authority == authority.key() @ GorbaDomeError::Unauthorized
    )]
    pub game_state: Account<'info, GameState>,
    
    #[account(
        seeds = [b"leaderboard"],
        bump
    )]
    pub leaderboard: Account<'info, Leaderboard>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// CHECK: Winner account is validated against leaderboard
    #[account(mut)]
    pub winner: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct BuyContinueInsurance<'info> {
    #[account(
        mut,
        seeds = [b"player_entry", player.key().as_ref()],
        bump,
        constraint = player_entry.player == player.key() @ GorbaDomeError::UnauthorizedPlayer
    )]
    pub player_entry: Account<'info, PlayerEntry>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    #[account(
        mut,
        constraint = player_token_account.owner == player.key()
    )]
    pub player_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"game_token_account"],
        bump
    )]
    pub game_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct MintTrashPass<'info> {
    #[account(
        init,
        payer = player,
        space = 8 + TrashPass::LEN,
        seeds = [b"trash_pass", player.key().as_ref()],
        bump
    )]
    pub trash_pass: Account<'info, TrashPass>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct GameState {
    pub authority: Pubkey,
    pub house_fee_percentage: u8,
    pub contest_duration: i64,
    pub current_contest_start: i64,
    pub total_pool: u64,
    pub is_active: bool,
}

impl GameState {
    pub const LEN: usize = 32 + 1 + 8 + 8 + 8 + 1;
}

#[account]
pub struct PlayerEntry {
    pub player: Pubkey,
    pub wager_amount: u64,
    pub net_wager: u64,
    pub score_hash: [u8; 32],
    pub entry_time: i64,
    pub is_completed: bool,
    pub score: u64,
    pub submission_time: i64,
    pub insurance_purchased: bool,
}

impl PlayerEntry {
    pub const LEN: usize = 32 + 8 + 8 + 32 + 8 + 1 + 8 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub struct LeaderboardEntry {
    pub player: Pubkey,
    pub score: u64,
    pub wager: u64,
    pub timestamp: i64,
}

impl LeaderboardEntry {
    pub const LEN: usize = 32 + 8 + 8 + 8;
}

#[account]
pub struct Leaderboard {
    pub entries: [LeaderboardEntry; 3],
}

impl Leaderboard {
    pub const LEN: usize = 8 + (LeaderboardEntry::LEN * 3);
}

#[account]
pub struct TrashPass {
    pub owner: Pubkey,
    pub mint_time: i64,
    pub is_active: bool,
}

impl TrashPass {
    pub const LEN: usize = 32 + 8 + 1;
}

// Events
#[event]
pub struct RunEntered {
    pub player: Pubkey,
    pub wager_amount: u64,
    pub entry_time: i64,
}

#[event]
pub struct ScoreSubmitted {
    pub player: Pubkey,
    pub score: u64,
    pub submission_time: i64,
}

#[event]
pub struct ContestEnded {
    pub total_pool: u64,
    pub end_time: i64,
}

#[event]
pub struct InsurancePurchased {
    pub player: Pubkey,
    pub fee: u64,
}

#[event]
pub struct TrashPassMinted {
    pub player: Pubkey,
    pub mint_time: i64,
}

#[event]
pub struct PrizeDistributed {
    pub winner: Pubkey,
    pub rank: u8,
    pub amount: u64,
}

// Helper function to update leaderboard with minimal stack usage
fn update_leaderboard(leaderboard: &mut Account<Leaderboard>, player: Pubkey, score: u64, wager: u64) -> Result<()> {
    let clock = Clock::get()?;
    let new_entry = LeaderboardEntry {
        player,
        score,
        wager,
        timestamp: clock.unix_timestamp,
    };

    // Find insertion position
    let mut insert_at = leaderboard.entries.len();
    for (i, entry) in leaderboard.entries.iter().enumerate() {
        if score > entry.score {
            insert_at = i;
            break;
        }
    }

    // Shift entries down if needed
    if insert_at < leaderboard.entries.len() {
        for i in (insert_at + 1..leaderboard.entries.len()).rev() {
            leaderboard.entries[i] = leaderboard.entries[i - 1].clone();
        }
        leaderboard.entries[insert_at] = new_entry;
    }

    Ok(())
}

// Error codes
#[error_code]
pub enum GorbaDomeError {
    #[msg("Contest is not active")]
    ContestNotActive,
    #[msg("Contest has ended")]
    ContestEnded,
    #[msg("Contest has not ended yet")]
    ContestNotEnded,
    #[msg("Unauthorized player")]
    UnauthorizedPlayer,
    #[msg("Unauthorized operation")]
    Unauthorized,
    #[msg("Run already completed")]
    RunAlreadyCompleted,
    #[msg("Invalid score hash")]
    InvalidScoreHash,
    #[msg("Insurance already purchased")]
    InsuranceAlreadyPurchased,
    #[msg("Invalid rank specified")]
    InvalidRank,
    #[msg("Player not found in leaderboard")]
    PlayerNotFound,
}
