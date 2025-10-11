'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import SpriteRenderer from '@/components/SpriteRenderer'
import { useGamepad } from '@/hooks/useGamepad'

type GameState = 'vehicleSelect' | 'start' | 'playing' | 'paused' | 'gameOver'

interface InventoryItem {
  id: number
  bitmap_string: string
  type: 'character' | 'vehicle'
}

interface Position {
  x: number
  y: number
}

interface Particle {
  x: number
  y: number
  size: 16 | 32 | 64 | 128
  health: number
  maxHealth: number
  speed: number
}

interface Bullet {
  x: number
  y: number
}

export default function StarFighterPage() {
  const router = useRouter()
  const { ready, authenticated, user } = usePrivy()
  const gamepad = useGamepad()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playerSpriteCanvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>('vehicleSelect')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [health, setHealth] = useState(100)
  const [vehicles, setVehicles] = useState<InventoryItem[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const [loadingInventory, setLoadingInventory] = useState(true)
  const [username, setUsername] = useState<string | null>(null)
  const [spriteReady, setSpriteReady] = useState(false)
  const [vehicleMenuIndex, setVehicleMenuIndex] = useState(0) // For gamepad navigation
  
  // Game state refs
  const playerRef = useRef({ x: 320, y: 520, width: 64, height: 64 })
  const bulletsRef = useRef<Bullet[]>([])
  const particlesRef = useRef<Particle[]>([])
  const animationIdRef = useRef<number>()
  const lastTimeRef = useRef(0)
  const gameStartTimeRef = useRef(0)
  const lastShootTimeRef = useRef(0)
  const lastParticleSpawnRef = useRef(0)
  const keysRef = useRef<Set<string>>(new Set())
  const gamepadStateRef = useRef(gamepad)
  const lastGamepadStartRef = useRef(false)
  const lastGamepadARef = useRef(false)
  const lastGamepadLeftRef = useRef(false)
  const lastGamepadRightRef = useRef(false)
  const healthRef = useRef(100)
  const scoreRef = useRef(0)

  const CANVAS_WIDTH = 640
  const CANVAS_HEIGHT = 640
  const PLAYER_SPEED = 5
  const BULLET_SPEED = 8
  const SHOOT_COOLDOWN = 250 // milliseconds
  const PARTICLE_SPAWN_RATE = 1000 // milliseconds

  // Particle configuration by size
  const PARTICLE_CONFIG = {
    16: { health: 1, damage: 5, speed: 0.8, points: 10 },
    32: { health: 2, damage: 10, speed: 0.7, points: 25 },
    64: { health: 4, damage: 20, speed: 0.6, points: 50 },
    128: { health: 8, damage: 40, speed: 0.5, points: 100 }
  }

  // Load high score on mount
  useEffect(() => {
    const saved = localStorage.getItem('starFighterHighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  // Update gamepad state ref and handle pause + vehicle selection
  useEffect(() => {
    gamepadStateRef.current = gamepad
    
    // Handle vehicle selection menu navigation
    if (gameState === 'vehicleSelect' && !loadingInventory) {
      const totalVehicles = vehicles.length + 1 // +1 for default
      
      // Navigate right
      if (gamepad.right && !lastGamepadRightRef.current) {
        setVehicleMenuIndex(prev => {
          const next = (prev + 1) % totalVehicles
          return next
        })
      }
      
      // Navigate left
      if (gamepad.left && !lastGamepadLeftRef.current) {
        setVehicleMenuIndex(prev => {
          const next = (prev - 1 + totalVehicles) % totalVehicles
          return next
        })
      }
      
      // Select vehicle with A button or Start (read from state)
      if ((gamepad.buttonA && !lastGamepadARef.current) || (gamepad.start && !lastGamepadStartRef.current)) {
        // Use a callback to get the current vehicleMenuIndex
        setVehicleMenuIndex(currentIndex => {
          if (currentIndex === 0) {
            handleVehicleSelect(null) // Default
          } else {
            handleVehicleSelect(vehicles[currentIndex - 1].bitmap_string)
          }
          return currentIndex // Don't change the index
        })
      }
    }
    
    // Handle Start button for pause during gameplay
    if (gamepad.start && !lastGamepadStartRef.current) {
      if (gameState === 'playing') {
        setGameState('paused')
      } else if (gameState === 'paused') {
        setGameState('playing')
      }
    }
    
    lastGamepadStartRef.current = gamepad.start
    lastGamepadARef.current = gamepad.buttonA
    lastGamepadLeftRef.current = gamepad.left
    lastGamepadRightRef.current = gamepad.right
  }, [gamepad, gameState, vehicles, loadingInventory])

  // Fetch user's vehicle inventory
  useEffect(() => {
    if (user?.id) {
      fetchVehicles()
    }
  }, [user?.id])

  const fetchVehicles = async () => {
    try {
      setLoadingInventory(true)
      
      // Fetch user profile to get username
      const email = user?.email?.address || user?.google?.email || `user-${user?.id}@example.com`
      const profileResponse = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          email: email,
        }),
        cache: 'no-store',
      })
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setUsername(profileData.profile?.username)
      }
      
      // Fetch inventory
      const response = await fetch(`/api/user/inventory?userId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        // Filter for vehicles only
        const vehicleItems = data.items.filter((item: InventoryItem) => item.type === 'vehicle')
        setVehicles(vehicleItems)
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    } finally {
      setLoadingInventory(false)
    }
  }

  const handleVehicleSelect = (bitmapString: string | null) => {
    setSelectedVehicle(bitmapString)
    // If no vehicle selected (default), sprite is ready immediately
    if (!bitmapString) {
      setSpriteReady(true)
      setGameState('start')
    } else {
      // Wait for sprite to render
      setSpriteReady(false)
    }
  }

  // Redirect if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/')
    }
  }, [ready, authenticated, router])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase())
      
      // Shoot on space
      if (e.key === ' ' && gameState === 'playing') {
        e.preventDefault()
        shoot()
      }
      
      // Pause on Escape
      if (e.key === 'Escape' && gameState === 'playing') {
        setGameState('paused')
      } else if (e.key === 'Escape' && gameState === 'paused') {
        setGameState('playing')
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase())
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameState])

  const shoot = useCallback(() => {
    const now = Date.now()
    if (now - lastShootTimeRef.current < SHOOT_COOLDOWN) return
    
    lastShootTimeRef.current = now
    const player = playerRef.current
    bulletsRef.current.push({
      x: player.x + player.width / 2 - 4, // Center the 8px wide bullet
      y: player.y
    })
  }, [])

  const spawnParticle = useCallback((timeSurvived: number) => {
    // Check if there's already a 128-sized particle on screen
    const hasLargeParticle = particlesRef.current.some(p => p.size === 128)
    
    // Progressive difficulty: start with smaller particles, introduce larger ones over time
    let availableSizes: Array<16 | 32 | 64 | 128> = []
    
    if (timeSurvived < 10) {
      // First 10 seconds: only small particles
      availableSizes = [16, 16, 32] // Weighted towards 16
    } else if (timeSurvived < 20) {
      // 10-20 seconds: small and medium
      availableSizes = [16, 32, 32, 64]
    } else if (timeSurvived < 40) {
      // 20-40 seconds: add large particles
      availableSizes = [16, 32, 64, 64, 128]
    } else {
      // After 40 seconds: all sizes
      availableSizes = [16, 32, 64, 128, 128]
    }
    
    // Remove 128 from options if one already exists
    if (hasLargeParticle) {
      availableSizes = availableSizes.filter(s => s !== 128)
    }
    
    const size = availableSizes[Math.floor(Math.random() * availableSizes.length)]
    const config = PARTICLE_CONFIG[size]
    
    // Progressive speed increase based on time survived
    // Starts at 1x, gradually increases: 1.5x at 20s, 2x at 40s, 3x at 80s
    const speedMultiplier = 1 + (timeSurvived / 40)
    
    particlesRef.current.push({
      x: Math.random() * (CANVAS_WIDTH - size),
      y: -size,
      size,
      health: config.health,
      maxHealth: config.health,
      speed: config.speed * speedMultiplier
    })
  }, [])

  const resetGame = useCallback(() => {
    playerRef.current = { x: 320, y: 520, width: 64, height: 64 }
    bulletsRef.current = []
    particlesRef.current = []
    scoreRef.current = 0
    healthRef.current = 100
    setScore(0)
    setHealth(100)
    lastTimeRef.current = 0
    gameStartTimeRef.current = 0
    lastShootTimeRef.current = 0
    lastParticleSpawnRef.current = 0
    keysRef.current.clear()
    
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current)
    }
    
    // Reset vehicle selection to allow choosing again
    setSelectedVehicle(null)
    setSpriteReady(false)
    setGameState('vehicleSelect')
  }, [])

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw stars background
    ctx.fillStyle = '#fff'
    for (let i = 0; i < 50; i++) {
      const x = (i * 137) % CANVAS_WIDTH
      const y = (i * 197) % CANVAS_HEIGHT
      ctx.fillRect(x, y, 2, 2)
    }

    // Draw player
    const player = playerRef.current
    if (selectedVehicle && playerSpriteCanvasRef.current && spriteReady) {
      // Draw selected vehicle sprite (only if ready)
      ctx.drawImage(
        playerSpriteCanvasRef.current,
        player.x,
        player.y,
        player.width,
        player.height
      )
    } else if (!selectedVehicle || !spriteReady) {
      // Draw default square (or while waiting for sprite)
      ctx.fillStyle = '#00ff00'
      ctx.fillRect(player.x, player.y, player.width, player.height)
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 2
      ctx.strokeRect(player.x, player.y, player.width, player.height)
    }

    // Draw bullets
    ctx.fillStyle = '#ffff00'
    bulletsRef.current.forEach(bullet => {
      ctx.fillRect(bullet.x, bullet.y, 8, 12)
    })

    // Draw particles
    particlesRef.current.forEach(particle => {
      // Particle color based on size
      const colors = {
        16: '#888',
        32: '#999',
        64: '#aaa',
        128: '#ccc'
      }
      ctx.fillStyle = colors[particle.size]
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size)
      
      // Health bar
      if (particle.health < particle.maxHealth) {
        const healthBarWidth = particle.size
        const healthPercentage = particle.health / particle.maxHealth
        ctx.fillStyle = '#f00'
        ctx.fillRect(particle.x, particle.y - 8, healthBarWidth, 4)
        ctx.fillStyle = '#0f0'
        ctx.fillRect(particle.x, particle.y - 8, healthBarWidth * healthPercentage, 4)
      }
    })

    // Draw health bar
    ctx.fillStyle = '#333'
    ctx.fillRect(10, 10, 200, 20)
    ctx.fillStyle = healthRef.current > 50 ? '#0f0' : healthRef.current > 25 ? '#ff0' : '#f00'
    ctx.fillRect(10, 10, 200 * (healthRef.current / 100), 20)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.strokeRect(10, 10, 200, 20)
    
    // Draw score
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 20px monospace'
    ctx.fillText(`Score: ${scoreRef.current}`, 10, 50)
  }, [selectedVehicle, spriteReady])

  const update = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp
    const deltaTime = timestamp - lastTimeRef.current
    lastTimeRef.current = timestamp

    const player = playerRef.current

    // Handle player movement (keyboard + gamepad)
    if (keysRef.current.has('arrowleft') || keysRef.current.has('a') || gamepadStateRef.current.left) {
      player.x = Math.max(0, player.x - PLAYER_SPEED)
    }
    if (keysRef.current.has('arrowright') || keysRef.current.has('d') || gamepadStateRef.current.right) {
      player.x = Math.min(CANVAS_WIDTH - player.width, player.x + PLAYER_SPEED)
    }

    // Auto-shoot (keyboard + gamepad)
    if (keysRef.current.has(' ') || gamepadStateRef.current.buttonA) {
      shoot()
    }

    // Update bullets
    bulletsRef.current = bulletsRef.current.filter(bullet => {
      bullet.y -= BULLET_SPEED
      return bullet.y > -12
    })

    // Spawn particles
    const now = timestamp
    if (!gameStartTimeRef.current) {
      gameStartTimeRef.current = now
    }
    const timeSurvived = Math.floor((now - gameStartTimeRef.current) / 1000)
    
    // Progressive spawn rate: MUCH more gradual increase
    // Starts at 2000ms (0.5 particles/sec), slowly decreases to min 600ms (1.67 particles/sec)
    const spawnRate = Math.max(600, 2000 - (timeSurvived * 8))
    
    // Progressive max particles on screen
    // Starts at 2, gradually increases to 8
    const maxParticles = Math.min(8, 2 + Math.floor(timeSurvived / 15))
    
    if (now - lastParticleSpawnRef.current > spawnRate && particlesRef.current.length < maxParticles) {
      lastParticleSpawnRef.current = now
      spawnParticle(timeSurvived)
    }

    // Update particles
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.y += particle.speed
      
      // Check if particle passed the player (life loss)
      if (particle.y > CANVAS_HEIGHT) {
        const config = PARTICLE_CONFIG[particle.size]
        healthRef.current = Math.max(0, healthRef.current - Math.floor(config.damage / 2))
        setHealth(healthRef.current)
        return false
      }
      
      return true
    })

    // Check bullet-particle collisions
    bulletsRef.current = bulletsRef.current.filter(bullet => {
      let bulletHit = false
      
      particlesRef.current = particlesRef.current.filter(particle => {
        if (
          bullet.x + 8 > particle.x &&
          bullet.x < particle.x + particle.size &&
          bullet.y < particle.y + particle.size &&
          bullet.y + 12 > particle.y
        ) {
          bulletHit = true
          particle.health--
          
          if (particle.health <= 0) {
            // Particle destroyed
            const config = PARTICLE_CONFIG[particle.size]
            scoreRef.current += config.points
            setScore(scoreRef.current)
            return false
          }
        }
        return true
      })
      
      return !bulletHit
    })

    // Check player-particle collisions
    particlesRef.current = particlesRef.current.filter(particle => {
      if (
        player.x < particle.x + particle.size &&
        player.x + player.width > particle.x &&
        player.y < particle.y + particle.size &&
        player.y + player.height > particle.y
      ) {
        // Player hit
        const config = PARTICLE_CONFIG[particle.size]
        healthRef.current = Math.max(0, healthRef.current - config.damage)
        setHealth(healthRef.current)
        return false
      }
      return true
    })

    // Check game over
    if (healthRef.current <= 0) {
      setGameState('gameOver')
      
      // Save high score
      if (scoreRef.current > highScore) {
        setHighScore(scoreRef.current)
        localStorage.setItem('starFighterHighScore', scoreRef.current.toString())
      }
      
      // Submit score
      if (user?.id) {
        fetch('/api/starfighter/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            score: scoreRef.current,
            highScore: Math.max(scoreRef.current, highScore),
            particlesDestroyed: Math.floor(scoreRef.current / 10) // Approximate
          })
        }).catch(err => console.error('Error submitting score:', err))
      }
      
      return
    }

    drawGame()
  }, [shoot, spawnParticle, drawGame, highScore, user])

  const gameLoop = useCallback((timestamp: number) => {
    if (gameState !== 'playing') return
    
    update(timestamp)
    animationIdRef.current = requestAnimationFrame(gameLoop)
  }, [gameState, update])

  const startGame = useCallback(() => {
    resetGame()
    setGameState('playing')
  }, [resetGame])

  // Start/stop game loop
  useEffect(() => {
    if (gameState === 'playing') {
      lastTimeRef.current = 0
      animationIdRef.current = requestAnimationFrame(gameLoop)
    } else {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
    
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [gameState, gameLoop])

  // Render selected vehicle sprite to hidden canvas
  useEffect(() => {
    if (!selectedVehicle || !playerSpriteCanvasRef.current) return

    const canvas = playerSpriteCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Import color palette
    import('../../../color-palette.json').then((module) => {
      const colorPalette = module.default
      
      // Clear canvas
      ctx.clearRect(0, 0, 64, 64)

      // Parse bitmap string
      const bytes = selectedVehicle.match(/.{1,2}/g) || []
      
      for (let i = 0; i < bytes.length && i < 4096; i++) {
        const colorIndex = parseInt(bytes[i], 16)
        
        if (isNaN(colorIndex) || colorIndex >= colorPalette.allColors.length) {
          continue
        }

        const color = colorPalette.allColors[colorIndex]
        
        // Skip transparent pixels
        if (color === 'transparent') {
          continue
        }

        const x = i % 64
        const y = Math.floor(i / 64)

        ctx.fillStyle = color
        ctx.fillRect(x, y, 1, 1)
      }
      
      // Mark sprite as ready and transition to start screen
      setSpriteReady(true)
      setGameState('start')
    })
  }, [selectedVehicle])
  
  // Redraw when sprite becomes ready
  useEffect(() => {
    if (spriteReady && (gameState === 'start' || gameState === 'vehicleSelect')) {
      drawGame()
    }
  }, [spriteReady, gameState, drawGame])

  // Initial draw
  useEffect(() => {
    if (gameState === 'start' || gameState === 'gameOver' || gameState === 'vehicleSelect') {
      drawGame()
    }
  }, [gameState, drawGame])

  if (!ready || !authenticated) {
    return (
      <main className="main-container">
        <div className="card text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Loading...</h1>
        </div>
      </main>
    )
  }

  return (
    <main className="main-container">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">🚀 Star Fighter</h1>
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Home
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* Game Info */}
          <div className="flex gap-8 text-center">
            <div>
              <div className="text-sm text-gray-500">Score</div>
              <div className="text-2xl font-bold text-primary-600">{score}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">High Score</div>
              <div className="text-2xl font-bold text-purple-600">{highScore}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Health</div>
              <div className={`text-2xl font-bold ${
                health > 50 ? 'text-green-600' : health > 25 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {health}%
              </div>
            </div>
          </div>

          {/* Hidden canvas for player sprite */}
          {selectedVehicle && (
            <canvas
              ref={playerSpriteCanvasRef}
              width={64}
              height={64}
              style={{ display: 'none' }}
            />
          )}

          {/* Canvas */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="border-4 border-gray-300 rounded-lg bg-black"
            />
            
            {/* Overlay messages */}
            {gameState === 'vehicleSelect' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 rounded-lg overflow-auto">
                <div className="text-center text-white p-8 max-w-4xl">
                  <h2 className="text-4xl font-bold mb-6">🚀 Choose Your Vehicle</h2>
                  
                  {/* Controller indicator */}
                  {gamepad.connected && (
                    <div className="mb-4">
                      <p className="text-green-400 font-semibold mb-2">🎮 Controller Connected</p>
                      <p className="text-sm text-gray-400">Use ← → to navigate • Press A or Start to select</p>
                      <div className="mt-2 text-xs bg-gray-800 inline-block p-2 rounded font-mono">
                        <div>L:{gamepad.left ? '✓' : '·'} R:{gamepad.right ? '✓' : '·'} A:{gamepad.buttonA ? '✓' : '·'} Start:{gamepad.start ? '✓' : '·'}</div>
                      </div>
                    </div>
                  )}
                  
                  {loadingInventory ? (
                    <p className="text-xl">Loading vehicles...</p>
                  ) : vehicles.length === 0 ? (
                    <div>
                      <p className="text-xl mb-6">No vehicles in inventory. Using default ship!</p>
                      <button
                        onClick={() => handleVehicleSelect(null)}
                        className="btn-primary text-lg px-8 py-3"
                      >
                        Continue with Default
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                        {/* Default vehicle option */}
                        <button
                          onClick={() => handleVehicleSelect(null)}
                          className={`bg-gray-700 hover:bg-gray-600 p-4 rounded-lg border-2 transition-all ${
                            vehicleMenuIndex === 0 ? 'border-green-400 ring-2 ring-green-400' : 'border-gray-500 hover:border-green-400'
                          }`}
                        >
                          <div className="w-full aspect-square bg-gray-800 rounded flex items-center justify-center mb-2">
                            <div className="w-16 h-16 bg-green-500 border-2 border-green-400"></div>
                          </div>
                          <p className="text-sm">Default Ship</p>
                        </button>
                        
                        {/* User's vehicles */}
                        {vehicles.map((vehicle, index) => (
                          <button
                            key={vehicle.id}
                            onClick={() => handleVehicleSelect(vehicle.bitmap_string)}
                            className={`bg-gray-700 hover:bg-gray-600 p-4 rounded-lg border-2 transition-all ${
                              vehicleMenuIndex === index + 1 ? 'border-green-400 ring-2 ring-green-400' : 'border-gray-500 hover:border-green-400'
                            }`}
                          >
                            <div className="w-full aspect-square bg-gray-800 rounded flex items-center justify-center mb-2"
                                 style={{ 
                                   background: 'repeating-conic-gradient(#333 0% 25%, #444 0% 50%) 50% / 8px 8px',
                                 }}>
                              <SpriteRenderer
                                bitmapString={vehicle.bitmap_string}
                                width={64}
                                height={64}
                                pixelSize={2}
                              />
                            </div>
                            <p className="text-sm">Custom Vehicle</p>
                          </button>
                        ))}
                      </div>
                      {username && (
                        <button
                          onClick={() => router.push('/users/' + username)}
                          className="text-sm text-gray-400 hover:text-white underline"
                        >
                          Manage Inventory
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {gameState === 'start' && !spriteReady && selectedVehicle && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 rounded-lg">
                <div className="text-center text-white">
                  <div className="text-6xl mb-4 animate-pulse">🚀</div>
                  <h2 className="text-2xl font-bold mb-2">Loading Vehicle...</h2>
                  <p className="text-gray-400">Preparing your custom ship</p>
                </div>
              </div>
            )}
            
            {gameState === 'start' && spriteReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
                <div className="text-center text-white">
                  <h2 className="text-4xl font-bold mb-4">🚀 Star Fighter</h2>
                  <p className="mb-2">← → or A/D to move</p>
                  <p className="mb-2">SPACE to shoot</p>
                  <p className="mb-6">Destroy asteroids before they pass!</p>
                  <button
                    onClick={startGame}
                    className="btn-primary text-lg px-8 py-3"
                  >
                    Start Game
                  </button>
                </div>
              </div>
            )}
            
            {gameState === 'paused' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
                <div className="text-center text-white">
                  <h2 className="text-4xl font-bold mb-4">⏸️ Paused</h2>
                  <p className="mb-4">Press ESC to resume</p>
                  <button
                    onClick={() => setGameState('playing')}
                    className="btn-primary text-lg px-8 py-3"
                  >
                    Resume
                  </button>
                </div>
              </div>
            )}
            
            {gameState === 'gameOver' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
                <div className="text-center text-white">
                  <h2 className="text-4xl font-bold mb-4">💥 Game Over!</h2>
                  <p className="text-2xl mb-2">Score: {score}</p>
                  {score === highScore && score > 0 && (
                    <p className="text-yellow-400 font-bold mb-4">🎉 New High Score!</p>
                  )}
                  <div className="flex flex-col gap-3 mt-6">
                    <button
                      onClick={resetGame}
                      className="btn-primary text-lg px-8 py-3"
                    >
                      Play Again
                    </button>
                    <button
                      onClick={() => {
                        const leaderboardSection = document.getElementById('starfighter-leaderboard')
                        if (leaderboardSection) {
                          window.scrollTo({ top: leaderboardSection.offsetTop - 100, behavior: 'smooth' })
                          router.push('/#starfighter-leaderboard')
                        } else {
                          router.push('/')
                        }
                      }}
                      className="btn-secondary text-lg px-8 py-3"
                    >
                      View Leaderboard
                    </button>
                    <button
                      onClick={() => router.push('/')}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      ← Back to Main Menu
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls info */}
          <div className="text-sm text-gray-600 text-center">
            <p><kbd className="kbd">←</kbd> <kbd className="kbd">→</kbd> or <kbd className="kbd">A</kbd> <kbd className="kbd">D</kbd> to move • <kbd className="kbd">SPACE</kbd> to shoot • <kbd className="kbd">ESC</kbd> to pause</p>
            {gamepad.connected && (
              <div className="mt-2">
                <p className="text-green-600 font-semibold">🎮 Controller Connected</p>
                <div className="mt-2 text-xs bg-gray-100 p-2 rounded font-mono">
                  <div>L:{gamepad.left ? '✓' : '·'} R:{gamepad.right ? '✓' : '·'} U:{gamepad.up ? '✓' : '·'} D:{gamepad.down ? '✓' : '·'}</div>
                  <div>A:{gamepad.buttonA ? '✓' : '·'} B:{gamepad.buttonB ? '✓' : '·'} Start:{gamepad.start ? '✓' : '·'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

