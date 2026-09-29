# 🎬 Postcast

**Upload once. Post everywhere.**

A modern, feature-rich platform for creating and publishing short-form videos to multiple platforms (TikTok, Instagram, YouTube Shorts, Snapchat) with AI-powered content optimization.

![Version](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-production%20ready-success)

---

## ✨ Features

### 📤 **Core Features**
- 🎯 Post to multiple platforms simultaneously
- ✏️ AI-powered title and description generation
- 📅 Schedule posts for later (auto-publish)
- 📦 Batch upload multiple videos
- 🎬 Built-in video editor (trim, filters, speed)
- 📊 Advanced analytics dashboard
- 🏷️ AI-generated hashtag suggestions
- 💬 Content optimization tools

### 🎨 **UI/UX**
- Modern, responsive design
- Dark mode support
- Real-time notifications
- Drag-and-drop file upload
- Beautiful animations
- Form auto-save

### 📊 **Analytics**
- Followers tracking
- Views and engagement metrics
- Platform breakdown
- Top performing videos
- Interactive charts
- Growth trends

### 🔐 **Security**
- Password-protected access
- OAuth2 authentication with platforms
- API key management
- Secure token storage

---

## 🚀 Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/postcast.git
cd postcast

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Add your API keys to .env
# (See DEPLOYMENT.md for details)

# Start the server
npm start

# Open http://localhost:3000
```

### Deploy to Vercel

```bash
# Push to GitHub
git push origin main

# Go to https://vercel.com
# Import your repository
# Add environment variables
# Deploy!
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## 📋 Supported Platforms

| Platform | Status | Features |
|----------|--------|----------|
| **TikTok** | ✅ Configured | Upload, OAuth, Analytics |
| **Instagram Reels** | ✅ Configured | Upload, OAuth, Analytics |
| **YouTube Shorts** | ✅ Configured | Upload, OAuth, Analytics |
| **Snapchat** | ⚠️ Manual | Download link for manual upload |
| **Facebook** | 🔄 In Development | Coming soon |

---

## 🛠️ Tech Stack

### Frontend
- Vanilla JavaScript (no dependencies)
- HTML5 & CSS3
- Chart.js for visualizations
- LocalStorage for persistence

### Backend
- Node.js + Express.js
- Multer for file uploads
- Anthropic Claude API for AI
- OAuth2 for platform authentication

### Deployment
- Vercel (serverless)
- GitHub for version control

---

## 📁 Project Structure

```
postcast/
├── public/
│   └── index.html          # Complete UI & client logic
├── server.js               # Backend APIs & auth
├── package.json            # Dependencies
├── vercel.json             # Vercel configuration
├── .env.example            # Environment template
├── DEPLOYMENT.md           # Deployment guide
├── IMPROVEMENTS.md         # Feature documentation
└── QUICKSTART.md           # Quick start guide
```

---

## 🎯 Key Endpoints

### Authentication
- `GET /auth/:platform` - OAuth login
- `GET /auth/:platform/callback` - OAuth callback
- `POST /api/disconnect/:platform` - Logout

### Content Management
- `POST /api/upload` - Upload video
- `POST /api/publish` - Publish to platforms
- `POST /api/posts` - Get post history
- `POST /api/posts/:id/delete` - Delete post

### AI Features
- `POST /api/generate` - Generate title/description
- `POST /api/suggest-hashtags` - Suggest hashtags
- `POST /api/optimize-content` - Optimize description

### Settings & Analytics
- `GET /api/settings` - Get user settings
- `POST /api/settings` - Update settings
- `GET /api/analytics` - Get platform analytics
- `GET /api/platforms` - List connected platforms

---

## 🔑 Environment Variables

```env
# Server
PORT=3000
PUBLIC_BASE_URL=http://localhost:3000
APP_PASSWORD=your-secure-password

# AI (Anthropic)
ANTHROPIC_API_KEY=sk-xxx
AI_MODEL=claude-sonnet-4-6

# TikTok
TIKTOK_CLIENT_KEY=xxx
TIKTOK_CLIENT_SECRET=xxx
TIKTOK_PRIVACY=SELF_ONLY

# YouTube
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Instagram
META_APP_ID=xxx
META_APP_SECRET=xxx
```

---

## 📸 Screenshots

### Login Screen
Beautiful, modern authentication interface.

### Main Dashboard
Clean interface with multiple tabs for posting, batch uploads, history, and analytics.

### Video Editor
Built-in editor with trimming, filters, speed control, and aspect ratio presets.

### Analytics Dashboard
Interactive charts and engagement metrics from all platforms.

---

## 🚀 Deployment

### Option 1: Vercel (Recommended)
- Zero configuration
- Auto-deploys on GitHub push
- Free tier available
- See [DEPLOYMENT.md](./DEPLOYMENT.md)

### Option 2: Traditional Server
- Railway, Heroku, DigitalOcean
- Persistent file storage
- Better for production with large files

---

## 💡 Usage Tips

1. **Best Performance**: Use vertical videos (9:16) for TikTok/Reels/Shorts
2. **Hashtags**: Generate after writing description
3. **Batch Uploads**: Use staggered timing for consistent presence
4. **Analytics**: Check Growth Trends for performance patterns
5. **Scheduling**: Post during peak engagement times

---

## 🔮 Roadmap

- [ ] Video trimming/cutting in the app
- [ ] Watermark overlay
- [ ] Caption generation
- [ ] A/B testing
- [ ] Team collaboration
- [ ] Content calendar
- [ ] Revenue tracking
- [ ] Custom templates
- [ ] Multi-language support

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

## 📝 License

MIT License - feel free to use this commercially or personally.

---

## 🐛 Bug Reports

Found a bug? [Open an issue](https://github.com/YOUR_USERNAME/postcast/issues) with:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if helpful

---

## 📚 Documentation

- [QUICKSTART.md](./QUICKSTART.md) - Get started in 5 minutes
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deploy to production
- [IMPROVEMENTS.md](./IMPROVEMENTS.md) - Feature deep-dive

---

## 🎓 Learning Resources

### Building With These Tools
- [Express.js Documentation](https://expressjs.com/)
- [Claude API Docs](https://anthropic.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [OAuth 2.0 Guide](https://oauth.net/2/)

---

## 📞 Support

Need help?
1. Check the [documentation](./QUICKSTART.md)
2. Review [deployment guide](./DEPLOYMENT.md)
3. Check browser console (F12) for errors
4. Open a GitHub issue

---

## 🙌 Credits

Built with:
- **Express.js** - Backend framework
- **Multer** - File uploads
- **Claude API** - AI features
- **Chart.js** - Analytics visualizations
- **Vercel** - Hosting

---

## 🎉 Get Started

```bash
git clone https://github.com/YOUR_USERNAME/postcast.git
cd postcast
npm install
npm start
```

Visit http://localhost:3000 and start posting! 🚀

---

**Made with ❤️ for content creators**

*Version 2.0 - September 29, 2026*
