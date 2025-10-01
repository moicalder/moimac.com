import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateUser, getUserById, updateUserProfile, isUsernameAvailable } from '@/lib/db'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// Helper to get user ID from Privy token
// In production, you'd verify the JWT token here
function getUserIdFromRequest(request: NextRequest): string | null {
  // For now, we'll get it from a custom header
  // In production, parse and verify the Privy JWT token
  const userId = request.headers.get('x-user-id')
  return userId
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const profile = await getUserById(userId)
    
    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ profile }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('Error in GET /api/user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, walletAddress } = body

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing userId or email' },
        { status: 400 }
      )
    }

    let profile = await getOrCreateUser(userId, email)
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Update wallet address if provided and different from stored
    if (walletAddress && profile.wallet_address !== walletAddress) {
      profile = await updateUserProfile(userId, { wallet_address: walletAddress }) || profile
    }

    return NextResponse.json({ profile }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('Error in POST /api/user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { username, avatar_url, wallet_address } = body

    // If updating username, check if it's available
    if (username) {
      const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
      if (!usernameRegex.test(username)) {
        return NextResponse.json(
          { error: 'Username must be 3-20 characters and contain only letters, numbers, underscores, or hyphens' },
          { status: 400 }
        )
      }

      const available = await isUsernameAvailable(username, userId)
      if (!available) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 409 }
        )
      }
    }

    const profile = await updateUserProfile(userId, {
      username,
      avatar_url,
      wallet_address,
    })
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('Error in PATCH /api/user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

