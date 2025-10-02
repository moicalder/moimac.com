import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Get MathMode leaderboard data
 * GET /api/mathmode/leaderboard?operator=+ (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const operator = searchParams.get('operator')

    let query

    if (operator) {
      // Per-operator leaderboard
      query = sql`
        SELECT 
          u.username,
          u.avatar_url,
          COUNT(m.id) as sessions_played,
          SUM(m.total_questions) as total_questions,
          SUM(m.correct_answers) as total_correct,
          SUM(m.incorrect_answers) as total_incorrect,
          ROUND(AVG(m.difficulty), 2) as avg_difficulty,
          ROUND(
            (SUM(m.correct_answers)::numeric / NULLIF(SUM(m.total_questions), 0)) * 100,
            1
          ) as accuracy_percentage
        FROM mathmode_sessions m
        JOIN users u ON m.user_id = u.id
        WHERE m.operator = ${operator}
          AND u.username IS NOT NULL
        GROUP BY u.id, u.username, u.avatar_url
        ORDER BY total_correct DESC, accuracy_percentage DESC
        LIMIT 50;
      `
    } else {
      // Global leaderboard (all operators)
      query = sql`
        SELECT 
          u.username,
          u.avatar_url,
          COUNT(m.id) as sessions_played,
          SUM(m.total_questions) as total_questions,
          SUM(m.correct_answers) as total_correct,
          SUM(m.incorrect_answers) as total_incorrect,
          ROUND(AVG(m.difficulty), 2) as avg_difficulty,
          ROUND(
            (SUM(m.correct_answers)::numeric / NULLIF(SUM(m.total_questions), 0)) * 100,
            1
          ) as accuracy_percentage,
          COUNT(DISTINCT m.operator) as operators_played
        FROM mathmode_sessions m
        JOIN users u ON m.user_id = u.id
        WHERE u.username IS NOT NULL
        GROUP BY u.id, u.username, u.avatar_url
        ORDER BY total_correct DESC, accuracy_percentage DESC
        LIMIT 50;
      `
    }

    const { rows } = await query

    return NextResponse.json({ 
      leaderboard: rows,
      operator: operator || 'global'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    })
  } catch (error) {
    console.error('Error fetching MathMode leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}

