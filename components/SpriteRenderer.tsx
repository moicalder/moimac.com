'use client'

import { useEffect, useRef } from 'react'
import colorPalette from '../color-palette.json'

interface SpriteRendererProps {
  bitmapString: string
  width?: number
  height?: number
  pixelSize?: number
  className?: string
}

export default function SpriteRenderer({ 
  bitmapString, 
  width = 16, 
  height = 16, 
  pixelSize = 4,
  className = ''
}: SpriteRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    try {
      // Parse bitmap string - expecting hex string of color indices
      const bytes = bitmapString.match(/.{1,2}/g) || []
      
      for (let i = 0; i < bytes.length; i++) {
        const colorIndex = parseInt(bytes[i], 16)
        
        // Skip if invalid index
        if (isNaN(colorIndex) || colorIndex >= colorPalette.allColors.length) {
          continue
        }

        const color = colorPalette.allColors[colorIndex]
        
        // Skip transparent pixels (index 0)
        if (color === 'transparent') {
          continue
        }

        // Calculate x, y position
        const x = i % width
        const y = Math.floor(i / width)

        // Draw pixel
        ctx.fillStyle = color
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
      }
    } catch (error) {
      console.error('Error rendering sprite:', error)
    }
  }, [bitmapString, width, height, pixelSize])

  return (
    <canvas
      ref={canvasRef}
      width={width * pixelSize}
      height={height * pixelSize}
      className={`${className} image-rendering-pixelated`}
      style={{ imageRendering: 'pixelated' }}
    />
  )
}

