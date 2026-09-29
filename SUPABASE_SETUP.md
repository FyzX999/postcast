# Supabase Setup for Postcast

## 1. Create Supabase Project

1. Go to https://supabase.com
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - Project name: `postcast` (or your preferred name)
   - Database password: Choose a strong password (save it!)
   - Region: Choose closest to your users
   - Pricing plan: Free tier is fine for starting
5. Click "Create new project" and wait 1-2 minutes

## 2. Create Database Tables

Once your project is created:

1. Go to "SQL Editor" in the left sidebar
2. Click "New query"
3. Copy and paste the following SQL:

```sql
-- Create posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  platforms JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file TEXT
);

-- Create settings table
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  defaultDescription TEXT DEFAULT '',
  style TEXT DEFAULT '',
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default settings row
INSERT INTO settings (id, defaultDescription, style) 
VALUES (1, '', '')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_status ON posts(status);
```

4. Click "Run" or press `Ctrl+Enter`
5. You should see "Success. No rows returned"

## 3. Get Supabase Credentials

1. Go to "Project Settings" (gear icon in left sidebar)
2. Click "API" in the settings menu
3. You'll see two important values:

   **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   **anon public key**: `eyJhbGc...` (long string)

4. Copy both of these - you'll need them for Vercel

## 4. Configure Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Click on your "postcast" project
3. Go to "Settings" tab
4. Click "Environment Variables" in the left sidebar
5. Add the following variables (click "Add" for each):

### Required Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `SUPABASE_URL` | Your Project URL from step 3 | Production, Preview, Development |
| `SUPABASE_KEY` | Your anon public key from step 3 | Production, Preview, Development |
| `GEMINI_API_KEY` | Get from https://aistudio.google.com/apikey | Production, Preview, Development |
| `AUTH_USERNAME` | Your chosen username (e.g., `admin`) | Production, Preview, Development |
| `AUTH_PASSWORD` | Your chosen password (make it strong!) | Production, Preview, Development |

### Optional Variable:

| Name | Value | Environment |
|------|-------|-------------|
| `PUBLIC_BASE_URL` | `https://postcast.vercel.app` | Production |

6. After adding all variables, click "Save"

## 5. Redeploy

The site should automatically redeploy after the git push. If not:

1. Go to "Deployments" tab in Vercel
2. Click the three dots (...) on the latest deployment
3. Click "Redeploy"
4. Check "Use existing Build Cache" can be OFF
5. Click "Redeploy"

## 6. Test Your Site

1. Wait for deployment to complete (1-2 minutes)
2. Visit https://postcast.vercel.app
3. You should see a login prompt
4. Enter the username and password you set in step 4
5. You should now see the Postcast app!

## Troubleshooting

### 500 Error persists
- Check Vercel logs: Deployments → [latest deployment] → Runtime Logs
- Verify all environment variables are set correctly
- Make sure Supabase tables were created successfully

### Login doesn't work
- Double-check `AUTH_USERNAME` and `AUTH_PASSWORD` in Vercel
- Clear browser cache and try again
- Try incognito/private browsing mode

### Supabase errors
- Check that your Supabase project is active (not paused)
- Verify the `SUPABASE_URL` and `SUPABASE_KEY` are correct
- Go to Supabase → SQL Editor and verify tables exist

### Gemini AI not working
- Get your API key from https://aistudio.google.com/apikey
- Verify `GEMINI_API_KEY` is set in Vercel
- The app will use fallback titles if Gemini fails (this is normal)

## What's Next?

Your basic Postcast app is now running! Here's what you can do:

- **Upload videos**: The upload feature needs Supabase Storage setup (optional)
- **Connect platforms**: Add OAuth for YouTube, TikTok, Instagram (advanced)
- **Customize styling**: Edit the settings in the app
- **View posts**: All published posts are saved in Supabase

## Security Notes

- The `anon public` key is safe to use in client-side code
- Your database is protected by Row Level Security (RLS) - you may want to set policies
- Consider changing your AUTH_PASSWORD regularly
- Never commit your `.env` file to git (it's already in .gitignore)
