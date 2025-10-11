import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

/**
 * Record a Star Fighter game session
 * POST /api/starfighter/session
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, score, highScore, particlesDestroyed } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Insert session
    await sql`
      INSERT INTO starfighter_sessions (
        user_id,
        score,
        high_score,
        particles_destroyed
      ) VALUES (
        ${userId},
        ${score},
        ${highScore},
        ${particlesDestroyed}
      );
    `

    // Update user's total games played
    await sql`
      UPDATE users 
      SET total_games_played = total_games_played + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId};
    `

    return NextResponse.json({
      success: true,
      message: 'Session recorded successfully'
    })
  } catch (error) {
    console.error('Error recording Star Fighter session:', error)
    return NextResponse.json(
      { error: 'Failed to record session' },
      { status: 500 }
    )
  }
}

