# ✅ Testing Your Postcast Setup

## Quick Test Checklist

### 1. Login System ✅
- [x] Visit https://postcast.vercel.app
- [x] Login page appears (no browser popup)
- [x] Enter username/password
- [x] Successfully redirects to main app
- [x] No infinite refresh loops

### 2. Test Gemini AI Features

**Generate Titles:**
1. In the "New Post" section, enter a topic: e.g., "cooking pasta"
2. Click "✨ Generate" button
3. Should get an AI-generated title (not fallback)
4. If you see generic fallbacks like "🔥 Amazing Content", Gemini isn't working

**Suggest Hashtags:**
1. Fill in topic and description
2. Click "🏷️ Suggest Hashtags"
3. Should get relevant hashtags for your topic
4. If you see generic ones like #viral, #trending, Gemini isn't working

### 3. Test Supabase Database

**Save Settings:**
1. Go to "Settings & Defaults" section
2. Add a default description: e.g., "Follow for more content!"
3. Click "💾 Save Settings"
4. Refresh the page
5. Settings should persist (loaded from Supabase)

**Create a Post:**
1. Fill in title and description
2. Select platforms (checkboxes)
3. Click "📤 Publish Now"
4. Go to "History" tab
5. Your post should appear in the list

### 4. Check Environment Variables

If anything isn't working, verify in Vercel Dashboard → Settings → Environment Variables:

**Required Variables:**
- ✅ `AUTH_USERNAME` - your login username
- ✅ `AUTH_PASSWORD` - your login password
- ✅ `GEMINI_API_KEY` - from https://aistudio.google.com/apikey
- ✅ `SUPABASE_URL` - your Supabase project URL
- ✅ `SUPABASE_KEY` - your Supabase anon key

**Optional:**
- `SECRET_KEY` - for token signing (has default)
- `PUBLIC_BASE_URL` - your domain (auto-detected)

### 5. Check Supabase Tables

In Supabase Dashboard → Table Editor:

**Required Tables:**
- `posts` - stores published posts
- `settings` - stores default settings

**Check SQL:**
```sql
-- Should return your settings
SELECT * FROM settings;

-- Should return your posts
SELECT * FROM posts ORDER BY created_at DESC;
```

## Common Issues

### Gemini Not Working
**Symptoms:** Generic fallback titles like "🔥 Amazing Content"

**Fix:**
1. Get API key from https://aistudio.google.com/apikey
2. Add to Vercel: `GEMINI_API_KEY`
3. Redeploy the app

### Supabase Not Working
**Symptoms:** Settings don't save, posts don't appear in history

**Fix:**
1. Check tables exist in Supabase (see SUPABASE_SETUP.md)
2. Verify `SUPABASE_URL` and `SUPABASE_KEY` in Vercel
3. Check Supabase project is active (not paused)

### Login Not Working
**Symptoms:** Can't login, wrong password error

**Fix:**
1. Check `AUTH_USERNAME` and `AUTH_PASSWORD` in Vercel
2. Try incognito/private browsing
3. Clear localStorage and try again

## Success Indicators

✅ **Login works** - no refresh loops
✅ **AI titles** - contextual, not generic
✅ **Hashtags** - relevant to your topic
✅ **Settings persist** - saved to database
✅ **Post history** - posts appear after publishing
✅ **Clean URLs** - no `.html` extensions

## Next Steps

If everything works:
1. **Set up platform OAuth** - Connect real YouTube, TikTok, Instagram accounts
2. **Configure Supabase Storage** - Enable video uploads
3. **Customize branding** - Change colors, logo, etc.
4. **Add custom domain** - Use your own domain instead of .vercel.app

If something doesn't work, check the specific section above!
