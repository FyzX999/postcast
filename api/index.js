require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const BASE = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
const DATA = path.join(__dirname, '../data');
const UP = path.join(__dirname, '../uploads');

// Create directories if they don't exist
[DATA, UP].forEach(d => {
  try {
    fs.mkdirSync(d, { recursive: true });
  } catch (e) {}
});

const read = (f, d) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA, f)));
  } catch {
    return d;
  }
};

const write = (f, v) => {
  try {
    fs.writeFileSync(path.join(DATA, f), JSON.stringify(v, null, 2));
  } catch (e) {
    console.error('Write error:', e);
  }
};

// Password gate
app.use((req, res, next) => {
  if (!process.env.APP_PASSWORD || req.path.startsWith('/uploads/') || req.path.includes('/callback')) return next();
  const b64 = (req.headers.authorization || '').split(' ')[1] || '';
  if (Buffer.from(b64, 'base64').toString().split(':').slice(1).join(':') === process.env.APP_PASSWORD) return next();
  res.set('WWW-Authenticate', 'Basic realm="Postcast"').status(401).send('Login required');
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(UP));

// Platforms configuration
const P = {
  youtube: {
    name: 'YouTube Shorts',
    auth: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    id: 'GOOGLE_CLIENT_ID',
    secret: 'GOOGLE_CLIENT_SECRET',
    idField: 'client_id',
    scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
    extra: { access_type: 'offline', prompt: 'consent' }
  },
  tiktok: {
    name: 'TikTok',
    auth: 'https://www.tiktok.com/v2/auth/authorize/',
    token: 'https://open.tiktokapis.com/v2/oauth/token/',
    id: 'TIKTOK_CLIENT_KEY',
    secret: 'TIKTOK_CLIENT_SECRET',
    idField: 'client_key',
    scope: 'user.info.basic,user.info.stats,video.publish,video.list'
  },
  instagram: {
    name: 'Instagram',
    auth: 'https://www.facebook.com/v21.0/dialog/oauth',
    token: 'https://graph.facebook.com/v21.0/oauth/access_token',
    id: 'META_APP_ID',
    secret: 'META_APP_SECRET',
    idField: 'client_id',
    scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,instagram_manage_insights'
  }
};

// API Routes
app.get('/api/platforms', (req, res) => {
  const tokens = read('tokens.json', {});
  const list = Object.entries(P).map(([key, p]) => ({
    key,
    name: p.name,
    configured: !!process.env[p.id],
    connected: !!tokens[key]
  }));
  list.push({ key: 'snapchat', name: 'Snapchat', manual: true });
  res.json(list);
});

app.get('/api/settings', (req, res) => res.json(read('settings.json', { defaultDescription: '', style: '', hashtagStrategy: 'auto', videoProcessing: 'auto', watermark: false })));

app.post('/api/settings', (req, res) => {
  const { defaultDescription = '', style = '' } = req.body;
  write('settings.json', { defaultDescription, style });
  res.json({ ok: true });
});

// Fallback titles for when API is unavailable
const fallbackTitles = [
  '🔥 You Won\'t Believe What Happens Next',
  '⚡ This Changed Everything',
  '✨ The Ultimate Guide to Success',
  '🎯 5 Secrets Nobody Tells You',
  '💡 How to Level Up Your Game',
  '🚀 From Zero to Hero in One Video',
  '🎬 Watch Till The End',
  '😱 This is Insane',
  '🌟 Life-Changing Moment',
  '💪 Motivation Monday',
];

app.post('/api/generate', async (req, res) => {
  try {
    const s = read('settings.json', {});
    const { topic, count = 1 } = req.body;

    // If no API key, return fallback titles
    if (!process.env.GEMINI_API_KEY) {
      const titles = [];
      for (let i = 0; i < count; i++) {
        titles.push(fallbackTitles[i % fallbackTitles.length] + ' - ' + (topic || 'Video') + (count > 1 ? ` #${i + 1}` : ''));
      }
      return res.json({ titles });
    }

    const prompt = count > 1
      ? `Generate ${count} different short-form video titles based on this topic: ${topic}\nStyle notes: ${s.style || 'none'}\n\nReply with JSON: {"titles": [array of ${count} titles]}`
      : `The video is about: ${topic}\nStyle notes: ${s.style || 'none'}\n\nGenerate an engaging short-form video title. Reply with JSON: {"titles": ["title"]}`;

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `System: You write short-form video titles and descriptions. Always reply with valid JSON only.\n\nUser: ${prompt}`
          }]
        }]
      })
    });

    const d = await r.json();
    if (!r.ok) {
      // Fallback on API error
      const titles = [];
      for (let i = 0; i < count; i++) {
        titles.push(fallbackTitles[i % fallbackTitles.length] + ' - ' + (topic || 'Video') + (count > 1 ? ` #${i + 1}` : ''));
      }
      return res.json({ titles });
    }

    const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonStr = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(jsonStr));
  } catch (e) {
    // Return fallback on any error
    const titles = [];
    const count = req.body.count || 1;
    for (let i = 0; i < count; i++) {
      titles.push(fallbackTitles[i % fallbackTitles.length] + ' - ' + (req.body.topic || 'Video') + (count > 1 ? ` #${i + 1}` : ''));
    }
    res.json({ titles });
  }
});

const fallbackHashtags = ['#viral', '#trending', '#foryou', '#viralvideo', '#shorts', '#reels', '#tiktok', '#youtube', '#content', '#creator'];

app.post('/api/suggest-hashtags', async (req, res) => {
  try {
    const { topic, title, description } = req.body;

    // If no API key, return fallback hashtags
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ hashtags: fallbackHashtags.slice(0, 5) });
    }

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `System: You generate trending hashtags. Always reply with valid JSON only.\n\nUser: Topic: ${topic}\nTitle: ${title}\nDescription: ${description}\n\nGenerate 5-10 trending hashtags. Reply with JSON: {"hashtags": ["#tag1", "#tag2"]}`
          }]
        }]
      })
    });

    const d = await r.json();
    if (!r.ok) {
      return res.json({ hashtags: fallbackHashtags.slice(0, 5) });
    }

    const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonStr = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(jsonStr));
  } catch (e) {
    res.json({ hashtags: fallbackHashtags.slice(0, 5) });
  }
});

    const d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || 'AI request failed');
    res.json(JSON.parse(d.content[0].text.replace(/```json|```/g, '').trim()));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/optimize-content', async (req, res) => {
  try {
    const { title, description, topic, platforms } = req.body;
    const platformInfo = platforms.length > 0
      ? `Target platforms: ${platforms.join(', ')}.`
      : 'Optimize for multiple platforms.';

    // If no API key, return basic optimization
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        optimized_description: (description || title) + '\n\n#ContentCreator #ShortForm',
        tips: ['Keep it short and punchy', 'Use trending sounds', 'Post at peak hours', 'Engage with comments']
      });
    }

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `System: You optimize descriptions for engagement. Always reply with valid JSON only.\n\nUser: Title: ${title}\nDescription: ${description}\nTopic: ${topic}\n\n${platformInfo}\n\nOptimize for maximum engagement. Reply with JSON: {"optimized_description": string, "tips": [array of tips]}`
          }]
        }]
      })
    });

    const d = await r.json();
    if (!r.ok) {
      return res.json({
        optimized_description: (description || title) + '\n\n#ContentCreator #ShortForm',
        tips: ['Keep it short and punchy', 'Use trending sounds', 'Post at peak hours', 'Engage with comments']
      });
    }

    const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonStr = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(jsonStr));
  } catch (e) {
    res.json({
      optimized_description: (req.body.description || req.body.title) + '\n\n#ContentCreator #ShortForm',
      tips: ['Keep it short and punchy', 'Use trending sounds', 'Post at peak hours', 'Engage with comments']
    });
  }
});

// Upload endpoint
const upload = multer({
  storage: multer.diskStorage({
    destination: UP,
    filename: (req, f, cb) => cb(null, crypto.randomUUID() + path.extname(f.originalname).toLowerCase())
  }),
  limits: { fileSize: 500 * 1024 * 1024 }
});

app.post('/api/upload', upload.single('video'), (req, res) =>
  req.file ? res.json({ file: req.file.filename, url: `${BASE}/uploads/${req.file.filename}` }) : res.status(400).json({ error: 'No video' })
);

// Post history endpoints
app.get('/api/posts', (req, res) => res.json(read('history.json', [])));
app.post('/api/posts/:id/delete', (req, res) => {
  const history = read('history.json', []);
  write('history.json', history.filter(p => p.id !== req.params.id));
  res.json({ ok: true });
});

// Publish endpoint
app.post('/api/publish', async (req, res) => {
  const { file, title, description, platforms = [], scheduled_at = null } = req.body;
  const history = read('history.json', []);
  const post = {
    id: crypto.randomUUID(),
    title,
    description,
    platforms,
    status: scheduled_at ? 'scheduled' : 'publishing',
    scheduled_at: scheduled_at || null,
    created_at: new Date().toISOString(),
    file,
    engagement: {}
  };
  history.unshift(post);
  write('history.json', history.slice(0, 100));

  if (scheduled_at && new Date(scheduled_at) > new Date()) {
    return res.json({
      scheduled: true,
      id: post.id,
      scheduled_at,
      platforms,
      message: 'Post scheduled for ' + new Date(scheduled_at).toLocaleString()
    });
  }

  const out = {};
  res.json(out);
});

app.get('/api/analytics', async (req, res) => res.json({}));

// Auth routes (simplified for Vercel)
const states = new Map();

app.get('/auth/:p', (req, res) => {
  const p = P[req.params.p];
  if (!p || !process.env[p.id]) return res.status(400).send('Add API keys');
  const state = crypto.randomUUID();
  states.set(state, req.params.p);
  const q = new URLSearchParams({
    [p.idField]: process.env[p.id],
    redirect_uri: `${BASE}/auth/${req.params.p}/callback`,
    response_type: 'code',
    scope: p.scope,
    state,
    ...(p.extra || {})
  });
  res.redirect(`${p.auth}?${q}`);
});

app.get('/auth/:p/callback', async (req, res) => {
  const key = req.params.p;
  const p = P[key];
  if (!p || states.get(req.query.state) !== key) return res.status(400).send('Invalid state');
  states.delete(req.query.state);
  try {
    const r = await fetch(p.token, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        [p.idField]: process.env[p.id],
        client_secret: process.env[p.secret],
        code: req.query.code,
        grant_type: 'authorization_code',
        redirect_uri: `${BASE}/auth/${key}/callback`
      })
    });
    const t = await r.json();
    if (!r.ok || t.error) throw new Error(t.error_description || 'Token exchange failed');
    const tokens = read('tokens.json', {});
    tokens[key] = { ...t, saved_at: Date.now() };
    write('tokens.json', tokens);
    res.redirect('/?connected=' + key);
  } catch (e) {
    res.status(500).send('Connection failed: ' + e.message);
  }
});

app.post('/api/disconnect/:p', (req, res) => {
  const tokens = read('tokens.json', {});
  delete tokens[req.params.p];
  write('tokens.json', tokens);
  res.json({ ok: true });
});

// Catch-all for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;
