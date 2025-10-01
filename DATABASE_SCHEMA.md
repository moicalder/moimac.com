# 🗄️ Database Schema

This document describes the database structure for MoiMac Games.

## Tables

### 1. `users`

Stores user profiles and aggregate statistics.

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(255) | Primary key, user's Privy ID |
| `email` | VARCHAR(255) | User's email (unique) |
| `username` | VARCHAR(100) | Display name (unique, case-insensitive) |
| `avatar_url` | TEXT | URL to profile picture |
| `wallet_address` | VARCHAR(255) | User's crypto wallet address |
| `created_at` | TIMESTAMP | When account was created |
| `updated_at` | TIMESTAMP | Last profile update |
| `total_games_played` | INTEGER | Total games across all games |
| `total_score` | INTEGER | Cumulative score from all games |

**Indexes & Constraints:**
- Primary key on `id`
- Unique constraint on `email`
- Unique constraint on `username` (case-insensitive)
- Defaults to email prefix for username on creation

### 2. `game_scores`

Stores individual game scores and sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Auto-increment primary key |
| `user_id` | VARCHAR(255) | Foreign key to users.id |
| `game_name` | VARCHAR(100) | Name of the game (e.g., 'mathmode', 'snake') |
| `score` | INTEGER | Score achieved |
| `metadata` | JSONB | Additional data (difficulty, mode, etc.) |
| `created_at` | TIMESTAMP | When score was recorded |

**Indexes:**
- Primary key on `id`
- Index on `user_id` for fast user score lookups
- Index on `game_name` for leaderboard queries
- Foreign key constraint to `users(id)` with CASCADE delete

**Metadata Examples:**
```json
// MathMode
{
  "operator": "+",
  "difficulty": "2x2 digits",
  "correct": 8,
  "total": 10,
  "percentage": 80
}

// Snake
{
  "length": 25,
  "duration": 180,
  "level": 5
}

// Runner
{
  "distance": 1500,
  "coins": 42,
  "time": 120
}
```

## Common Queries

### Get User Profile
```sql
SELECT * FROM users WHERE id = 'privy_user_id';
```

### Get User's Recent Scores
```sql
SELECT * FROM game_scores 
WHERE user_id = 'privy_user_id' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Get Leaderboard for Specific Game
```sql
SELECT 
  u.username,
  u.email,
  gs.score,
  gs.metadata,
  gs.created_at
FROM game_scores gs
JOIN users u ON gs.user_id = u.id
WHERE gs.game_name = 'mathmode'
ORDER BY gs.score DESC
LIMIT 10;
```

### Get Global Leaderboard (All Games)
```sql
SELECT 
  u.id,
  u.username,
  u.email,
  u.total_score,
  u.total_games_played
FROM users
ORDER BY u.total_score DESC
LIMIT 10;
```

### Get User's Best Score Per Game
```sql
SELECT 
  game_name,
  MAX(score) as best_score
FROM game_scores
WHERE user_id = 'privy_user_id'
GROUP BY game_name;
```

### Update User Stats After Game
```sql
UPDATE users 
SET 
  total_games_played = total_games_played + 1,
  total_score = total_score + 100,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'privy_user_id';
```

## API Endpoints

### Create/Get User
```
POST /api/user
Body: { userId: string, email: string }
```

### Update User Profile
```
PATCH /api/user
Headers: { x-user-id: string }
Body: { username?: string, avatar_url?: string }
```

### Submit Score (to be implemented)
```
POST /api/scores
Body: {
  userId: string,
  gameName: string,
  score: number,
  metadata?: object
}
```

### Get Leaderboard (to be implemented)
```
GET /api/leaderboard?game=mathmode&limit=10
```

## Future Enhancements

### Possible Additional Tables

**achievements**
- Track user achievements across games
- Unlock badges and rewards

**sessions**
- Track individual game sessions
- More detailed analytics

**friends**
- Friend system
- Compare scores with friends

**challenges**
- Daily/weekly challenges
- Special events

## Maintenance

### Backup
Vercel Postgres includes automatic backups. Check your Vercel dashboard for backup settings.

### Cleanup Old Scores (if needed)
```sql
-- Delete scores older than 1 year
DELETE FROM game_scores 
WHERE created_at < NOW() - INTERVAL '1 year';
```

### Reset User Stats
```sql
-- Use with caution!
UPDATE users 
SET 
  total_games_played = 0,
  total_score = 0;
  
DELETE FROM game_scores;
```

## Monitoring

Monitor database usage in Vercel dashboard:
- Storage size
- Query performance
- Connection count
- Error rates

---

Need to modify the schema? Update `lib/db.ts` and create a migration endpoint!

