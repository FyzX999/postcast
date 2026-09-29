require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const app = express();

// Auto-detect BASE URL for Vercel
const BASE = process.env.PUBLIC_BASE_URL 
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  || 'http://localhost:3000';

// Initialize Supabase client (optional - gracefully handle if not configured)
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
}

// Simple auth credentials from environment variables
const AUTH_USERNAME = process.env.AUTH_USERNAME || 'admin';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'password';
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-change-in-production';

// Simple token encode/decode (stateless - works in serverless)
function encodeToken(username) {
  const payload = JSON.stringify({ username, exp: Date.now() + 86400000 }); // 24h expiry
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
  return Buffer.from(payload).toString('base64') + '.' + signature;
}

function decodeToken(token) {
  try {
    const [payloadB64, signature] = token.split('.');
    const payload = Buffer.from(payloadB64, 'base64').toString();
    const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
    
    if (signature !== expectedSig) return null;
    
    const data = JSON.parse(payload);
    if (data.exp < Date.now()) return null; // expired
    
    return data;
  } catch (e) {
    return null;
  }
}

app.use(express.json());

// Public routes - NO AUTH
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/terms.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/privacy.html'));
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
    const token = encodeToken(username);
    res.json({ success: true, token, username });
  } else {
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});

// Verify token endpoint - NO AUTH REQUIRED
app.get('/api/verify', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  
  const user = decodeToken(token);
  if (user) {
    res.json({ valid: true, user });
  } else {
    res.status(401).json({ valid: false });
  }
});

// Logout endpoint (stateless, just returns success)
app.post('/api/logout', (req, res) => {
  res.json({ success: true });
});

// Static files middleware (for JS, CSS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware for protected routes
app.use((req, res, next) => {
  // Skip auth for public pages
  if (req.path === '/terms' || req.path === '/privacy' || req.path === '/terms.html' || req.path === '/privacy.html') {
    return next();
  }
  
  // Skip auth for OAuth connect endpoints (we'll check auth in the callback)
  if (req.path.startsWith('/api/oauth/') && req.path.includes('/connect')) {
    return next();
  }
  
  // All API routes except login/verify/health/logout require auth
  if (req.path.startsWith('/api/')) {
    if (req.path === '/api/login' || req.path === '/api/verify' || req.path === '/api/health' || req.path === '/api/logout') {
      return next();
    }
    
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '');
    const user = decodeToken(token);
    
    if (user) {
      req.user = user;
      return next();
    }
    
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // For HTML pages, redirect to login if no valid token
  if (req.path === '/' || req.path === '/index.html') {
    // Don't check token on server side for HTML pages
    // Let the client-side auth.js handle it
    return next();
  }
  
  next();
});

// Fallback data
const fallbackTitles = ['🔥 Amazing Content', '⚡ Must Watch', '✨ You Won\'t Believe This', '🎯 Viral Video', '💡 Game Changer'];
const fallbackHashtags = ['#viral', '#trending', '#foryou', '#shorts', '#reels', '#content', '#creator'];

// Platform list
app.get('/api/platforms', async (req, res) => {
  const platforms = [
    { 
      key: 'youtube', 
      name: 'YouTube Shorts', 
      icon: '📺',
      configured: !!(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET),
      connected: false,
      monetization: 'High - Partner Program'
    },
    { 
      key: 'tiktok', 
      name: 'TikTok', 
      icon: '🎵',
      configured: !!(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET),
      connected: false,
      monetization: 'Medium - Creator Fund'
    },
    { 
      key: 'instagram', 
      name: 'Instagram Reels', 
      icon: '📸',
      configured: !!(process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET),
      connected: false,
      monetization: 'Medium - Reels Bonus'
    },
    { 
      key: 'facebook', 
      name: 'Facebook Reels', 
      icon: '👥',
      configured: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
      connected: false,
      monetization: 'Low-Medium - Ad Revenue'
    },
    { 
      key: 'twitter', 
      name: 'Twitter/X', 
      icon: '🐦',
      configured: !!(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET),
      connected: false,
      monetization: 'Medium - Premium Revenue Share'
    },
    { 
      key: 'linkedin', 
      name: 'LinkedIn', 
      icon: '💼',
      configured: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
      connected: false,
      monetization: 'None - B2B Reach'
    },
    { 
      key: 'pinterest', 
      name: 'Pinterest', 
      icon: '📌',
      configured: !!(process.env.PINTEREST_APP_ID && process.env.PINTEREST_APP_SECRET),
      connected: false,
      monetization: 'Low - Creator Rewards'
    },
    { 
      key: 'rumble', 
      name: 'Rumble', 
      icon: '🎬',
      configured: !!(process.env.RUMBLE_API_KEY),
      connected: false,
      monetization: 'Very High - $0.25-1.50 per 1K views'
    },
    { 
      key: 'snapchat', 
      name: 'Snapchat', 
      icon: '👻',
      manual: true, 
      configured: false, 
      connected: false,
      monetization: 'High - Spotlight Fund'
    }
  ];
  
  // Check if user has connected accounts in Supabase
  if (supabase && req.user) {
    try {
      const { data } = await supabase
        .from('connected_accounts')
        .select('platform, access_token')
        .eq('username', req.user.username);
      
      if (data) {
        data.forEach(account => {
          const platform = platforms.find(p => p.key === account.platform);
          if (platform) {
            platform.connected = !!account.access_token;
          }
        });
      }
    } catch (e) {
      console.error('Error checking connections:', e);
    }
  }
  
  res.json(platforms);
});

// Settings (using Supabase if available)
app.get('/api/settings', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();
      
      if (!error && data) {
        return res.json(data);
      }
    } catch (e) {}
  }
  res.json({ defaultDescription: '', style: '' });
});

app.post('/api/settings', async (req, res) => {
  if (supabase) {
    try {
      const { defaultDescription = '', style = '' } = req.body;
      await supabase
        .from('settings')
        .upsert({ id: 1, defaultDescription, style });
    } catch (e) {}
  }
  res.json({ ok: true });
});

// Generate titles with Gemini
app.post('/api/generate', async (req, res) => {
  try {
    const { topic, count = 1 } = req.body;
    
    // If no Gemini API key, return fallback
    if (!process.env.GEMINI_API_KEY) {
      const titles = [];
      for (let i = 0; i < count; i++) {
        titles.push(fallbackTitles[i % fallbackTitles.length] + ' - ' + (topic || 'Video'));
      }
      return res.json({ titles });
    }
    
    // Call Gemini API
    const prompt = count > 1
      ? `Generate ${count} different catchy short-form video titles for: ${topic}. Reply with JSON: {"titles": ["title1", "title2"]}`
      : `Generate 1 catchy short-form video title for: ${topic}. Reply with JSON: {"titles": ["title"]}`;
    
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 1.0,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      })
    });
    
    const d = await r.json();
    if (!r.ok || !d.candidates) {
      const titles = [];
      for (let i = 0; i < count; i++) {
        titles.push(fallbackTitles[i % fallbackTitles.length]);
      }
      return res.json({ titles });
    }
    
    const text = d.candidates[0]?.content?.parts[0]?.text || '';
    const json = JSON.parse(text.replace(/```json|```/g, '').trim());
    res.json(json);
  } catch (e) {
    const titles = [];
    for (let i = 0; i < (req.body.count || 1); i++) {
      titles.push(fallbackTitles[i % fallbackTitles.length]);
    }
    res.json({ titles });
  }
});

// Suggest hashtags with Gemini
app.post('/api/suggest-hashtags', async (req, res) => {
  try {
    const { topic, title, description } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ hashtags: fallbackHashtags.slice(0, 5) });
    }
    
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate 5-10 trending hashtags for a video about: ${topic}. Title: ${title}. Description: ${description}. Reply with JSON: {"hashtags": ["#tag1", "#tag2"]}`
          }]
        }],
        generationConfig: {
          temperature: 1.0,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512
        }
      })
    });
    
    const d = await r.json();
    if (!r.ok || !d.candidates) {
      return res.json({ hashtags: fallbackHashtags.slice(0, 5) });
    }
    
    const text = d.candidates[0]?.content?.parts[0]?.text || '';
    const json = JSON.parse(text.replace(/```json|```/g, '').trim());
    res.json(json);
  } catch (e) {
    res.json({ hashtags: fallbackHashtags.slice(0, 5) });
  }
});

// Optimize content
app.post('/api/optimize-content', (req, res) => {
  res.json({ 
    optimized_description: (req.body.description || '') + '\n\n#ContentCreator #Viral', 
    tips: ['Keep it short and engaging', 'Use trending sounds', 'Post at peak hours']
  });
});

// Upload (would need Supabase Storage)
app.post('/api/upload', (req, res) => {
  res.status(501).json({ error: 'File uploads require Supabase Storage configuration' });
});

// Post history (using Supabase if available)
app.get('/api/posts', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (!error && data) {
        return res.json(data);
      }
    } catch (e) {}
  }
  res.json([]);
});

app.post('/api/posts/:id/delete', async (req, res) => {
  if (supabase) {
    try {
      await supabase
        .from('posts')
        .delete()
        .eq('id', req.params.id);
    } catch (e) {}
  }
  res.json({ ok: true });
});

app.post('/api/publish', async (req, res) => {
  const { file, title, description, platforms = [] } = req.body;
  
  if (supabase) {
    try {
      await supabase
        .from('posts')
        .insert({
          title,
          description,
          platforms,
          status: 'published',
          created_at: new Date().toISOString(),
          file
        });
    } catch (e) {
      console.error('Supabase insert error:', e);
    }
  }
  
  res.json({ ok: true, message: 'Post saved' });
});

app.get('/api/analytics', (req, res) => {
  res.json({});
});

// TikTok OAuth - Start connection
app.get('/api/oauth/tiktok/connect', (req, res) => {
  if (!process.env.TIKTOK_CLIENT_KEY) {
    return res.status(400).json({ error: 'TikTok not configured' });
  }
  
  const csrfState = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${BASE}/api/oauth/tiktok/callback`;
  
  const authUrl = `https://www.tiktok.com/v2/auth/authorize/` +
    `?client_key=${process.env.TIKTOK_CLIENT_KEY}` +
    `&scope=user.info.basic,video.upload,video.publish` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${csrfState}`;
  
  res.redirect(authUrl);
});

// YouTube OAuth - Start connection
app.get('/api/oauth/youtube/connect', (req, res) => {
  if (!process.env.YOUTUBE_CLIENT_ID) {
    return res.status(400).json({ error: 'YouTube not configured' });
  }
  
  const redirectUri = `${BASE}/api/oauth/youtube/callback`;
  const scope = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly';
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${process.env.YOUTUBE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&access_type=offline` +
    `&prompt=consent`;
  
  res.redirect(authUrl);
});

// Twitter/X OAuth - Start connection
app.get('/api/oauth/twitter/connect', (req, res) => {
  if (!process.env.TWITTER_CLIENT_ID) {
    return res.status(400).json({ error: 'Twitter not configured' });
  }
  
  const redirectUri = `${BASE}/api/oauth/twitter/callback`;
  const scope = 'tweet.read tweet.write users.read offline.access';
  const codeChallenge = crypto.randomBytes(32).toString('base64url');
  
  const authUrl = `https://twitter.com/i/oauth2/authorize` +
    `?client_id=${process.env.TWITTER_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${crypto.randomBytes(16).toString('hex')}` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=plain`;
  
  res.redirect(authUrl);
});

// Facebook OAuth - Start connection
app.get('/api/oauth/facebook/connect', (req, res) => {
  if (!process.env.FACEBOOK_APP_ID) {
    return res.status(400).json({ error: 'Facebook not configured' });
  }
  
  const redirectUri = `${BASE}/api/oauth/facebook/callback`;
  const scope = 'pages_manage_posts,pages_read_engagement,publish_video';
  
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth` +
    `?client_id=${process.env.FACEBOOK_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&response_type=code`;
  
  res.redirect(authUrl);
});

// LinkedIn OAuth - Start connection
app.get('/api/oauth/linkedin/connect', (req, res) => {
  if (!process.env.LINKEDIN_CLIENT_ID) {
    return res.status(400).json({ error: 'LinkedIn not configured' });
  }
  
  const redirectUri = `${BASE}/api/oauth/linkedin/callback`;
  const scope = 'w_member_social r_liteprofile';
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization` +
    `?client_id=${process.env.LINKEDIN_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}`;
  
  res.redirect(authUrl);
});

// Pinterest OAuth - Start connection
app.get('/api/oauth/pinterest/connect', (req, res) => {
  if (!process.env.PINTEREST_APP_ID) {
    return res.status(400).json({ error: 'Pinterest not configured' });
  }
  
  const redirectUri = `${BASE}/api/oauth/pinterest/callback`;
  const scope = 'boards:read,boards:write,pins:read,pins:write';
  
  const authUrl = `https://www.pinterest.com/oauth/` +
    `?client_id=${process.env.PINTEREST_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}`;
  
  res.redirect(authUrl);
});

// TikTok OAuth - Handle callback
app.get('/api/oauth/tiktok/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    return res.redirect('/?error=tiktok_auth_failed');
  }
  
  if (!code) {
    return res.redirect('/?error=tiktok_no_code');
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${BASE}/api/oauth/tiktok/callback`
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error || !tokenData.data) {
      console.error('TikTok token error:', tokenData);
      return res.redirect('/?error=tiktok_token_failed');
    }
    
    const { access_token, refresh_token, expires_in, open_id } = tokenData.data;
    
    // Get user info
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    const userData = await userResponse.json();
    const displayName = userData.data?.user?.display_name || 'TikTok User';
    
    // Save to Supabase
    if (supabase && req.user) {
      await supabase
        .from('connected_accounts')
        .upsert({
          username: req.user.username,
          platform: 'tiktok',
          platform_user_id: open_id,
          platform_username: displayName,
          access_token: access_token,
          refresh_token: refresh_token,
          expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'username,platform'
        });
    }
    
    res.redirect('/?success=tiktok_connected');
  } catch (err) {
    console.error('TikTok OAuth error:', err);
    res.redirect('/?error=tiktok_connection_failed');
  }
});

// YouTube OAuth - Handle callback
app.get('/api/oauth/youtube/callback', async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    return res.redirect('/?error=youtube_auth_failed');
  }
  
  if (!code) {
    return res.redirect('/?error=youtube_no_code');
  }
  
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.YOUTUBE_CLIENT_ID,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET,
        redirect_uri: `${BASE}/api/oauth/youtube/callback`,
        grant_type: 'authorization_code'
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error || !tokenData.access_token) {
      console.error('YouTube token error:', tokenData);
      return res.redirect('/?error=youtube_token_failed');
    }
    
    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    
    const userData = await userResponse.json();
    const channelTitle = userData.items?.[0]?.snippet?.title || 'YouTube User';
    const channelId = userData.items?.[0]?.id || '';
    
    // Save to Supabase
    if (supabase && req.user) {
      await supabase
        .from('connected_accounts')
        .upsert({
          username: req.user.username,
          platform: 'youtube',
          platform_user_id: channelId,
          platform_username: channelTitle,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'username,platform'
        });
    }
    
    res.redirect('/?success=youtube_connected');
  } catch (err) {
    console.error('YouTube OAuth error:', err);
    res.redirect('/?error=youtube_connection_failed');
  }
});

// Disconnect platform
app.post('/api/disconnect/:p', async (req, res) => {
  const platform = req.params.p;
  
  if (supabase && req.user) {
    try {
      await supabase
        .from('connected_accounts')
        .delete()
        .eq('username', req.user.username)
        .eq('platform', platform);
    } catch (e) {
      console.error('Disconnect error:', e);
    }
  }
  
  res.json({ ok: true });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    base: BASE,
    supabase: !!supabase,
    gemini: !!process.env.GEMINI_API_KEY
  });
});

// Catch-all for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Export for Vercel
module.exports = app;

// Start server if running locally
if (require.main === module) {
  app.listen(process.env.PORT || 3000, () => console.log('✅ Postcast on ' + BASE));
}
