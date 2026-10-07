'use client'

import { useEffect, useRef, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { fileToBitmap, imageToBitmap } from '@/lib/image-to-bitmap'
import SpriteRenderer from './SpriteRenderer'

interface InventoryItem {
  id: number
  bitmap_string: string
  type: 'character' | 'vehicle' | 'painting'
  created_at: string
}

interface InventoryManagerProps {
  onProfileUpdate?: () => void
}

export default function InventoryManager({ onProfileUpdate }: InventoryManagerProps) {
  const { user } = usePrivy()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [bitmapInput, setBitmapInput] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [formError, setFormError] = useState('')
  const [converting, setConverting] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchInventory()
      fetchCurrentAvatar()
    }
  }, [user?.id])

  const fetchCurrentAvatar = async () => {
    if (!user?.id) return
    
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email?.address || `user-${user.id}@example.com`,
        }),
        cache: 'no-store',
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentAvatarUrl(data.profile?.avatar_url)
      }
    } catch (error) {
      console.error('Error fetching current avatar:', error)
    }
  }

  const fetchInventory = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const response = await fetch(`/api/user/inventory?userId=${user.id}`, {
        cache: 'no-store'
      })
      
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetAddForm = () => {
    setBitmapInput('')
    setImageUrl('')
    setFormError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const usePicture = async (load: () => Promise<string>) => {
    try {
      setConverting(true)
      setFormError('')
      setBitmapInput(await load())
    } catch (error) {
      setBitmapInput('')
      setFormError(error instanceof Error ? error.message : 'Could not use that picture.')
    } finally {
      setConverting(false)
    }
  }

  const handleFile = (file: File | undefined) => {
    if (!file) return
    usePicture(() => fileToBitmap(file))
  }

  const handleUrl = () => {
    const url = imageUrl.trim()
    if (!url) {
      setFormError('Paste a picture link first.')
      return
    }
    usePicture(async () => {
      const response = await fetch('/api/image-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Could not open that link.')
      }
      const blob = await response.blob()
      const src = URL.createObjectURL(blob)
      try {
        return await imageToBitmap(src)
      } finally {
        URL.revokeObjectURL(src)
      }
    })
  }

  const handleAdd = async () => {
    if (!user?.id || !bitmapInput.trim()) return

    try {
      setLoading(true)
      const response = await fetch('/api/user/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          bitmapString: bitmapInput.trim(),
          type: 'character'
        })
      })

      if (response.ok) {
        await fetchInventory()
        resetAddForm()
        setShowAddForm(false)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error adding item:', error)
      alert('Failed to add item')
    } finally {
      setLoading(false)
    }
  }

  const handleSetAsProfilePic = async (bitmapString: string) => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      // Update profile with bitmap string directly
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          avatar_url: bitmapString
        })
      })

      if (response.ok) {
        // Update current avatar
        setCurrentAvatarUrl(bitmapString)
        
        // Trigger parent to refresh user data
        if (onProfileUpdate) {
          onProfileUpdate()
        }
        alert('Profile picture updated!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error setting profile pic:', error)
      alert('Failed to set profile picture')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (itemId: number) => {
    if (!user?.id) return
    
    if (!confirm('Are you sure you want to delete this item?')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/user/inventory', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          itemId
        })
      })

      if (response.ok) {
        await fetchInventory()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Your Inventory
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
          disabled={loading}
        >
          {showAddForm ? 'Cancel' : '+ Add New'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Add New Item</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Picture from your computer
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={(event) => handleFile(event.target.files?.[0])}
                className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or a link to a picture
              </label>
              <div className="flex gap-2">
                <input
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={handleUrl}
                  disabled={loading || converting || !imageUrl.trim()}
                  className="btn-secondary"
                >
                  Load
                </button>
              </div>
            </div>

            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}

            {bitmapInput.trim() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  This is how it will look
                </label>
                <div
                  className="p-4 bg-white rounded-lg border-2 border-gray-300 inline-block"
                  style={{
                    background: 'repeating-conic-gradient(#f0f0f0 0% 25%, #ffffff 0% 50%) 50% / 8px 8px',
                  }}
                >
                  <SpriteRenderer
                    bitmapString={bitmapInput.trim()}
                    width={64}
                    height={64}
                    pixelSize={3}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!bitmapInput.trim() || loading || converting}
                className="btn-primary flex-1"
              >
                {loading || converting ? 'Working...' : 'Save to Inventory'}
              </button>
              <button
                onClick={() => {
                  resetAddForm()
                  setShowAddForm(false)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Grid */}
      {loading && items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Loading inventory...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">No items in your inventory yet.</p>
          <p className="text-sm">Play Paint, or click Add New to upload a picture.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {items.map((item) => {
            const isCurrentAvatar = currentAvatarUrl === item.bitmap_string
            
            return (
              <div 
                key={item.id}
                className="relative group bg-white rounded-lg border-2 border-gray-200 
                         hover:border-primary-400 transition-colors p-4 cursor-pointer flex flex-col items-center"
                style={{ minWidth: '160px' }}
                onClick={() => setSelectedItem(item)}
              >
                {/* Sprite Preview */}
                <div className="mb-3 rounded overflow-hidden flex items-center justify-center"
                     style={{ 
                       width: '128px',
                       height: '128px',
                       background: 'repeating-conic-gradient(#f0f0f0 0% 25%, #ffffff 0% 50%) 50% / 8px 8px',
                     }}>
                  <SpriteRenderer 
                    bitmapString={item.bitmap_string}
                    width={64}
                    height={64}
                    pixelSize={2}
                    className="block"
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 w-full">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSetAsProfilePic(item.bitmap_string)
                    }}
                    disabled={loading || isCurrentAvatar}
                    className={`w-full text-xs py-2 px-3 rounded transition-colors disabled:opacity-50 font-medium ${
                      isCurrentAvatar
                        ? 'bg-green-50 text-green-700 cursor-default'
                        : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                    }`}
                  >
                    {isCurrentAvatar ? '✓ Current Profile Pic' : 'Set as Profile Pic'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(item.id)
                    }}
                    disabled={loading}
                    className="w-full text-xs py-2 px-3 bg-red-50 text-red-600 rounded 
                             hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Enlarged Preview Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Your picture</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="flex items-center justify-center mb-4 bg-gray-50 rounded-lg p-8"
                 style={{ imageRendering: 'pixelated' }}>
              <SpriteRenderer 
                bitmapString={selectedItem.bitmap_string}
                width={64}
                height={64}
                pixelSize={4}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  handleSetAsProfilePic(selectedItem.bitmap_string)
                  setSelectedItem(null)
                }}
                disabled={loading || currentAvatarUrl === selectedItem.bitmap_string}
                className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                  currentAvatarUrl === selectedItem.bitmap_string
                    ? 'bg-green-50 text-green-700 cursor-default'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {currentAvatarUrl === selectedItem.bitmap_string ? '✓ Current Profile Pic' : 'Set as Profile Pic'}
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

