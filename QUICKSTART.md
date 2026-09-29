# Postcast - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. **Install & Configure**

```bash
# Navigate to the project
cd "path/to/mass poster"

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. **Edit .env File**

Add your API keys to `.env`:

```env
PORT=3000
PUBLIC_BASE_URL=http://localhost:3000
APP_PASSWORD=change-me

# For AI features (title, hashtags, optimization)
ANTHROPIC_API_KEY=your-key-here
AI_MODEL=claude-sonnet-4-6

# For YouTube Shorts (optional)
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret

# For TikTok (optional)
TIKTOK_CLIENT_KEY=your-key
TIKTOK_CLIENT_SECRET=your-secret

# For Instagram (optional)
META_APP_ID=your-id
META_APP_SECRET=your-secret
```

### 3. **Start the Server**

```bash
npm start
```

You should see:
```
ffmpeg not available - thumbnail generation disabled
Postcast running on http://localhost:3000
```

### 4. **Open in Browser**

- Go to http://localhost:3000
- Enter username (anything) and password (from `APP_PASSWORD`)
- Start uploading videos!

---

## 📝 Main Features

### 📤 **Post Tab**
- Upload video with drag-and-drop
- AI generates title & description
- Edit with video editor (trim, filters, speed)
- Select platforms and schedule
- One-click publish or schedule for later

### 📦 **Batch Upload Tab**
- Upload multiple videos at once
- Auto-generate different titles for each
- Schedule with staggered timing
- Post to all platforms simultaneously

### 📋 **History Tab**
- View all uploaded posts
- Filter by status (Scheduled, Published, etc.)
- Search by title/description
- Edit scheduled posts
- Delete posts

### 💰 **Earn Tab**
- Analytics dashboard with charts
- Followers, views, engagement metrics
- Platform-specific stats
- Monetization requirements tracker

### ⚙️ **Settings**
- Default description for all posts
- AI style notes (tone, voice)
- Advanced options:
  - Hashtag strategy
  - Video processing (aspect ratio)
  - Watermark settings

---

## 🎯 Common Tasks

### Upload & Publish a Video

1. Click "Post" tab
2. Drag video into upload area (or click to select)
3. Wait for preview to load
4. Describe the video in "What's this video about?"
5. Click "✨ Generate" for AI title/description
6. Edit if needed
7. Select platforms to post to
8. Click "📤 Publish Now"

### Schedule a Post for Later

1. Follow steps 1-6 above
2. Select date/time in "Schedule (Optional)"
3. Click "📅 Schedule Post"
4. Server will auto-publish at that time

### Generate Hashtags

1. In the description area
2. Click "🏷️ Suggest Hashtags"
3. Review suggestions
4. Click "✓ Add to Description"

### Optimize Description

1. Write or generate a description
2. Click "✨ Optimize Description"
3. AI improves it for engagement
4. Get tips for better performance

### View Analytics

1. Click "💰 Earn" tab
2. View "Overview" for quick stats
3. Check "Detailed Stats" for per-video metrics
4. View "Growth Trends" for interactive charts

---

## 🎨 Features Highlights

✨ **Modern UI** - Beautiful dark mode support, smooth animations  
🎬 **Video Editor** - Trim, filters, speed control, crop  
📅 **Scheduling** - Post now or schedule for later  
📦 **Batch Uploads** - Upload multiple videos at once  
📊 **Analytics** - Charts and engagement metrics  
🏷️ **Smart Hashtags** - AI generates trending hashtags  
💬 **Optimization** - AI improves your descriptions  
🔔 **Notifications** - Real-time alerts for all actions  
💾 **Auto-Save** - Form data persists in browser  
🌙 **Dark Mode** - Eye-friendly dark theme  

---

## 🔧 Troubleshooting

### "Port 3000 already in use"
```bash
# Use a different port
PORT=3001 npm start
```

### "API key error"
- Make sure your Anthropic API key is in `.env`
- Restart the server after changing `.env`

### "Upload fails silently"
- Check browser console (F12 > Console)
- Verify `PUBLIC_BASE_URL` in `.env` matches your URL
- Ensure `uploads/` folder exists (created automatically)

### "Video won't load"
- Try refreshing the page
- Check if file is a valid video format
- Try a smaller file size

---

## 📂 File Structure

```
mass poster/
├── public/index.html      ← All UI, styles, client code
├── server.js              ← Backend APIs
├── data/                  ← Stored data
│   ├── settings.json      ← User settings
│   ├── tokens.json        ← Platform tokens
│   └── history.json       ← Post history
├── uploads/               ← Video files
├── package.json           ← Dependencies
├── .env                   ← Configuration (create this!)
└── .env.example           ← Template
```

---

## 🌐 Platform API Keys

### YouTube Shorts
1. Go to https://console.cloud.google.com
2. Create project
3. Enable "YouTube Data API v3"
4. Create OAuth 2.0 Client ID (Web application)
5. Add callback: `http://localhost:3000/auth/youtube/callback`

### TikTok
1. Go to https://developers.tiktok.com
2. Create app in "Content Posting API"
3. Set callback: `http://localhost:3000/auth/tiktok/callback`

### Instagram
1. Go to https://developers.facebook.com
2. Create app (Consumer type)
3. Add Instagram Graph API product
4. Create test app or use existing
5. Add callback: `http://localhost:3000/auth/instagram/callback`

### Anthropic (AI Features)
1. Go to https://console.anthropic.com
2. Create API key
3. Add to `.env` as `ANTHROPIC_API_KEY`

---

## 💡 Pro Tips

1. **Vertical videos** (9:16) work best for TikTok, Reels, Shorts
2. **Use hashtags** - Generated suggestions are trending
3. **Batch uploads** - Schedule with staggered timing for consistency
4. **Check analytics** - See what performs best
5. **Optimize** - Let AI improve your descriptions
6. **Schedule smart** - Post when your audience is active
7. **Theme toggle** - Try dark mode for comfortable editing at night

---

## 📞 Support

**Issues?**
- Check IMPROVEMENTS.md for complete feature docs
- Verify API keys are correct
- Check browser console for errors (F12)
- Ensure server is running on correct port

**Want to customize?**
- Edit styling in the `<style>` tag in index.html
- Modify API endpoints in server.js
- Change colors by editing CSS variables (--bg, --accent, etc.)

---

## ✅ You're Ready!

Start uploading videos and growing your audience across all platforms at once. 🚀

Happy posting! 🎬
