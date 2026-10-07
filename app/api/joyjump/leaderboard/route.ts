import { NextResponse } from 'next/server'
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
}

export async function GET() {
  try {
    await ensureJoyJumpTable()

    const { rows } = await sql`
      SELECT
        u.username,
        u.avatar_url,
        COUNT(s.id) as sessions_played,
        MAX(s.score) as best_score,
        ROUND(AVG(s.score), 1) as avg_score,
        SUM(s.score) as total_score
      FROM joyjump_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE u.username IS NOT NULL
      GROUP BY u.id, u.username, u.avatar_url
      ORDER BY best_score DESC, total_score DESC
      LIMIT 50;
    `

    return NextResponse.json({
      leaderboard: rows,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Error fetching Joy Jump leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
