'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from './Avatar'

interface PublicUser {
  username: string
  avatar_url: string | null
  total_games_played: number
  total_score: number
  created_at: string
}

export default function UserDirectory() {
  const router = useRouter()
  const [users, setUsers] = useState<PublicUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">👥 Player Directory</h2>
        <div className="text-center py-8 text-gray-500">Loading players...</div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">👥 Player Directory</h2>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🎮</div>
          <p>No players yet. Be the first to set a username!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        👥 Player Directory
        <span className="text-sm font-normal text-gray-500 ml-2">
          ({users.length} {users.length === 1 ? 'player' : 'players'})
        </span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <button
            key={user.username}
            onClick={() => router.push(`/users/${user.username}`)}
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 
                     hover:border-primary-400 hover:bg-primary-50 transition-all duration-200
                     text-left group"
          >
            {/* Avatar */}
            <Avatar 
              avatarUrl={user.avatar_url}
              username={user.username}
              size="md"
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                {user.username}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span>🎮 {user.total_games_played}</span>
                <span>•</span>
                <span>🏆 {user.total_score.toLocaleString()}</span>
              </div>
            </div>

            {/* Arrow */}
            <div className="text-gray-400 group-hover:text-primary-500 transition-colors">
              →
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

