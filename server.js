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

const fail = (msg, status) => { const e = new Error(msg); e.status = status; throw e; };
const notReady = (what) => fail(what + " service is not connected yet.", 501);

const fetchT = (url, opts, ms) => {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return fetch(url, { ...opts, signal: c.signal }).finally(() => clearTimeout(t));
};

function wav(pcm, rate = 24000) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

const VOICES = { Female: "Kore", Male: "Charon", Child: "Leda" };
const TTS_MODELS = process.env.GEMINI_TTS_MODEL
  ? [process.env.GEMINI_TTS_MODEL]
  : ["gemini-3.1-flash-tts-preview", "gemini-3.8-flash-lite-tts", "gemini-3.8-flash-tts"];

async function speak(body) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) fail("Voice needs GEMINI_API_KEY in settings.", 501);
  const text = String((body && body.p) || "").trim().slice(0, 600);
  if (!text) fail("Write the text first.", 400);
  const voice = VOICES[body && body.f2] || "Kore";
  let last = "Voice is not available right now. Please try again.";
  for (const model of TTS_MODELS) {
    try {
      const r = await fetchT(BASE + "/models/" + model + ":generateContent", {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
          },
        }),
      }, 15000);
      const data = await r.json();
      if (!r.ok) { last = (data && data.error && data.error.message) || last; continue; }
      const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
      const part = parts.find((p) => p.inlineData && p.inlineData.data);
      if (!part) { last = "No audio came back. Try shorter text."; continue; }
      let buf = Buffer.from(part.inlineData.data, "base64");
      if (buf.subarray(0, 4).toString("ascii") !== "RIFF") {
        const m = /rate=(\d+)/.exec(part.inlineData.mimeType || "");
        buf = wav(buf, m ? Number(m[1]) : 24000);
      }
      return { audio: "data:audio/wav;base64," + buf.toString("base64"), message: "Your voice is ready. Press play below." };
    } catch {
      last = "Voice took too long. Please try again.";
    }
  }
  fail(last, 503);
}

const providers = {
  image: async () => notReady("Image"),
  video: async () => notReady("Video"),
  music: async () => notReady("Music"),
  voice: async (prompt, body) => speak(body),
  sticker: async () => notReady("Sticker"),
  motion: async () => notReady("Motion sticker"),
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
