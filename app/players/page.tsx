'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import UserDirectory from '@/components/UserDirectory'

export default function PlayersPage() {
  const router = useRouter()
  const { ready, authenticated, user } = usePrivy()
  const [profile, setProfile] = useState<{ username: string | null; avatar_url: string | null } | null>(null)

  useEffect(() => {
    if (ready && !authenticated) router.push('/')
  }, [ready, authenticated, router])

  useEffect(() => {
    if (!user?.id) return
    const email = user.email?.address || user.google?.email || `user-${user.id}@example.com`
    fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, email }),
      cache: 'no-store',
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.profile) setProfile(data.profile)
      })
      .catch((error) => {
        console.error('Error loading profile:', error)
      })
  }, [user])

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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.push('/')} className="btn-secondary">
            ← Back to Home
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Player Directory</h1>
        </div>
        <UserDirectory currentUserProfile={profile} />
      </div>
    </main>
  )
}
