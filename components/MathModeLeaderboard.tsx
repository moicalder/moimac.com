'use client'

import React, { useEffect, useState } from 'react'

type Operator = '+' | '-' | '×' | '÷' | 'global'

interface LeaderboardEntry {
  username: string
  avatar_url: string | null
  sessions_played: number
  total_questions: number
  total_correct: number
  total_incorrect: number
  avg_difficulty: number
  accuracy_percentage: number
  operators_played?: number  // Only for global view
}

interface Session {
  id: number
  operator: string
  total_questions: number
  correct_answers: number
  incorrect_answers: number
  difficulty: number
  digits1: number | null
  digits2: number | null
  accuracy_percentage: number
  created_at: string
}

interface MathModeLeaderboardProps {
  operator?: Operator
}

export default function MathModeLeaderboard({ operator = 'global' }: MathModeLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOperator, setSelectedOperator] = useState<Operator>(operator)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [userSessions, setUserSessions] = useState<Session[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)

  useEffect(() => {
    fetchLeaderboard(selectedOperator)
    // Auto-collapse when operator changes
    setExpandedUser(null)
    setUserSessions([])
  }, [selectedOperator])

  const fetchLeaderboard = async (op: Operator) => {
    setLoading(true)
    try {
      // Add timestamp to bust cache
      const timestamp = new Date().getTime()
      const url = op === 'global' 
        ? `/api/mathmode/leaderboard?_t=${timestamp}`
        : `/api/mathmode/leaderboard?operator=${encodeURIComponent(op)}&_t=${timestamp}`
      
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
        console.log('Leaderboard fetch:', { 
          operator: op, 
          entries: data.leaderboard.length, 
          timestamp: data.timestamp,
          firstEntry: data.leaderboard[0] 
        })
        setLeaderboard(data.leaderboard)
      } else {
        console.error('Leaderboard fetch failed:', response.status)
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
      const op = selectedOperator === 'global' ? '' : `&operator=${encodeURIComponent(selectedOperator)}`
      const timestamp = new Date().getTime()
      const url = `/api/mathmode/user-sessions?username=${encodeURIComponent(username)}${op}&_t=${timestamp}`
      
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

  const operators: Array<{ value: Operator; label: string; icon: string }> = [
    { value: 'global', label: 'All Operators', icon: '🌍' },
    { value: '+', label: 'Addition', icon: '➕' },
    { value: '-', label: 'Subtraction', icon: '➖' },
    { value: '×', label: 'Multiplication', icon: '✖️' },
    { value: '÷', label: 'Division', icon: '➗' },
  ]

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
        🏆 MathMode Leaderboard
      </h2>

      {/* Operator Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {operators.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => setSelectedOperator(value)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedOperator === value
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      {leaderboard.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-2">🎯</div>
          <p>No one has played yet. Be the first!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Rank</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Player</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">Accuracy</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">Correct</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">Total Qs</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">Avg Diff</th>
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

                    {/* Accuracy */}
                    <td className="p-3 text-right">
                      <span className={`font-bold ${
                        Number(entry.accuracy_percentage) >= 90 ? 'text-green-600' :
                        Number(entry.accuracy_percentage) >= 70 ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {entry.accuracy_percentage}%
                      </span>
                    </td>

                    {/* Correct Answers */}
                    <td className="p-3 text-right">
                      <span className="text-green-600 font-semibold">
                        {entry.total_correct.toLocaleString()}
                      </span>
                    </td>

                    {/* Total Questions */}
                    <td className="p-3 text-right text-gray-700">
                      {entry.total_questions.toLocaleString()}
                    </td>

                    {/* Average Difficulty */}
                    <td className="p-3 text-right">
                      <span className="text-purple-600 font-medium">
                        {Number(entry.avg_difficulty).toFixed(1)}
                      </span>
                    </td>

                    {/* Sessions - now clickable */}
                    <td className="p-3 text-right">
                      <button
                        onClick={() => toggleUserExpansion(entry.username)}
                        className="text-blue-600 hover:text-blue-800 font-medium underline"
                      >
                        {entry.sessions_played} {expandedUser === entry.username ? '▼' : '▶'}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded session details */}
                  {expandedUser === entry.username && (
                    <tr key={`${entry.username}-details`}>
                      <td colSpan={7} className="p-4 bg-gray-50">
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
                                    <span className="font-bold text-lg">{session.operator}</span>
                                    <span className="text-gray-600">
                                      {new Date(session.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-6">
                                    {session.digits1 && session.digits2 && (
                                      <div className="text-center">
                                        <div className="text-xs text-gray-500">Digits</div>
                                        <div className="font-bold text-indigo-600">{session.digits1}×{session.digits2}</div>
                                      </div>
                                    )}
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500">Difficulty</div>
                                      <div className="font-bold text-purple-600">{session.difficulty}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500">Questions</div>
                                      <div className="font-bold text-gray-700">{session.total_questions}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500">Correct</div>
                                      <div className="font-bold text-green-600">{session.correct_answers}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500">Wrong</div>
                                      <div className="font-bold text-red-600">{session.incorrect_answers}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500">Accuracy</div>
                                      <div className={`font-bold ${
                                        Number(session.accuracy_percentage) >= 90 ? 'text-green-600' :
                                        Number(session.accuracy_percentage) >= 70 ? 'text-blue-600' :
                                        'text-gray-600'
                                      }`}>
                                        {session.accuracy_percentage}%
                                      </div>
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
          <p><strong>Accuracy:</strong> Percentage of correct answers</p>
          <p><strong>Avg Diff:</strong> Average difficulty (sum of digits per problem)</p>
          <p><strong>Sessions:</strong> Number of practice sessions completed</p>
        </div>
      </div>
    </div>
  )
}

