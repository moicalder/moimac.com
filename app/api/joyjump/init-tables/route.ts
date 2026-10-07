import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS joyjump_sessions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        high_score INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_joyjump_user_id
      ON joyjump_sessions(user_id);
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_joyjump_created_at
      ON joyjump_sessions(created_at);
    `

    return NextResponse.json({
      message: 'Joy Jump tables initialized successfully',
    })
  } catch (error) {
    console.error('Error initializing Joy Jump tables:', error)
    return NextResponse.json(
      { error: 'Failed to initialize tables', details: String(error) },
      { status: 500 }
    )
  }
}
