'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import InventoryManager from '../../../components/InventoryManager'
import Avatar from '../../../components/Avatar'

interface PublicUser {
  username: string
  avatar_url: string | null
  total_games_played: number
  total_score: number
  created_at: string
}

interface CurrentUserProfile {
  username: string | null
}

export default function UserProfilePage() {
  const router = useRouter()
  const params = useParams()
  const { user: currentUser, authenticated } = usePrivy()
  const [user, setUser] = useState<PublicUser | null>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<CurrentUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const username = params.username as string

  useEffect(() => {
    fetchUserProfile()
    if (authenticated && currentUser?.id) {
      fetchCurrentUserProfile()
    }
  }, [username, authenticated, currentUser?.id, refreshKey])

  const fetchUserProfile = async () => {
    try {
      const timestamp = Date.now()
      const randomBuster = Math.random().toString(36)
      const response = await fetch(`/api/users/${username}?_t=${timestamp}&_r=${randomBuster}&_k=${refreshKey}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else if (response.status === 404) {
        setNotFound(true)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentUserProfile = async () => {
    if (!currentUser?.id) return
    
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          email: currentUser.email?.address || `user-${currentUser.id}@example.com`,
        }),
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        setCurrentUserProfile(data.profile)
      }
    } catch (error) {
      console.error('Error fetching current user profile:', error)
    }
  }

  // Check if this is the current user's profile
  const isOwnProfile = authenticated && 
                       currentUserProfile?.username && 
                       user?.username &&
                       currentUserProfile.username.toLowerCase() === user.username.toLowerCase()

  // Memoize the refresh callback
  const handleProfileUpdate = useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [refreshKey])

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </main>
    )
  }

  if (notFound || !user) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="btn-secondary mb-6"
          >
            ← Back to Home
          </button>
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
            <p className="text-gray-600 mb-6">
              The user "{username}" doesn't exist or hasn't set up their profile yet.
            </p>
            <button
              onClick={() => router.push('/')}
              className="btn-primary"
            >
              Go Home
            </button>
          </div>
        </div>
      </main>
    )
  }

  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="btn-secondary mb-6"
        >
          ← Back to Home
        </button>

        {/* Page Header */}
        <div className="mb-6 flex items-center gap-4">
          <Avatar 
            key={`avatar-${user.avatar_url}`}
            avatarUrl={user.avatar_url} 
            username={user.username}
            size="md"
          />
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {user.username}'s Inventory
            </h1>
            <p className="text-gray-600">
              {isOwnProfile 
                ? 'Manage your characters and vehicles' 
                : `View ${user.username}'s collection`}
            </p>
          </div>
        </div>

        {/* Inventory Manager */}
        {isOwnProfile ? (
          <InventoryManager onProfileUpdate={handleProfileUpdate} />
        ) : (
          <div className="card text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">🔒</div>
            <p>This user's inventory is private</p>
          </div>
        )}
      </div>
    </main>
  )
}

