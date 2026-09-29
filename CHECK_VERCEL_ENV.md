# ⚠️ Check Vercel Environment Variables

Your local `.env` file has TikTok credentials, but they need to be in **Vercel** too!

## TikTok Credentials Found Locally:
```
TIKTOK_CLIENT_KEY=awn04eiky3396hds
TIKTOK_CLIENT_SECRET=bvkymGUIZONJ4k5nbNMMoucWmaMFgLN9
TIKTOK_PRIVACY=SELF_ONLY
```

## ✅ Add These to Vercel:

1. Go to https://vercel.com/dashboard
2. Click your **postcast** project
3. Go to **Settings** → **Environment Variables**
4. Add these 3 variables:

| Variable | Value |
|----------|-------|
| `TIKTOK_CLIENT_KEY` | `awn04eiky3396hds` |
| `TIKTOK_CLIENT_SECRET` | `bvkymGUIZONJ4k5nbNMMoucWmaMFgLN9` |
| `TIKTOK_PRIVACY` | `SELF_ONLY` |

5. Make sure to select **Production, Preview, Development** for each
6. Click **Save**

## Then I'll Implement:

Once you add these to Vercel, I'll implement:
- ✅ TikTok OAuth connection flow
- ✅ Token storage in Supabase
- ✅ Video upload to TikTok
- ✅ "Connect" button in the UI

This will make the TikTok integration fully functional!
