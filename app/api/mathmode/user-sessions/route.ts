import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Force dynamic rendering - never cache this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Get individual sessions for a user
 * GET /api/mathmode/user-sessions?username=snowfro&operator=+ (operator optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const username = searchParams.get('username')
    const operator = searchParams.get('operator')

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    let query

    if (operator) {
      query = sql`
        SELECT 
          m.id,
          m.operator,
          m.total_questions,
          m.correct_answers,
          m.incorrect_answers,
          m.difficulty,
          m.created_at,
          ROUND(
            (m.correct_answers::numeric / NULLIF(m.total_questions, 0)) * 100,
            1
          ) as accuracy_percentage
        FROM mathmode_sessions m
        JOIN users u ON m.user_id = u.id
        WHERE u.username = ${username}
          AND m.operator = ${operator}
        ORDER BY m.created_at DESC;
      `
    } else {
      query = sql`
        SELECT 
          m.id,
          m.operator,
          m.total_questions,
          m.correct_answers,
          m.incorrect_answers,
          m.difficulty,
          m.created_at,
          ROUND(
            (m.correct_answers::numeric / NULLIF(m.total_questions, 0)) * 100,
            1
          ) as accuracy_percentage
        FROM mathmode_sessions m
        JOIN users u ON m.user_id = u.id
        WHERE u.username = ${username}
        ORDER BY m.created_at DESC;
      `
    }

    const { rows } = await query

    return NextResponse.json({ 
      sessions: rows,
      username,
      operator: operator || 'all'
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

