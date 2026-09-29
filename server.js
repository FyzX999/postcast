require('dotenv').config();
const express = require('express'), multer = require('multer'), fs = require('fs'),
  path = require('path'), crypto = require('crypto');

// Optional ffmpeg for thumbnail generation (gracefully handle if not installed)
let ffmpeg;
try {
  ffmpeg = require('fluent-ffmpeg');
  const ffmpegPath = require('ffmpeg-static');
  const ffprobePath = require('ffprobe-static').path;
  if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
  if (ffprobePath) ffmpeg.setFfprobePath(ffprobePath);
} catch (e) {
  console.warn('ffmpeg not available - thumbnail generation disabled');
}

const app = express();
const BASE = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
const DATA = path.join(__dirname, 'data'), UP = path.join(__dirname, 'uploads');
[DATA, UP].forEach(d => fs.mkdirSync(d, { recursive: true }));
const read = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(DATA, f))); } catch { return d; } };
const write = (f, v) => fs.writeFileSync(path.join(DATA, f), JSON.stringify(v, null, 2));

// Password gate (uploads stay open: Instagram must fetch the video by URL; filenames are random)
app.use((req, res, next) => {
  if (!process.env.APP_PASSWORD || req.path.startsWith('/uploads/') || req.path.includes('/callback')) return next();
  const b64 = (req.headers.authorization || '').split(' ')[1] || '';
  if (Buffer.from(b64, 'base64').toString().split(':').slice(1).join(':') === process.env.APP_PASSWORD) return next();
  res.set('WWW-Authenticate', 'Basic realm="Postcast"').status(401).send('Login required');
});
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UP));

// ---------- Platforms ----------
const P = {
  youtube: { name: 'YouTube Shorts', auth: 'https://accounts.google.com/o/oauth2/v2/auth', token: 'https://oauth2.googleapis.com/token',
    id: 'GOOGLE_CLIENT_ID', secret: 'GOOGLE_CLIENT_SECRET', idField: 'client_id',
    scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly', extra: { access_type: 'offline', prompt: 'consent' } },
  tiktok: { name: 'TikTok', auth: 'https://www.tiktok.com/v2/auth/authorize/', token: 'https://open.tiktokapis.com/v2/oauth/token/',
    id: 'TIKTOK_CLIENT_KEY', secret: 'TIKTOK_CLIENT_SECRET', idField: 'client_key', scope: 'user.info.basic,user.info.stats,video.publish,video.list' },
  instagram: { name: 'Instagram', auth: 'https://www.facebook.com/v21.0/dialog/oauth', token: 'https://graph.facebook.com/v21.0/oauth/access_token',
    id: 'META_APP_ID', secret: 'META_APP_SECRET', idField: 'client_id',
    scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,instagram_manage_insights' },
};

app.get('/api/platforms', (req, res) => {
  const tokens = read('tokens.json', {});
  const list = Object.entries(P).map(([key, p]) => ({
    key, name: p.name, configured: !!process.env[p.id], connected: !!tokens[key] }));
  list.push({ key: 'snapchat', name: 'Snapchat', manual: true });
  res.json(list);
});

const states = new Map();
app.get('/auth/:p', (req, res) => {
  const p = P[req.params.p];
  if (!p || !process.env[p.id]) return res.status(400).send('Add this platform\'s keys to .env first.');
  const state = crypto.randomUUID(); states.set(state, req.params.p);
  const q = new URLSearchParams({ [p.idField]: process.env[p.id], redirect_uri: `${BASE}/auth/${req.params.p}/callback`,
    response_type: 'code', scope: p.scope, state, ...(p.extra || {}) });
  res.redirect(`${p.auth}?${q}`);
});

app.get('/auth/:p/callback', async (req, res) => {
  const key = req.params.p, p = P[key];
  if (!p || states.get(req.query.state) !== key) return res.status(400).send('Invalid login state.');
  states.delete(req.query.state);
  try {
    const r = await fetch(p.token, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ [p.idField]: process.env[p.id], client_secret: process.env[p.secret], code: req.query.code,
        grant_type: 'authorization_code', redirect_uri: `${BASE}/auth/${key}/callback` }) });
    const t = await r.json();
    if (!r.ok || t.error) throw new Error(t.error_description || t.error?.message || 'Token exchange failed');
    let tok = { ...t, saved_at: Date.now() };
    if (key === 'instagram') { // swap the short-lived token for a ~60 day one
      const x = await (await fetch(`${p.token}?` + new URLSearchParams({ grant_type: 'fb_exchange_token', client_id: process.env[p.id],
        client_secret: process.env[p.secret], fb_exchange_token: t.access_token }))).json();
      if (x.access_token) tok = { ...x, saved_at: Date.now() };
    }
    const tokens = read('tokens.json', {}); tokens[key] = tok; write('tokens.json', tokens);
    res.redirect('/?connected=' + key);
  } catch (e) { res.status(500).send('Connection failed: ' + e.message); }
});

app.post('/api/disconnect/:p', (req, res) => {
  const tokens = read('tokens.json', {}); delete tokens[req.params.p]; write('tokens.json', tokens); res.json({ ok: true });
});

// ---------- Settings (default description) ----------
app.get('/api/settings', (req, res) => res.json(read('settings.json', { defaultDescription: '', style: '', hashtagStrategy: 'auto', videoProcessing: 'auto', watermark: false })));
app.post('/api/settings', (req, res) => {
  const { defaultDescription = '', style = '', hashtagStrategy = 'auto', videoProcessing = 'auto', watermark = false } = req.body; 
  write('settings.json', { defaultDescription, style, hashtagStrategy, videoProcessing, watermark }); 
  res.json({ ok: true });
});

// ---------- AI title + description ----------
app.post('/api/generate', async (req, res) => {
  try {
    const s = read('settings.json', {});
    const { topic, count = 1 } = req.body;
    
    const prompt = count > 1 
      ? `Generate ${count} different short-form video titles based on this topic: ${topic}\nStyle notes: ${s.style || 'none'}\n\nReply with JSON: {"titles": [array of ${count} titles, each under 80 chars]}`
      : `The video is about: ${topic}\nStyle notes: ${s.style || 'none'}`;
    
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.AI_MODEL || 'claude-sonnet-4-6', max_tokens: 500,
        system: count > 1 
          ? 'You write short-form video titles. Reply with only JSON containing an array of titles.'
          : 'You write short-form video titles and descriptions. Reply with only JSON: {"title": string under 80 chars, "description": string under 300 chars}. No markdown.',
        messages: [{ role: 'user', content: prompt }] }) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || 'AI request failed');
    res.json(JSON.parse(d.content[0].text.replace(/```json|```/g, '').trim()));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- Hashtag Suggestions ----------
app.post('/api/suggest-hashtags', async (req, res) => {
  try {
    const { topic, title, description } = req.body;
    
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.AI_MODEL || 'claude-sonnet-4-6', max_tokens: 300,
        system: 'You generate trending hashtags for short-form videos. Reply with only JSON: {"hashtags": ["#hashtag1", "#hashtag2", ...]} with 10-15 relevant hashtags.',
        messages: [{ role: 'user', content: `Topic: ${topic}\nTitle: ${title}\nDescription: ${description}\n\nGenerate trending, searchable hashtags for this content.` }] }) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || 'AI request failed');
    res.json(JSON.parse(d.content[0].text.replace(/```json|```/g, '').trim()));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- Content Optimization ----------
app.post('/api/optimize-content', async (req, res) => {
  try {
    const { title, description, topic, platforms } = req.body;
    
    const platformInfo = platforms.length > 0 
      ? `Target platforms: ${platforms.join(', ')}. Keep in mind character limits and best practices for each.`
      : 'Optimize for multiple platforms (TikTok, Instagram, YouTube).';
    
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.AI_MODEL || 'claude-sonnet-4-6', max_tokens: 500,
        system: 'You optimize short-form video descriptions for engagement. Make them punchy, clear, and compelling. Reply with only JSON: {"optimized_description": string, "tips": [array of 2-3 optimization tips]}',
        messages: [{ role: 'user', content: `Title: ${title}\nCurrent description: ${description}\nTopic: ${topic}\n\n${platformInfo}\n\nOptimize this description for maximum engagement and clarity.` }] }) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || 'AI request failed');
    res.json(JSON.parse(d.content[0].text.replace(/```json|```/g, '').trim()));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- Upload + publish ----------
const upload = multer({ storage: multer.diskStorage({ destination: UP,
  filename: (req, f, cb) => cb(null, crypto.randomUUID() + path.extname(f.originalname).toLowerCase()) }),
  limits: { fileSize: 500 * 1024 * 1024 } });
app.post('/api/upload', upload.single('video'), (req, res) =>
  req.file ? res.json({ file: req.file.filename, url: `${BASE}/uploads/${req.file.filename}` }) : res.status(400).json({ error: 'No video received' }));

// Returns a valid token, refreshing it if it has expired.
async function freshToken(key) {
  const tokens = read('tokens.json', {}), t = tokens[key], p = P[key];
  if (!t) throw new Error('Not connected');
  if (!t.expires_in || Date.now() < t.saved_at + (t.expires_in - 120) * 1000) return t;
  if (!t.refresh_token) throw new Error('Login expired. Reconnect this account.');
  const r = await fetch(p.token, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ [p.idField]: process.env[p.id], client_secret: process.env[p.secret], grant_type: 'refresh_token', refresh_token: t.refresh_token }) });
  const n = await r.json();
  if (!r.ok || n.error) throw new Error('Login expired. Reconnect this account.');
  tokens[key] = { ...t, ...n, saved_at: Date.now() }; write('tokens.json', tokens);
  return tokens[key];
}

const G = 'https://graph.facebook.com/v21.0';
async function igAccount(t) {
  const d = await (await fetch(`${G}/me/accounts?fields=instagram_business_account&access_token=${t.access_token}`)).json();
  const id = d.data?.find(p => p.instagram_business_account)?.instagram_business_account.id;
  if (!id) throw new Error('No Instagram Business or Creator account is linked to a Facebook Page');
  return id;
}
const gpost = (p, body, t) => fetch(`${G}/${p}`, { method: 'POST', body: new URLSearchParams({ access_token: t.access_token, ...body }) }).then(r => r.json());
const caption = (title, description) => [title, description].filter(Boolean).join('\n\n').slice(0, 2200);

// One function per platform. Each gets { file, url, title, description, token }.
const publishers = {
  async tiktok({ file, title, description, token }) {
    const fp = path.join(UP, path.basename(file)), size = fs.statSync(fp).size;
    const chunk = size < 5 * 1024 * 1024 ? size : 10 * 1024 * 1024, count = Math.max(1, Math.floor(size / chunk));
    const privacy = process.env.TIKTOK_PRIVACY || 'SELF_ONLY';
    const init = await (await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', { method: 'POST',
      headers: { Authorization: 'Bearer ' + token.access_token, 'content-type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ post_info: { title: caption(title, description), privacy_level: privacy },
        source_info: { source: 'FILE_UPLOAD', video_size: size, chunk_size: chunk, total_chunk_count: count } }) })).json();
    if (init.error?.code && init.error.code !== 'ok') throw new Error(init.error.message || init.error.code);
    const type = path.extname(fp).toLowerCase() === '.mov' ? 'video/quicktime' : 'video/mp4', fd = fs.openSync(fp, 'r');
    try {
      for (let i = 0; i < count; i++) {
        const a = i * chunk, b = i === count - 1 ? size - 1 : a + chunk - 1, buf = Buffer.alloc(b - a + 1);
        fs.readSync(fd, buf, 0, buf.length, a);
        const r = await fetch(init.data.upload_url, { method: 'PUT', body: buf,
          headers: { 'Content-Type': type, 'Content-Length': String(buf.length), 'Content-Range': `bytes ${a}-${b}/${size}` } });
        if (!r.ok) throw new Error('TikTok upload failed (' + r.status + ')');
      }
    } finally { fs.closeSync(fd); }
    return { note: 'Sent to TikTok' + (privacy === 'SELF_ONLY' ? ' (private until your app passes TikTok\'s review)' : '') };
  },

  async instagram({ url, title, description, token }) {
    const ig = await igAccount(token);
    const c = await gpost(`${ig}/media`, { media_type: 'REELS', video_url: url, caption: caption(title, description) }, token);
    if (!c.id) throw new Error(c.error?.message || 'Instagram rejected the video');
    for (let i = 0; i < 60; i++) { // wait for Instagram to process it
      const s = await (await fetch(`${G}/${c.id}?fields=status_code&access_token=${token.access_token}`)).json();
      if (s.status_code === 'FINISHED') break;
      if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error('Instagram could not process the video');
      await new Promise(r => setTimeout(r, 5000));
    }
    const p = await gpost(`${ig}/media_publish`, { creation_id: c.id }, token);
    if (!p.id) throw new Error(p.error?.message || 'Instagram publish failed');
    return { note: 'Posted as a Reel' };
  },

  async snapchat({ url }) { // no posting API, so hand the video back for manual posting
    return { manual: true, url, note: 'Snapchat has no posting API. Download this video and post it in the app:' };
  },

  async youtube({ file, title, description, token }) {
    const fp = path.join(UP, path.basename(file)), size = fs.statSync(fp).size;
    const start = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', { method: 'POST',
      headers: { Authorization: 'Bearer ' + token.access_token, 'content-type': 'application/json', 'X-Upload-Content-Length': String(size), 'X-Upload-Content-Type': 'video/*' },
      body: JSON.stringify({ snippet: { title: (title || 'Untitled').slice(0, 100), description: ((description || '') + '\n\n#Shorts').slice(0, 5000) },
        status: { privacyStatus: 'public', selfDeclaredMadeForKids: false } }) });
    const loc = start.headers.get('location');
    if (!loc) throw new Error((await start.json().catch(() => ({}))).error?.message || 'YouTube refused the upload');
    const v = await (await fetch(loc, { method: 'PUT', headers: { 'Content-Length': String(size) }, body: fs.createReadStream(fp), duplex: 'half' })).json();
    if (!v.id) throw new Error(v.error?.message || 'YouTube upload failed');
    return { note: 'Uploaded: https://youtube.com/shorts/' + v.id };
  },
};

app.post('/api/publish', async (req, res) => {
  const { file, title, description, platforms = [], scheduled_at = null } = req.body, out = {};
  
  // Save to history
  const history = read('history.json', []);
  const post = {
    id: crypto.randomUUID(),
    title, description, platforms,
    status: scheduled_at ? 'scheduled' : 'publishing',
    scheduled_at: scheduled_at || null,
    created_at: new Date().toISOString(),
    file,
    engagement: {}
  };
  history.unshift(post);
  write('history.json', history.slice(0, 100));
  
  // If scheduled, don't publish yet
  if (scheduled_at && new Date(scheduled_at) > new Date()) {
    return res.json({ 
      scheduled: true, 
      id: post.id,
      scheduled_at,
      platforms,
      message: 'Post scheduled for ' + new Date(scheduled_at).toLocaleString()
    });
  }
  
  // Publish immediately
  await Promise.all(platforms.map(async key => {
    try {
      if (!publishers[key]) throw new Error('Not built yet');
      const token = key === 'snapchat' ? null : await freshToken(key);
      out[key] = { ok: true, ...(await publishers[key]({ file, url: `${BASE}/uploads/${file}`, title, description, token })) };
      post.engagement[key] = { status: 'published' };
    } catch (e) { out[key] = { ok: false, error: e.message }; }
  }));
  post.status = 'published';
  write('history.json', history);
  res.json(out);
});

// ---------- Post History & Scheduling ----------
app.post('/api/save-post', (req, res) => {
  const { title, description, platforms, scheduled_at, file } = req.body;
  const history = read('history.json', []);
  const post = {
    id: crypto.randomUUID(),
    title, description, platforms,
    status: scheduled_at ? 'scheduled' : 'published',
    scheduled_at: scheduled_at || null,
    created_at: new Date().toISOString(),
    file,
    engagement: {}
  };
  history.unshift(post);
  write('history.json', history.slice(0, 100)); // Keep last 100 posts
  res.json(post);
});

app.get('/api/posts', (req, res) => {
  const history = read('history.json', []);
  res.json(history);
});

app.get('/api/posts/:id', (req, res) => {
  const history = read('history.json', []);
  const post = history.find(p => p.id === req.params.id);
  res.json(post || { error: 'Not found' });
});

app.post('/api/posts/:id/delete', (req, res) => {
  const history = read('history.json', []);
  const filtered = history.filter(p => p.id !== req.params.id);
  write('history.json', filtered);
  res.json({ ok: true });
});

app.post('/api/posts/:id/reschedule', (req, res) => {
  const history = read('history.json', []);
  const post = history.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  
  post.scheduled_at = req.body.scheduled_at;
  write('history.json', history);
  res.json({ ok: true });
});

// Scheduler to publish scheduled posts (runs every minute)
setInterval(async () => {
  const history = read('history.json', []);
  const now = new Date();
  for (const post of history) {
    if (post.status === 'scheduled' && post.scheduled_at && new Date(post.scheduled_at) <= now) {
      try {
        // Publish the post
        const out = {};
        await Promise.all(post.platforms.map(async key => {
          try {
            if (!publishers[key]) throw new Error('Not built yet');
            const token = key === 'snapchat' ? null : await freshToken(key);
            out[key] = { ok: true, ...(await publishers[key]({ file: post.file, url: `${BASE}/uploads/${post.file}`, title: post.title, description: post.description, token })) };
            post.engagement[key] = { status: 'published' };
          } catch (e) { out[key] = { ok: false, error: e.message }; }
        }));
        post.status = 'published';
        write('history.json', history);
      } catch (e) {
        post.status = 'failed';
        post.error = e.message;
        write('history.json', history);
      }
    }
  }
}, 60000); // Check every minute
const stats = {
  async tiktok(t) {
    const h = { Authorization: 'Bearer ' + t.access_token };
    const u = (await (await fetch('https://open.tiktokapis.com/v2/user/info/?fields=follower_count,video_count', { headers: h })).json()).data?.user || {};
    const v = (await (await fetch('https://open.tiktokapis.com/v2/video/list/?fields=title,view_count,like_count,comment_count', { method: 'POST',
      headers: { ...h, 'content-type': 'application/json' }, body: JSON.stringify({ max_count: 20 }) })).json()).data?.videos || [];
    return { followers: u.follower_count, videos: u.video_count,
      recent: v.map(x => ({ title: x.title, views: x.view_count, likes: x.like_count, comments: x.comment_count })) };
  },
  async instagram(t) {
    const ig = await igAccount(t), q = f => `${G}/${ig}${f}&access_token=${t.access_token}`;
    const u = await (await fetch(q('?fields=followers_count,media_count'))).json();
    const m = (await (await fetch(q('/media?fields=caption,like_count,comments_count&limit=20'))).json()).data || [];
    return { followers: u.followers_count, videos: u.media_count,
      recent: m.map(x => ({ title: (x.caption || '').slice(0, 60), likes: x.like_count, comments: x.comments_count })) };
  },
  async youtube(t) {
    const d = await (await fetch('https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true', { headers: { Authorization: 'Bearer ' + t.access_token } })).json();
    const s = d.items?.[0]?.statistics || {};
    return { followers: +s.subscriberCount, videos: +s.videoCount, totalViews: +s.viewCount, recent: [] };
  },
};
app.get('/api/analytics', async (req, res) => {
  const out = {};
  await Promise.all(Object.keys(stats).map(async key => {
    try { const t = await freshToken(key).catch(() => null); if (t) out[key] = await stats[key](t); }
    catch (e) { out[key] = { error: e.message }; }
  }));
  res.json(out);
});

app.listen(process.env.PORT || 3000, () => console.log('✅ Postcast running on ' + BASE));
