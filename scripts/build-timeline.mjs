#!/usr/bin/env node
// storyboard.json + data/timings.json  →  src/data/timeline.json, reports/cues.md, public/legendas.srt
// Converte cada at_word (+nth) em quadro. A duração da cena vem do áudio.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const sb = JSON.parse(fs.readFileSync(path.join(ROOT, "storyboard.json"), "utf8"));
const tm = JSON.parse(fs.readFileSync(path.join(ROOT, "data/timings.json"), "utf8"));
const { fps, width, height } = sb.meta;

const LEAD_S = 0.45; // respiro antes da fala
const TAIL_S = 1.15; // respiro depois da fala (além da transição)

export const norm = (w) =>
  w.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

const errors = [];
const warns = [];
const report = [];

const ptBR = (n) => n.toLocaleString("pt-BR").replace(/\u00a0/g, ".");
const dayValue = (d) => ({ day: d, value: 2 ** d, label: ptBR(2 ** d) + "×" });

function makeResolver(scene, words, leadF) {
  return (word, nth = 1, ctx = "") => {
    const target = norm(word);
    let count = 0;
    for (let i = 0; i < words.length; i++) {
      if (words[i].norm === target && ++count === nth) {
        const f = leadF + Math.round(words[i].start * fps);
        report.push({ scene: scene.id, type: scene.type, ctx, word, nth, index: i, frame: f });
        return f;
      }
    }
    errors.push(`${scene.id}: palavra-âncora "${word}" (nth ${nth}) não encontrada [${ctx}]`);
    return leadF;
  };
}

// resolve recursivamente at_word / until_word / *_at_word
function resolveObj(obj, R, ctx) {
  if (Array.isArray(obj)) return obj.map((o, i) => resolveObj(o, R, `${ctx}[${i}]`));
  if (!obj || typeof obj !== "object") return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === "at_word") out.at_frame = R(v, obj.nth ?? 1, `${ctx} ${obj.id ?? obj.action ?? obj.icon ?? obj.day ?? ""}`.trim());
    else if (k === "until_word") out.until_frame = R(v, obj.until_nth ?? 1, `${ctx} until`);
    else if (k.endsWith("_at_word")) out[k.replace(/_at_word$/, "_frame")] = R(v, obj[k.replace(/_at_word$/, "_nth")] ?? 1, `${ctx}.${k}`);
    if (typeof v === "object") out[k] = resolveObj(v, R, `${ctx}.${k}`);
    else out[k] = v;
    if (k === "day" && typeof v === "number") Object.assign(out, { value: 2 ** v, label: dayValue(v).label });
  }
  return out;
}

function captionChunks(words, leadF, sceneDur) {
  const chunks = [];
  let cur = [];
  const flush = () => { if (cur.length) chunks.push(cur); cur = []; };
  words.forEach((w, i) => {
    cur.push(i);
    const last = w.text.slice(-1);
    if (cur.length >= 7 || ".?!:".includes(last) || (last === "," && cur.length >= 4)) flush();
  });
  flush();
  return chunks.map((idx, ci) => {
    const startF = leadF + Math.round(words[idx[0]].start * fps);
    const endWord = leadF + Math.round(words[idx[idx.length - 1]].end * fps) + 8;
    const next = chunks[ci + 1] ? leadF + Math.round(words[chunks[ci + 1][0]].start * fps) : sceneDur - 4;
    return { from: startF, to: Math.min(Math.max(endWord, startF + 12), next, sceneDur - 2), words: idx };
  });
}

let cursor = 0;
const scenes = sb.scenes.map((scene, si) => {
  const t = tm.scenes[scene.id];
  if (!t) { errors.push(`${scene.id}: sem timings`); return null; }
  const tokens = scene.narration.split(/\s+/).filter(Boolean);
  if (tokens.length !== t.words.length) errors.push(`${scene.id}: ${tokens.length} palavras na narração vs ${t.words.length} nos timings`);
  const words = t.words.map((w, i) => ({ text: tokens[i] ?? w.text, norm: norm(tokens[i] ?? w.text), start: w.start, end: w.end }));
  const leadF = Math.round(LEAD_S * fps);
  const trans = scene.transition_out ?? { type: "none", frames: 0 };
  const tail = (scene.tail_seconds ?? TAIL_S) + (trans.frames || 0) / fps;
  const durationInFrames = Math.ceil((LEAD_S + t.duration_s + tail) * fps);
  const R = makeResolver(scene, words, leadF);
  const resolved = resolveObj(scene, R, scene.id);
  const from = cursor;
  cursor += durationInFrames - (si < sb.scenes.length - 1 ? trans.frames || 0 : 0);
  const sec = durationInFrames / fps;
  if (sec < 8 || sec > 20.5) warns.push(`${scene.id}: duração ${sec.toFixed(2)} s fora de 8–20 s`);
  if (si > 0 && sb.scenes[si - 1].type === scene.type) warns.push(`${scene.id}: mesmo tipo da cena anterior`);
  return {
    ...resolved,
    index: si,
    from,
    durationInFrames,
    leadFrames: leadF,
    audio: t.audio ?? null,
    speechFrames: Math.round(t.duration_s * fps),
    words: words.map((w) => ({ text: w.text, norm: w.norm, f0: leadF + Math.round(w.start * fps), f1: leadF + Math.round(w.end * fps) })),
    captions: captionChunks(words, leadF, durationInFrames),
  };
});

const totalFrames = cursor;
const totalS = totalFrames / fps;
if (totalS < 230 || totalS > 250) warns.push(`duração total ${totalS.toFixed(2)} s fora de 3:50–4:10`);

// conferência dos números falados na cena da conta (2^n por extenso)
const spoken = { 1: "duas vezes", 2: "quatro", 3: "oito", 7: "cento e vinte e oito", 10: "mil e vinte e quatro", 20: "um milhão", 30: "um bilhão" };
const conta = sb.scenes.find((s) => s.id === "s03-conta");
const numberChecks = Object.entries(spoken).map(([d, phrase]) => ({
  day: +d, value: ptBR(2 ** +d), spoken: phrase, ok: conta.narration.toLowerCase().includes(phrase),
}));
numberChecks.forEach((c) => !c.ok && errors.push(`número falado ausente: dia ${c.day} → "${c.spoken}"`));

const timeline = { fps, width, height, totalFrames, source: tm.source, method: tm.method ?? "", scenes };
fs.mkdirSync(path.join(ROOT, "src/data"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "src/data/timeline.json"), JSON.stringify(timeline));

// ----- relatório
const fmt = (f) => { const s = f / fps; return `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, "0")}`; };
let md = `# Relatório de cues (at_word → quadro)\n\nFonte da narração: **${tm.source}**  \nDuração total: **${fmt(totalFrames)}** (${totalFrames} quadros @ ${fps} fps)\n\n`;
md += `## Cenas\n\n| # | id | tipo | início | duração |\n|---|---|---|---|---|\n`;
scenes.forEach((s) => (md += `| ${s.index + 1} | ${s.id} | ${s.type} | ${fmt(s.from)} | ${(s.durationInFrames / fps).toFixed(2)} s |\n`));
md += `\n## Números (2^n)\n\n| dia | 2^n | falado | ok |\n|---|---|---|---|\n`;
numberChecks.forEach((c) => (md += `| ${c.day} | ${c.value}× | ${c.spoken} | ${c.ok ? "✅" : "❌"} |\n`));
md += `\n## Cues\n\n| cena | marcação | palavra (nth) | índice | quadro local | quadro absoluto |\n|---|---|---|---|---|---|\n`;
report.forEach((r) => {
  const sc = scenes.find((s) => s.id === r.scene);
  md += `| ${r.scene} | ${r.ctx.replace(r.scene, "").trim()} | ${r.word} (${r.nth}) | ${r.index} | ${r.frame} | ${sc ? sc.from + r.frame : "?"} |\n`;
});
md += `\n## Avisos\n\n${warns.length ? warns.map((w) => "- " + w).join("\n") : "- nenhum"}\n\n## Erros\n\n${errors.length ? errors.map((w) => "- " + w).join("\n") : "- nenhum"}\n`;
fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "reports/cues.md"), md);

// ----- SRT
const srtT = (f) => {
  const ms = Math.round((f / fps) * 1000);
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${h}:${m}:${s},${String(ms % 1000).padStart(3, "0")}`;
};
let n = 0, srt = "";
scenes.forEach((s) => s.captions.forEach((c) => {
  srt += `${++n}\n${srtT(s.from + c.from)} --> ${srtT(s.from + c.to)}\n${c.words.map((i) => s.words[i].text).join(" ")}\n\n`;
}));
fs.writeFileSync(path.join(ROOT, "public/legendas.srt"), srt);

console.log(`cenas: ${scenes.length} · total ${fmt(totalFrames)} (${totalFrames} quadros) · cues resolvidas: ${report.length}`);
warns.forEach((w) => console.log("AVISO:", w));
errors.forEach((e) => console.log("ERRO:", e));
if (errors.length) process.exit(1);
