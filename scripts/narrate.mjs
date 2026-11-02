#!/usr/bin/env node
// Narração ElevenLabs com timestamps por caractere → palavras.
// Uso: ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=... node scripts/narrate.mjs [--only s01-gancho]
// Saída: public/audio/<id>.mp3 + data/timings.json (substitui o fallback do Piper).
// Depois: node scripts/build-timeline.mjs && node scripts/render.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE = process.env.ELEVENLABS_VOICE_ID;
const MODEL = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
if (!KEY || !VOICE) {
  console.error("Defina ELEVENLABS_API_KEY e ELEVENLABS_VOICE_ID (voz pt-BR). Fallback offline: python3 scripts/tts_piper.py");
  process.exit(1);
}
const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const sb = JSON.parse(fs.readFileSync(path.join(ROOT, "storyboard.json"), "utf8"));
const tpath = path.join(ROOT, "data/timings.json");
const timings = only && fs.existsSync(tpath)
  ? JSON.parse(fs.readFileSync(tpath, "utf8"))
  : { source: `elevenlabs:${MODEL}:${VOICE}`, method: "character-alignment", scenes: {} };
timings.source = `elevenlabs:${MODEL}:${VOICE}`;
fs.mkdirSync(path.join(ROOT, "public/audio"), { recursive: true });

const ffprobe = path.join(ROOT, "node_modules/@remotion/compositor-linux-x64-gnu/ffprobe");
const probe = (f) => {
  try {
    return parseFloat(execFileSync(ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], {
      env: { ...process.env, LD_LIBRARY_PATH: path.dirname(ffprobe) },
    }).toString());
  } catch { return null; }
};

function charsToWords(al) {
  const words = [];
  let cur = null;
  al.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) { if (cur) words.push(cur); cur = null; return; }
    if (!cur) cur = { text: "", start: al.character_start_times_seconds[i], end: 0 };
    cur.text += ch;
    cur.end = al.character_end_times_seconds[i];
  });
  if (cur) words.push(cur);
  return words;
}

for (let i = 0; i < sb.scenes.length; i++) {
  const sc = sb.scenes[i];
  if (only && sc.id !== only) continue;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: sc.narration,
      model_id: MODEL,
      previous_text: sb.scenes[i - 1]?.narration,
      next_text: sb.scenes[i + 1]?.narration,
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
    }),
  });
  if (!res.ok) { console.error(sc.id, res.status, await res.text()); process.exit(1); }
  const json = await res.json();
  const file = path.join(ROOT, "public/audio", `${sc.id}.mp3`);
  fs.writeFileSync(file, Buffer.from(json.audio_base64, "base64"));
  const words = charsToWords(json.alignment).map((w) => ({ text: w.text, start: +w.start.toFixed(3), end: +w.end.toFixed(3) }));
  const duration = probe(file) ?? words[words.length - 1].end + 0.2;
  timings.scenes[sc.id] = { audio: `audio/${sc.id}.mp3`, duration_s: +duration.toFixed(3), words };
  console.log(`${sc.id}: ${words.length} palavras, ${duration.toFixed(2)} s`);
}
fs.mkdirSync(path.dirname(tpath), { recursive: true });
fs.writeFileSync(tpath, JSON.stringify(timings, null, 1));
console.log("ok → data/timings.json");
