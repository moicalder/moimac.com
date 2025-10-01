/**
 * Server-side authentication utilities for Privy
 * Uses PRIVY_APP_SECRET to verify tokens
 */

import { headers } from 'next/headers'

export interface PrivyUser {
  id: string
  email?: string
  createdAt: number
}

/**
 * Verify Privy access token (simplified version)
 * In production, you'd use Privy's SDK or verify the JWT properly
 * 
 * For now, this is a placeholder that accepts the user ID from headers
 * TODO: Implement proper JWT verification with PRIVY_APP_SECRET
 */
export async function verifyPrivyToken(token?: string): Promise<PrivyUser | null> {
  // For development, we'll accept a simple header
  // In production, verify the JWT token here using PRIVY_APP_SECRET
  
  if (!token) {
    return null
  }

  // TODO: Implement JWT verification
  // const secret = process.env.PRIVY_APP_SECRET
  // Verify token signature, expiry, etc.
  
  return null
}

/**
 * Get authenticated user from request headers
 * Call this in API routes to get the current user
 */
export async function getAuthenticatedUser(): Promise<PrivyUser | null> {
  const headersList = headers()
  const authHeader = headersList.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  return verifyPrivyToken(token)
}

/**
 * Check if app secret is configured
 */
export function isAuthConfigured(): boolean {
  return !!process.env.PRIVY_APP_SECRET
}

