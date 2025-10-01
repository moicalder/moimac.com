# 🔄 Database Migrations Guide

How to add, modify, or remove database fields as your app evolves.

## ✅ Current Schema

Your `users` table currently has:
- `id` - User's Privy ID (primary key)
- `email` - Email address (unique)
- `username` - Display name (unique, case-insensitive)
- `avatar_url` - Profile image URL
- `wallet_address` - Crypto wallet address
- `created_at` - Account creation time
- `updated_at` - Last profile update
- `total_games_played` - Game counter
- `total_score` - Cumulative score

## 🆕 Adding New Fields

### Step 1: Create Migration File

Create a new file: `/app/api/migrate-[name]/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Add your new column
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS your_new_field VARCHAR(255);
    `
    
    return NextResponse.json({ 
      message: 'Migration successful',
      note: 'Delete this file after running'
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error },
      { status: 500 }
    )
  }
}
```

### Step 2: Update TypeScript Interface

In `lib/db.ts`, add the field to `UserProfile`:

```typescript
export interface UserProfile {
  id: string
  email: string
  username: string | null
  avatar_url: string | null
  wallet_address: string | null
  your_new_field: string | null  // ← Add this
  created_at: Date
  updated_at: Date
  total_games_played: number
  total_score: number
}
```

### Step 3: Update Functions (if needed)

Update `updateUserProfile()` to accept the new field:

```typescript
export async function updateUserProfile(
  userId: string,
  updates: { 
    username?: string
    avatar_url?: string
    wallet_address?: string
    your_new_field?: string  // ← Add this
  }
): Promise<UserProfile | null> {
  // ... add to setClauses logic
}
```

### Step 4: Run Migration

1. Push code to GitHub
2. Vercel auto-deploys
3. Visit: `https://your-app.vercel.app/api/migrate-[name]`
4. See success message
5. Delete the migration file
6. Commit and push the deletion

## 📝 Example: Adding a Bio Field

### Migration File: `/app/api/migrate-bio/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS bio TEXT;
    `
    
    return NextResponse.json({ message: 'Added bio field' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
```

### Update Interface

```typescript
export interface UserProfile {
  // ... existing fields
  bio: string | null
}
```

### Update Functions

```typescript
export async function updateUserProfile(
  userId: string,
  updates: { 
    username?: string
    avatar_url?: string
    bio?: string  // ← New
  }
) {
  // ... existing code
  
  if (updates.bio !== undefined) {
    setClauses.push(`bio = $${values.length + 1}`)
    values.push(updates.bio)
  }
  
  // ... rest of function
}
```

## 🔄 Modifying Existing Fields

### Change Column Type

```typescript
await sql`
  ALTER TABLE users 
  ALTER COLUMN username TYPE VARCHAR(50);
`
```

### Add Constraint

```typescript
await sql`
  ALTER TABLE users 
  ADD CONSTRAINT check_username_length 
  CHECK (char_length(username) >= 3);
`
```

### Add Index

```typescript
await sql`
  CREATE INDEX IF NOT EXISTS idx_users_username 
  ON users(username);
`
```

## 🗑️ Removing Fields

### Step 1: Migration to Drop Column

```typescript
await sql`
  ALTER TABLE users 
  DROP COLUMN IF EXISTS old_field;
`
```

### Step 2: Remove from TypeScript

Remove field from `UserProfile` interface and all related functions.

**⚠️ Warning:** This permanently deletes data! Make sure you don't need it first.

## 🔐 Username Uniqueness (Already Implemented!)

Your username field already has:
- ✅ UNIQUE constraint in database
- ✅ Case-insensitive checking
- ✅ Validation (3-20 chars, alphanumeric + _ -)
- ✅ API endpoint: `/api/username/check`

### Check Username Availability

```typescript
// In your React component
async function checkUsername(username: string) {
  const response = await fetch(
    `/api/username/check?username=${username}&userId=${user.id}`
  )
  const data = await response.json()
  return data.available // true or false
}
```

### Update Username

```typescript
async function updateUsername(newUsername: string) {
  const response = await fetch('/api/user', {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'x-user-id': user.id 
    },
    body: JSON.stringify({ username: newUsername })
  })
  
  if (!response.ok) {
    const error = await response.json()
    console.error(error.error) // "Username is already taken"
  }
}
```

## 📊 Common Migration Scenarios

### Add Avatar/Profile Picture Support

Already included as `avatar_url`! Just store image URLs:

```typescript
await updateUserProfile(userId, {
  avatar_url: 'https://your-cdn.com/avatars/user123.jpg'
})
```

### Add Social Links

```typescript
// Migration
await sql`
  ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS twitter_handle VARCHAR(50),
  ADD COLUMN IF NOT EXISTS discord_username VARCHAR(100);
`
```

### Add User Preferences

Option 1: JSON column (flexible)
```typescript
await sql`
  ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
`
```

Option 2: Individual columns (typed)
```typescript
await sql`
  ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS theme VARCHAR(10) DEFAULT 'light',
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;
`
```

## 🎯 Best Practices

1. **Always use `IF NOT EXISTS`** - Prevents errors if migration runs twice
2. **Test locally first** - Run migrations on local DB before production
3. **One migration = One change** - Easier to track and rollback
4. **Delete migration files** - After running, remove them for security
5. **Update TypeScript** - Keep interfaces in sync with database
6. **Use nullable fields** - For existing users, new fields should allow NULL
7. **Add defaults** - Or populate existing users with default values

## 🔄 Migration Checklist

When adding a new field:
- [ ] Create migration file in `/app/api/migrate-[name]/`
- [ ] Add field to `UserProfile` interface
- [ ] Update `initializeDatabase()` if needed
- [ ] Update `updateUserProfile()` if needed
- [ ] Test migration locally
- [ ] Deploy to Vercel
- [ ] Run migration endpoint
- [ ] Verify in Neon dashboard
- [ ] Delete migration file
- [ ] Update documentation

## 🛠️ Tools for Managing Schema

### View Current Schema

In Neon dashboard:
1. Go to your Vercel project → Storage
2. Click your database
3. Click **SQL Editor**
4. Run: `\d users` or `SELECT * FROM users LIMIT 1;`

### Manual SQL Queries

You can run any SQL in the Neon SQL Editor:
```sql
-- See all columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users';

-- See all constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'users';
```

## 🚨 Troubleshooting

### "Column already exists"
- Migration ran twice
- Safe to ignore if using `IF NOT EXISTS`

### "Constraint violation"
- Existing data conflicts with new constraint
- Update existing data first, then add constraint

### "Cannot add NOT NULL column"
- Existing rows would have NULL
- Either: add with NULL allowed, or provide DEFAULT value

---

You're all set to evolve your database schema as your app grows! 🚀

