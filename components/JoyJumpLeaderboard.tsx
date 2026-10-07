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
}

interface Session {
  id: number
  score: number
  high_score: number
  created_at: string
}

export default function JoyJumpLeaderboard({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [userSessions, setUserSessions] = useState<Session[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [open, setOpen] = useState(defaultOpen)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/joyjump/leaderboard?_t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data.leaderboard)
      }
    } catch (error) {
      console.error('Error fetching Joy Jump leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserSessions = async (username: string) => {
    setLoadingSessions(true)
    try {
      const response = await fetch(
        `/api/joyjump/user-sessions?username=${encodeURIComponent(username)}&_t=${Date.now()}`,
        { cache: 'no-store' }
      )
      if (response.ok) {
        const data = await response.json()
        setUserSessions(data.sessions)
      }
    } catch (error) {
      console.error('Error fetching Joy Jump sessions:', error)
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
        <h2 className="text-2xl font-bold text-gray-900">Joy Jump Leaderboard</h2>
        <span className="text-gray-500 text-lg" aria-hidden="true">
          {open ? '▼' : '▶'}
        </span>
      </div>

      {open && (loading ? (
        <div className="text-center py-8 text-gray-500">Loading leaderboard...</div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No one has jumped yet. Be the first!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Rank</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Player</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">Best Height</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">Average</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">Sessions</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <React.Fragment key={entry.username}>
                  <tr className={`border-b border-gray-100 hover:bg-gray-50 ${index < 3 ? 'bg-yellow-50' : ''} ${expandedUser === entry.username ? 'bg-blue-50' : ''}`}>
                    <td className="p-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900'
                          : index === 1 ? 'bg-gray-300 text-gray-700'
                            : index === 2 ? 'bg-orange-300 text-orange-900'
                              : 'bg-primary-100 text-primary-700'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar avatarUrl={entry.avatar_url} username={entry.username} size="sm" />
                        <span className="font-medium text-gray-900">{entry.username}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-green-600 font-bold text-lg">
                        {Number(entry.best_score).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 text-right text-blue-600 font-semibold">
                      {Math.round(Number(entry.avg_score)).toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => toggleUserExpansion(entry.username)}
                        className="text-gray-700 hover:text-gray-900 font-medium ml-auto"
                      >
                        {entry.sessions_played} {expandedUser === entry.username ? '▼' : '▶'}
                      </button>
                    </td>
                  </tr>
                  {expandedUser === entry.username && (
                    <tr>
                      <td colSpan={5} className="p-4 bg-gray-50">
                        {loadingSessions ? (
                          <div className="text-center py-4 text-gray-500">Loading sessions...</div>
                        ) : userSessions.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">No sessions found</div>
                        ) : (
                          <div className="space-y-2">
                            {userSessions.map((session) => (
                              <div key={session.id} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                  {new Date(session.created_at).toLocaleDateString()}
                                </span>
                                <span className="font-bold text-green-600">Height {session.score}</span>
                              </div>
                            ))}
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
      ))}
    </div>
  )
}
