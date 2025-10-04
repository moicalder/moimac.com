import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Get individual sessions for a user
 * GET /api/typemaster/user-sessions?username=snowfro&lesson=home-row (lesson optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const username = searchParams.get('username')
    const lessonId = searchParams.get('lesson')

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    let query

    if (lessonId) {
      if (lessonId === 'custom') {
        query = sql`
          SELECT
            t.id,
            t.lesson_id,
            t.wpm,
            t.accuracy,
            t.total_keys,
            t.correct_keys,
            t.mistakes,
            t.duration_seconds,
            t.words_completed,
            t.customListName,
            t.created_at,
            ROUND(t.wpm * t.accuracy / 100, 1) as mastery_score
          FROM typemaster_sessions t
          JOIN users u ON t.user_id = u.id
          WHERE u.username = ${username}
            AND t.lesson_id LIKE 'custom-%'
          ORDER BY t.created_at DESC;
        `
      } else {
        query = sql`
          SELECT
            t.id,
            t.lesson_id,
            t.wpm,
            t.accuracy,
            t.total_keys,
            t.correct_keys,
            t.mistakes,
            t.duration_seconds,
            t.words_completed,
            t.customListName,
            t.created_at,
            ROUND(t.wpm * t.accuracy / 100, 1) as mastery_score
          FROM typemaster_sessions t
          JOIN users u ON t.user_id = u.id
          WHERE u.username = ${username}
            AND t.lesson_id = ${lessonId}
          ORDER BY t.created_at DESC;
        `
      }
    } else {
      query = sql`
        SELECT
          t.id,
          t.lesson_id,
          t.wpm,
          t.accuracy,
          t.total_keys,
          t.correct_keys,
          t.mistakes,
          t.duration_seconds,
          t.words_completed,
          t.customListName,
          t.created_at,
          ROUND(t.wpm * t.accuracy / 100, 1) as mastery_score
        FROM typemaster_sessions t
        JOIN users u ON t.user_id = u.id
        WHERE u.username = ${username}
        ORDER BY t.created_at DESC;
      `
    }

    const { rows } = await query

    return NextResponse.json({ 
      sessions: rows,
      username,
      lesson: lessonId || 'all'
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

