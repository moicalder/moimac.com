import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface SessionData {
  userId: string
  score: number
  highScore: number
}

/**
 * Submit a Snake game session
 * POST /api/snake/session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, score, highScore }: SessionData = body

    if (!userId || score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert session record
    const result = await sql`
      INSERT INTO snake_sessions (
        user_id,
        score,
        high_score
      ) VALUES (
        ${userId},
        ${score},
        ${highScore}
      )
      RETURNING id;
    `

    // Increment total_games_played for the user
    await sql`
      UPDATE users 
      SET total_games_played = total_games_played + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId};
    `

    console.log('Snake session saved:', {
      id: result.rows[0]?.id,
      userId,
      score,
      highScore
    })

    return NextResponse.json({ 
      success: true,
      message: 'Session recorded',
      sessionId: result.rows[0]?.id
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('Error recording Snake session:', error)
    return NextResponse.json(
      { error: 'Failed to record session' },
      { status: 500 }
    )
  }
}

