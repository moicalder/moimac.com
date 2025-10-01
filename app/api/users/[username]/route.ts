import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Get a specific user's public profile by username
 * GET /api/users/[username]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username

    const { rows } = await sql`
      SELECT 
        username,
        avatar_url,
        total_games_played,
        total_score,
        created_at
      FROM users
      WHERE LOWER(username) = LOWER(${username});
    `

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user: rows[0] })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

