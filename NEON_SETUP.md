# 🐘 Neon Postgres Setup

Your app is configured to work with Neon Postgres (via Vercel).

## ✅ What's Already Configured

The app uses `@vercel/postgres` which **automatically works** with Neon! No code changes needed.

## Environment Variables You Need

### Required (Automatically set by Vercel)

When you created the Neon database in Vercel, these were auto-set:

```bash
POSTGRES_URL=                    # Main connection (pooled)
POSTGRES_URL_NON_POOLING=        # Direct connection (for migrations)
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
```

### For Local Development

Copy these from your Vercel project:
1. Go to your Vercel project
2. Click **Settings** → **Environment Variables**
3. Copy all `POSTGRES_*` variables to your local `.env.local`

### Additional Variables You Might See

Neon also provides these (optional):
- `DATABASE_URL` - Alternative to POSTGRES_URL
- `DATABASE_URL_UNPOOLED` - Alternative to POSTGRES_URL_NON_POOLING
- `PGHOST`, `PGUSER`, etc. - Individual parameters

**You don't need these** - the app uses `POSTGRES_URL` by default.

## How It Works

The `@vercel/postgres` package looks for environment variables in this order:

1. ✅ `POSTGRES_URL` (what Neon/Vercel uses) ← **You're using this**
2. `DATABASE_URL` (alternative)
3. Individual parameters (`POSTGRES_HOST`, `POSTGRES_USER`, etc.)

## Your .env.local Should Look Like

```bash
# Privy (your auth)
NEXT_PUBLIC_PRIVY_APP_ID=clp_xxxxx
PRIVY_APP_SECRET=xxxxx

# Neon Postgres (from Vercel)
POSTGRES_URL=postgres://user:pass@host/db?sslmode=require
POSTGRES_URL_NON_POOLING=postgres://user:pass@host/db?sslmode=require
POSTGRES_USER=default
POSTGRES_HOST=ep-xxx-xxx.us-east-1.aws.neon.tech
POSTGRES_PASSWORD=xxxxx
POSTGRES_DATABASE=verceldb
```

## Database Initialization

After setting up your .env.local:

1. Run dev server: `npm run dev`
2. Visit: `http://localhost:3000/api/init-db`
3. Should see: `{"message":"Database initialized successfully"}`
4. Delete `/app/api/init-db/route.ts`

## Verifying Connection

The app will automatically connect using `POSTGRES_URL`. You can verify by:

1. Sign in to your app
2. Check Vercel logs for database queries
3. Check Neon dashboard for active connections

## Troubleshooting

### "Connection error"
- Verify `POSTGRES_URL` is set correctly
- Check Neon dashboard that database is active
- Ensure connection string includes `?sslmode=require`

### "Authentication failed"
- Password might have special characters
- Copy exact value from Vercel (don't manually type)

### "Table does not exist"
- Run `/api/init-db` to create tables
- Check Neon SQL Editor to verify tables exist

## Neon Dashboard Access

View your database directly:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Your project → **Storage** tab
3. Click your Neon database
4. Click **Data** to see tables
5. Click **SQL Editor** to run queries

## Connection Limits

Neon free tier includes:
- ✅ 0.5 GB storage
- ✅ Unlimited databases
- ✅ Auto-suspend after 5 min inactivity
- ✅ Auto-resume on query

Your app works perfectly with these limits!

## Migration from Old Setup

If you previously used different Postgres:
1. Your code already works! No changes needed
2. Just update environment variables
3. Run `/api/init-db` to create tables
4. You're done! ✅

---

**TL;DR:** Your app already works with Neon! Just make sure `POSTGRES_URL` is set in `.env.local` and Vercel. 🚀

