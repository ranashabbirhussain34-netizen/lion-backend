import express from "express";
import cors from "cors";
import fs from "fs";

const PORT = process.env.PORT || 3000;
const START_CREDITS = 50;
const COST = { image: 1, sticker: 1, voice: 2, music: 3, motion: 3, video: 5 };
const DB = "/tmp/db.json"
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

async function lionAI(idea) {
  if (!process.env.ANTHROPIC_API_KEY) {
    const e = new Error("LION AI needs ANTHROPIC_API_KEY in settings.");
    e.status = 501;
    throw e;
  }
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 1000,
      system: "You are LION AI, a creative planning assistant inside LION STUDIO. Turn the user's video idea into short scenes, an image/video prompt for each scene, a voice-over script and a music plan. Be concise. Reply in the user's language.",
      messages: [{ role: "user", content: idea }],
    }),
  });
  const data = await r.json();
  if (!r.ok) {
    const e = new Error(data?.error?.message || "LION AI request failed.");
    e.status = 502;
    throw e;
  }
  return data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
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
