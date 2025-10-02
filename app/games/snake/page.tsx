'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'

type GameState = 'start' | 'playing' | 'paused' | 'gameOver'

interface Position {
  x: number
  y: number
}

export default function SnakePage() {
  const router = useRouter()
  const { ready, authenticated, user } = usePrivy()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>('start')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  
  // Game state refs (for accessing in game loop)
  const snakeRef = useRef<Position[]>([{ x: 10, y: 10 }])
  const directionRef = useRef({ dx: 0, dy: 0 })
  const nextDirectionRef = useRef({ dx: 0, dy: 0 })
  const foodRef = useRef<Position>({ x: 15, y: 15 })
  const rainbowOrbRef = useRef<Position | null>(null)
  const rainbowOrbActiveRef = useRef(false)
  const rainbowOrbStartTimeRef = useRef(0)
  const nextRainbowOrbTimeRef = useRef(0)
  const gameSpeedRef = useRef(150)
  const lastTimeRef = useRef(0)
  const animationIdRef = useRef<number>()

  const GRID_SIZE = 20
  const TILE_COUNT = 20 // 400x400 canvas / 20 grid
  const CANVAS_SIZE = 400
  const RAINBOW_ORB_DURATION = 10000
  const RAINBOW_ORB_INTERVAL_MIN = 30000
  const RAINBOW_ORB_INTERVAL_MAX = 60000

  // Load high score on mount
  useEffect(() => {
    const saved = localStorage.getItem('snakeHighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  // Redirect if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/')
    }
  }, [ready, authenticated, router])

  const generateFood = useCallback((): Position => {
    let food: Position
    do {
      food = {
        x: Math.floor(Math.random() * TILE_COUNT),
        y: Math.floor(Math.random() * TILE_COUNT)
      }
    } while (snakeRef.current.some(segment => segment.x === food.x && segment.y === food.y))
    return food
  }, [])

  const generateRainbowOrb = useCallback((): Position => {
    let orb: Position
    do {
      orb = {
        x: Math.floor(Math.random() * TILE_COUNT),
        y: Math.floor(Math.random() * TILE_COUNT)
      }
    } while (
      snakeRef.current.some(segment => segment.x === orb.x && segment.y === orb.y) ||
      (foodRef.current.x === orb.x && foodRef.current.y === orb.y)
    )
    return orb
  }, [])

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#f8f9fa'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Draw grid
    ctx.strokeStyle = '#e9ecef'
    ctx.lineWidth = 1
    for (let i = 0; i <= TILE_COUNT; i++) {
      ctx.beginPath()
      ctx.moveTo(i * GRID_SIZE, 0)
      ctx.lineTo(i * GRID_SIZE, CANVAS_SIZE)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * GRID_SIZE)
      ctx.lineTo(CANVAS_SIZE, i * GRID_SIZE)
      ctx.stroke()
    }

    // Draw snake
    snakeRef.current.forEach((segment, index) => {
      if (index === 0) {
        // Head
        ctx.fillStyle = '#667eea'
      } else {
        // Body with rainbow effect if active
        if (rainbowOrbActiveRef.current) {
          const hue = (index * 25) % 360
          ctx.fillStyle = `hsl(${hue}, 70%, 60%)`
        } else {
          const alpha = Math.max(0.3, 1 - (index * 0.1))
          ctx.fillStyle = `rgba(102, 126, 234, ${alpha})`
        }
      }
      ctx.fillRect(
        segment.x * GRID_SIZE + 1,
        segment.y * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2
      )
    })

    // Draw food
    ctx.fillStyle = '#f5576c'
    ctx.beginPath()
    ctx.arc(
      foodRef.current.x * GRID_SIZE + GRID_SIZE / 2,
      foodRef.current.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2 - 2,
      0,
      2 * Math.PI
    )
    ctx.fill()

    // Draw rainbow orb if exists
    if (rainbowOrbRef.current) {
      const centerX = rainbowOrbRef.current.x * GRID_SIZE + GRID_SIZE / 2
      const centerY = rainbowOrbRef.current.y * GRID_SIZE + GRID_SIZE / 2
      const radius = GRID_SIZE / 2 - 2
      
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      gradient.addColorStop(0, '#ff0000')
      gradient.addColorStop(0.17, '#ff8000')
      gradient.addColorStop(0.33, '#ffff00')
      gradient.addColorStop(0.5, '#00ff00')
      gradient.addColorStop(0.67, '#0080ff')
      gradient.addColorStop(0.83, '#8000ff')
      gradient.addColorStop(1, '#ff0080')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      ctx.fill()
    }
  }, [])

  const resetGame = useCallback(() => {
    // Cancel any existing animation frame
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current)
    }

    snakeRef.current = [{ x: 10, y: 10 }]
    directionRef.current = { dx: 0, dy: 0 }
    nextDirectionRef.current = { dx: 0, dy: 0 }
    foodRef.current = generateFood()
    rainbowOrbRef.current = null
    rainbowOrbActiveRef.current = false
    rainbowOrbStartTimeRef.current = 0
    nextRainbowOrbTimeRef.current = 0
    gameSpeedRef.current = 150
    lastTimeRef.current = 0
    setScore(0)
    
    // Redraw the initial state
    drawGame()
  }, [generateFood, drawGame])

  const gameLoop = useCallback((currentTime: number) => {
    if (gameState !== 'playing') return

    if (currentTime - lastTimeRef.current > gameSpeedRef.current) {
      // Update direction
      directionRef.current = { ...nextDirectionRef.current }
      
      // Don't move if no direction
      if (directionRef.current.dx === 0 && directionRef.current.dy === 0) {
        lastTimeRef.current = currentTime
        animationIdRef.current = requestAnimationFrame(gameLoop)
        return
      }

      // Calculate new head
      const head = {
        x: snakeRef.current[0].x + directionRef.current.dx,
        y: snakeRef.current[0].y + directionRef.current.dy
      }

      // Check wall collision
      if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        if (rainbowOrbActiveRef.current) {
          // Wrap around
          if (head.x < 0) head.x = TILE_COUNT - 1
          else if (head.x >= TILE_COUNT) head.x = 0
          if (head.y < 0) head.y = TILE_COUNT - 1
          else if (head.y >= TILE_COUNT) head.y = 0
        } else {
          // Save high score
          const newHighScore = score > highScore ? score : highScore
          if (score > highScore) {
            setHighScore(score)
            localStorage.setItem('snakeHighScore', score.toString())
          }
          
          // Submit score to database
          if (user?.id) {
            try {
              await fetch('/api/snake/session', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: user.id,
                  score: score,
                  highScore: newHighScore,
                }),
                cache: 'no-store',
              })
            } catch (error) {
              console.error('Failed to submit Snake session:', error)
            }
          }
          
          setGameState('gameOver')
          return
        }
      }

      // Check self collision
      for (const segment of snakeRef.current) {
        if (head.x === segment.x && head.y === segment.y) {
          // Save high score
          const newHighScore = score > highScore ? score : highScore
          if (score > highScore) {
            setHighScore(score)
            localStorage.setItem('snakeHighScore', score.toString())
          }
          
          // Submit score to database
          if (user?.id) {
            try {
              await fetch('/api/snake/session', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: user.id,
                  score: score,
                  highScore: newHighScore,
                }),
                cache: 'no-store',
              })
            } catch (error) {
              console.error('Failed to submit Snake session:', error)
            }
          }
          
          setGameState('gameOver')
          return
        }
      }

      // Add new head
      snakeRef.current.unshift(head)

      // Check food collision
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        setScore(prev => prev + 10)
        foodRef.current = generateFood()
        gameSpeedRef.current = Math.max(50, gameSpeedRef.current - 2)
      } else {
        snakeRef.current.pop()
      }

      // Check rainbow orb collision
      if (rainbowOrbRef.current && head.x === rainbowOrbRef.current.x && head.y === rainbowOrbRef.current.y) {
        rainbowOrbActiveRef.current = true
        rainbowOrbStartTimeRef.current = Date.now()
        rainbowOrbRef.current = null
        nextRainbowOrbTimeRef.current = Date.now() + RAINBOW_ORB_INTERVAL_MIN + Math.random() * (RAINBOW_ORB_INTERVAL_MAX - RAINBOW_ORB_INTERVAL_MIN)
      }

      // Update rainbow orb
      const now = Date.now()
      if (rainbowOrbActiveRef.current && now - rainbowOrbStartTimeRef.current > RAINBOW_ORB_DURATION) {
        rainbowOrbActiveRef.current = false
      }
      if (!rainbowOrbRef.current && !rainbowOrbActiveRef.current && now > nextRainbowOrbTimeRef.current) {
        rainbowOrbRef.current = generateRainbowOrb()
      }

      drawGame()
      lastTimeRef.current = currentTime
    }

    animationIdRef.current = requestAnimationFrame(gameLoop)
  }, [gameState, score, highScore, generateFood, generateRainbowOrb, drawGame])

  const startGame = useCallback(() => {
    resetGame()
    setGameState('playing')
  }, [resetGame])

  const togglePause = useCallback(() => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing')
  }, [])

  // Handle keyboard
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState === 'start') return

      switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (directionRef.current.dy !== 1) {
            nextDirectionRef.current = { dx: 0, dy: -1 }
          }
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          if (directionRef.current.dy !== -1) {
            nextDirectionRef.current = { dx: 0, dy: 1 }
          }
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (directionRef.current.dx !== 1) {
            nextDirectionRef.current = { dx: -1, dy: 0 }
          }
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (directionRef.current.dx !== -1) {
            nextDirectionRef.current = { dx: 1, dy: 0 }
          }
          break
        case ' ':
          e.preventDefault()
          if (gameState === 'playing' || gameState === 'paused') {
            togglePause()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState, togglePause])

  // Start/stop game loop
  useEffect(() => {
    if (gameState === 'playing') {
      animationIdRef.current = requestAnimationFrame(gameLoop)
    } else if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current)
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [gameState, gameLoop])

  // Draw initial state
  useEffect(() => {
    drawGame()
  }, [drawGame])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="btn-secondary"
          >
            ← Back to Home
          </button>
          <h1 className="text-2xl font-bold text-gray-900">🐍 Snake</h1>
        </div>

        {/* Score Board */}
        <div className="flex gap-4 mb-6">
          <div className="card flex-1 text-center bg-gradient-to-br from-purple-100 to-pink-100">
            <div className="text-sm text-purple-700 font-medium">Score</div>
            <div className="text-3xl font-bold text-purple-900">{score}</div>
          </div>
          <div className="card flex-1 text-center bg-gradient-to-br from-blue-100 to-purple-100">
            <div className="text-sm text-blue-700 font-medium">High Score</div>
            <div className="text-3xl font-bold text-blue-900">{highScore}</div>
          </div>
        </div>

        {/* Game Area */}
        <div className="card relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="mx-auto border-2 border-purple-300 rounded-lg"
          />

          {/* Overlays */}
          {gameState === 'start' && (
            <div className="absolute inset-0 bg-black bg-opacity-80 rounded-lg flex items-center justify-center">
              <div className="text-center text-white p-6">
                <h2 className="text-3xl font-bold mb-4 text-purple-300">🐍 Snake Game</h2>
                <p className="mb-6 text-gray-300">Use arrow keys or WASD to move</p>
                <button onClick={startGame} className="btn-primary">
                  Start Game
                </button>
              </div>
            </div>
          )}

          {gameState === 'paused' && (
            <div className="absolute inset-0 bg-black bg-opacity-80 rounded-lg flex items-center justify-center">
              <div className="text-center text-white p-6">
                <h2 className="text-3xl font-bold mb-4 text-purple-300">⏸️ Paused</h2>
                <p className="mb-6 text-gray-300">Press Space to resume</p>
                <button onClick={togglePause} className="btn-primary">
                  Resume
                </button>
              </div>
            </div>
          )}

          {gameState === 'gameOver' && (
            <div className="absolute inset-0 bg-black bg-opacity-80 rounded-lg flex items-center justify-center">
              <div className="text-center text-white p-6">
                <h2 className="text-3xl font-bold mb-4 text-red-400">Game Over!</h2>
                <p className="mb-2 text-2xl">Final Score: <span className="text-purple-300 font-bold">{score}</span></p>
                {score === highScore && score > 0 && (
                  <p className="mb-6 text-yellow-400">🎉 New High Score!</p>
                )}
                <button onClick={startGame} className="btn-primary mt-4">
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-6 space-y-4">
          <div className="card bg-gradient-to-br from-purple-50 to-blue-50">
            <p className="text-center text-sm text-gray-700">
              Use <strong>Arrow Keys</strong> or <strong>WASD</strong> to move • 
              Press <strong>Space</strong> to pause
            </p>
            {rainbowOrbActiveRef.current && (
              <p className="text-center text-sm text-purple-600 font-bold mt-2">
                🌈 Rainbow Mode Active! Walk through walls!
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={togglePause}
              disabled={gameState === 'start' || gameState === 'gameOver'}
              className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {gameState === 'paused' ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={startGame}
              className="btn-primary flex-1"
            >
              Restart
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

