'use client'

import { useEffect, useRef } from 'react'
import colorPalette from '../color-palette.json'

interface AvatarProps {
  avatarUrl: string | null
  username: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function Avatar({ avatarUrl, username, size = 'md', className = '' }: AvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Determine if it's a bitmap string (hex characters, long string)
  const isBitmapString = avatarUrl && 
    avatarUrl.length > 100 && 
    /^[0-9A-Fa-f]+$/.test(avatarUrl)

  // Size mappings (in pixels)
  const sizes = {
    sm: 32,   // Was w-8 h-8 in leaderboards
    md: 48,   // Was w-12 h-12 in user directory
    lg: 96,
    xl: 128
  }

  const pixelSize = sizes[size]

  // Render bitmap to canvas
  useEffect(() => {
    if (!isBitmapString || !avatarUrl || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    try {
      // Parse bitmap string
      const bytes = avatarUrl.match(/.{1,2}/g) || []
      
      for (let i = 0; i < bytes.length; i++) {
        const colorIndex = parseInt(bytes[i], 16)
        
        if (isNaN(colorIndex) || colorIndex >= colorPalette.allColors.length) {
          continue
        }

        const color = colorPalette.allColors[colorIndex]
        
        if (color === 'transparent') {
          continue
        }

        // Calculate x, y position
        const x = i % 64
        const y = Math.floor(i / 64)

        // Draw pixel
        ctx.fillStyle = color
        ctx.fillRect(x, y, 1, 1)
      }
    } catch (error) {
      console.error('Error rendering sprite:', error)
    }
  }, [avatarUrl, isBitmapString])

  if (!avatarUrl) {
    // No avatar - show initial
    return (
      <div 
        className={`rounded-full bg-primary-100 flex items-center justify-center 
                   font-bold text-primary-600 border-4 border-primary-200 ${className}`}
        style={{ width: pixelSize, height: pixelSize, fontSize: pixelSize * 0.4 }}
      >
        {username[0]?.toUpperCase() || '?'}
      </div>
    )
  }

  if (isBitmapString) {
    // Bitmap string - render as sprite with nearest neighbor scaling
    return (
      <div 
        className={`rounded-full overflow-hidden border-4 border-primary-200 
                   flex items-center justify-center bg-gray-50 ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
      >
        <canvas
          ref={canvasRef}
          width={64}
          height={64}
          style={{
            width: '100%',
            height: '100%',
            imageRendering: 'pixelated',
          }}
        />
      </div>
    )
  }

  // Check if it's a valid URL
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('data:')) {
    // URL - show as image with cover to fill the circle
    return (
      <div 
        className={`rounded-full border-4 border-primary-200 overflow-hidden ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
      >
        <img
          src={avatarUrl}
          alt={username}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  // Invalid format - show initial
  return (
    <div 
      className={`rounded-full bg-primary-100 flex items-center justify-center 
                 font-bold text-primary-600 border-4 border-primary-200 ${className}`}
      style={{ width: pixelSize, height: pixelSize, fontSize: pixelSize * 0.4 }}
    >
      {username[0]?.toUpperCase() || '?'}
    </div>
  )
}

