import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

/**
 * Initialize Star Fighter tables
 * GET /api/starfighter/init-tables
 */
export async function GET() {
  try {
    // Create starfighter_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS starfighter_sessions (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        high_score INTEGER NOT NULL,
        particles_destroyed INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `

    // Create index on user_id for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_starfighter_user_id 
      ON starfighter_sessions(user_id);
    `

    // Create index on score for leaderboard queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_starfighter_score 
      ON starfighter_sessions(score DESC);
    `

    return NextResponse.json({
      success: true,
      message: 'Star Fighter tables initialized successfully'
    })
  } catch (error) {
    console.error('Error initializing Star Fighter tables:', error)
    return NextResponse.json(
      { error: 'Failed to initialize tables' },
      { status: 500 }
    )
  }
}

