import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Initialize Snake tables
 * Run this once to create the snake_sessions table
 * DELETE THIS FILE after running!
 */
export async function GET() {
  try {
    // Create snake_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS snake_sessions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        high_score INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `

    // Create indexes for better query performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_snake_user_id 
      ON snake_sessions(user_id);
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_snake_created_at 
      ON snake_sessions(created_at);
    `

    return NextResponse.json({ 
      message: 'Snake tables initialized successfully',
      note: 'DELETE /app/api/snake/init-tables/route.ts for security'
    })
  } catch (error) {
    console.error('Error initializing Snake tables:', error)
    return NextResponse.json(
      { error: 'Failed to initialize tables', details: String(error) },
      { status: 500 }
    )
  }
}

