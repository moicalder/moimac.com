import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Initialize MathMode tables
 * Run this once to create the mathmode_sessions table
 * DELETE THIS FILE after running!
 */
export async function GET() {
  try {
    // Create mathmode_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS mathmode_sessions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        operator VARCHAR(1) NOT NULL,
        total_questions INTEGER NOT NULL,
        correct_answers INTEGER NOT NULL,
        incorrect_answers INTEGER NOT NULL,
        difficulty NUMERIC(4,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `

    // Create indexes for better query performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_mathmode_user_id 
      ON mathmode_sessions(user_id);
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_mathmode_operator 
      ON mathmode_sessions(operator);
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_mathmode_created_at 
      ON mathmode_sessions(created_at);
    `

    return NextResponse.json({ 
      message: 'MathMode tables initialized successfully',
      note: 'DELETE /app/api/mathmode/init-tables/route.ts for security'
    })
  } catch (error) {
    console.error('Error initializing MathMode tables:', error)
    return NextResponse.json(
      { error: 'Failed to initialize tables', details: String(error) },
      { status: 500 }
    )
  }
}

