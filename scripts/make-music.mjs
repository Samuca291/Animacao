#!/usr/bin/env node
// Trilha leve procedural (sem licenças): pad suave + pluck pentatônico, loop de 16 s.
// Saída: public/audio/trilha.wav (mono 22.05 kHz). Tocada em loop, volume baixo, com ducking leve.
import fs from "node:fs";
import path from "node:path";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SR = 22050, BPM = 96, BEAT = 60 / BPM, BARS = 8, LEN = BARS * 4 * BEAT; // 20 s
const N = Math.floor(LEN * SR);
const out = new Float32Array(N);
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
const chords = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 66]]; // Am7 Fmaj7 Cmaj7 G(add)
// pad
for (let bar = 0; bar < BARS; bar++) {
  const ch = chords[bar % 4];
  const t0 = bar * 4 * BEAT, dur = 4 * BEAT;
  for (const m of ch) {
    const f = hz(m);
    for (let i = Math.floor(t0 * SR); i < Math.min(N, Math.floor((t0 + dur + 0.6) * SR)); i++) {
      const t = i / SR - t0;
      const env = Math.min(1, t / 0.8) * Math.min(1, Math.max(0, (dur + 0.6 - t) / 1.0));
      out[i] += 0.05 * env * (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2.003 * t));
    }
  }
}
// pluck (arpejo)
const pent = [69, 72, 74, 76, 79, 81];
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
for (let s = 0; s < BARS * 8; s++) {
  if (rnd() < 0.35) continue;
  const f = hz(pent[Math.floor(rnd() * pent.length)]);
  const t0 = s * BEAT / 2;
  for (let i = Math.floor(t0 * SR); i < Math.min(N, Math.floor((t0 + 1.2) * SR)); i++) {
    const t = i / SR - t0;
    out[i] += 0.07 * Math.exp(-t * 5) * Math.sin(2 * Math.PI * f * t) * Math.min(1, t * 200);
  }
}
// bumbo suave
for (let b = 0; b < BARS * 4; b += 2) {
  const t0 = b * BEAT;
  for (let i = Math.floor(t0 * SR); i < Math.min(N, Math.floor((t0 + 0.3) * SR)); i++) {
    const t = i / SR - t0;
    out[i] += 0.12 * Math.exp(-t * 18) * Math.sin(2 * Math.PI * (55 + 60 * Math.exp(-t * 30)) * t);
  }
}
// crossfade de loop
const X = Math.floor(0.5 * SR);
for (let i = 0; i < X; i++) { const g = i / X; out[i] = out[i] * g + out[N - X + i] * (1 - g); }
const final = out.slice(0, N - X);
const peak = final.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
const pcm = Buffer.alloc(final.length * 2);
final.forEach((v, i) => pcm.writeInt16LE(Math.round((v / peak) * 0.8 * 32767), i * 2));
const h = Buffer.alloc(44);
h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(SR, 24);
h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
fs.mkdirSync(path.join(ROOT, "public/audio"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "public/audio/trilha.wav"), Buffer.concat([h, pcm]));
console.log(`trilha.wav: ${(final.length / SR).toFixed(2)} s`);
