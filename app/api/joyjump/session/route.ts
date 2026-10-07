import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function ensureJoyJumpTable() {
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
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, score, highScore } = body

    if (!userId || score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await ensureJoyJumpTable()

    const result = await sql`
      INSERT INTO joyjump_sessions (
        user_id,
        score,
        high_score
      ) VALUES (
        ${userId},
        ${score},
        ${highScore}
      )
      RETURNING id;
    `

    await sql`
      UPDATE users
      SET total_games_played = total_games_played + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId};
    `

    return NextResponse.json({
      success: true,
      sessionId: result.rows[0]?.id,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Error recording Joy Jump session:', error)
    return NextResponse.json(
      { error: 'Failed to record session' },
      { status: 500 }
    )
  }
}
