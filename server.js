import express from "express";
import cors from "cors";
import fs from "fs";
import page from "./page.js";

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

const VOICES = { Female: "Kore", Male: "Charon
