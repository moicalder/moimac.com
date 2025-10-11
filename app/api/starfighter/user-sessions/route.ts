import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

/**
 * Get user's Star Fighter session history
 * GET /api/starfighter/user-sessions?username=<username>
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    const { rows } = await sql`
      SELECT 
        s.id,
        s.score,
        s.high_score,
        s.particles_destroyed,
        s.created_at
      FROM starfighter_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE u.username = ${username}
      ORDER BY s.created_at DESC
      LIMIT 50;
    `

    return NextResponse.json(
      { sessions: rows },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    )
  } catch (error) {
    console.error('Error fetching user Star Fighter sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

