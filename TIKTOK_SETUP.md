# 🎵 TikTok Connection Setup

Your TikTok credentials are configured! Now let's get it working.

## ✅ Step 1: Add to Vercel Environment Variables

Go to https://vercel.com → Your Project → Settings → Environment Variables

Add these **3 variables** (for Production, Preview, Development):

```
TIKTOK_CLIENT_KEY=awn04eiky3396hds
TIKTOK_CLIENT_SECRET=bvkymGUIZONJ4k5nbNMMoucWmaMFgLN9  
TIKTOK_PRIVACY=SELF_ONLY
```

## ✅ Step 2: Create Supabase Table

Go to Supabase → SQL Editor → New Query

Run this SQL:

```sql
-- Table to store connected social media accounts
CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  platform TEXT NOT NULL,
  platform_user_id TEXT,
  platform_username TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(username, platform)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user 
ON connected_accounts(username, platform);

-- Optional: Enable Row Level Security
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own connections
CREATE POLICY "Users can view own connections" 
ON connected_accounts FOR SELECT 
USING (username = current_user);

CREATE POLICY "Users can insert own connections" 
ON connected_accounts FOR INSERT 
WITH CHECK (username = current_user);

CREATE POLICY "Users can update own connections" 
ON connected_accounts FOR UPDATE 
USING (username = current_user);

CREATE POLICY "Users can delete own connections" 
ON connected_accounts FOR DELETE 
USING (username = current_user);
```

## ✅ Step 3: Deploy Code

I've already updated the code. Just commit and push:

```bash
git add server.js
git commit -m "Add TikTok OAuth integration"
git push origin main
```

## ✅ Step 4: Connect Your TikTok Account

Once deployed (1-2 minutes):

1. Go to https://postcast.vercel.app
2. In "Connected Accounts", find **TikTok**
3. Click **"🔗 Connect"** button
4. Login to TikTok and authorize the app
5. You'll be redirected back to Postcast
6. TikTok will show as **Connected** ✅

## 🎬 Step 5: Post to TikTok!

Now when you create a post:
1. Check the **TikTok** checkbox
2. Upload your video
3. Add title and description
4. Click **"📤 Publish Now"**
5. Your video will be posted to TikTok!

## ⚠️ Important Notes

### Privacy Setting
- `TIKTOK_PRIVACY=SELF_ONLY` means videos are private (only you can see)
- Once TikTok approves your app for production, change to `PUBLIC_TO_EVERYONE`
- This is required during testing phase

### API Scopes
Make sure your TikTok app has these scopes approved:
- ✅ `user.info.basic` - Get user info
- ✅ `video.upload` - Upload videos
- ✅ `video.publish` - Publish videos

### Testing Phase
- During testing, only accounts added as "Test Users" can connect
- Go to TikTok Developer Portal → Your App → Test Users
- Add your TikTok account there first

## 🐛 Troubleshooting

### "TikTok not configured" error
→ Environment variables not in Vercel yet

### "Authorization failed" error
→ Check redirect URI matches: `https://postcast.vercel.app/api/oauth/tiktok/callback`

### "Scope not approved" error  
→ Request scopes in TikTok Developer Portal → Your App → Permissions

### Connection doesn't persist
→ Supabase table not created yet

## 🚀 Next Steps

Once TikTok works:
1. Add YouTube connection (similar OAuth flow)
2. Add Instagram connection
3. Test video uploads
4. Apply for TikTok production approval

Let me know when you're ready to connect!
