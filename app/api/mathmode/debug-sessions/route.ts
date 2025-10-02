import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Debug endpoint to see all sessions in the database
 * DELETE THIS FILE after debugging
 */
export async function GET() {
  try {
    const { rows } = await sql`
      SELECT 
        m.*,
        u.username
      FROM mathmode_sessions m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.created_at DESC
      LIMIT 20;
    `

    return NextResponse.json({ 
      sessions: rows,
      count: rows.length
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions', details: String(error) },
      { status: 500 }
    )
  }
}

