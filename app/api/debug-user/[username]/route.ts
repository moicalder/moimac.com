import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Debug endpoint to see raw database data for a user
 * GET /api/debug-user/[username]
 * DELETE THIS FILE after debugging!
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username

    // Get by username
    const { rows: byUsername } = await sql`
      SELECT 
        id,
        email,
        username,
        avatar_url,
        wallet_address,
        created_at,
        updated_at
      FROM users
      WHERE LOWER(username) = LOWER(${username});
    `

    // Get all users to check for duplicates
    const { rows: allUsers } = await sql`
      SELECT 
        id,
        email,
        username,
        avatar_url
      FROM users
      WHERE username IS NOT NULL
      ORDER BY username;
    `

    return NextResponse.json({
      requestedUsername: username,
      foundUser: byUsername[0] || null,
      totalUsersWithUsernames: allUsers.length,
      allUsers: allUsers,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: String(error) },
      { status: 500 }
    )
  }
}

