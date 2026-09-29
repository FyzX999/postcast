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

// Helpers
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
app.use(express.static(path.join(__dirname, '../public'), { fallthrough: true }));
app.use('/uploads', express.static(UP));

// Platform configs
const P = {
  youtube: { name: 'YouTube Shorts' },
  tiktok: { name: 'TikTok' },
  instagram: { name: 'Instagram' }
};

// Fallbacks
const fallbackTitles = ['🔥 You Won\'t Believe This', '⚡ This Changed Everything', '✨ Mind Blowing', '🎯 Must Watch', '💡 Game Changer'];
const fallbackHashtags = ['#viral', '#trending', '#foryou', '#shorts', '#reels'];

// API
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

// Serve index.html
app.get('*', (req, res) => {
  const p = path.join(__dirname, '../public/index.html');
  if (fs.existsSync(p)) {
    res.sendFile(p);
  } else {
    res.send('<!DOCTYPE html><html><head><title>Postcast</title></head><body><h1>Postcast</h1></body></html>');
  }
});

module.exports = app;
