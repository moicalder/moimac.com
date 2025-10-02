'use client'

import React, { useEffect, useState } from 'react'

interface LeaderboardEntry {
  username: string
  avatar_url: string | null
  sessions_played: number
  best_score: number
  avg_score: number
  total_score: number
}

interface Session {
  id: number
  score: number
  high_score: number
  created_at: string
}

export default function SnakeLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [userSessions, setUserSessions] = useState<Session[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const timestamp = new Date().getTime()
      const url = `/api/snake/leaderboard?_t=${timestamp}`
      
      const response = await fetch(url, {
        cache: 'no-store',
        next: { revalidate: 0 },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Snake leaderboard data:', { count: data.leaderboard.length, timestamp: data.timestamp })
        setLeaderboard(data.leaderboard)
      }
    } catch (error) {
      console.error('Error fetching Snake leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserSessions = async (username: string) => {
    setLoadingSessions(true)
    try {
      const timestamp = new Date().getTime()
      const url = `/api/snake/user-sessions?username=${encodeURIComponent(username)}&_t=${timestamp}`
      
      const response = await fetch(url, {
        cache: 'no-store',
        next: { revalidate: 0 },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
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

  const toggleUserExpansion = (username: string) => {
    if (expandedUser === username) {
      setExpandedUser(null)
      setUserSessions([])
    } else {
      setExpandedUser(username)
      fetchUserSessions(username)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-8 text-gray-500">
          Loading leaderboard...
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        🏆 Snake Leaderboard
      </h2>

      {/* Leaderboard Table */}
      {leaderboard.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-2">🐍</div>
          <p>No one has played yet. Be the first!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Rank</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Player</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">Best Score</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">Avg Score</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">Total Score</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">Sessions</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <React.Fragment key={entry.username}>
                  <tr 
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      index < 3 ? 'bg-yellow-50' : ''
                    } ${expandedUser === entry.username ? 'bg-blue-50' : ''}`}
                  >
                    {/* Rank */}
                    <td className="p-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 
                          ? 'bg-yellow-400 text-yellow-900'
                          : index === 1
                            ? 'bg-gray-300 text-gray-700'
                            : index === 2
                              ? 'bg-orange-300 text-orange-900'
                              : 'bg-primary-100 text-primary-700'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>
                    </td>

                    {/* Player */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {entry.avatar_url ? (
                          <img
                            src={entry.avatar_url}
                            alt={entry.username}
                            className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-600 border-2 border-gray-200">
                            {entry.username[0].toUpperCase()}
                          </div>
                        )}
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
                        {Math.round(Number(entry.avg_score)).toLocaleString()}
                      </span>
                    </td>

                    {/* Total Score */}
                    <td className="p-3 text-right text-gray-700">
                      {entry.total_score.toLocaleString()}
                    </td>

                    {/* Sessions - clickable */}
                    <td className="p-3 text-right">
                      <button
                        onClick={() => toggleUserExpansion(entry.username)}
                        className="text-gray-700 hover:text-gray-900 font-medium flex items-center gap-1 ml-auto"
                      >
                        <span>{entry.sessions_played}</span>
                        <span className="text-gray-500 text-sm">
                          {expandedUser === entry.username ? '▼' : '▶'}
                        </span>
                      </button>
                    </td>
                  </tr>

                  {/* Expanded session details */}
                  {expandedUser === entry.username && (
                    <tr key={`${entry.username}-details`}>
                      <td colSpan={6} className="p-4 bg-gray-50">
                        {loadingSessions ? (
                          <div className="text-center py-4 text-gray-500">Loading sessions...</div>
                        ) : userSessions.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">No sessions found</div>
                        ) : (
                          <div className="space-y-2">
                            <h4 className="font-bold text-gray-700 mb-3">Session History</h4>
                            <div className="grid gap-2">
                              {userSessions.map((session, idx) => (
                                <div 
                                  key={session.id}
                                  className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between text-sm"
                                >
                                  <div className="flex items-center gap-4">
                                    <span className="text-gray-500">#{idx + 1}</span>
                                    <span className="text-gray-600">
                                      {new Date(session.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-6">
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500">Score</div>
                                      <div className="font-bold text-green-600">{session.score}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500">High Score</div>
                                      <div className="font-bold text-purple-600">{session.high_score}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Best Score:</strong> Highest score achieved</p>
          <p><strong>Avg Score:</strong> Average score across all games</p>
          <p><strong>Total Score:</strong> Sum of all game scores</p>
        </div>
      </div>
    </div>
  )
}

