import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Get Snake leaderboard data
 * GET /api/snake/leaderboard
 */
export async function GET(request: NextRequest) {
  try {
    const query = sql`
      SELECT 
        u.username,
        u.avatar_url,
        COUNT(s.id) as sessions_played,
        MAX(s.score) as best_score,
        ROUND(AVG(s.score), 1) as avg_score,
        SUM(s.score) as total_score
      FROM snake_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE u.username IS NOT NULL
      GROUP BY u.id, u.username, u.avatar_url
      ORDER BY best_score DESC, total_score DESC
      LIMIT 50;
    `

    const { rows } = await query

    return NextResponse.json({ 
      leaderboard: rows,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('Error fetching Snake leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}

