'use client'

import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'

/**
 * Example component showing how to update username with availability checking
 * Use this as a reference when building your profile editing UI
 */
export default function UsernameExample() {
  const { user } = usePrivy()
  const [username, setUsername] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Check username availability as user types
  const checkUsername = async (value: string) => {
    if (!value || value.length < 3) {
      setAvailable(null)
      return
    }

    setChecking(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/username/check?username=${encodeURIComponent(value)}&userId=${user?.id}`
      )
      const data = await response.json()

      if (response.ok) {
        setAvailable(data.available)
      } else {
        setError(data.error)
        setAvailable(false)
      }
    } catch (err) {
      setError('Error checking username')
      setAvailable(false)
    } finally {
      setChecking(false)
    }
  }

  // Update username
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!available) {
      setError('Please choose an available username')
      return
    }

    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({ username }),
      })

      if (response.ok) {
        setSuccess(true)
        setError(null)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const data = await response.json()
        setError(data.error)
      }
    } catch (err) {
      setError('Error updating username')
    }
  }

  return (
    <div className="card max-w-md">
      <h2 className="text-xl font-bold mb-4">Update Username</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              const value = e.target.value
              setUsername(value)
              checkUsername(value)
            }}
            placeholder="Enter username"
            className="input-field"
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_-]+"
          />
          
          {/* Validation feedback */}
          <div className="mt-2 text-sm">
            {checking && (
              <p className="text-gray-500">Checking availability...</p>
            )}
            {!checking && available === true && (
              <p className="text-green-600">✓ Username available!</p>
            )}
            {!checking && available === false && !error && (
              <p className="text-red-600">✗ Username already taken</p>
            )}
            {error && (
              <p className="text-red-600">{error}</p>
            )}
            {success && (
              <p className="text-green-600">✓ Username updated!</p>
            )}
          </div>

          <p className="mt-1 text-xs text-gray-500">
            3-20 characters, letters, numbers, underscores, or hyphens
          </p>
        </div>

        <button
          type="submit"
          disabled={!available || checking}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Update Username
        </button>
      </form>
    </div>
  )
}

