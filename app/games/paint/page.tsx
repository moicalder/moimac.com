'use client'

import { useEffect, useRef, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import colorPalette from '@/color-palette.json'

const GRID = 16
const SPRITE = 64
const SCALE = SPRITE / GRID

const SWATCH_HEX = [
  '#000000', '#FFFFFF', '#808080', '#FF0000', '#FF8000', '#FFFF00',
  '#00FF00', '#00FFFF', '#0000FF', '#8000FF', '#FF00FF', '#FF69B4',
  '#8B4513', '#FFD1A4', '#FFD700', '#1E90FF',
]

function colorIndex(hex: string) {
  const index = colorPalette.allColors.findIndex(
    (color) => color.toLowerCase() === hex.toLowerCase()
  )
  return index === -1 ? 1 : index
}

const SWATCHES = SWATCH_HEX.map((hex) => ({
  hex,
  index: colorIndex(hex),
}))

function emptyPixels() {
  return Array(GRID * GRID).fill(0)
}

function toBitmap(pixels: number[]) {
  const sprite = Array(SPRITE * SPRITE).fill(0)
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const color = pixels[y * GRID + x]
      for (let dy = 0; dy < SCALE; dy++) {
        for (let dx = 0; dx < SCALE; dx++) {
          sprite[(y * SCALE + dy) * SPRITE + (x * SCALE + dx)] = color
        }
      }
    }
  }
  return sprite.map((value) => value.toString(16).padStart(2, '0')).join('')
}

export default function PaintPage() {
  const router = useRouter()
  const { ready, authenticated, user } = usePrivy()
  const [pixels, setPixels] = useState<number[]>(emptyPixels)
  const [selected, setSelected] = useState(SWATCHES[0].index)
  const [tool, setTool] = useState<'paint' | 'erase'>('paint')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const history = useRef<number[][]>([])
  const pixelsRef = useRef(pixels)
  const strokeStarted = useRef(false)
  pixelsRef.current = pixels

  useEffect(() => {
    if (ready && !authenticated) router.push('/')
  }, [ready, authenticated, router])

  useEffect(() => {
    const endStroke = () => {
      strokeStarted.current = false
    }
    window.addEventListener('pointerup', endStroke)
    return () => window.removeEventListener('pointerup', endStroke)
  }, [])

  const paintAt = (index: number) => {
    const nextColor = tool === 'erase' ? 0 : selected
    setPixels((current) => {
      if (current[index] === nextColor) return current
      const next = current.slice()
      next[index] = nextColor
      pixelsRef.current = next
      return next
    })
  }

  const beginStroke = () => {
    history.current.push(pixelsRef.current.slice())
    if (history.current.length > 30) history.current.shift()
  }

  const undo = () => {
    const previous = history.current.pop()
    if (!previous) return
    pixelsRef.current = previous
    setPixels(previous)
    setMessage(null)
  }

  const clearCanvas = () => {
    beginStroke()
    const blank = emptyPixels()
    pixelsRef.current = blank
    setPixels(blank)
    setMessage(null)
  }

  const saveDrawing = async () => {
    if (!user?.id) return
    if (pixels.every((pixel) => pixel === 0)) {
      setMessage('Draw something first.')
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch('/api/user/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          bitmapString: toBitmap(pixels),
          type: 'painting',
        }),
      })

      if (response.ok) {
        setMessage('Saved to your inventory.')
      } else {
        const data = await response.json()
        setMessage(data.error || 'Could not save the drawing.')
      }
    } catch {
      setMessage('Could not save the drawing.')
    } finally {
      setSaving(false)
    }
  }

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
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.push('/')} className="btn-secondary">
            ← Back to Home
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Paint</h1>
        </div>

        <div className="card">
          <p className="text-gray-600 mb-4">
            Click and drag to draw. Save puts the picture in your inventory.
          </p>

          <div
            className="inline-grid touch-none select-none"
            style={{
              gridTemplateColumns: `repeat(${GRID}, 22px)`,
              background: 'repeating-conic-gradient(#ececec 0% 25%, #ffffff 0% 50%) 50% / 22px 22px',
              border: '2px solid #d1d5db',
            }}
          >
            {pixels.map((colorIndex, index) => {
              const color = colorIndex === 0 ? 'transparent' : colorPalette.allColors[colorIndex]
              return (
                <div
                  key={index}
                  onPointerDown={(event) => {
                    event.preventDefault()
                    if (!strokeStarted.current) {
                      beginStroke()
                      strokeStarted.current = true
                    }
                    paintAt(index)
                  }}
                  onPointerEnter={(event) => {
                    if (event.buttons === 1) paintAt(index)
                  }}
                  style={{
                    width: 22,
                    height: 22,
                    background: color,
                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
                  }}
                />
              )
            })}
          </div>

          <div className="mt-6">
            <div className="text-sm font-medium text-gray-700 mb-2">Colors</div>
            <div className="flex flex-wrap gap-2">
              {SWATCHES.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  aria-label={swatch.hex}
                  onClick={() => {
                    setSelected(swatch.index)
                    setTool('paint')
                  }}
                  className={`w-9 h-9 rounded-md border-2 ${
                    tool === 'paint' && selected === swatch.index
                      ? 'border-gray-900'
                      : 'border-gray-300'
                  }`}
                  style={{ background: swatch.hex }}
                />
              ))}
              <button
                type="button"
                onClick={() => setTool('erase')}
                className={`px-3 h-9 rounded-md border-2 text-sm font-medium ${
                  tool === 'erase' ? 'border-gray-900 bg-gray-100' : 'border-gray-300 bg-white'
                }`}
              >
                Erase
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <button type="button" onClick={undo} className="btn-secondary">
              Undo
            </button>
            <button type="button" onClick={clearCanvas} className="btn-secondary">
              Clear
            </button>
            <button type="button" onClick={saveDrawing} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save to inventory'}
            </button>
          </div>

          {message && <p className="mt-4 text-gray-700">{message}</p>}
        </div>
      </div>
    </main>
  )
}
