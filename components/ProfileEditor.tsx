'use client'

import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import Avatar from './Avatar'

interface ProfileEditorProps {
  profile: {
    username: string | null
    avatar_url: string | null
    background_color?: string | null
  } | null
  onProfileUpdate: () => void
  onBackgroundColorChange?: (color: string) => void
}

export default function ProfileEditor({ profile, onProfileUpdate, onBackgroundColorChange }: ProfileEditorProps) {
  const { user } = usePrivy()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [backgroundColor, setBackgroundColor] = useState('white')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const backgroundColors = [
    { value: 'white', label: 'White', class: 'from-gray-50 via-white to-blue-50' },
    { value: 'black', label: 'Black', class: 'from-gray-900 via-black to-gray-900' },
    { value: 'brown', label: 'Brown', class: 'from-amber-900 via-amber-950 to-amber-900' },
    { value: 'grey', label: 'Grey', class: 'from-gray-400 via-gray-500 to-gray-400' },
    { value: 'red', label: 'Red', class: 'from-red-300 via-red-400 to-red-300' },
    { value: 'orange', label: 'Orange', class: 'from-orange-300 via-orange-400 to-orange-300' },
    { value: 'yellow', label: 'Yellow', class: 'from-yellow-200 via-yellow-300 to-yellow-200' },
    { value: 'green', label: 'Green', class: 'from-green-300 via-green-400 to-green-300' },
    { value: 'blue', label: 'Blue', class: 'from-blue-300 via-blue-400 to-blue-300' },
    { value: 'purple', label: 'Purple', class: 'from-purple-300 via-purple-400 to-purple-300' },
  ]

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '')
      setAvatarUrl(profile.avatar_url || '')
      setBackgroundColor(profile.background_color || 'white')
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
          background_color: backgroundColor,
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
            <Avatar 
              avatarUrl={profile?.avatar_url || null}
              username={profile?.username || user?.email?.address || 'User'}
              size="md"
            />
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

          {/* Buttons */}
          <div className="flex gap-2">
            {profile?.username && (
              <button
                onClick={() => router.push(`/users/${profile.username}`)}
                className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
              >
                <Avatar 
                  avatarUrl={profile.avatar_url}
                  username={profile.username}
                  size="sm"
                />
                Inventory
              </button>
            )}
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary text-sm px-4 py-2"
            >
              {profile?.username ? 'Edit' : 'Add Username'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Profile</h3>

      <div className="space-y-4">
        {/* Avatar URL or Bitmap */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Picture
          </label>
          <textarea
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="Enter a URL (https://...) or paste a bitmap string (hex)"
            className="input-field font-mono text-sm"
            rows={3}
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter a URL to an image OR paste a bitmap string from your inventory
          </p>
          {avatarUrl && profile?.username && (
            <div className="mt-3">
              <p className="text-xs text-gray-600 mb-2">Preview:</p>
              <Avatar 
                avatarUrl={avatarUrl}
                username={profile.username}
                size="lg"
              />
            </div>
          )}
        </div>

        {/* Background Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Background Color
          </label>
          <div className="grid grid-cols-5 gap-2">
            {backgroundColors.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => {
                  setBackgroundColor(color.value)
                  onBackgroundColorChange?.(color.value)
                }}
                className={`relative h-16 rounded-lg border-2 transition-all ${
                  backgroundColor === color.value 
                    ? 'border-blue-500 ring-2 ring-blue-300' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className={`w-full h-full rounded-md bg-gradient-to-br ${color.class}`}></div>
                {backgroundColor === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">✓</span>
                  </div>
                )}
                <p className="absolute bottom-1 left-0 right-0 text-center text-xs font-medium text-gray-700 bg-white/80 rounded mx-1">
                  {color.label}
                </p>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            This will change the background color across all pages
          </p>
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
              (username === profile?.username && 
               avatarUrl === profile?.avatar_url && 
               backgroundColor === (profile?.background_color || 'white'))
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

