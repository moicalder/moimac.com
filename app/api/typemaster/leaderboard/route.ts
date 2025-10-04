import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Get TypeMaster leaderboard data
 * GET /api/typemaster/leaderboard?lesson=home-row (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lessonId = searchParams.get('lesson')

    let query

    if (lessonId) {
      if (lessonId === 'custom') {
        query = sql`
          SELECT
            u.username,
            u.avatar_url,
            COUNT(t.id) as sessions_played,
            MAX(t.wpm) as best_wpm,
            ROUND(AVG(t.wpm), 1) as avg_wpm,
            ROUND(AVG(t.accuracy), 1) as avg_accuracy,
            MAX(t.accuracy) as best_accuracy,
            SUM(t.total_keys) as total_keys_typed,
            SUM(t.mistakes) as total_mistakes,
            ROUND(MAX(t.wpm * t.accuracy / 100), 1) as mastery_score
          FROM typemaster_sessions t
          JOIN users u ON t.user_id = u.id
          WHERE t.lesson_id LIKE 'custom-%'
            AND u.username IS NOT NULL
          GROUP BY u.id, u.username, u.avatar_url
          ORDER BY best_wpm DESC, avg_accuracy DESC
          LIMIT 50;
        `
      } else {
        query = sql`
          SELECT
            u.username,
            u.avatar_url,
            COUNT(t.id) as sessions_played,
            MAX(t.wpm) as best_wpm,
            ROUND(AVG(t.wpm), 1) as avg_wpm,
            ROUND(AVG(t.accuracy), 1) as avg_accuracy,
            MAX(t.accuracy) as best_accuracy,
            SUM(t.total_keys) as total_keys_typed,
            SUM(t.mistakes) as total_mistakes,
            ROUND(MAX(t.wpm * t.accuracy / 100), 1) as mastery_score
          FROM typemaster_sessions t
          JOIN users u ON t.user_id = u.id
          WHERE t.lesson_id = ${lessonId}
            AND u.username IS NOT NULL
          GROUP BY u.id, u.username, u.avatar_url
          ORDER BY best_wpm DESC, avg_accuracy DESC
          LIMIT 50;
        `
      }
    } else {
      // Global leaderboard (all lessons)
      query = sql`
        SELECT 
          u.username,
          u.avatar_url,
          COUNT(t.id) as sessions_played,
          MAX(t.wpm) as best_wpm,
          ROUND(AVG(t.wpm), 1) as avg_wpm,
          ROUND(AVG(t.accuracy), 1) as avg_accuracy,
          MAX(t.accuracy) as best_accuracy,
          SUM(t.total_keys) as total_keys_typed,
          SUM(t.mistakes) as total_mistakes,
          COUNT(DISTINCT t.lesson_id) as lessons_completed,
          ROUND(MAX(t.wpm * t.accuracy / 100), 1) as mastery_score
        FROM typemaster_sessions t
        JOIN users u ON t.user_id = u.id
        WHERE u.username IS NOT NULL
        GROUP BY u.id, u.username, u.avatar_url
        ORDER BY mastery_score DESC, best_wpm DESC
        LIMIT 50;
      `
    }

    const { rows } = await query

    return NextResponse.json({ 
      leaderboard: rows,
      lesson: lessonId || 'global',
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('Error fetching TypeMaster leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}

