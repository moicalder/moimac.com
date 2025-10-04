'use client'

import React, { useEffect, useState } from 'react'

type LessonId = 'home-row' | 'top-row' | 'bottom-row' | 'numbers' | 'all-keys' | 'global' | 'custom'

interface LeaderboardEntry {
  username: string
  avatar_url: string | null
  sessions_played: number
  best_wpm: number
  avg_wpm: number
  avg_accuracy: number
  best_accuracy: number
  total_keys_typed: number
  total_mistakes: number
  lessons_completed?: number
  mastery_score: number
}

interface Session {
  id: number
  lesson_id: string
  wpm: number
  accuracy: number
  total_keys: number
  correct_keys: number
  mistakes: number
  duration_seconds: number
  words_completed: number
  mastery_score: number
  created_at: string
  customListName?: string | null
}

const LESSONS = [
  { id: 'global' as LessonId, name: 'All Lessons', icon: '🏆' },
  { id: 'custom' as LessonId, name: 'Custom Lists', icon: '📚' },
  { id: 'home-row' as LessonId, name: 'Home Row', icon: '🏠' },
  { id: 'top-row' as LessonId, name: 'Top Row', icon: '⬆️' },
  { id: 'bottom-row' as LessonId, name: 'Bottom Row', icon: '⬇️' },
  { id: 'numbers' as LessonId, name: 'Numbers', icon: '🔢' },
  { id: 'all-keys' as LessonId, name: 'All Keys', icon: '⌨️' },
]

export default function TypeMasterLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLesson, setSelectedLesson] = useState<LessonId>('global')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [userSessions, setUserSessions] = useState<Session[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)

  useEffect(() => {
    fetchLeaderboard(selectedLesson)
    setExpandedUser(null)
    setUserSessions([])
  }, [selectedLesson])

  const fetchLeaderboard = async (lesson: LessonId) => {
    setLoading(true)
    try {
      const timestamp = new Date().getTime()
      const url = lesson === 'global'
        ? `/api/typemaster/leaderboard?_t=${timestamp}`
        : lesson === 'custom'
        ? `/api/typemaster/leaderboard?lesson=custom&_t=${timestamp}`
        : `/api/typemaster/leaderboard?lesson=${lesson}&_t=${timestamp}`

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
        setLeaderboard(data.leaderboard)
      }
    } catch (error) {
      console.error('Error fetching TypeMaster leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserSessions = async (username: string) => {
    setLoadingSessions(true)
    try {
      const lesson = selectedLesson === 'global' ? '' :
                    selectedLesson === 'custom' ? '&lesson=custom' :
                    `&lesson=${selectedLesson}`
      const timestamp = new Date().getTime()
      const url = `/api/typemaster/user-sessions?username=${encodeURIComponent(username)}${lesson}&_t=${timestamp}`

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

  const getLessonName = (lessonId: string) => {
    return LESSONS.find(l => l.id === lessonId)?.name || lessonId
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
        ⌨️ TypeMaster Leaderboard
      </h2>

      {/* Lesson Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {LESSONS.map(lesson => (
          <button
            key={lesson.id}
            onClick={() => setSelectedLesson(lesson.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedLesson === lesson.id
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {lesson.icon} {lesson.name}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      {leaderboard.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-2">⌨️</div>
          <p>No one has completed this lesson yet. Be the first!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Rank</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Player</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">Best WPM</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">Avg WPM</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">Accuracy</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">Mastery</th>
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

                    {/* Best WPM */}
                    <td className="p-3 text-right">
                      <span className="text-blue-600 font-bold text-lg">
                        {entry.best_wpm}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">WPM</span>
                    </td>

                    {/* Average WPM */}
                    <td className="p-3 text-right">
                      <span className="text-gray-700 font-semibold">
                        {Math.round(Number(entry.avg_wpm))}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">avg</span>
                    </td>

                    {/* Accuracy */}
                    <td className="p-3 text-right">
                      <span className={`font-bold ${
                        Number(entry.avg_accuracy) >= 95 ? 'text-green-600' :
                        Number(entry.avg_accuracy) >= 85 ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {Math.round(Number(entry.avg_accuracy))}%
                      </span>
                    </td>

                    {/* Mastery Score */}
                    <td className="p-3 text-right">
                      <span className="text-purple-600 font-bold">
                        {Math.round(Number(entry.mastery_score))}
                      </span>
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
                                    <span className="font-semibold text-primary-600">
                                      {session.lesson_id.startsWith('custom-')
                                        ? (session.customListName || session.lesson_id.replace('custom-', ''))
                                        : getLessonName(session.lesson_id)
                                      }
                                    </span>
                                    <span className="text-gray-600">
                                      {new Date(session.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-6">
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500">WPM</div>
                                      <div className="font-bold text-blue-600">{session.wpm}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500">Accuracy</div>
                                      <div className={`font-bold ${
                                        Number(session.accuracy) >= 95 ? 'text-green-600' :
                                        Number(session.accuracy) >= 85 ? 'text-blue-600' :
                                        'text-gray-600'
                                      }`}>
                                        {Math.round(Number(session.accuracy))}%
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500">Mistakes</div>
                                      <div className="font-bold text-red-600">{session.mistakes}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500">Time</div>
                                      <div className="font-bold text-gray-700">{session.duration_seconds}s</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500">Mastery</div>
                                      <div className="font-bold text-purple-600">{Math.round(Number(session.mastery_score))}</div>
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
          <p><strong>WPM:</strong> Words Per Minute (higher is better)</p>
          <p><strong>Accuracy:</strong> Percentage of keys typed correctly</p>
          <p><strong>Mastery Score:</strong> WPM × Accuracy (combined skill metric)</p>
        </div>
      </div>
    </div>
  )
}

