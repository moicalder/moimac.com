'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import SpriteRenderer from './SpriteRenderer'

interface InventoryItem {
  id: number
  bitmap_string: string
  type: 'character' | 'vehicle'
  created_at: string
}

export default function InventoryManager() {
  const { user } = usePrivy()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [bitmapInput, setBitmapInput] = useState('')
  const [selectedType, setSelectedType] = useState<'character' | 'vehicle'>('character')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchInventory()
    }
  }, [user?.id])

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
          type: selectedType
        })
      })

      if (response.ok) {
        await fetchInventory()
        setBitmapInput('')
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
          🎨 Character & Vehicle Inventory
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
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as 'character' | 'vehicle')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="character">Character</option>
                <option value="vehicle">Vehicle</option>
              </select>
            </div>

            {/* Bitmap Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bitmap String (hex color indices)
              </label>
              <textarea
                value={bitmapInput}
                onChange={(e) => setBitmapInput(e.target.value)}
                placeholder="Enter hex string (e.g., 000102030405...)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                Each byte (2 hex digits) represents a color index from 0-255
              </p>
            </div>

            {/* Preview */}
            {bitmapInput.trim() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview (16x16)
                </label>
                <div className="p-4 bg-white rounded-lg border-2 border-gray-300 inline-block">
                  <SpriteRenderer 
                    bitmapString={bitmapInput.trim()} 
                    width={16}
                    height={16}
                    pixelSize={8}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!bitmapInput.trim() || loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Saving...' : 'Save to Inventory'}
              </button>
              <button
                onClick={() => {
                  setBitmapInput('')
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
          <p className="text-sm">Click "Add New" to add your first character or vehicle!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative group bg-white rounded-lg border-2 border-gray-200 
                       hover:border-primary-400 transition-colors p-3"
            >
              {/* Sprite Preview */}
              <div className="flex items-center justify-center mb-2 bg-gray-50 rounded p-2">
                <SpriteRenderer 
                  bitmapString={item.bitmap_string}
                  width={16}
                  height={16}
                  pixelSize={6}
                />
              </div>

              {/* Type Badge */}
              <div className="text-center mb-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  item.type === 'character' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {item.type === 'character' ? '🧑 Character' : '🚗 Vehicle'}
                </span>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleDelete(item.id)}
                disabled={loading}
                className="w-full text-xs py-1 px-2 bg-red-50 text-red-600 rounded 
                         hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

