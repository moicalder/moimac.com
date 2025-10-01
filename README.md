# MoiMac Games

Your central gaming hub with authentication, user profiles, and global leaderboards.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Privy account ([dashboard.privy.io](https://dashboard.privy.io/))
- A Vercel account for database hosting

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Privy Authentication

1. Go to [Privy Dashboard](https://dashboard.privy.io/)
2. Create a new app or use existing one
3. Copy your App ID
4. Create `.env.local` file in the root:

```bash
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
```

### 3. Set Up Vercel Postgres Database

#### Option A: Via Vercel Dashboard (Recommended)

1. Push your code to GitHub
2. Import to Vercel
3. In your Vercel project, go to **Storage** → **Create Database**
4. Select **Postgres**
5. Create database
6. Vercel will automatically set environment variables

#### Option B: Local Development

1. Create a Postgres database on Vercel
2. Go to your project settings → Environment Variables
3. Copy all `POSTGRES_*` variables to your `.env.local`

### 4. Initialize Database Tables

Once your database is connected:

```bash
npm run dev
```

Then visit: `http://localhost:3000/api/init-db`

This will create the necessary tables. **Delete the `/app/api/init-db/route.ts` file after running this once** for security.

### 5. Start Developing

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
moimac/
├── app/
│   ├── api/              # API routes
│   │   ├── user/         # User profile endpoints
│   │   └── init-db/      # Database initialization (delete after use)
│   ├── games/            # Future game pages
│   ├── layout.tsx        # Root layout with Privy provider
│   ├── page.tsx          # Landing page
│   └── globals.css       # Global styles
├── lib/
│   ├── providers.tsx     # Privy provider configuration
│   └── db.ts             # Database utilities
└── public/               # Static assets
```

## 🎮 Adding New Games

To add a new game:

1. Create a new folder in `app/games/[game-name]/`
2. Add `page.tsx` for your game
3. Update the games array in `app/page.tsx`
4. User authentication is automatically available via `usePrivy()` hook

## 🗄️ Database Schema

### Users Table
- `id` - User's Privy ID (primary key)
- `email` - User's email
- `username` - Display name
- `avatar_url` - Profile picture URL
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp
- `total_games_played` - Total games across all games
- `total_score` - Cumulative score

### Game Scores Table
- `id` - Auto-increment ID
- `user_id` - Foreign key to users
- `game_name` - Name of the game
- `score` - Score achieved
- `metadata` - JSON data (difficulty, mode, etc.)
- `created_at` - When score was recorded

## 🔐 Authentication

This project uses [Privy](https://privy.io) for authentication:
- Email-only login (no wallet required)
- Secure, managed authentication
- Easy integration with `usePrivy()` hook

## 🚀 Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

### Environment Variables on Vercel

Make sure to set:
- `NEXT_PUBLIC_PRIVY_APP_ID` in Vercel project settings
- Postgres variables are auto-set when you connect the database

## 📝 TODO

- [x] Set up Next.js with TypeScript
- [x] Integrate Privy authentication
- [x] Set up Vercel Postgres
- [x] Create user database schema
- [x] Build landing page
- [ ] Migrate MathMode game
- [ ] Migrate Snake game
- [ ] Migrate Runner game
- [ ] Build global leaderboard
- [ ] Add user profile editing

## 🛠️ Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Privy** - Authentication
- **Vercel Postgres** - Database
- **Vercel** - Hosting

## 📄 License

MIT

