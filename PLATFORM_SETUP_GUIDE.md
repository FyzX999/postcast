# 🚀 Complete Platform Setup Guide

All platforms with instant API access - no approval waiting!

---

## 1️⃣ YouTube Shorts (HIGHEST PRIORITY)

### Monetization: HIGH ($100-$10K+/month)
- Partner Program pays $0.01-0.05 per 1K views
- Best long-term earning potential

### Setup (5 minutes):

1. **Google Cloud Console:** https://console.cloud.google.com/
2. **Create Project** → Name it "Postcast"
3. **Enable API:** Search "YouTube Data API v3" → Enable
4. **Create Credentials:**
   - APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URI: `https://postcast.vercel.app/api/oauth/youtube/callback`
5. **Copy credentials** to Vercel:

```
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
```

---

## 2️⃣ Twitter/X (INSTANT VIRAL POTENTIAL)

### Monetization: MEDIUM (Premium revenue sharing)
- X Premium creators earn from ads
- Great for viral clips

### Setup (10 minutes):

1. **Twitter Developer Portal:** https://developer.twitter.com/
2. **Sign up** for developer account (instant approval for basic)
3. **Create Project** → Create App
4. **App Settings:**
   - Enable OAuth 2.0
   - Callback URL: `https://postcast.vercel.app/api/oauth/twitter/callback`
   - Website URL: `https://postcast.vercel.app`
5. **Keys and Tokens:**
   - Copy Client ID and Client Secret
6. **Add to Vercel:**

```
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
```

---

## 3️⃣ Facebook Reels

### Monetization: LOW-MEDIUM (Ad revenue)
- $0.01-0.03 per 1K views
- Uses same Meta app as Instagram

### Setup (15 minutes):

1. **Meta for Developers:** https://developers.facebook.com/
2. **Create App** → Business type
3. **Add Product:** Facebook Login
4. **Settings:**
   - Valid OAuth Redirect URIs: `https://postcast.vercel.app/api/oauth/facebook/callback`
5. **Get App ID and Secret**
6. **Add to Vercel:**

```
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
```

---

## 4️⃣ LinkedIn

### Monetization: NONE (Great for B2B reach)
- No direct monetization
- Best for professional/business content

### Setup (15 minutes):

1. **LinkedIn Developers:** https://www.linkedin.com/developers/
2. **Create App**
3. **App Settings:**
   - Redirect URLs: `https://postcast.vercel.app/api/oauth/linkedin/callback`
   - Request "Share on LinkedIn" and "Sign In with LinkedIn" products
4. **Get credentials:**
   - Client ID
   - Client Secret
5. **Add to Vercel:**

```
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
```

---

## 5️⃣ Pinterest

### Monetization: LOW (Creator Rewards + Affiliate)
- Creator Rewards program
- Great for evergreen content

### Setup (10 minutes):

1. **Pinterest Developers:** https://developers.pinterest.com/
2. **Create App**
3. **App Settings:**
   - Redirect URI: `https://postcast.vercel.app/api/oauth/pinterest/callback`
   - Scopes: boards:read, boards:write, pins:read, pins:write
4. **Get credentials:**
   - App ID
   - App Secret
5. **Add to Vercel:**

```
PINTEREST_APP_ID=your_app_id
PINTEREST_APP_SECRET=your_app_secret
```

---

## 6️⃣ Rumble (HIGHEST CPM!)

### Monetization: VERY HIGH ($0.25-$1.50 per 1K views)
- Highest CPM of any platform
- Growing alternative to YouTube

### Setup (10 minutes):

1. **Rumble:** https://rumble.com/
2. **Create Account** + Become a creator
3. **Creator Studio** → API Access
4. **Generate API Key**
5. **Add to Vercel:**

```
RUMBLE_API_KEY=your_api_key
```

---

## 🎯 Quick Start Order:

### Week 1: Core Platforms
1. **YouTube Shorts** (30 min) - Highest earning
2. **Twitter/X** (20 min) - Viral potential
3. **Rumble** (20 min) - Highest CPM

### Week 2: Additional Reach
4. **Facebook Reels** (25 min) - Extra reach
5. **Pinterest** (20 min) - Evergreen content
6. **LinkedIn** (25 min) - B2B content

---

## 📝 Complete Environment Variables List:

Add all of these to **Vercel → Settings → Environment Variables**:

```bash
# YouTube
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=

# Twitter/X
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=

# Facebook
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# Pinterest
PINTEREST_APP_ID=
PINTEREST_APP_SECRET=

# Rumble
RUMBLE_API_KEY=

# Already configured:
TIKTOK_CLIENT_KEY=awn04eiky3396hds
TIKTOK_CLIENT_SECRET=bvkymGUIZONJ4k5nbNMMoucWmaMFgLN9
GEMINI_API_KEY=[your existing key]
SUPABASE_URL=[your existing url]
SUPABASE_KEY=[your existing key]
AUTH_USERNAME=[your username]
AUTH_PASSWORD=[your password]
```

---

## 💰 Expected Revenue (with good content):

**Per 1M views:**
- Rumble: $250 - $1,500 🔥
- YouTube Shorts: $100 - $500
- TikTok: $200 - $400
- X/Twitter: $100 - $300
- Facebook: $100 - $300
- Instagram: $0 (unless invited to bonus)
- Pinterest: $50 - $150
- LinkedIn: $0

**Total potential per 1M views across all platforms: $800 - $3,150**

---

## 🚀 Next Steps:

1. Start with YouTube Shorts (easiest + highest pay)
2. Set up credentials for each platform
3. Add all env vars to Vercel
4. I'll implement all OAuth flows
5. Test each connection
6. Start posting!

**Ready to set these up?** Let me know when you have the credentials and I'll implement all the OAuth flows!
