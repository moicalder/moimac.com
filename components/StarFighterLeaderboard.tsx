'use client'

import React, { useEffect, useState } from 'react'
import Avatar from './Avatar'

interface LeaderboardEntry {
  username: string
  avatar_url: string | null
  sessions_played: number
  best_score: number
  avg_score: number
  total_score: number
  total_particles_destroyed: number
}

interface Session {
  id: number
  score: number
  high_score: number
  particles_destroyed: number
  created_at: string
}

export default function StarFighterLeaderboard({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [userSessions, setUserSessions] = useState<Session[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [open, setOpen] = useState(defaultOpen)

  useEffect(() => {
    if (window.location.hash === '#starfighter-leaderboard') {
      setOpen(true)
    }
  }, [])

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const timestamp = Date.now()
      const response = await fetch(`/api/starfighter/leaderboard?_t=${timestamp}`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data.leaderboard)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserSessions = async (username: string) => {
    setLoadingSessions(true)
    try {
      const timestamp = Date.now()
      const response = await fetch(`/api/starfighter/user-sessions?username=${username}&_t=${timestamp}`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        setUserSessions(data.sessions)
      }
    } catch (error) {
      console.error('Error fetching user sessions:', error)
    } finally {
      setLoadingSessions(false)
    }
  }

  const toggleUserSessions = (username: string) => {
    if (expandedUser === username) {
      setExpandedUser(null)
      setUserSessions([])
    } else {
      setExpandedUser(username)
      fetchUserSessions(username)
    }
  }

  return (
    <div className="card">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setOpen((value) => !value)
          }
        }}
        className={`flex items-center justify-between gap-4 cursor-pointer select-none -mx-8 px-8 -mt-8 pt-8 ${open ? 'mb-4' : '-mb-8 pb-8'}`}
      >
        <h2 className="text-2xl font-bold text-gray-900">🚀 Star Fighter Leaderboard</h2>
        <span className="text-gray-500 text-lg" aria-hidden="true">
          {open ? '▼' : '▶'}
        </span>
      </div>

      {open && (loading ? (
        <div className="text-center py-8 text-gray-500">Loading leaderboard...</div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🚀</div>
          <p>No scores yet. Be the first to play!</p>
        </div>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left p-3 text-gray-600 font-semibold">Rank</th>
              <th className="text-left p-3 text-gray-600 font-semibold">Player</th>
              <th className="text-right p-3 text-gray-600 font-semibold">Best Score</th>
              <th className="text-right p-3 text-gray-600 font-semibold">Avg Score</th>
              <th className="text-right p-3 text-gray-600 font-semibold">Total Score</th>
              <th className="text-right p-3 text-gray-600 font-semibold">Particles</th>
              <th className="text-center p-3 text-gray-600 font-semibold">Sessions</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <React.Fragment key={entry.username}>
                <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  expandedUser === entry.username ? 'bg-primary-50' : ''
                }`}>
                  {/* Rank */}
                  <td className="p-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-primary-100 text-primary-700'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </div>
                  </td>

                  {/* Player */}
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Avatar 
                        avatarUrl={entry.avatar_url}
                        username={entry.username}
                        size="sm"
                      />
                      <span className="font-medium text-gray-900">{entry.username}</span>
                    </div>
                  </td>

                  {/* Best Score */}
                  <td className="p-3 text-right">
                    <span className="text-green-600 font-bold text-lg">
                      {entry.best_score.toLocaleString()}
                    </span>
                  </td>

                  {/* Average Score */}
                  <td className="p-3 text-right">
                    <span className="text-blue-600 font-semibold">
                      {Number(entry.avg_score).toLocaleString()}
                    </span>
                  </td>

                  {/* Total Score */}
                  <td className="p-3 text-right">
                    <span className="text-purple-600 font-semibold">
                      {Number(entry.total_score).toLocaleString()}
                    </span>
                  </td>

                  {/* Particles */}
                  <td className="p-3 text-right">
                    <span className="text-gray-700">
                      {Number(entry.total_particles_destroyed).toLocaleString()}
                    </span>
                  </td>

                  {/* Sessions */}
                  <td className="p-3 text-center">
                    <button
                      onClick={() => toggleUserSessions(entry.username)}
                      className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                      <span>{entry.sessions_played}</span>
                      <span className="ml-1 text-gray-500">
                        {expandedUser === entry.username ? '▲' : '▼'}
                      </span>
                    </button>
                  </td>
                </tr>

                {/* Expanded Sessions */}
                {expandedUser === entry.username && (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <div className="bg-gray-50 p-4 border-b border-gray-200">
                        {loadingSessions ? (
                          <div className="text-center py-4 text-gray-500">Loading sessions...</div>
                        ) : userSessions.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">No sessions found</div>
                        ) : (
                          <div className="space-y-2">
                            <h3 className="font-semibold text-gray-700 mb-3">Recent Sessions</h3>
                            {userSessions.map((session) => (
                              <div
                                key={session.id}
                                className="bg-white rounded-lg p-3 flex items-center justify-between text-sm border border-gray-200"
                              >
                                <div className="flex items-center gap-4">
                                  <span className="text-gray-500">
                                    {new Date(session.created_at).toLocaleDateString()}
                                  </span>
                                  <span className="font-semibold text-primary-600">
                                    Score: {session.score.toLocaleString()}
                                  </span>
                                  <span className="text-gray-600">
                                    Particles: {session.particles_destroyed}
                                  </span>
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {new Date(session.created_at).toLocaleTimeString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      ))}
    </div>
  )
}

