# ⚡ Quick Start - Get Running in 5 Minutes

## 1. Install Dependencies (1 min)

```bash
cd /Users/moises/apps/moimac
npm install
```

## 2. Set Up Privy (2 min)

1. Visit [dashboard.privy.io](https://dashboard.privy.io/)
2. Create account / Sign in
3. Create new app
4. In your app dashboard, go to **Settings**
5. Copy **App ID** and **App Secret**
6. Create `.env.local`:

```bash
cp env.example .env.local
```

7. Edit `.env.local` and add both:
```
NEXT_PUBLIC_PRIVY_APP_ID=your_app_id_here
PRIVY_APP_SECRET=your_app_secret_here
```

**Important:** The App ID is public (sent to browser), but the App Secret is private (server-only). Never commit `.env.local` to git!

## 3. Deploy to Vercel (2 min)

```bash
# Push to GitHub first
git init
git add .
git commit -m "Initial commit"
# Create GitHub repo, then:
git remote add origin YOUR_GITHUB_URL
git push -u origin main

# Deploy to Vercel
npx vercel
```

Then in Vercel dashboard:
1. Go to your project → **Storage** → **Create Database** → **Postgres**
2. Go to **Settings** → **Environment Variables**
3. Add both Privy variables:
   - `NEXT_PUBLIC_PRIVY_APP_ID` = your App ID
   - `PRIVY_APP_SECRET` = your App Secret
4. Redeploy

## 4. Initialize Database (30 sec)

Visit: `https://your-app.vercel.app/api/init-db`

You should see: `{"message":"Database initialized successfully"}`

**Then delete** `app/api/init-db/route.ts` for security!

## 5. Test! ✅

1. Visit your app
2. Click "Sign In with Email"
3. Enter your email
4. Check email for code
5. Enter code
6. You're in!

---

## Next Steps

- Read [INTEGRATING_GAMES.md](./INTEGRATING_GAMES.md) to add your first game
- Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions
- Review [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) to understand data structure

## Troubleshooting

**"Invalid App ID"** → Check `.env.local` has correct Privy App ID

**"Database error"** → Make sure you created Postgres database on Vercel

**Not redirecting after login** → Clear browser cache and try again

---

🎮 Ready to add games! Start with MathMode migration.

