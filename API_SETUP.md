# 🔌 Connecting Platform APIs

This guide shows you how to connect YouTube, TikTok, and Instagram APIs to enable automatic posting.

## Overview

Each platform requires:
1. **Developer Account** - Register as a developer
2. **Create App** - Register your application
3. **OAuth Credentials** - Get Client ID and Client Secret
4. **Add to Vercel** - Store credentials as environment variables
5. **Implement OAuth Flow** - Let users connect their accounts

---

## 1️⃣ YouTube (YouTube Shorts)

### Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Click "Create Project"
3. Name it: `Postcast` or your app name
4. Wait for project to be created

### Step 2: Enable YouTube Data API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "YouTube Data API v3"
3. Click it and press **"Enable"**

### Step 3: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. If prompted, configure **OAuth consent screen** first:
   - User Type: **External**
   - App name: `Postcast`
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `youtube.upload`, `youtube.readonly`
   - Test users: Add your email (for testing)
4. Back to Create OAuth client ID:
   - Application type: **Web application**
   - Name: `Postcast Web`
   - Authorized redirect URIs: `https://postcast.vercel.app/api/oauth/youtube/callback`
5. Click **Create**
6. Copy your **Client ID** and **Client Secret**

### Step 4: Add to Vercel

In Vercel → Settings → Environment Variables, add:
```
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_REDIRECT_URI=https://postcast.vercel.app/api/oauth/youtube/callback
```

---

## 2️⃣ TikTok

### Step 1: Register as TikTok Developer

1. Go to https://developers.tiktok.com/
2. Click **"Sign up"** or **"Login"**
3. Register as a developer (requires verification)

### Step 2: Create App

1. Go to **"Manage apps"**
2. Click **"Connect an app"** → **"Create"**
3. Fill in:
   - App name: `Postcast`
   - App category: `Social Media`
   - Description: Your app description
4. Submit for review (may take 1-3 days)

### Step 3: Get Credentials

1. Once approved, go to your app
2. Go to **"Settings"** → **"Credentials"**
3. Copy **Client Key** and **Client Secret**
4. Add **Redirect URI**: `https://postcast.vercel.app/api/oauth/tiktok/callback`

### Step 4: Request API Access

1. Go to **"Permissions"**
2. Request access to:
   - `video.upload`
   - `user.info.basic`
   - `video.publish`
3. Wait for approval (1-3 days)

### Step 5: Add to Vercel

In Vercel → Settings → Environment Variables, add:
```
TIKTOK_CLIENT_KEY=your_client_key_here
TIKTOK_CLIENT_SECRET=your_client_secret_here
TIKTOK_REDIRECT_URI=https://postcast.vercel.app/api/oauth/tiktok/callback
```

---

## 3️⃣ Instagram (Meta)

### Step 1: Create Meta Developer Account

1. Go to https://developers.facebook.com/
2. Click **"Get Started"**
3. Complete registration and verification

### Step 2: Create App

1. Click **"My Apps"** → **"Create App"**
2. Use case: **"Other"** → **"Business"**
3. App name: `Postcast`
4. App contact email: Your email
5. Click **Create**

### Step 3: Add Instagram API

1. In your app dashboard, find **"Instagram Basic Display"**
2. Click **"Set Up"**
3. Create New App:
   - Display Name: `Postcast`
   - Valid OAuth Redirect URIs: `https://postcast.vercel.app/api/oauth/instagram/callback`
   - Deauthorize Callback URL: `https://postcast.vercel.app/api/oauth/instagram/deauth`
   - Data Deletion Request URL: `https://postcast.vercel.app/api/oauth/instagram/delete`
4. Save Changes

### Step 4: Get Credentials

1. Go to **"Instagram Basic Display"** → **"Basic Display"**
2. Copy **Instagram App ID** and **Instagram App Secret**

### Step 5: Add Test Users

1. Go to **"Roles"** → **"Instagram Testers"**
2. Add Instagram accounts (your test accounts)
3. Accept invitation on Instagram app

### Step 6: Add to Vercel

In Vercel → Settings → Environment Variables, add:
```
INSTAGRAM_CLIENT_ID=your_instagram_app_id_here
INSTAGRAM_CLIENT_SECRET=your_instagram_app_secret_here
INSTAGRAM_REDIRECT_URI=https://postcast.vercel.app/api/oauth/instagram/callback
```

---

## 4️⃣ Implementation Code

Once you have all the credentials, I can help you implement the OAuth flow. The basic structure:

### Backend Routes Needed:
- `GET /api/oauth/:platform/connect` - Starts OAuth flow
- `GET /api/oauth/:platform/callback` - Handles OAuth callback
- `POST /api/upload/:platform` - Uploads video to platform
- `GET /api/oauth/:platform/status` - Checks connection status

### Would you like me to:
1. ✅ **Implement YouTube OAuth** (easiest to start with)
2. ✅ **Implement TikTok OAuth** (after approval)
3. ✅ **Implement Instagram OAuth** (requires business account)
4. ✅ **Add token refresh logic** (keeps connections alive)

---

## Quick Start Guide

### Start with YouTube (Fastest):
1. Create Google Cloud project (5 min)
2. Enable YouTube API (1 min)
3. Create OAuth credentials (5 min)
4. Add to Vercel (2 min)
5. I'll implement the code (10 min)
6. Test connection (2 min)

**Total time: ~25 minutes** to have working YouTube uploads!

### Then Add TikTok & Instagram:
- TikTok requires app approval (1-3 days wait)
- Instagram requires business account
- Same implementation pattern

---

## Alternative: Manual Upload Links

If you don't want to wait for API approvals, we can implement **manual posting**:
- Generate optimized captions
- Copy to clipboard
- Open platform's upload page
- Paste and post manually

This works immediately but isn't fully automated.

---

## What would you like to do first?

1. **Start with YouTube** - I'll implement OAuth and upload now
2. **Start approvals** - I'll guide you through registering all platforms
3. **Manual mode** - I'll add clipboard copy and direct links
4. **All of the above** - Full implementation

Let me know and I'll help you set it up! 🚀
