import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Force dynamic rendering - never cache this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

type Operator = '+' | '-' | '×' | '÷'

interface SessionData {
  userId: string
  operator: Operator
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  difficulty: number  // Average of (digits1 + digits2)
  digits1?: number
  digits2?: number
}

/**
 * Submit a MathMode game session
 * POST /api/mathmode/session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, operator, totalQuestions, correctAnswers, incorrectAnswers, difficulty, digits1, digits2 }: SessionData = body

    if (!userId || !operator || totalQuestions === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert session record
    const result = await sql`
      INSERT INTO mathmode_sessions (
        user_id,
        operator,
        total_questions,
        correct_answers,
        incorrect_answers,
        difficulty,
        digits1,
        digits2
      ) VALUES (
        ${userId},
        ${operator},
        ${totalQuestions},
        ${correctAnswers},
        ${incorrectAnswers},
        ${difficulty},
        ${digits1 || null},
        ${digits2 || null}
      )
      RETURNING id;
    `

    console.log('Session saved:', {
      id: result.rows[0]?.id,
      userId,
      operator,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      difficulty
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
    console.error('Error recording MathMode session:', error)
    return NextResponse.json(
      { error: 'Failed to record session' },
      { status: 500 }
    )
  }
}

