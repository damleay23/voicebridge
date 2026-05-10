use anchor_lang::prelude::*;

declare_id!("AELiTsxMv5D4W8bwJA4YvpsrGAc8wvcbskn7Cnsmec86"); // No lo cambies manualmente por ahora

#[program]
pub mod sign_language_rewards {
    use super::*;

    // Función para crear la cuenta del jugador en la blockchain
    pub fn initialize_player(ctx: Context<InitializePlayer>, username: String) -> Result<()> {
        let player_stats = &mut ctx.accounts.player_stats;
        player_stats.username = username;
        player_stats.level = 1;
        player_stats.xp = 0;
        Ok(())
    }

    // Función que llamará tu IA cuando el usuario suba de nivel
    pub fn update_level(ctx: Context<UpdateLevel>, new_level: u64) -> Result<()> {
        let player_stats = &mut ctx.accounts.player_stats;
        player_stats.level = new_level;
        msg!("¡Nivel actualizado en la blockchain para el usuario!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePlayer<'info> {
    #[account(init, payer = user, space = 8 + 32 + 8 + 8)]
    pub player_stats: Account<'info, PlayerStats>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateLevel<'info> {
    #[account(mut)]
    pub player_stats: Account<'info, PlayerStats>,
}

#[account]
pub struct PlayerStats {
    pub username: String, // Nombre que pusiste en el .json
    pub level: u64,      // Nivel alcanzado
    pub xp: u64,         // XP acumulada
}