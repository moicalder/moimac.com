'use client'

import { useEffect, useRef, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import SpriteRenderer from '@/components/SpriteRenderer'
import { useGamepad } from '@/hooks/useGamepad'
import colorPalette from '../../../color-palette.json'
import {
  createWorld,
  scoreFor,
  stepJoyWorld,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type Cloud,
  type JoyInput,
  type JoyWorld,
  type Platform,
  type Player,
} from '@/lib/joyjump-world'

type GameState = 'pick' | 'start' | 'playing' | 'paused' | 'gameOver'

type InventoryItem = {
  id: number
  bitmap_string: string
}

function spriteFromBitmap(bitmap: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const bytes = bitmap.match(/.{1,2}/g) || []
  for (let i = 0; i < bytes.length && i < 64 * 64; i++) {
    const colorIndex = parseInt(bytes[i], 16)
    if (isNaN(colorIndex) || colorIndex >= colorPalette.allColors.length) continue
    const color = colorPalette.allColors[colorIndex]
    if (color === 'transparent') continue
    ctx.fillStyle = color
    ctx.fillRect(i % 64, Math.floor(i / 64), 1, 1)
  }
  return canvas
}

function toScreen(worldY: number, camera: number) {
  return WORLD_HEIGHT - (worldY - camera)
}

function skyColors(camera: number): [string, string] {
  if (camera < 1400) return ['#8fd8ff', '#fff4c8']
  if (camera < 3200) return ['#5aa2ff', '#d7ecff']
  if (camera < 5600) return ['#31407a', '#f3b3c4']
  return ['#140c2e', '#3d2a72']
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function drawCloud(ctx: CanvasRenderingContext2D, cloud: Cloud, camera: number) {
  const y = toScreen(cloud.y, camera)
  if (y < -50 || y > WORLD_HEIGHT + 50) return
  ctx.save()
  ctx.translate(cloud.x, y)
  ctx.scale(cloud.s, cloud.s)
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.beginPath()
  ctx.ellipse(0, 0, 28, 16, 0, 0, Math.PI * 2)
  ctx.ellipse(22, 4, 20, 14, 0, 0, Math.PI * 2)
  ctx.ellipse(-20, 6, 16, 12, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawPlatform(ctx: CanvasRenderingContext2D, platform: Platform, camera: number) {
  const y = toScreen(platform.y, camera)
  if (y < -30 || y > WORLD_HEIGHT + 10) return
  const crumbling = platform.crumble !== null
  const shake = platform.crumble !== null ? Math.sin(platform.crumble * 48) * 3 : 0
  ctx.save()
  ctx.translate(platform.x + shake, y)
  if (crumbling) ctx.globalAlpha = 0.55
  roundRect(ctx, 0, 0, platform.w, 16, 8)
  ctx.fillStyle = platform.color
  ctx.fill()
  roundRect(ctx, 0, 0, platform.w, 6, 6)
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.fill()
  if (platform.breakable) {
    ctx.strokeStyle = 'rgba(90, 48, 18, 0.8)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(10, 5)
    ctx.lineTo(platform.w * 0.38, 11)
    ctx.lineTo(platform.w * 0.62, 4)
    ctx.lineTo(platform.w - 8, 10)
    ctx.stroke()
  }
  if (platform.vx !== 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fillRect(platform.w / 2 - 8, 9, 16, 3)
  }
  ctx.restore()
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  camera: number,
  sprite: HTMLCanvasElement | null
) {
  const feet = toScreen(player.y, camera)
  if (sprite) {
    const size = 44
    ctx.save()
    ctx.translate(player.x, feet + 4)
    if (player.facing < 0) ctx.scale(-1, 1)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(sprite, -size / 2, -size, size, size)
    ctx.restore()
    return
  }
  const stretch = Math.max(-5, Math.min(8, player.vy / 140))
  const bodyW = 32 - stretch * 0.35
  const bodyH = 36 + stretch
  const drawAt = (x: number) => {
    ctx.save()
    ctx.translate(x, feet)
    ctx.fillStyle = 'rgba(40, 50, 80, 0.15)'
    ctx.beginPath()
    ctx.ellipse(0, 2, 14, 4, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ffd15c'
    ctx.beginPath()
    ctx.ellipse(0, -bodyH / 2, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffe59a'
    ctx.beginPath()
    ctx.ellipse(0, -bodyH / 2 + 4, bodyW / 3.2, bodyH / 3.4, 0, 0, Math.PI * 2)
    ctx.fill()

    const eyeX = player.facing * 5
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(-6 + eyeX * 0.2, -bodyH / 2 - 2, 5, 0, Math.PI * 2)
    ctx.arc(6 + eyeX * 0.2, -bodyH / 2 - 2, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#2b2b3a'
    ctx.beginPath()
    ctx.arc(-6 + eyeX * 0.45, -bodyH / 2 - 2, 2.2, 0, Math.PI * 2)
    ctx.arc(6 + eyeX * 0.45, -bodyH / 2 - 2, 2.2, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#2b2b3a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, -bodyH / 2 + 8, 6, 0.15 * Math.PI, 0.85 * Math.PI)
    ctx.stroke()
    ctx.restore()
  }

  drawAt(player.x)
}

function drawWorld(
  ctx: CanvasRenderingContext2D,
  world: JoyWorld,
  sprite: HTMLCanvasElement | null
) {
  const [top, bottom] = skyColors(world.camera)
  const sky = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT)
  sky.addColorStop(0, top)
  sky.addColorStop(1, bottom)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

  if (world.camera > 3600) {
    for (const star of world.stars) {
      const y = toScreen(star.y, world.camera)
      if (y < 0 || y > WORLD_HEIGHT) continue
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.fillRect(star.x, y, star.s, star.s)
    }
  } else {
    ctx.fillStyle = '#ffe08a'
    ctx.beginPath()
    ctx.arc(WORLD_WIDTH - 70, 78, 28, 0, Math.PI * 2)
    ctx.fill()
  }

  for (const cloud of world.clouds) drawCloud(ctx, cloud, world.camera)
  for (const platform of world.platforms) drawPlatform(ctx, platform, world.camera)
  drawPlayer(ctx, world.player, world.camera, sprite)

  const glow = ctx.createLinearGradient(0, WORLD_HEIGHT - 36, 0, WORLD_HEIGHT)
  glow.addColorStop(0, 'rgba(255, 70, 90, 0)')
  glow.addColorStop(1, 'rgba(255, 70, 90, 0.45)')
  ctx.fillStyle = glow
  ctx.fillRect(0, WORLD_HEIGHT - 36, WORLD_WIDTH, 36)

  ctx.fillStyle = world.camera > 3200 ? '#ffffff' : 'rgba(20, 24, 40, 0.75)'
  ctx.font = 'bold 22px sans-serif'
  ctx.fillText(String(scoreFor(world)), 16, 32)
}

function playTone(audio: AudioContext, frequency: number, duration: number) {
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(0.08, audio.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration)
  oscillator.connect(gain)
  gain.connect(audio.destination)
  oscillator.start()
  oscillator.stop(audio.currentTime + duration)
}

export default function JoyJumpPage() {
  const router = useRouter()
  const { ready, authenticated, user } = usePrivy()
  const gamepad = useGamepad()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const worldRef = useRef<JoyWorld>(createWorld())
  const keysRef = useRef({ left: false, right: false, up: false })
  const gamepadRef = useRef(gamepad)
  const userIdRef = useRef<string | null>(null)
  const highScoreRef = useRef(0)
  const endedRef = useRef(false)
  const audioRef = useRef<AudioContext | null>(null)
  const spriteRef = useRef<HTMLCanvasElement | null>(null)
  const [gameState, setGameState] = useState<GameState>('pick')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)

  gamepadRef.current = gamepad
  userIdRef.current = user?.id ?? null

  useEffect(() => {
    const saved = localStorage.getItem('joyJumpHighScore')
    if (saved) {
      const value = parseInt(saved, 10)
      setHighScore(value)
      highScoreRef.current = value
    }
  }, [])

  useEffect(() => {
    if (ready && !authenticated) router.push('/')
  }, [ready, authenticated, router])

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch(`/api/user/inventory?userId=${user.id}`)
        if (!response.ok) return
        const data = await response.json()
        if (!cancelled) setItems(data.items || [])
      } catch (error) {
        console.error('Error fetching inventory:', error)
      } finally {
        if (!cancelled) setLoadingItems(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawWorld(ctx, worldRef.current, spriteRef.current)
  }, [gameState])

  useEffect(() => {
    const keys = keysRef.current
    const onKeyDown = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault()
      }
      if (event.repeat) return
      if (event.key === 'ArrowLeft') keys.left = true
      if (event.key === 'ArrowRight') keys.right = true
      if (event.key === 'ArrowUp') keys.up = true
      if (event.key === 'Escape') {
        setGameState((current) => {
          if (current === 'playing') return 'paused'
          if (current === 'paused') return 'playing'
          return current
        })
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') keys.left = false
      if (event.key === 'ArrowRight') keys.right = false
      if (event.key === 'ArrowUp') keys.up = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    if (gameState !== 'playing') return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let frame = 0
    let last = performance.now()

    const finish = (finalScore: number) => {
      if (endedRef.current) return
      endedRef.current = true
      keysRef.current.up = false
      const best = Math.max(highScoreRef.current, finalScore)
      if (finalScore > highScoreRef.current) {
        highScoreRef.current = finalScore
        setHighScore(finalScore)
        localStorage.setItem('joyJumpHighScore', String(finalScore))
      }
      if (userIdRef.current) {
        fetch('/api/joyjump/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userIdRef.current,
            score: finalScore,
            highScore: best,
          }),
        }).catch((error) => {
          console.error('Failed to submit Joy Jump session:', error)
        })
      }
      const audio = audioRef.current
      if (audio) playTone(audio, 180, 0.25)
      setGameState('gameOver')
    }

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      const pad = gamepadRef.current
      const keys = keysRef.current
      const input: JoyInput = {
        left: keys.left || pad.left,
        right: keys.right || pad.right,
        up: keys.up || pad.up || pad.buttonA,
      }
      const previousVy = worldRef.current.player.vy
      const result = stepJoyWorld(worldRef.current, input, dt)
      const justJumped = previousVy < 400 && worldRef.current.player.vy > 700
      if (justJumped) {
        const audio = audioRef.current
        if (audio) playTone(audio, 540, 0.07)
      }

      const nextScore = scoreFor(worldRef.current)
      setScore(nextScore)
      drawWorld(ctx, worldRef.current, spriteRef.current)
      if (result === 'dead') {
        finish(nextScore)
        return
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [gameState])

  const unlockAudio = () => {
    if (!audioRef.current) {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) audioRef.current = new AudioCtx()
    }
    audioRef.current?.resume().catch(() => {})
  }

  const chooseCharacter = (bitmap: string | null) => {
    spriteRef.current = bitmap ? spriteFromBitmap(bitmap) : null
    setGameState('start')
  }

  const startGame = () => {
    unlockAudio()
    worldRef.current = createWorld()
    endedRef.current = false
    keysRef.current.up = false
    setScore(0)
    setGameState('playing')
  }

  const hold = (key: 'left' | 'right' | 'up', down: boolean) => {
    keysRef.current[key] = down
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
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.push('/')} className="btn-secondary">
            ← Back to Home
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Joy Jump</h1>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="card flex-1 text-center bg-gradient-to-br from-sky-100 to-amber-100">
            <div className="text-sm text-sky-700 font-medium">Height</div>
            <div className="text-3xl font-bold text-sky-900">{score}</div>
          </div>
          <div className="card flex-1 text-center bg-gradient-to-br from-amber-100 to-pink-100">
            <div className="text-sm text-amber-700 font-medium">Best</div>
            <div className="text-3xl font-bold text-amber-900">{highScore}</div>
          </div>
        </div>

        <div className="card relative">
          <canvas
            ref={canvasRef}
            width={WORLD_WIDTH}
            height={WORLD_HEIGHT}
            className="mx-auto w-full h-auto rounded-lg border-2 border-sky-200"
            style={{ maxWidth: WORLD_WIDTH, touchAction: 'none' }}
          />

          {gameState === 'pick' && (
            <div className="absolute inset-0 bg-black/75 rounded-lg overflow-auto p-4">
              <div className="text-center text-white max-w-lg mx-auto">
                <h2 className="text-3xl font-bold mb-2 text-amber-300">Pick your character</h2>
                <p className="mb-4 text-sm text-gray-300">
                  Choose a picture from your inventory, or use the default.
                </p>
                {loadingItems ? (
                  <p>Loading your pictures...</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => chooseCharacter(null)}
                      className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg border-2 border-gray-500 hover:border-amber-300"
                    >
                      <div className="mx-auto mb-2 h-16 w-16 rounded-full bg-yellow-300" />
                      <p className="text-sm">Default</p>
                    </button>
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => chooseCharacter(item.bitmap_string)}
                        className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg border-2 border-gray-500 hover:border-amber-300"
                      >
                        <div
                          className="mb-2 flex h-16 items-center justify-center rounded"
                          style={{
                            background:
                              'repeating-conic-gradient(#333 0% 25%, #444 0% 50%) 50% / 8px 8px',
                          }}
                        >
                          <SpriteRenderer
                            bitmapString={item.bitmap_string}
                            width={64}
                            height={64}
                            pixelSize={1}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {gameState === 'start' && (
            <div className="absolute inset-0 bg-black/75 rounded-lg flex items-center justify-center p-4">
              <div className="text-center text-white max-w-sm">
                <h2 className="text-3xl font-bold mb-3 text-amber-300">Joy Jump</h2>
                <p className="mb-2 text-gray-100">Jump as high as you can.</p>
                <p className="mb-6 text-sm text-gray-300">
                  Left and right arrows move you. Up arrow jumps.
                  The screen follows you up and never scrolls back down.
                  Fall off and touch the bottom, and you lose.
                  Brown cracked platforms break after you land on them.
                </p>
                <button onClick={startGame} className="btn-primary">
                  Start
                </button>
              </div>
            </div>
          )}

          {gameState === 'paused' && (
            <div className="absolute inset-0 bg-black/75 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <h2 className="text-3xl font-bold mb-4">Paused</h2>
                <button onClick={() => setGameState('playing')} className="btn-primary">
                  Keep jumping
                </button>
              </div>
            </div>
          )}

          {gameState === 'gameOver' && (
            <div className="absolute inset-0 bg-black/75 rounded-lg flex items-center justify-center">
              <div className="text-center text-white p-6">
                <h2 className="text-3xl font-bold mb-3 text-rose-300">You fell!</h2>
                <p className="mb-2 text-2xl">Height: {score}</p>
                {score === highScore && score > 0 && (
                  <p className="mb-4 text-amber-300">New best height!</p>
                )}
                <button onClick={startGame} className="btn-primary mt-2">
                  Jump again
                </button>
                <button
                  onClick={() => setGameState('pick')}
                  className="btn-secondary mt-3 block mx-auto"
                >
                  Pick a different character
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <button
            type="button"
            className="btn-secondary"
            onPointerDown={(event) => {
              event.preventDefault()
              event.currentTarget.setPointerCapture(event.pointerId)
              hold('left', true)
            }}
            onPointerUp={() => hold('left', false)}
            onPointerCancel={() => hold('left', false)}
          >
            Left
          </button>
          <button
            type="button"
            className="btn-primary"
            onPointerDown={(event) => {
              event.preventDefault()
              event.currentTarget.setPointerCapture(event.pointerId)
              hold('up', true)
            }}
            onPointerUp={() => hold('up', false)}
            onPointerCancel={() => hold('up', false)}
          >
            Jump
          </button>
          <button
            type="button"
            className="btn-secondary"
            onPointerDown={(event) => {
              event.preventDefault()
              event.currentTarget.setPointerCapture(event.pointerId)
              hold('right', true)
            }}
            onPointerUp={() => hold('right', false)}
            onPointerCancel={() => hold('right', false)}
          >
            Right
          </button>
        </div>

        <p className="text-center text-sm text-gray-600 mt-4">
          Arrow keys move and jump. You stop at the sides of the screen.
          Brown platforms break after one landing.
          Press Escape to pause.
          {gamepad.connected ? ' Controller connected.' : ''}
        </p>
      </div>
    </main>
  )
}
