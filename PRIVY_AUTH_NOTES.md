# 🔐 Privy Authentication Implementation Notes

## Current Status

### ✅ What's Working
- **Client-side auth**: Users can sign in with email via Privy
- **User profiles**: Users are created in database on first login
- **Session management**: Privy handles sessions in browser

### ⚠️ What Needs Production Enhancement
- **Server-side token verification**: Currently simplified for development
- **API route protection**: Using basic user ID passing

## Environment Variables

### NEXT_PUBLIC_PRIVY_APP_ID (Public)
- **Used in**: Browser/client-side code
- **Purpose**: Initialize Privy in the React app
- **Safe to expose**: Yes, it's public
- **Location**: `lib/providers.tsx`

### PRIVY_APP_SECRET (Private)
- **Used in**: Server-side API routes
- **Purpose**: Verify JWT tokens from Privy
- **Safe to expose**: NO - server-only
- **Location**: Future use in `lib/auth-server.ts`

## How Authentication Works

### 1. User Signs In (Client)
```
User enters email → Privy sends code → User enters code → Privy creates session
```

The session is stored in browser cookies by Privy.

### 2. Making Authenticated Requests (Client)
```tsx
import { usePrivy } from '@privy-io/react-auth'

const { user } = usePrivy()
// user.id, user.email.address available
```

### 3. Verifying on Server (Current Simple Approach)
For now, we trust the client to send the user ID:

```tsx
// Client
fetch('/api/user', {
  method: 'POST',
  body: JSON.stringify({ userId: user.id })
})

// Server
const { userId } = await request.json()
// Use userId to fetch/update data
```

### 4. Production Approach (TODO)
Use Privy's access tokens:

```tsx
// Client - get access token
const { getAccessToken } = usePrivy()
const token = await getAccessToken()

fetch('/api/user', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

// Server - verify token
import { verifyPrivyToken } from '@/lib/auth-server'
const user = await verifyPrivyToken(token)
if (!user) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
```

## When to Upgrade to Production Auth

You should implement proper token verification when:
1. ✅ You're ready to deploy to production
2. ✅ You have sensitive user data
3. ✅ You're handling real scores/leaderboards
4. ✅ You want to prevent cheating

For now (development/testing), the simple approach works fine.

## How to Implement Production Auth

### Step 1: Install Privy Server SDK
```bash
npm install @privy-io/server-auth
```

### Step 2: Update `lib/auth-server.ts`
```typescript
import { PrivyClient } from '@privy-io/server-auth'

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
)

export async function verifyPrivyToken(token: string) {
  try {
    const claims = await privy.verifyAuthToken(token)
    return {
      id: claims.userId,
      email: claims.email
    }
  } catch (error) {
    return null
  }
}
```

### Step 3: Update API Routes
```typescript
import { getAuthenticatedUser } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Use user.id safely
}
```

### Step 4: Update Client Requests
```typescript
// In your game components
import { usePrivy } from '@privy-io/react-auth'

const { getAccessToken } = usePrivy()

async function submitScore(score: number) {
  const token = await getAccessToken()
  
  await fetch('/api/scores', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ score })
  })
}
```

## Security Best Practices

1. ✅ **NEVER commit** `.env.local` to git
2. ✅ **Always use** `PRIVY_APP_SECRET` on server only
3. ✅ **Verify tokens** on every authenticated API call
4. ✅ **Set proper CORS** if needed
5. ✅ **Use HTTPS** in production (Vercel does this automatically)

## Resources

- [Privy Docs](https://docs.privy.io/)
- [Privy Server Auth](https://docs.privy.io/guide/server/verification)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

For now, the simple approach is fine for development. Upgrade when you're ready to launch! 🚀

