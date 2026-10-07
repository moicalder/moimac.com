'use client'

import { useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useParams, useRouter } from 'next/navigation'
import MathModeLeaderboard from '@/components/MathModeLeaderboard'
import SnakeLeaderboard from '@/components/SnakeLeaderboard'
import TypeMasterLeaderboard from '@/components/TypeMasterLeaderboard'
import StarFighterLeaderboard from '@/components/StarFighterLeaderboard'
import JoyJumpLeaderboard from '@/components/JoyJumpLeaderboard'
import { leaderboardGames, type LeaderboardGameId } from '@/lib/leaderboard-games'

function isLeaderboardGame(id: string): id is LeaderboardGameId {
  return leaderboardGames.some((game) => game.id === id)
}

function GameLeaderboard({ game }: { game: LeaderboardGameId }) {
  if (game === 'mathmode') return <MathModeLeaderboard defaultOpen />
  if (game === 'snake') return <SnakeLeaderboard defaultOpen />
  if (game === 'typemaster') return <TypeMasterLeaderboard defaultOpen />
  if (game === 'starfighter') return <StarFighterLeaderboard defaultOpen />
  return <JoyJumpLeaderboard defaultOpen />
}

export default function LeaderboardGamePage() {
  const router = useRouter()
  const params = useParams<{ game: string }>()
  const { ready, authenticated } = usePrivy()
  const gameId = params.game
  const game = leaderboardGames.find((entry) => entry.id === gameId)

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
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button onClick={() => router.push('/leaderboards')} className="btn-secondary">
            ← All Leaderboards
          </button>
        </div>

        {game && isLeaderboardGame(game.id) ? (
          <GameLeaderboard game={game.id} />
        ) : (
          <div className="card text-center">
            <p className="text-gray-700 mb-4">That leaderboard does not exist.</p>
            <button onClick={() => router.push('/leaderboards')} className="btn-primary">
              Back to Leaderboards
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
