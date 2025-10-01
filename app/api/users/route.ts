import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Get all users (public information only)
 * GET /api/users
 */
export async function GET() {
  try {
    const { rows } = await sql`
      SELECT 
        username,
        avatar_url,
        total_games_played,
        total_score,
        created_at
      FROM users
      WHERE username IS NOT NULL
      ORDER BY total_score DESC, username ASC
      LIMIT 100;
    `

    return NextResponse.json({ users: rows }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

