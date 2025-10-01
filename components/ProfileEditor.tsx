'use client'

import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'

interface ProfileEditorProps {
  profile: {
    username: string | null
    avatar_url: string | null
  } | null
  onProfileUpdate: () => void
}

export default function ProfileEditor({ profile, onProfileUpdate }: ProfileEditorProps) {
  const { user } = usePrivy()
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '')
      setAvatarUrl(profile.avatar_url || '')
    }
  }, [profile])

  // Check username availability with debouncing
  useEffect(() => {
    if (!isEditing || !username || username === profile?.username) {
      setAvailable(null)
      return
    }

    const timeoutId = setTimeout(() => {
      checkUsername(username)
    }, 500) // Debounce 500ms

    return () => clearTimeout(timeoutId)
  }, [username, isEditing])

  const checkUsername = async (value: string) => {
    if (value.length < 3) {
      setAvailable(null)
      return
    }

    // Check format first
    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    if (!usernameRegex.test(value)) {
      setError('Only letters, numbers, underscores, and hyphens allowed')
      setAvailable(false)
      return
    }

    setChecking(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/username/check?username=${encodeURIComponent(value)}&userId=${user?.id}`,
        {
          cache: 'no-store',
        }
      )
      const data = await response.json()

      if (response.ok) {
        setAvailable(data.available)
        if (!data.available) {
          setError('Username already taken')
        }
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

  const handleSave = async () => {
    if (!user?.id) return

    // Validate username if changed
    if (username !== profile?.username) {
      if (!available) {
        setError('Please choose an available username')
        return
      }
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          username: username || null,
          avatar_url: avatarUrl || null,
        }),
        cache: 'no-store',
      })

      if (response.ok) {
        setIsEditing(false)
        onProfileUpdate()
      } else {
        const data = await response.json()
        setError(data.error)
      }
    } catch (err) {
      setError('Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setUsername(profile?.username || '')
    setAvatarUrl(profile?.avatar_url || '')
    setIsEditing(false)
    setError(null)
    setAvailable(null)
  }

  if (!isEditing) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-2 border-primary-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-600">
                {profile?.username?.[0]?.toUpperCase() || user?.email?.address?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {profile?.username ? (
              <>
                <div className="text-lg font-semibold text-gray-900">{profile.username}</div>
                <div className="text-sm text-gray-500 truncate">{user?.email?.address}</div>
              </>
            ) : (
              <>
                <div className="text-gray-500 text-sm">No username set</div>
                <div className="text-xs text-gray-400 truncate">{user?.email?.address}</div>
              </>
            )}
          </div>

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(true)}
            className="btn-secondary text-sm px-4 py-2"
          >
            {profile?.username ? 'Edit' : 'Add Username'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Profile</h3>

      <div className="space-y-4">
        {/* Avatar URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Picture URL
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            className="input-field"
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter a URL to an image (e.g., from Imgur, GitHub, etc.)
          </p>
          {avatarUrl && (
            <div className="mt-2">
              <img
                src={avatarUrl}
                alt="Preview"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="username"
            className="input-field"
            minLength={3}
            maxLength={20}
          />

          {/* Validation feedback */}
          <div className="mt-2 text-sm min-h-[20px]">
            {checking && (
              <p className="text-gray-500">Checking availability...</p>
            )}
            {!checking && username !== profile?.username && username.length >= 3 && (
              <>
                {available === true && (
                  <p className="text-green-600">✓ Username available!</p>
                )}
                {available === false && (
                  <p className="text-red-600">✗ {error || 'Username not available'}</p>
                )}
              </>
            )}
            {error && available !== false && (
              <p className="text-red-600">{error}</p>
            )}
          </div>

          <p className="mt-1 text-xs text-gray-500">
            3-20 characters, letters, numbers, underscores, or hyphens. Case-insensitive.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleCancel}
            className="btn-secondary flex-1"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={
              saving ||
              checking ||
              (username !== profile?.username && !available) ||
              (username === profile?.username && avatarUrl === profile?.avatar_url)
            }
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

