import { sql } from '@vercel/postgres'

export interface UserProfile {
  id: string
  email: string
  username: string | null
  avatar_url: string | null
  wallet_address: string | null
  created_at: Date
  updated_at: Date
  total_games_played: number
  total_score: number
}

/**
 * Initialize the database tables
 * Run this once to set up your database schema
 */
export async function initializeDatabase() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100),
        avatar_url TEXT,
        wallet_address VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_games_played INTEGER DEFAULT 0,
        total_score INTEGER DEFAULT 0
      );
    `

    // Create game_scores table for future use
    await sql`
      CREATE TABLE IF NOT EXISTS game_scores (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        game_name VARCHAR(100) NOT NULL,
        score INTEGER NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `

    // Create index on user_id for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_game_scores_user_id 
      ON game_scores(user_id);
    `

    // Create index on game_name for leaderboards
    await sql`
      CREATE INDEX IF NOT EXISTS idx_game_scores_game_name 
      ON game_scores(game_name);
    `

    return { success: true }
  } catch (error) {
    console.error('Database initialization error:', error)
    return { success: false, error }
  }
}

/**
 * Get or create a user profile
 */
export async function getOrCreateUser(userId: string, email: string): Promise<UserProfile | null> {
  try {
    // Try to get existing user
    const { rows } = await sql`
      SELECT * FROM users WHERE id = ${userId};
    `

    if (rows.length > 0) {
      return rows[0] as UserProfile
    }

    // Create new user if doesn't exist
    const { rows: newUser } = await sql`
      INSERT INTO users (id, email, username)
      VALUES (${userId}, ${email}, ${email.split('@')[0]})
      RETURNING *;
    `

    return newUser[0] as UserProfile
  } catch (error) {
    console.error('Error getting/creating user:', error)
    return null
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: { username?: string; avatar_url?: string; wallet_address?: string }
): Promise<UserProfile | null> {
  try {
    const setClauses: string[] = []
    const values: any[] = []

    if (updates.username !== undefined) {
      setClauses.push(`username = $${values.length + 1}`)
      values.push(updates.username)
    }

    if (updates.avatar_url !== undefined) {
      setClauses.push(`avatar_url = $${values.length + 1}`)
      values.push(updates.avatar_url)
    }

    if (updates.wallet_address !== undefined) {
      setClauses.push(`wallet_address = $${values.length + 1}`)
      values.push(updates.wallet_address)
    }

    if (setClauses.length === 0) {
      return null
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`)

    const { rows } = await sql.query(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${values.length + 1} RETURNING *`,
      [...values, userId]
    )

    return rows[0] as UserProfile
  } catch (error) {
    console.error('Error updating user profile:', error)
    return null
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<UserProfile | null> {
  try {
    const { rows } = await sql`
      SELECT * FROM users WHERE id = ${userId};
    `
    return rows.length > 0 ? (rows[0] as UserProfile) : null
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

