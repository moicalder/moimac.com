'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'

interface PublicUser {
  username: string
  avatar_url: string | null
  total_games_played: number
  total_score: number
  created_at: string
}

export default function UserProfilePage() {
  const router = useRouter()
  const params = useParams()
  const { user: currentUser, authenticated } = usePrivy()
  const [user, setUser] = useState<PublicUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const username = params.username as string

  useEffect(() => {
    fetchUserProfile()
  }, [username])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${username}`)
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

  // Check if this is the current user's profile
  const isOwnProfile = authenticated && currentUser?.email?.address && user?.username

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
              The user @{username} doesn't exist or hasn't set up their profile yet.
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

        {/* Profile Header */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover border-4 border-primary-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center 
                           text-4xl font-bold text-primary-600 border-4 border-primary-200">
                {user.username[0].toUpperCase()}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                @{user.username}
              </h1>
              {isOwnProfile && (
                <div className="inline-block px-3 py-1 bg-primary-100 text-primary-700 
                             rounded-full text-sm font-medium mb-2">
                  This is you!
                </div>
              )}
              <p className="text-gray-600">
                Joined {joinDate}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary-50 p-6 rounded-lg text-center">
              <div className="text-sm text-primary-600 font-medium mb-1">Games Played</div>
              <div className="text-3xl font-bold text-primary-700">
                {user.total_games_played}
              </div>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <div className="text-sm text-purple-600 font-medium mb-1">Total Score</div>
              <div className="text-3xl font-bold text-purple-700">
                {user.total_score.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder for future content */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 Recent Activity</h2>
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">🎮</div>
            <p>Game history coming soon!</p>
          </div>
        </div>
      </div>
    </main>
  )
}

