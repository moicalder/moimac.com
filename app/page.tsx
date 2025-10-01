'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import ProfileEditor from '@/components/ProfileEditor'

interface UserProfile {
  username: string | null
  avatar_url: string | null
  total_games_played: number
  total_score: number
}

export default function Home() {
  const { ready, authenticated, user, login, logout } = usePrivy()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch or create user profile when authenticated
  useEffect(() => {
    if (authenticated && user) {
      initializeUser()
    }
  }, [authenticated, user])

  const initializeUser = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      // Get user email from Privy
      const email = user.email?.address || user.google?.email || `user-${user.id}@example.com`
      
      // Get wallet address if available (Privy auto-creates embedded wallet)
      const walletAddress = user.wallet?.address || null
      
      // Create or get user profile
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: email,
          walletAddress: walletAddress,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
      }
    } catch (error) {
      console.error('Error initializing user:', error)
    } finally {
      setLoading(false)
    }
  }

  // Games data - placeholder for now
  type GameStatus = 'available' | 'coming-soon'
  
  const games: Array<{
    id: string
    name: string
    description: string
    icon: string
    status: GameStatus
  }> = [
    {
      id: 'mathmode',
      name: 'MathMode',
      description: 'Practice math with addition, subtraction, multiplication, and division',
      icon: '🔢',
      status: 'coming-soon',
    },
    {
      id: 'snake',
      name: 'Snake',
      description: 'Classic snake game with modern twist',
      icon: '🐍',
      status: 'coming-soon',
    },
    {
      id: 'runner',
      name: 'Pixel Runner',
      description: 'Pixel-perfect retro platformer',
      icon: '🎮',
      status: 'coming-soon',
    },
  ]

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </main>
    )
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="card text-center max-w-md w-full">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎮 MoiMac Games
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your gaming hub
          </p>
          <div className="space-y-4">
            <p className="text-gray-700">
              Sign in to play games, compete on leaderboards, and track your progress across all games.
            </p>
            <button onClick={login} className="btn-primary w-full">
              Sign In with Email
            </button>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-4">Available Games</h2>
            <div className="grid grid-cols-3 gap-2 text-center">
              {games.map((game) => (
                <div key={game.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-1">{game.icon}</div>
                  <div className="text-xs font-medium text-gray-700">{game.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Sign Out */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🎮 MoiMac Games
          </h1>
          <button onClick={logout} className="btn-secondary">
            Sign Out
          </button>
        </div>

        {/* Profile Section */}
        <div className="mb-6">
          <ProfileEditor 
            profile={profile} 
            onProfileUpdate={initializeUser}
          />
        </div>

        {/* Stats */}
        {profile && (
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary-50 p-4 rounded-lg">
                <div className="text-sm text-primary-600 font-medium">Games Played</div>
                <div className="text-2xl font-bold text-primary-700">
                  {profile.total_games_played}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Total Score</div>
                <div className="text-2xl font-bold text-purple-700">
                  {profile.total_score.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Games Grid */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🎮 Choose a Game</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <div
              key={game.id}
              className={`game-card ${
                game.status === 'coming-soon' ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              onClick={() => {
                if (game.status === 'available') {
                  window.location.href = `/games/${game.id}`
                }
              }}
            >
              <div className="text-5xl mb-4">{game.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{game.name}</h3>
              <p className="text-gray-600 mb-4">{game.description}</p>
              {game.status === 'coming-soon' ? (
                <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                  Coming Soon
                </div>
              ) : (
                <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  Play Now
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Placeholder for Global Leaderboard */}
        <div className="card mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🏆 Global Leaderboard</h2>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-gray-500 text-lg">
              Play games to start competing on the leaderboard!
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

