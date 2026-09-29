# 📋 Step-by-Step: GitHub & Vercel Setup

Everything is ready! Your code is committed locally. Now follow these steps to go live.

---

## ✅ What's Already Done

- ✅ Git repository initialized
- ✅ `.gitignore` created (protects sensitive files)
- ✅ `vercel.json` configured
- ✅ Initial commit created
- ✅ README.md and deployment guides written

**What's left:** Push to GitHub and deploy to Vercel

---

## 🔴 STEP 1: Create GitHub Repository (2 minutes)

1. Go to **https://github.com/new**

2. Fill in the form:
   - **Repository name**: `postcast`
   - **Description**: "Multi-platform video posting tool with AI features"
   - **Public** (important for free Vercel)
   - Don't add README or .gitignore (we have them)

3. Click **Create repository**

4. **Copy the HTTPS URL** shown (looks like):
   ```
   https://github.com/YOUR_USERNAME/postcast.git
   ```

---

## 🟡 STEP 2: Push Code to GitHub (1 minute)

In your terminal (in the `mass poster` folder):

```bash
git remote add origin https://github.com/YOUR_USERNAME/postcast.git
git branch -M main
git push -u origin main
```

**Replace** `YOUR_USERNAME` with your actual GitHub username.

**Example:**
```bash
git remote add origin https://github.com/fyzx/postcast.git
git branch -M main
git push -u origin main
```

**What you'll see:**
```
Enumerating objects: 10, done.
Counting objects: 100% (10/10), done.
...
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

✅ **Done!** Your code is now on GitHub.

---

## 🟢 STEP 3: Deploy to Vercel (5 minutes)

### Part A: Create Vercel Account

1. Go to **https://vercel.com**
2. Click **Sign Up**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel (it will ask for permission)

### Part B: Import Project

1. On Vercel, click **"Add New Project"** or **"Import Project"**
2. Select your `postcast` repository
3. Vercel will auto-detect it's a Node.js app
4. Click **Deploy**

⏳ **Wait 2-3 minutes** for the build...

You should see a screen that says "**Congratulations! Your project has been successfully deployed.**"

✅ **Copy your Vercel URL** (looks like):
```
https://postcast-abc123.vercel.app
```

---

## 🔵 STEP 4: Add Environment Variables to Vercel (3 minutes)

1. Go back to your Vercel project dashboard
2. Click **Settings** (tab at top)
3. Click **Environment Variables** (left sidebar)
4. Add each variable:

**For AI Features:**
- Name: `ANTHROPIC_API_KEY`
- Value: `your-api-key-here`
- Click **Save**

**For TikTok:**
- Name: `TIKTOK_CLIENT_KEY`
- Value: `awn04eiky3396hds`
- Select: Production, Preview, Development
- Click **Save**

Then add:
- Name: `TIKTOK_CLIENT_SECRET`
- Value: `bvkymGUIZONJ4k5nbNMMoucWmaMFgLN9`
- Select all
- Click **Save**

**For App Security:**
- Name: `APP_PASSWORD`
- Value: `your-secure-password` (remember this for login!)
- Select all
- Click **Save**

**Optional (YouTube, Instagram):**
```
GOOGLE_CLIENT_ID = your-key
GOOGLE_CLIENT_SECRET = your-key
META_APP_ID = your-id
META_APP_SECRET = your-secret
TIKTOK_PRIVACY = SELF_ONLY
```

---

## 🟣 STEP 5: Redeploy with Environment Variables (2 minutes)

1. Go to **Deployments** (tab at top)
2. Find the latest deployment (at top)
3. Click the **three dots** ⋮ on the right
4. Click **"Redeploy"**

⏳ **Wait for build to finish...**

---

## 🟤 STEP 6: Test Your Live App (3 minutes)

1. Go to your Vercel URL:
   ```
   https://postcast-YOUR-NAME.vercel.app
   ```

2. **Login:**
   - Username: `admin` (or anything)
   - Password: `your-secure-password` (what you set in env vars)

3. **Test features:**
   - ✅ Upload a test video
   - ✅ Generate title with AI
   - ✅ See platforms as "Configured"
   - ✅ Check notifications appear

✅ **You're live!**

---

## 🎯 STEP 7: (Optional) Update OAuth Redirect URLs

If you want to actually connect to TikTok/Instagram/YouTube:

**For TikTok:**
1. Go to your TikTok app settings
2. Find "Redirect URL" or "OAuth Callback"
3. Add: `https://postcast-YOUR-NAME.vercel.app/auth/tiktok/callback`
4. Save

**Same for YouTube & Instagram** (update their respective developer consoles)

---

## 🚀 You're Done!

Your app is now live and accessible from anywhere!

**Share your URL:**
```
https://postcast-YOUR-NAME.vercel.app
```

---

## 📊 Monitoring & Updates

### View Logs
- Vercel Dashboard → Deployments → click a deployment → Logs

### Make Updates
```bash
# Make changes locally
# Then:
git add -A
git commit -m "Your description"
git push origin main
# Vercel automatically redeploys! 🚀
```

### Check Status
- Visit your Vercel dashboard
- All deployments are listed there
- Green = success, Red = failed

---

## ⚠️ Important Notes

### About Files on Vercel
- Video uploads are **temporary** (deleted after each deployment)
- For production, you'd use AWS S3 or similar
- For MVP/testing, current setup is perfect!

### Troubleshooting
| Problem | Solution |
|---------|----------|
| App won't deploy | Check build logs in Vercel |
| OAuth fails | Make sure redirect URLs are updated |
| Env vars not working | Redeploy after adding them |
| Videos deleted | Normal for serverless (use external storage) |

---

## 🎓 Next Steps

1. **Share with friends** - give them your Vercel URL
2. **Add a database** - for persistent storage
3. **Set up S3** - for video file storage
4. **Monitor analytics** - in Vercel dashboard
5. **Create content** - start posting! 🎬

---

## 🔗 Quick Links

- GitHub repo: `https://github.com/YOUR_USERNAME/postcast`
- Vercel app: `https://postcast-YOUR-NAME.vercel.app`
- Documentation: See README.md, DEPLOYMENT.md, QUICKSTART.md

---

**That's it! You're live! 🎉**

Any issues? Check the Vercel logs or terminal output for error messages.
