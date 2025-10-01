import { NextRequest, NextResponse } from 'next/server'
import { isUsernameAvailable } from '@/lib/db'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

/**
 * Check if a username is available
 * GET /api/username/check?username=desired_name&userId=optional_current_user_id
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const username = searchParams.get('username')
    const userId = searchParams.get('userId')

    if (!username || username.trim().length === 0) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { 
          available: false, 
          error: 'Username must be 3-20 characters and contain only letters, numbers, underscores, or hyphens' 
        },
        { status: 400 }
      )
    }

    const available = await isUsernameAvailable(username, userId || undefined)

    return NextResponse.json({ 
      available,
      username 
    })
  } catch (error) {
    console.error('Error checking username:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

