# 🚀 Setup Guide for MoiMac Games

Follow these steps to get your gaming hub up and running!

## Step 1: Install Dependencies

```bash
cd /Users/moises/apps/moimac
npm install
```

## Step 2: Set Up Privy (Authentication)

### 2.1 Create Privy Account
1. Go to [https://dashboard.privy.io/](https://dashboard.privy.io/)
2. Sign up or log in
3. Click "Create New App"

### 2.2 Configure Privy App
1. Give your app a name (e.g., "MoiMac Games")
2. In the app settings:
   - Go to **Login Methods**
   - Enable **Email** only
   - Disable wallet options (we don't need crypto)
3. Copy your **App ID** from the dashboard

### 2.3 Set Environment Variables
1. In your project root, create `.env.local` file:
```bash
cp env.example .env.local
```

2. Edit `.env.local` and add your Privy credentials:
```
NEXT_PUBLIC_PRIVY_APP_ID=clxxxxxxxxxxxxxxxxxxxx
PRIVY_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Where to find these:**
- Go to your Privy app dashboard
- Click **Settings** in the left sidebar
- You'll see both **App ID** and **App Secret**
- Copy both values

**Security Note:**
- `NEXT_PUBLIC_PRIVY_APP_ID` - Safe to expose (sent to browser)
- `PRIVY_APP_SECRET` - **NEVER expose** (server-side only)
- Never commit `.env.local` to git (it's already in .gitignore)

## Step 3: Set Up Postgres Database (Neon or Vercel Postgres)

**Good News:** The app works with both Neon Postgres and Vercel Postgres! When you create a database in Vercel, it uses Neon behind the scenes.

You have two options:

### Option A: Deploy to Vercel First (Easiest)

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
# Create a repo on GitHub, then:
git remote add origin https://github.com/yourusername/moimac.git
git push -u origin main
```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repo
   - Vercel will auto-detect Next.js

3. **Add Database:**
   - In your Vercel project dashboard
   - Click **Storage** tab
   - Click **Create Database**
   - Select **Postgres** (powered by Neon)
   - Click **Create**
   - Environment variables are automatically added!
   
   **Note:** Vercel uses Neon Postgres. You'll see variables like `POSTGRES_URL`, `DATABASE_URL`, etc. The app uses `POSTGRES_URL` by default.

4. **Add Privy App ID to Vercel:**
   - Go to **Settings** → **Environment Variables**
   - Add: `NEXT_PUBLIC_PRIVY_APP_ID` with your Privy App ID
   - Redeploy the project

5. **Initialize Database:**
   - Visit: `https://your-app.vercel.app/api/init-db`
   - You should see success message
   - **IMPORTANT:** Delete `/app/api/init-db/route.ts` after this!

### Option B: Local Development First

1. **Create Database on Vercel:**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Create new project (can be empty)
   - Go to **Storage** → **Create Database** → **Postgres**

2. **Get Database Credentials:**
   - After creating database, go to **.env.local** tab
   - You'll see many variables (POSTGRES_URL, DATABASE_URL, etc.)
   - Copy at minimum: `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING`
   - Optionally copy all `POSTGRES_*` variables
   - Paste into your local `.env.local` file

3. **Run Development Server:**
```bash
npm run dev
```

4. **Initialize Database:**
   - Visit: `http://localhost:3000/api/init-db`
   - You should see success message
   - Delete `/app/api/init-db/route.ts` after this

## Step 4: Test Authentication

1. Start dev server: `npm run dev`
2. Open `http://localhost:3000`
3. Click "Sign In with Email"
4. Enter your email
5. Check your email for verification code
6. Enter code and you're in!

## Step 5: Verify User Database

You can verify users are being created by:
1. Going to Vercel dashboard
2. Click on your Storage
3. Click **Data** tab
4. You should see `users` and `game_scores` tables

## 🎮 Next Steps

Your authentication and user system is ready! Next you can:

1. **Migrate MathMode** - Move your math game into `/app/games/mathmode/`
2. **Add More Games** - Bring in Snake and Runner
3. **Build Leaderboards** - Create game-specific and global leaderboards
4. **Customize Profile** - Add profile editing features

## 🐛 Troubleshooting

### "Privy App ID not found"
- Make sure `.env.local` exists and has `NEXT_PUBLIC_PRIVY_APP_ID`
- Restart your dev server after adding env variables

### "Database connection error"
- Verify all `POSTGRES_*` variables are in `.env.local`
- Check Vercel dashboard for correct values
- Make sure you're using the right database region

### "Unauthorized" errors
- The current user API needs to be updated to properly verify Privy tokens
- For now, it's a placeholder - we'll fix this when integrating games

### Can't initialize database
- Make sure database is created on Vercel
- Check environment variables are correct
- Look at browser console and terminal for error messages

## 📚 Resources

- [Privy Docs](https://docs.privy.io/)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## Need Help?

Check the main README.md for more details or raise an issue!

