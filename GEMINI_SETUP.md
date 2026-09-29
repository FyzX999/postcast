# Gemini API Setup

The API has been updated to use Google Gemini instead of Claude.

## To Enable Gemini AI Features:

1. **Get your Gemini API Key**
   - Go to: https://aistudio.google.com/apikey
   - Click "Create API Key"
   - Copy the key

2. **Add to Vercel**
   - Go to: https://vercel.com/dashboard
   - Select "postcast" project
   - Settings → Environment Variables
   - Add:
     - Name: `GEMINI_API_KEY`
     - Value: [paste your API key]
   - Click Save

3. **Redeploy**
   - Go to Deployments tab
   - Click three dots on latest deployment
   - Click Redeploy

## Fallback Mode

If you don't add the API key, the app will still work with fallback titles and hashtags. You can always add the API key later.

## Environment Variables Reference

- `GEMINI_API_KEY` - Google Gemini API key for AI features
- `APP_PASSWORD` - Password to access the app (optional)
- `TIKTOK_CLIENT_KEY` - TikTok API key
- `TIKTOK_CLIENT_SECRET` - TikTok API secret
