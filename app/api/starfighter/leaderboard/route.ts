import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

/**
 * Get Star Fighter leaderboard
 * GET /api/starfighter/leaderboard
 */
export async function GET() {
  try {
    const { rows } = await sql`
      SELECT 
        u.username,
        u.avatar_url,
        COUNT(s.id) as sessions_played,
        MAX(s.score) as best_score,
        ROUND(AVG(s.score)) as avg_score,
        SUM(s.score) as total_score,
        SUM(s.particles_destroyed) as total_particles_destroyed
      FROM starfighter_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE u.username IS NOT NULL
      GROUP BY u.id, u.username, u.avatar_url
      ORDER BY best_score DESC, avg_score DESC
      LIMIT 100;
    `

    return NextResponse.json(
      { leaderboard: rows },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    )
  } catch (error) {
    console.error('Error fetching Star Fighter leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}

