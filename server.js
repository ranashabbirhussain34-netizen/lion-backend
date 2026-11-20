const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const pageHtml = require('./page');

const app = express();
app.use(express.json({ limit: '4mb' }));

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const KEY = process.env.GEMINI_API_KEY;
const MODEL = {
  text: process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash',
  image: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image',
  tts: process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts',
};
const COST = { image: 1, sticker: 1, motion: 3, voice: 2, music: 3, video: 5, read: 1, ai: 1 };

// ---------- helpers ----------
async function gemini(model, parts, config) {
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: config || {} }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || 'AI request failed');
  const out = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts;
  if (!out || !out.length) throw new Error('The AI returned nothing. Try a different prompt.');
  return out;
}

function imgPart(dataUrl) {
  const m = /^data:(.+?);base64,(.+)$/.exec(dataUrl || '');
  return m ? { inlineData: { mimeType: m[1], data: m[2] } } : null;
}

function wav(pcmBase64) {
  const pcm = Buffer.from(pcmBase64, 'base64');
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(24000, 24); h.writeUInt32LE(48000, 28); h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

async function save(userId, kind, buf, mime, ext, prompt) {
  const path = userId + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
  const up = await sb.storage.from('media').upload(path, buf, { contentType: mime });
  if (up.error) throw new Error('Could not save file: ' + up.error.message);
  const url = sb.storage.from('media').getPublicUrl(path).data.publicUrl;
  await sb.from('files').insert({ user_id: userId, kind, url, prompt: prompt || null });
  return url;
}

const wrap = (fn) => (req, res) => fn(req, res).catch((e) => res.status(400).json({ error: e.message }));

async function user(req, res, next) {
  try {
    const d = req.headers['x-device-id'];
    if (!d || d.length < 8) return res.status(400).json({ error: 'Missing device id' });
    let { data: p } = await sb.from('profiles').select('*').eq('device_id', d).maybeSingle();
    if (!p) {
      const r = await sb.from('profiles').insert({ device_id: d }).select().single();
      if (r.error) throw new Error(r.error.message);
      p = r.data;
    }
    const c = await sb.rpc('get_credits', { p_user: p.id });
    p.credits = c.data;
    req.u = p;
    next();
  } catch (e) { res.status(500).json({ error: e.message }); }
}

function need(u, cost) { if (u.credits < cost) throw new Error('Not enough credits. Upgrade your plan or wait for the daily refill.'); }
async function charge(u, cost, feature) {
  const r = await sb.rpc('spend_credits', { p_user: u.id, p_cost: cost, p_feature: feature });
  if (r.error) throw new Error(r.error.message.includes('NOT_ENOUGH') ? 'Not enough credits.' : r.error.message);
  return r.data;
}

// ---------- pages ----------
app.get('/', (req, res) => res.type('html').send(pageHtml()));

// ---------- account ----------
app.get('/api/plans', wrap(async (req, res) => {
  const r = await sb.from('plans').select('*').order('price_rs');
  res.json({ plans: r.data || [], costs: COST });
}));

app.get('/api/me', user, wrap(async (req, res) => res.json(req.u)));

app.put('/api/me', user, wrap(async (req, res) => {
  const b = req.body || {}, patch = {};
  ['name', 'email', 'theme', 'language', 'notifications'].forEach((k) => { if (b[k] !== undefined) patch[k] = b[k]; });
  const r = await sb.from('profiles').update(patch).eq('id', req.u.id).select().single();
  if (r.error) throw new Error(r.error.message);
  res.json(r.data);
}));

app.post('/api/plans/choose', user, wrap(async () => {
  throw new Error('Payments are not connected yet. Plans will open soon.');
}));

// ---------- generation ----------
app.post('/api/image', user, wrap(async (req, res) => {
  const { prompt, image, ratio, count } = req.body;
  if (!prompt) throw new Error('Write a prompt first.');
  const n = Math.min(Math.max(parseInt(count) || 1, 1), 4);
  need(req.u, COST.image * n);
  const urls = [];
  for (let i = 0; i < n; i++) {
    const parts = [{ text: prompt + '. Aspect ratio ' + (ratio || '1:1') + '.' }];
    const ip = imgPart(image); if (ip) parts.push(ip);
    const out = await gemini(MODEL.image, parts, { responseModalities: ['TEXT', 'IMAGE'] });
    const f = out.find((p) => p.inlineData);
    if (!f) throw new Error('No image came back. Try a different prompt.');
    urls.push(await save(req.u.id, 'image', Buffer.from(f.inlineData.data, 'base64'), f.inlineData.mimeType, 'png', prompt));
  }
  const credits = await charge(req.u, COST.image * n, 'image');
  res.json({ urls, credits });
}));

app.post('/api/sticker', user, wrap(async (req, res) => {
  const { prompt, image, background, motion } = req.body;
  if (!prompt && !image) throw new Error('Describe your sticker or upload an image.');
  const cost = motion ? COST.motion : COST.sticker;
  need(req.u, cost);
  const bg = (background || 'Transparent').toLowerCase() === 'transparent' ? 'plain white' : (background || '').toLowerCase();
  const parts = [{ text: 'Sticker illustration: ' + (prompt || 'make this image a sticker') + '. Single subject, thick outline, centered, on a ' + bg + ' background.' }];
  const ip = imgPart(image); if (ip) parts.push(ip);
  const out = await gemini(MODEL.image, parts, { responseModalities: ['TEXT', 'IMAGE'] });
  const f = out.find((p) => p.inlineData);
  if (!f) throw new Error('No sticker came back. Try a different prompt.');
  const url = await save(req.u.id, 'sticker', Buffer.from(f.inlineData.data, 'base64'), f.inlineData.mimeType, 'png', prompt);
  const credits = await charge(req.u, cost, motion ? 'motion_sticker' : 'sticker');
  res.json({ urls: [url], credits });
}));

app.post('/api/voice', user, wrap(async (req, res) => {
  const { text, language, voiceType } = req.body;
  if (!text) throw new Error('Type the text first.');
  need(req.u, COST.voice);
  const voice = voiceType === 'Male' ? 'Puck' : voiceType === 'Child' ? 'Leda' : 'Kore';
  const style = voiceType === 'Child' ? ' in a cheerful, young child-like voice' : '';
  const out = await gemini(MODEL.tts, [{ text: 'Read this aloud in ' + (language || 'English') + style + ': ' + text }], {
    responseModalities: ['AUDIO'],
    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
  });
  const f = out.find((p) => p.inlineData);
  if (!f) throw new Error('No audio came back.');
  const url = await save(req.u.id, 'audio', wav(f.inlineData.data), 'audio/wav', 'wav', text.slice(0, 200));
  const credits = await charge(req.u, COST.voice, 'voice');
  res.json({ url, credits });
}));

app.post('/api/read', user, wrap(async (req, res) => {
  const ip = imgPart(req.body.image);
  if (!ip) throw new Error('Choose an image first.');
  need(req.u, COST.read);
  const lang = req.body.language && req.body.language !== 'Auto' ? ' The text is in ' + req.body.language + '.' : '';
  const out = await gemini(MODEL.text, [{ text: 'Read all the text in this image exactly as written. Return only the text.' + lang }, ip]);
  const credits = await charge(req.u, COST.read, 'read_image');
  res.json({ text: out.map((p) => p.text || '').join(''), credits });
}));

app.post('/api/ai', user, wrap(async (req, res) => {
  if (!req.body.idea) throw new Error('Tell LION AI your video idea first.');
  need(req.u, COST.ai);
  const out = await gemini(MODEL.text, [{ text:
    'You are LION AI, a creative planning assistant. Turn this video idea into: a scene list (each scene with a short visual prompt), a voice-over script, and a music plan. Reply in the same language as the idea. Idea: ' + req.body.idea }]);
  const credits = await charge(req.u, COST.ai, 'lion_ai');
  res.json({ text: out.map((p) => p.text || '').join(''), credits });
}));

// ---------- files ----------
app.post('/api/upload', user, wrap(async (req, res) => {
  const m = /^data:(.+?);base64,(.+)$/.exec(req.body.data || '');
  if (!m) throw new Error('Choose a file first.');
  const kind = m[1].startsWith('video') ? 'video' : 'image';
  const url = await save(req.u.id, kind, Buffer.from(m[2], 'base64'), m[1], (m[1].split('/')[1] || 'bin').split('+')[0], req.body.name);
  res.json({ url });
}));

app.get('/api/images', user, wrap(async (req, res) => {
  const r = await sb.from('files').select('*').eq('user_id', req.u.id).order('created_at', { ascending: false }).limit(60);
  res.json({ files: r.data || [] });
}));

// ---------- not connected yet ----------
const later = (what) => (req, res) => res.status(501).json({ error: what + ' needs an AI provider that is not connected yet.' });
app.post('/api/music', user, later('Music'));
app.post('/api/video', user, later('Video'));
app.post('/api/editor', user, later('The video editor'));

module.exports = app;
if (require.main === module) app.listen(process.env.PORT || 3000);
