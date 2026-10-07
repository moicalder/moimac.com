import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username')

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
        s.created_at
      FROM joyjump_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE u.username = ${username}
      ORDER BY s.created_at DESC;
    `

    return NextResponse.json({
      sessions: rows,
      username,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Error fetching Joy Jump sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}
