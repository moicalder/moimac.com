'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { getBackgroundClass } from '@/lib/background-colors'

type BackgroundColorContextValue = {
  backgroundColor: string
  setBackgroundColor: (color: string) => void
}

const BackgroundColorContext = createContext<BackgroundColorContextValue>({
  backgroundColor: 'white',
  setBackgroundColor: () => {},
})

export function useBackgroundColor() {
  return useContext(BackgroundColorContext)
}

export function BackgroundColorProvider({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user } = usePrivy()
  const [backgroundColor, setBackgroundColorState] = useState('white')
  const pickedLocally = useRef(false)

  const setBackgroundColor = (color: string) => {
    pickedLocally.current = true
    setBackgroundColorState(color)
  }

  const userId = user?.id
  const loadedForUser = useRef<string | null>(null)

  useEffect(() => {
    if (loadedForUser.current !== (userId ?? null)) {
      loadedForUser.current = userId ?? null
      pickedLocally.current = false
    }
    if (!ready || !authenticated || !userId) return

    const email = user?.email?.address || user?.google?.email || `user-${userId}@example.com`
    let cancelled = false

    fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email }),
      cache: 'no-store',
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || pickedLocally.current) return
        setBackgroundColorState(data?.profile?.background_color || 'white')
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [ready, authenticated, userId, user?.email?.address, user?.google?.email])

  return (
    <BackgroundColorContext.Provider value={{ backgroundColor, setBackgroundColor }}>
      <div className={`min-h-screen bg-gradient-to-br ${getBackgroundClass(backgroundColor)}`}>
        {children}
      </div>
    </BackgroundColorContext.Provider>
  )
}
