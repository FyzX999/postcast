# Postcast - GitHub & Vercel Deployment Guide

## 🚀 Step-by-Step Deployment

### **Step 1: Create a GitHub Repository**

1. Go to https://github.com/new
2. Create a new repository with these settings:
   - **Repository name**: `postcast` (or any name you prefer)
   - **Description**: "Multi-platform video posting tool with AI features"
   - **Visibility**: Public (for free Vercel deployment)
   - **Initialize**: Don't add README (we have one coming)
   - Click **Create repository**

3. You'll see commands to push existing code. Copy this URL:
   ```
   https://github.com/YOUR_USERNAME/postcast.git
   ```

---

### **Step 2: Push Code to GitHub**

In your terminal (in the `mass poster` directory):

```bash
# Add the GitHub repository as origin
git remote add origin https://github.com/YOUR_USERNAME/postcast.git

# Rename branch to main (GitHub default)
git branch -M main

# Push your code
git push -u origin main
```

**Example:**
```bash
git remote add origin https://github.com/fyzx/postcast.git
git branch -M main
git push -u origin main
```

---

### **Step 3: Deploy to Vercel**

1. Go to https://vercel.com
2. Click **Sign Up** and choose **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub account
4. Click **"Import Project"**
5. Find and select your `postcast` repository
6. Vercel will auto-detect the Node.js project
7. Click **Deploy**

**Note**: First deployment might take 2-3 minutes ⏳

---

### **Step 4: Set Environment Variables on Vercel**

After deployment, you need to add your API keys:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables (one by one):

```
ANTHROPIC_API_KEY=your-key-here
AI_MODEL=claude-sonnet-4-6
APP_PASSWORD=your-secure-password

TIKTOK_CLIENT_KEY=awn04eiky3396hds
TIKTOK_CLIENT_SECRET=bvkymGUIZONJ4k5nbNMMoucWmaMFgLN9
TIKTOK_PRIVACY=SELF_ONLY

GOOGLE_CLIENT_ID=your-key
GOOGLE_CLIENT_SECRET=your-key

META_APP_ID=your-id
META_APP_SECRET=your-secret
```

4. For each, select the environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

5. Click **Save**

---

### **Step 5: Update OAuth Redirect URLs**

Since you're now on a Vercel domain, update your OAuth apps:

**For YouTube:**
- Add callback: `https://YOUR_VERCEL_URL/auth/youtube/callback`

**For TikTok:**
- Add callback: `https://YOUR_VERCEL_URL/auth/tiktok/callback`

**For Instagram:**
- Add callback: `https://YOUR_VERCEL_URL/auth/instagram/callback`

(Find your Vercel URL in the project settings)

---

### **Step 6: Redeploy with Environment Variables**

After adding environment variables:

1. Go back to your Vercel dashboard
2. Click **Deployments**
3. Click the three dots on the latest deployment
4. Select **Redeploy**
5. Wait for it to finish ⏳

---

## ✅ Testing Your Deployment

Once deployed, visit your Vercel URL:
```
https://postcast-YOUR-NAME.vercel.app
```

**Test the following:**
- ✅ Login works (username: anything, password: your APP_PASSWORD)
- ✅ Upload a video
- ✅ Generate title with AI
- ✅ See platforms as "Configured" or "Connected"
- ✅ Check notifications work
- ✅ Test analytics (if connected to platforms)

---

## 🔧 Important Notes for Vercel

**Serverless Limitations:**
- ✅ Web interface works perfectly
- ✅ OAuth authentication works
- ✅ API calls work
- ⚠️ Uploaded files are **temporary** (stored in `/tmp`)
  - Files are deleted after serverless function ends
  - Scheduled posts won't persist between deployments

**Solution for Production:**
- Use external storage (AWS S3, Firebase, or Cloudinary)
- Or use a traditional server (Heroku, Railway, etc.)

**For MVP/Testing:**
- Current setup works great!
- Just re-upload files when you redeploy

---

## 📝 Git Workflow for Future Updates

After making changes locally:

```bash
# Make your changes
git add -A
git commit -m "Your description of changes"

# Push to GitHub
git push origin main

# Vercel will auto-deploy! 🚀
```

---

## 🐛 Troubleshooting

### Build fails on Vercel
- Check the build logs (Deployments → click failed build)
- Ensure `package.json` is correct
- Verify `server.js` has no syntax errors

### OAuth not working after deployment
- Make sure redirect URLs are updated in each platform's developer console
- Use `https://` not `http://` (important for OAuth)
- Clear browser cache and cookies

### Files not persisting
- This is normal for Vercel (serverless)
- Use external storage for production

### Environment variables not loading
- Redeploy after adding variables
- Check that you selected "Production" when adding variables

---

## 🎉 You're Live!

Your app is now deployed and accessible from anywhere! Share your Vercel URL with others to try it out.

**Next Steps:**
- Add a real database for persistent storage
- Set up external storage for video files
- Monitor usage in Vercel dashboard
- Update OAuth for production URLs

---

## Quick Reference

| Task | Command |
|------|---------|
| Push to GitHub | `git push origin main` |
| View logs | Check Vercel dashboard |
| Add env vars | Vercel Settings → Environment Variables |
| Check URL | Vercel dashboard → Domains |
| Redeploy | Vercel Deployments → three dots → Redeploy |

---

**Questions?** Check the server logs in Vercel for detailed error messages.

Good luck! 🚀
