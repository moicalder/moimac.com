import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Get individual sessions for a user
 * GET /api/snake/user-sessions?username=snowfro
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    const query = sql`
      SELECT 
        s.id,
        s.score,
        s.high_score,
        s.created_at
      FROM snake_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE u.username = ${username}
      ORDER BY s.created_at DESC;
    `

    const { rows } = await query

    return NextResponse.json({ 
      sessions: rows,
      username
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('Error fetching user sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

