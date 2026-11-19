import express from "express";
import cors from "cors";
import fs from "fs";

const PORT = process.env.PORT || 3000;
const START_CREDITS = 50;
const COST = { image: 1, sticker: 1, voice: 2, music: 3, motion: 3, video: 5 };
const DB = "/tmp/db.json";
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const load = () => { try { return JSON.parse(fs.readFileSync(DB, "utf8")); } catch { return { users: {} }; } };
const save = (d) => fs.writeFileSync(DB, JSON.stringify(d, null, 2));
const getUser = (d, id) => (d.users[id] ??= { credits: START_CREDITS, plan: "Free", name: "", email: "", items: [] });
const promptOf = (b) => Object.values(b || {}).find((v) => typeof v === "string" && v.trim()) || "";

const notReady = (what) => {
  const e = new Error(what + " service is not connected yet.");
  e.status = 501;
  throw e;
};
const providers = {
  image: async () => notReady("Image"),
  video: async () => notReady("Video"),
  music: async () => notReady("Music"),
  voice: async () => notReady("Voice"),
  sticker: async () => notReady("Sticker"),
  motion: async () => notReady("Motion sticker"),
};

const fetchT = (url, opts, ms) => {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return fetch(url, { ...opts, signal: c.signal }).finally(() => clearTimeout(t));
};

let cache = { at: 0, list: [] };
async function flashModels(key) {
  if (cache.list.length && Date.now() - cache.at < 3600000) return cache.list;
  try {
    const r = await fetchT(BASE + "/models?pageSize=200", { headers: { "x-goog-api-key": key } }, 6000);
    const d = await r.json();
    const list = (d.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent") && /flash/i.test(m.name) && !/image|tts|live|audio|embed|robotics|computer|thinking/i.test(m.name))
      .map((m) => m.name.replace("models/", ""))
      .sort((a, b) => (/lite/i.test(b) - /lite/i.test(a)) || b.localeCompare(a, undefined, { numeric: true }));
    if (list.length) cache = { at: Date.now(), list };
    return list;
  } catch {
    return [];
  }
}

async function lionAI(idea) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    const e = new Error("LION AI needs GEMINI_API_KEY in settings.");
    e.status = 501;
    throw e;
  }
  const models = (await flashModels(key)).slice(0, 3);
  if (!models.length) models.push(process.env.GEMINI_MODEL || "gemini-3.8-flash");
  let last = "LION AI is busy right now. Please try again in a minute.";
  for (const model of models) {
    try {
      const r = await fetchT(BASE + "/models/" + model + ":generateContent", {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: "You are LION AI, a creative planning assistant inside LION STUDIO. Turn the user's video idea into 3 short scenes, a one-line image/video prompt for each, a short voice-over line and a one-line music idea. Keep the whole answer under 200 words. Reply in the user's language." }] },
          contents: [{ role: "user", parts: [{ text: idea }] }],
          generationConfig: { maxOutputTokens: 700 },
        }),
      }, 7000);
      const data = await r.json();
      if (!r.ok) { last = (data && data.error && data.error.message) || last; continue; }
      const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
      const text = parts.map((p) => p.text || "").join("\n").trim();
      if (text) return text;
    } catch {
      last = "LION AI took too long. Please try again.";
    }
  }
  const e = new Error(last);
  e.status = 503;
  throw e;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => res.send("LION STUDIO backend is running."));

app.use("/api", (req, res, next) => {
  const id = String(req.get("x-user-id") || "").slice(0, 64);
  if (!id) return res.status(400).json({ ok: false, message: "Missing user id." });
  req.uid = id;
  next();
});

app.get("/api/credits", (req, res) => {
  const d = load(); const u = getUser(d, req.uid); save(d);
  res.json({ ok: true, credits: u.credits, plan: u.plan });
});

for (const name of Object.keys(COST)) {
  app.post("/api/" + name, async (req, res) => {
    const cost = COST[name];
    const before = getUser(load(), req.uid);
    if (before.credits < cost)
      return res.status(402).json({ ok: false, credits: before.credits, message: "Not enough credits. This needs " + cost + "." });
    try {
      const out = await providers[name](promptOf(req.body), req.body);
      const d = load(); const u = getUser(d, req.uid);
      u.credits = Math.max(0, u.credits - cost);
      if (out && out.url) u.items.push({ type: name, url: out.url, at: Date.now() });
      save(d);
      res.json({ ok: true, credits: u.credits, url: out && out.url, message: (out && out.message) || "Done." });
    } catch (e) {
      res.status(e.status || 500).json({ ok: false, credits: before.credits, message: e.message });
    }
  });
}

app.post("/api/ai", async (req, res) => {
  try {
    const idea = String((req.body && req.body.idea) || "").slice(0, 2000);
    if (!idea.trim()) return res.status(400).json({ ok: false, message: "Write your video idea first." });
    res.json({ ok: true, reply: await lionAI(idea) });
  } catch (e) {
    res.status(e.status || 500).json({ ok: false, message: e.message });
  }
});

app.post("/api/account", (req, res) => {
  const d = load(); const u = getUser(d, req.uid);
  if (typeof req.body.an === "string") u.name = req.body.an.slice(0, 80);
  if (typeof req.body.ae === "string") u.email = req.body.ae.slice(0, 120);
  save(d);
  res.json({ ok: true, message: "Account saved." });
});

for (const p of ["edit", "upload", "ocr"])
  app.post("/api/" + p, (req, res) => res.status(501).json({ ok: false, message: "This feature is not built in the backend yet." }));

app.listen(PORT, "0.0.0.0", () => console.log("LION STUDIO backend on port " + PORT));
