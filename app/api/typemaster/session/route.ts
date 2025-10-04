import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface SessionData {
  userId: string
  lessonId: string
  wpm: number
  accuracy: number
  totalKeys: number
  correctKeys: number
  mistakes: number
  durationSeconds: number
  wordsCompleted: number
  customListName?: string | null
}

/**
 * Submit a TypeMaster session
 * POST /api/typemaster/session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      lessonId,
      wpm,
      accuracy,
      totalKeys,
      correctKeys,
      mistakes,
      durationSeconds,
      wordsCompleted,
      customListName
    }: SessionData = body

    if (!userId || !lessonId || wpm === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert session record
    const result = await sql`
      INSERT INTO typemaster_sessions (
        user_id,
        lesson_id,
        wpm,
        accuracy,
        total_keys,
        correct_keys,
        mistakes,
        duration_seconds,
        words_completed,
        customListName
      ) VALUES (
        ${userId},
        ${lessonId},
        ${wpm},
        ${accuracy},
        ${totalKeys},
        ${correctKeys},
        ${mistakes},
        ${durationSeconds},
        ${wordsCompleted},
        ${customListName !== undefined ? customListName : null}
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

    console.log('TypeMaster session saved:', {
      id: result.rows[0]?.id,
      userId,
      lessonId,
      wpm,
      accuracy
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
    console.error('Error recording TypeMaster session:', error)
    return NextResponse.json(
      { error: 'Failed to record session' },
      { status: 500 }
    )
  }
}

