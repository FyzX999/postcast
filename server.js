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

// In-memory token store (in production, use Redis or database)
const tokens = new Map();

// Generate a secure token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

app.use(express.json());

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
    const token = generateToken();
    tokens.set(token, { username, createdAt: Date.now() });
    
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});

// Verify token endpoint
app.get('/api/verify', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  
  if (tokens.has(token)) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  
  tokens.delete(token);
  res.json({ success: true });
});

// Authentication middleware
app.use((req, res, next) => {
  // Skip auth for login page and login endpoint
  if (req.path === '/login.html' || req.path === '/api/login' || req.path === '/api/health') {
    return next();
  }
  
  // Skip auth for static assets
  if (req.path.match(/\.(js|css|png|jpg|gif|svg|ico|woff|woff2|ttf)$/i)) {
    return next();
  }
  
  // Check for Bearer token
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  
  if (tokens.has(token)) {
    req.user = tokens.get(token);
    return next();
  }
  
  // Redirect to login page for HTML requests
  if (req.path === '/' || req.path === '/index.html') {
    return res.redirect('/login.html');
  }
  
  // Return 401 for API requests
  res.status(401).json({ error: 'Authentication required' });
});

app.use(express.static(path.join(__dirname, 'public')));

// Fallback data
const fallbackTitles = ['🔥 Amazing Content', '⚡ Must Watch', '✨ You Won\'t Believe This', '🎯 Viral Video', '💡 Game Changer'];
const fallbackHashtags = ['#viral', '#trending', '#foryou', '#shorts', '#reels', '#content', '#creator'];

// Platform list
app.get('/api/platforms', (req, res) => {
  res.json([
    { key: 'youtube', name: 'YouTube Shorts', configured: false, connected: false },
    { key: 'tiktok', name: 'TikTok', configured: false, connected: false },
    { key: 'instagram', name: 'Instagram', configured: false, connected: false },
    { key: 'snapchat', name: 'Snapchat', manual: true, configured: false, connected: false }
  ]);
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
        }]
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
        }]
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

app.post('/api/disconnect/:p', (req, res) => {
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
