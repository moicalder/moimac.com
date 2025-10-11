import { useEffect, useRef, useState } from 'react'

interface GamepadState {
  connected: boolean
  left: boolean
  right: boolean
  up: boolean
  down: boolean
  buttonA: boolean // Primary action button
  buttonB: boolean // Secondary action button
  start: boolean
  select: boolean
}

/**
 * Custom hook for gamepad/controller support
 * Handles both D-pad and analog stick input
 * Button mapping:
 * - D-pad/Left Stick: Movement
 * - A button (0): Primary action (shoot/select)
 * - B button (1): Secondary action (back/cancel)
 * - Start (9): Pause
 * - Select (8): Menu
 */
export function useGamepad() {
  const [gamepadState, setGamepadState] = useState<GamepadState>({
    connected: false,
    left: false,
    right: false,
    up: false,
    down: false,
    buttonA: false,
    buttonB: false,
    start: false,
    select: false,
  })
  
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    const checkGamepad = () => {
      const gamepads = navigator.getGamepads()
      // Find first connected gamepad
      const gamepad = gamepads.find(gp => gp !== null) || null
      
      if (!gamepad) {
        setGamepadState(prev => prev.connected ? { ...prev, connected: false } : prev)
        animationFrameRef.current = requestAnimationFrame(checkGamepad)
        return
      }

      const state: GamepadState = {
        connected: true,
        left: false,
        right: false,
        up: false,
        down: false,
        buttonA: false,
        buttonB: false,
        start: false,
        select: false,
      }

      // D-pad (buttons 12-15 on standard gamepad)
      if (gamepad.buttons[14]?.pressed) state.left = true
      if (gamepad.buttons[15]?.pressed) state.right = true
      if (gamepad.buttons[12]?.pressed) state.up = true
      if (gamepad.buttons[13]?.pressed) state.down = true

      // Left analog stick (axes 0 and 1)
      const deadzone = 0.25 // Ignore small movements
      if (gamepad.axes[0] !== undefined) {
        if (gamepad.axes[0] < -deadzone) state.left = true
        if (gamepad.axes[0] > deadzone) state.right = true
      }
      if (gamepad.axes[1] !== undefined) {
        if (gamepad.axes[1] < -deadzone) state.up = true
        if (gamepad.axes[1] > deadzone) state.down = true
      }

      // Action buttons (try multiple indices for compatibility)
      // Button 0 is usually A/Cross
      if (gamepad.buttons[0]?.pressed) state.buttonA = true
      // Button 1 is usually B/Circle
      if (gamepad.buttons[1]?.pressed) state.buttonB = true
      // Start button (try 9, 10, or 11)
      if (gamepad.buttons[9]?.pressed || gamepad.buttons[10]?.pressed || gamepad.buttons[11]?.pressed) {
        state.start = true
      }
      // Select button (try 8, 10, or 11)
      if (gamepad.buttons[8]?.pressed || gamepad.buttons[10]?.pressed) {
        state.select = true
      }

      setGamepadState(state)
      animationFrameRef.current = requestAnimationFrame(checkGamepad)
    }

    // Start polling
    animationFrameRef.current = requestAnimationFrame(checkGamepad)

    // Listen for gamepad connection events
    const handleConnect = (e: GamepadEvent) => {
      console.log('🎮 Gamepad connected:', e.gamepad.id)
      console.log('  Buttons:', e.gamepad.buttons.length)
      console.log('  Axes:', e.gamepad.axes.length)
      console.log('  Mapping:', e.gamepad.mapping)
    }

    const handleDisconnect = (e: GamepadEvent) => {
      console.log('🎮 Gamepad disconnected:', e.gamepad.id)
    }

    window.addEventListener('gamepadconnected', handleConnect)
    window.addEventListener('gamepaddisconnected', handleDisconnect)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      window.removeEventListener('gamepadconnected', handleConnect)
      window.removeEventListener('gamepaddisconnected', handleDisconnect)
    }
  }, [])

  return gamepadState
}
