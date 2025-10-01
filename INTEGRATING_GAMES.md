# 🎮 Integrating Games into MoiMac

This guide shows you how to add your existing games to the MoiMac platform.

## Quick Overview

Each game will:
1. Live in `/app/games/[game-name]/` directory
2. Automatically have access to user authentication
3. Be able to submit scores to the central database
4. Show up on the main landing page

## Step-by-Step: Adding a Game

### 1. Create Game Directory

```bash
mkdir -p app/games/[your-game-name]
```

### 2. Add Your Game Page

Create `app/games/[your-game-name]/page.tsx`:

```tsx
'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'

export default function YourGamePage() {
  const { ready, authenticated, user } = usePrivy()
  const router = useRouter()

  // Redirect to home if not authenticated
  if (!ready) {
    return <div>Loading...</div>
  }

  if (!authenticated) {
    router.push('/')
    return null
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button 
          onClick={() => router.push('/')}
          className="btn-secondary mb-4"
        >
          ← Back to Home
        </button>

        {/* User info available */}
        <div className="card mb-4">
          <p>Playing as: {user?.email?.address}</p>
        </div>

        {/* Your game goes here */}
        <div className="card">
          <h1 className="text-3xl font-bold mb-4">Your Game</h1>
          {/* Insert your game component or canvas here */}
        </div>
      </div>
    </div>
  )
}
```

### 3. Update Landing Page

Edit `app/page.tsx` and update the `games` array:

```tsx
const games = [
  {
    id: 'your-game-name',
    name: 'Your Game Name',
    description: 'Description of your game',
    icon: '🎮', // Pick an emoji
    status: 'available' as const, // Change from 'coming-soon'
  },
  // ... other games
]
```

### 4. Submit Scores (Optional)

When a game ends, submit the score:

```tsx
async function submitScore(score: number, metadata?: any) {
  try {
    const response = await fetch('/api/scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        gameName: 'your-game-name',
        score: score,
        metadata: metadata, // e.g., { difficulty: 'hard', mode: 'timed' }
      }),
    })
    
    if (response.ok) {
      console.log('Score submitted!')
    }
  } catch (error) {
    console.error('Failed to submit score:', error)
  }
}
```

Note: You'll need to create the `/api/scores/route.ts` endpoint (we can do this later).

## Example: Converting Static HTML Game

If your game is currently static HTML/CSS/JS (like Snake or Runner):

### Option 1: Iframe Approach (Easiest)

1. Copy your game files to `/public/games/[game-name]/`
2. Create a wrapper page:

```tsx
'use client'

export default function GamePage() {
  return (
    <div className="min-h-screen">
      <iframe 
        src="/games/snake/index.html"
        className="w-full h-screen border-none"
        title="Snake Game"
      />
    </div>
  )
}
```

**Pros:** Quick, no code changes needed
**Cons:** Limited integration, harder to share auth/data

### Option 2: React Component (Better)

1. Convert your game logic to a React component
2. Use `useEffect` for canvas setup
3. Use `useState` for game state

Example structure:
```tsx
'use client'

import { useEffect, useRef, useState } from 'react'

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Your game initialization code here
    const ctx = canvas.getContext('2d')
    
    // Game loop
    const gameLoop = () => {
      // Your game logic
      requestAnimationFrame(gameLoop)
    }
    
    gameLoop()
  }, [])

  return (
    <div className="card">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Snake Game</h1>
        <p>Score: {score}</p>
      </div>
      <canvas 
        ref={canvasRef}
        width={400}
        height={400}
        className="border-2 border-gray-300 rounded-lg"
      />
    </div>
  )
}
```

## Example: Integrating Next.js Game (Like MathMode)

If your game is already a Next.js app:

1. Copy the game component code to `/app/games/mathmode/page.tsx`
2. Move any shared utilities to `/lib/`
3. Update imports
4. Remove duplicate authentication (use central Privy)

## Accessing User Data in Games

All games can access user data via Privy:

```tsx
import { usePrivy } from '@privy-io/react-auth'

export default function GamePage() {
  const { user } = usePrivy()
  
  const userId = user?.id
  const email = user?.email?.address
  
  // Use these to submit scores, personalize experience, etc.
}
```

## Testing Your Game

1. Start dev server: `npm run dev`
2. Sign in on homepage
3. Click your game card
4. Test authentication and game functionality

## Checklist

- [ ] Game directory created in `/app/games/[name]/`
- [ ] `page.tsx` created with authentication check
- [ ] Game added to landing page games array
- [ ] Game works when authenticated
- [ ] Back button returns to home
- [ ] Scores can be submitted (if applicable)
- [ ] Tested on mobile and desktop

## Need Help?

- Check existing games in `/app/games/` for examples
- Look at the Privy docs: https://docs.privy.io/
- Review Next.js App Router docs: https://nextjs.org/docs

---

Ready to integrate? Start with one game and the pattern will become clear! 🚀

