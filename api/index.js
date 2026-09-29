require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();

const DATA = path.join(__dirname, '../data');
const UP = path.join(__dirname, '../uploads');

[DATA, UP].forEach(d => {
  try { fs.mkdirSync(d, { recursive: true }); } catch (e) {}
});

const read = (f, d) => {
  try { return JSON.parse(fs.readFileSync(path.join(DATA, f))); } catch { return d; }
};

const write = (f, v) => {
  try { fs.writeFileSync(path.join(DATA, f), JSON.stringify(v, null, 2)); } catch (e) {}
};

app.use(express.json());

// Serve uploads
app.use('/uploads', express.static(UP));

// Serve other static files (css, js, etc) with fallthrough
app.use((req, res, next) => {
  if (req.path.match(/\.(js|css|png|jpg|gif|svg|ico|json|ttf|woff|woff2)$/i)) {
    const file = path.join(__dirname, '../public', req.path);
    if (fs.existsSync(file)) {
      return res.sendFile(file);
    }
  }
  next();
});

const P = {
  youtube: { name: 'YouTube Shorts' },
  tiktok: { name: 'TikTok' },
  instagram: { name: 'Instagram' }
};

const fallbackTitles = ['🔥 You Won\'t Believe This', '⚡ This Changed Everything', '✨ Mind Blowing', '🎯 Must Watch', '💡 Game Changer'];
const fallbackHashtags = ['#viral', '#trending', '#foryou', '#shorts', '#reels'];

app.get('/api/platforms', (req, res) => {
  res.json(Object.entries(P).map(([key, p]) => ({ key, name: p.name, configured: false, connected: false })));
});

app.get('/api/settings', (req, res) => {
  res.json(read('settings.json', { defaultDescription: '', style: '' }));
});

app.post('/api/settings', (req, res) => {
  write('settings.json', req.body);
  res.json({ ok: true });
});

app.post('/api/generate', async (req, res) => {
  try {
    const { topic, count = 1 } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      const titles = [];
      for (let i = 0; i < count; i++) {
        titles.push(fallbackTitles[i % fallbackTitles.length]);
      }
      return res.json({ titles });
    }
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: `Generate a short-form video title for: ${topic}. Reply JSON: {"titles": ["title"]}` }] }] })
    });
    const d = await r.json();
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      res.json(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } else {
      res.json({ titles: fallbackTitles.slice(0, count) });
    }
  } catch (e) {
    res.json({ titles: fallbackTitles.slice(0, (req.body.count || 1)) });
  }
});

app.post('/api/suggest-hashtags', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) return res.json({ hashtags: fallbackHashtags });
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: `Generate 5 hashtags for: ${req.body.topic}. Reply JSON: {"hashtags": ["#tag"]}` }] }] })
    });
    const d = await r.json();
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      res.json(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } else {
      res.json({ hashtags: fallbackHashtags });
    }
  } catch (e) {
    res.json({ hashtags: fallbackHashtags });
  }
});

app.post('/api/optimize-content', (req, res) => {
  res.json({ optimized_description: (req.body.description || '') + '\n\n#ContentCreator', tips: ['Keep short', 'Use trending sounds', 'Post at peak hours'] });
});

const upload = multer({ storage: multer.diskStorage({ destination: UP, filename: (req, f, cb) => cb(null, crypto.randomUUID() + path.extname(f.originalname).toLowerCase()) }), limits: { fileSize: 500 * 1024 * 1024 } });

app.post('/api/upload', upload.single('video'), (req, res) => {
  res.json(req.file ? { file: req.file.filename, url: `https://postcast.vercel.app/uploads/${req.file.filename}` } : { error: 'No file' });
});

app.get('/api/posts', (req, res) => res.json(read('history.json', [])));

app.post('/api/posts/:id/delete', (req, res) => {
  const h = read('history.json', []);
  write('history.json', h.filter(p => p.id !== req.params.id));
  res.json({ ok: true });
});

app.post('/api/publish', (req, res) => {
  const { file, title, description, platforms = [] } = req.body;
  const h = read('history.json', []);
  h.unshift({ id: crypto.randomUUID(), title, description, platforms, status: 'published', created_at: new Date().toISOString(), file });
  write('history.json', h.slice(0, 100));
  res.json({ ok: true });
});

app.get('/api/analytics', (req, res) => res.json({}));

app.post('/api/disconnect/:p', (req, res) => res.json({ ok: true }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Catch-all: serve index.html
app.get('*', (req, res) => {
  try {
    const indexPath = path.join(__dirname, '../public/index.html');
    if (fs.existsSync(indexPath)) {
      const html = fs.readFileSync(indexPath, 'utf-8');
      return res.type('text/html').send(html);
    }
  } catch (e) {
    console.error('Error reading index.html:', e.message);
  }
  res.type('text/html').send('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Postcast</title></head><body><h1>Postcast</h1><p>App loading...</p></body></html>');
});

// Export handler wrapper for Vercel serverless
module.exports = (req, res) => {
  return app(req, res);
};

// Export app for local development (server.js needs this)
module.exports.app = app;
