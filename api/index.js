require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();

// Directories
const DATA = path.join(__dirname, '../data');
const UP = path.join(__dirname, '../uploads');

// Create directories
[DATA, UP].forEach(d => {
  try {
    fs.mkdirSync(d, { recursive: true });
  } catch (e) {}
});

// Helper functions
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
  } catch (e) {}
};

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(UP));

// Password protection
app.use((req, res, next) => {
  if (!process.env.APP_PASSWORD || req.path.startsWith('/uploads') || req.path.includes('/callback') || req.path === '/') {
    return next();
  }
  
  const auth = req.headers.authorization || '';
  const [scheme, credentials] = auth.split(' ');
  
  if (scheme === 'Basic' && credentials) {
    const [user, pass] = Buffer.from(credentials, 'base64').toString().split(':');
    if (pass === process.env.APP_PASSWORD) {
      return next();
    }
  }
  
  res.set('WWW-Authenticate', 'Basic realm="Postcast"');
  res.status(401).send('Login required');
});

// Platform configs
const P = {
  youtube: { name: 'YouTube Shorts', id: 'GOOGLE_CLIENT_ID', secret: 'GOOGLE_CLIENT_SECRET' },
  tiktok: { name: 'TikTok', id: 'TIKTOK_CLIENT_KEY', secret: 'TIKTOK_CLIENT_SECRET' },
  instagram: { name: 'Instagram', id: 'META_APP_ID', secret: 'META_APP_SECRET' }
};

// Fallback data
const fallbackTitles = ['🔥 You Won\'t Believe This', '⚡ This Changed Everything', '✨ Mind Blowing', '🎯 Must Watch', '💡 Game Changer'];
const fallbackHashtags = ['#viral', '#trending', '#foryou', '#shorts', '#reels'];

// API Routes
app.get('/api/platforms', (req, res) => {
  const tokens = read('tokens.json', {});
  const list = Object.entries(P).map(([key, p]) => ({
    key,
    name: p.name,
    configured: !!process.env[p.id],
    connected: !!tokens[key]
  }));
  res.json(list);
});

app.get('/api/settings', (req, res) => {
  res.json(read('settings.json', { defaultDescription: '', style: '' }));
});

app.post('/api/settings', (req, res) => {
  const { defaultDescription = '', style = '' } = req.body;
  write('settings.json', { defaultDescription, style });
  res.json({ ok: true });
});

// Generate titles
app.post('/api/generate', async (req, res) => {
  try {
    const { topic, count = 1 } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      const titles = [];
      for (let i = 0; i < count; i++) {
        titles.push(fallbackTitles[i % fallbackTitles.length] + ' - ' + (topic || 'Video') + (count > 1 ? ` #${i + 1}` : ''));
      }
      return res.json({ titles });
    }

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate 1 short-form video title for: ${topic}. Reply with JSON: {"titles": ["title"]}`
          }]
        }]
      })
    });

    const d = await r.json();
    if (d.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = d.candidates[0].content.parts[0].text;
      const json = JSON.parse(text.replace(/```json|```/g, '').trim());
      return res.json(json);
    }

    const titles = [];
    for (let i = 0; i < count; i++) {
      titles.push(fallbackTitles[i % fallbackTitles.length]);
    }
    res.json({ titles });
  } catch (e) {
    const titles = [];
    for (let i = 0; i < (req.body.count || 1); i++) {
      titles.push(fallbackTitles[i % fallbackTitles.length]);
    }
    res.json({ titles });
  }
});

// Suggest hashtags
app.post('/api/suggest-hashtags', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ hashtags: fallbackHashtags });
    }

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate 5 hashtags for a video about ${req.body.topic}. Reply with JSON: {"hashtags": ["#tag1", "#tag2"]}`
          }]
        }]
      })
    });

    const d = await r.json();
    if (d.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = d.candidates[0].content.parts[0].text;
      const json = JSON.parse(text.replace(/```json|```/g, '').trim());
      return res.json(json);
    }

    res.json({ hashtags: fallbackHashtags });
  } catch (e) {
    res.json({ hashtags: fallbackHashtags });
  }
});

// Optimize content
app.post('/api/optimize-content', (req, res) => {
  const { description } = req.body;
  res.json({
    optimized_description: (description || '') + '\n\n#ContentCreator #ShortForm',
    tips: ['Keep it short', 'Use trending sounds', 'Post at peak hours']
  });
});

// Upload
const upload = multer({
  storage: multer.diskStorage({
    destination: UP,
    filename: (req, f, cb) => cb(null, crypto.randomUUID() + path.extname(f.originalname).toLowerCase())
  }),
  limits: { fileSize: 500 * 1024 * 1024 }
});

app.post('/api/upload', upload.single('video'), (req, res) => {
  if (req.file) {
    const base = process.env.PUBLIC_BASE_URL || 'https://postcast.vercel.app';
    res.json({ file: req.file.filename, url: `${base}/uploads/${req.file.filename}` });
  } else {
    res.status(400).json({ error: 'No file' });
  }
});

// Posts
app.get('/api/posts', (req, res) => res.json(read('history.json', [])));

app.post('/api/posts/:id/delete', (req, res) => {
  const history = read('history.json', []);
  write('history.json', history.filter(p => p.id !== req.params.id));
  res.json({ ok: true });
});

// Publish
app.post('/api/publish', (req, res) => {
  const { file, title, description, platforms = [], scheduled_at = null } = req.body;
  const history = read('history.json', []);
  const post = {
    id: crypto.randomUUID(),
    title,
    description,
    platforms,
    status: scheduled_at ? 'scheduled' : 'published',
    created_at: new Date().toISOString(),
    file,
    engagement: {}
  };
  history.unshift(post);
  write('history.json', history.slice(0, 100));
  res.json({ ok: true, id: post.id });
});

app.get('/api/analytics', (req, res) => res.json({}));

// Disconnect
app.post('/api/disconnect/:p', (req, res) => {
  const tokens = read('tokens.json', {});
  delete tokens[req.params.p];
  write('tokens.json', tokens);
  res.json({ ok: true });
});

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../public/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('<!DOCTYPE html><html><head><title>Postcast</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#f1f5f9}</style></head><body><div><h1>Postcast</h1><p>Initializing...</p></div></body></html>');
  }
});

// Export for Vercel serverless
module.exports = app;
