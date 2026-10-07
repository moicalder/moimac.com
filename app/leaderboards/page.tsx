'use client'

import { useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { leaderboardGames } from '@/lib/leaderboard-games'

export default function LeaderboardsPage() {
  const router = useRouter()
  const { ready, authenticated } = usePrivy()

  useEffect(() => {
    if (ready && !authenticated) router.push('/')
  }, [ready, authenticated, router])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!authenticated) return null

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.push('/')} className="btn-secondary">
            ← Back to Home
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Leaderboards</h1>
        </div>

        <div className="space-y-4">
          {leaderboardGames.map((game) => (
            <button
              key={game.id}
              type="button"
              onClick={() => router.push(`/leaderboards/${game.id}`)}
              className="card w-full flex items-center justify-between text-left cursor-pointer hover:border-primary-300"
            >
              <span className="flex items-center gap-4">
                <span className="text-3xl">{game.icon}</span>
                <span className="text-xl font-bold text-gray-900">{game.name}</span>
              </span>
              <span className="text-gray-400 text-2xl" aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
