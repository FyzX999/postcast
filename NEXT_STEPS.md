# ✅ Next Steps - Make Postcast Work

## Status: Code Deployed ✓

Your code with Supabase + Gemini + Basic Auth is now on GitHub and Vercel is rebuilding.

## 🚀 Do These 3 Things NOW:

### 1️⃣ Create Supabase Project (5 minutes)

1. Go to https://supabase.com → Sign in → "New Project"
2. Name it `postcast`, pick a password and region
3. Wait for it to be created (~2 min)

### 2️⃣ Create Database Tables (1 minute)

1. In Supabase, go to **SQL Editor** → **New query**
2. Paste this and click **Run**:

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  platforms JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file TEXT
);

CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  defaultDescription TEXT DEFAULT '',
  style TEXT DEFAULT '',
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO settings (id, defaultDescription, style) 
VALUES (1, '', '') ON CONFLICT (id) DO NOTHING;

CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

### 3️⃣ Add Environment Variables to Vercel (3 minutes)

1. In Supabase: **Project Settings** → **API** → Copy:
   - Project URL
   - anon public key

2. Go to https://vercel.com → Your `postcast` project → **Settings** → **Environment Variables**

3. Add these 5 variables (for Production, Preview, Development):

```
SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_KEY = eyJhbGc... (the long anon key)
GEMINI_API_KEY = (get from https://aistudio.google.com/apikey)
AUTH_USERNAME = admin (or whatever you want)
AUTH_PASSWORD = your-secure-password
```

4. **Save** → Go to **Deployments** → Click **...** on latest → **Redeploy**

## ✨ Done!

After redeployment finishes (1-2 min):

1. Visit https://postcast.vercel.app
2. Enter your username/password
3. Use the app!

---

**Having issues?** Check `SUPABASE_SETUP.md` for detailed instructions and troubleshooting.
