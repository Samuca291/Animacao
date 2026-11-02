import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import type { Layer, Scene } from "./types";
import { clamp, ease, easeOut, float, lerp, ptBR, rand, spr, times } from "./anim";
import { Icon } from "./assets/Icons";

const FONT = "Nunito, DejaVu, sans-serif";
const TITLE = "Baloo2, Nunito, DejaVu, sans-serif";
export const LIGHT_BG = ["warm", "paper"];

const SLOTS: Record<string, [number, number]> = {
  center: [960, 480], "center-up": [960, 330], "center-down": [960, 700], top: [960, 170],
  "top-left": [250, 100], "top-right": [1440, 110], left: [560, 520], "left-up": [500, 290], "left-down": [500, 790],
  right: [1400, 470], "right-up": [1400, 250], "right-down": [1400, 780], full: [960, 540],
};

/* ================= FUNDOS ================= */
export const EditBackground: React.FC<{ kind: string; f: number }> = ({ kind, f }) => {
  if (kind === "stars" || kind === "night") {
    return (
      <AbsoluteFill style={{ background: kind === "stars" ? "radial-gradient(circle at 50% 40%, #1b2a6b, #070b24 70%)" : "linear-gradient(#0b132b, #1c2541)" }}>
        <svg width={1920} height={1080}>
          {Array.from({ length: 90 }).map((_, i) => {
            const x = (rand(i) * 1920 + f * (0.2 + rand(i + 1) * 0.6)) % 1920;
            const y = kind === "night" ? (rand(i + 2) * 1080 - f * (0.3 + rand(i + 3)) + 2000) % 1080 : rand(i + 2) * 1080;
            return <circle key={i} cx={x} cy={y} r={1 + rand(i + 4) * 2.5} fill="#fff" opacity={0.3 + 0.7 * Math.abs(Math.sin(f / 15 + i))} />;
          })}
        </svg>
      </AbsoluteFill>
    );
  }
  if (kind === "grid") {
    const o = (f * 0.6) % 80;
    return (
      <AbsoluteFill style={{
        background: "#0f1b3d",
        backgroundImage: "linear-gradient(rgba(120,160,255,.13) 2px, transparent 2px), linear-gradient(90deg, rgba(120,160,255,.13) 2px, transparent 2px)",
        backgroundSize: "80px 80px", backgroundPosition: `${o}px ${o * 0.5}px`,
      }} />
    );
  }
  if (kind === "warm") {
    return (
      <AbsoluteFill style={{ background: "#fff1d6" }}>
        <svg width={1920} height={1080}>
          {Array.from({ length: 9 }).map((_, i) => (
            <circle key={i} cx={(rand(i) * 1920 + f * (0.4 + rand(i + 5))) % 2200 - 140} cy={rand(i + 9) * 1080 + float(f, i, 30, 200)} r={60 + rand(i + 2) * 140} fill={["#ffd8a8", "#ffc9c9", "#ffec99"][i % 3]} opacity={0.55} />
          ))}
        </svg>
      </AbsoluteFill>
    );
  }
  if (kind === "purple") {
    return (
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, #7209b7, #240046 75%)" }}>
        <AbsoluteFill style={{ background: `repeating-conic-gradient(from ${f * 0.4}deg at 50% 50%, rgba(255,255,255,.06) 0deg 10deg, transparent 10deg 20deg)` }} />
      </AbsoluteFill>
    );
  }
  if (kind === "paper") {
    const o = (f * 0.4) % 64;
    return (
      <AbsoluteFill style={{ background: "#f8f5ec", backgroundImage: "linear-gradient(rgba(70,100,160,.12) 2px, transparent 2px)", backgroundSize: "100% 64px", backgroundPosition: `0 ${o}px` }}>
        <div style={{ position: "absolute", left: 140, top: 0, bottom: 0, width: 3, background: "rgba(230,80,80,.35)" }} />
      </AbsoluteFill>
    );
  }
  // dusk
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#ff9a8b, #a06cd5 55%, #3c2a6b)" }}>
      <div style={{ position: "absolute", left: 860 + float(f, 1, 40, 400), top: 640 - f * 0.25, width: 200, height: 200, borderRadius: 100, background: "#ffe066", opacity: 0.55, filter: "blur(4px)" }} />
    </AbsoluteFill>
  );
};

/* ================= CAMADAS ================= */
type LP = { layer: Layer; scene: Scene; f: number; dark: boolean };

function fitSize(text: string, size: number, maxW: number) {
  return Math.min(size, maxW / Math.max(1, text.length * 0.56));
}

const Kinetic: React.FC<LP> = ({ layer, f, dark }) => {
  const p = layer.props ?? {};
  const text: string = p.text;
  const local = f - layer.at_frame;
  const color = p.color ?? (dark ? "#fff" : "#1f2430");
  if (layer.enter === "typewriter") {
    const n = Math.floor(interpolate(local, [0, text.length * 1.1], [0, text.length], clamp));
    return (
      <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: p.size, color, maxWidth: p.max_width ?? 1400, textAlign: "center", lineHeight: 1.1 }}>
        {text.slice(0, n)}<span style={{ opacity: Math.floor(local / 8) % 2 ? 1 : 0 }}>|</span>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 22px", maxWidth: p.max_width ?? 1500, fontFamily: TITLE, fontWeight: 800, fontSize: p.size, color }}>
      {text.split(" ").map((w, i) => {
        const s = spr(f, layer.at_frame + i * 3, { damping: layer.enter === "wobble" ? 7 : 14 });
        const rot = layer.enter === "wobble" ? Math.sin((local + i * 5) / 4) * 6 : 0;
        return <span key={i} style={{ display: "inline-block", transform: `translateY(${(1 - s) * 80 + float(f, i, 5, 50)}px) rotate(${rot}deg) scale(${0.6 + 0.4 * s})`, opacity: Math.min(1, s * 1.5) }}>{w}</span>;
      })}
    </div>
  );
};

const SyncWords: React.FC<LP> = ({ layer, scene, f, dark }) => {
  const p = layer.props ?? {};
  const i0 = scene.words.findIndex((w) => w.norm === p.from_word);
  let i1 = scene.words.findIndex((w) => w.norm === p.to_word);
  if (i1 < 0) i1 = scene.words.length - 1;
  const hi: string[] = p.highlight ?? [];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 24px", maxWidth: 1560, fontFamily: TITLE, fontWeight: 800, fontSize: p.size ?? 90, lineHeight: 1.08 }}>
      {scene.words.slice(i0, i1 + 1).map((w, k) => {
        const s = spr(f, w.f0, { damping: 12, stiffness: 170 });
        const isHi = hi.includes(w.norm);
        return (
          <span key={k} style={{
            display: "inline-block", opacity: Math.min(1, s * 1.4),
            transform: `translateY(${(1 - s) * 50 + float(f, k, 3, 60)}px) scale(${isHi ? 1 + 0.12 * s : 1})`,
            color: isHi ? "#ffd166" : dark ? "#fff" : "#1f2430",
            textShadow: isHi ? "0 0 30px rgba(255,209,102,.6)" : "none",
          }}>{w.text}</span>
        );
      })}
    </div>
  );
};

const Stamp: React.FC<LP> = ({ layer, f }) => {
  const p = layer.props ?? {};
  const local = f - layer.at_frame;
  const size = p.size ?? 120;
  return (
    <div style={{
      fontFamily: TITLE, fontWeight: 800, fontSize: size, color: p.color, border: `${size / 12}px solid ${p.color}`, borderRadius: 24,
      padding: "0 40px", transform: `rotate(${(p.rotate ?? 0) + Math.sin(local / 20) * 1.5}deg)`, background: "rgba(255,255,255,.08)", whiteSpace: "nowrap",
    }}>{p.text}</div>
  );
};

const IconLayer: React.FC<LP> = ({ layer, f, dark }) => {
  const p = layer.props ?? {};
  const local = f - layer.at_frame;
  const pulse = p.pulse ? 1 + 0.07 * Math.sin(local / 5) : 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ transform: `scale(${pulse})` }}><Icon name={p.icon} size={p.size ?? 160} f={local} spin={p.spin ?? 1} /></div>
      {p.label && <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: dark ? "#fff" : "#1f2430", whiteSpace: "nowrap" }}>{p.label}</div>}
    </div>
  );
};

const Equation: React.FC<LP> = ({ layer, f, dark }) => {
  const p = layer.props ?? {};
  return (
    <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 96, color: dark ? "#fff" : "#1f2430", whiteSpace: "nowrap" }}>
      {p.text}
      <sup style={{ fontSize: 56, color: "#ffd166", display: "inline-block", transform: `translateY(${float(f, 2, 6, 40)}px)` }}>{p.exp}</sup>
    </div>
  );
};

const Ladder: React.FC<LP> = ({ layer, f }) => {
  const items = layer.items ?? [];
  const curIdx = items.filter((it) => it.at_frame <= f).length - 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 640 }}>
      {items.map((it, i) => {
        if (it.at_frame > f) return <div key={i} style={{ height: 70 }} />;
        const s = spr(f, it.at_frame, { damping: 14 });
        const isCur = i === curIdx;
        return (
          <div key={i} style={{
            height: 70, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", borderRadius: 18,
            background: isCur ? "#ffd166" : "rgba(255,255,255,.08)", color: isCur ? "#1f2430" : "#cdd5ee",
            fontFamily: FONT, fontWeight: 900, fontSize: 40, transform: `translateX(${(1 - s) * -300}px) scale(${isCur ? 1.04 : 1})`, opacity: s,
          }}>
            <span>Dia {it.day}</span><span style={{ fontFamily: TITLE }}>2<sup style={{ fontSize: 24 }}>{it.day}</sup> = {it.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const Counter: React.FC<LP> = ({ layer, f, dark }) => {
  const p = layer.props ?? {};
  const items = layer.items ?? [];
  let cur = items[0], prevDay = p.roll_from_day ?? 0;
  for (let i = 0; i < items.length; i++) if (items[i].at_frame <= f) { cur = items[i]; prevDay = i > 0 ? items[i - 1].day : p.roll_from_day ?? 0; }
  const t = easeOut(f, cur.at_frame, 16);
  const v = t >= 1 ? 2 ** cur.day : 2 ** lerp(prevDay, cur.day, t);
  const text = `${ptBR(v)}×`;
  const maxW = (layer.slot ?? "center").includes("center") || layer.slot === "full" ? 1600 : 820;
  const size = fitSize(times(cur.day), p.size ?? 150, maxW);
  const bump = 1 + 0.12 * Math.max(0, 1 - (f - cur.at_frame) / 10);
  return (
    <div style={{ textAlign: "center", fontFamily: TITLE, color: dark ? "#fff" : "#1f2430" }}>
      <div style={{ fontSize: 40, fontWeight: 800, opacity: 0.7, letterSpacing: 4 }}>DIA {cur.day} · 2<sup>{cur.day}</sup></div>
      <div style={{ fontSize: size, fontWeight: 800, color: "#ffd166", transform: `scale(${bump})`, whiteSpace: "nowrap", textShadow: "0 8px 0 rgba(0,0,0,.25)" }}>{text}</div>
    </div>
  );
};

const Blocks: React.FC<LP> = ({ layer, f }) => {
  const items = layer.items ?? [];
  const cur = [...items].reverse().find((it) => it.at_frame <= f) ?? items[0];
  const n = 2 ** cur.day;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 52px)", gap: 10 }}>
      {Array.from({ length: n }).map((_, i) => {
        const s = spr(f, cur.at_frame + i * 2, { damping: 10 });
        return <div key={i} style={{ width: 52, height: 52, borderRadius: 12, background: "#4dabf7", transform: `scale(${s}) rotate(${float(f, i, 4, 40)}deg)`, boxShadow: "0 5px 0 #1c7ed6" }} />;
      })}
    </div>
  );
};

const DayChip: React.FC<LP> = ({ layer, f }) => {
  const d = layer.props?.day as number;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#ffd166", color: "#1f2430", padding: "12px 28px", borderRadius: 22, fontFamily: TITLE, fontWeight: 800, fontSize: 52, boxShadow: "8px 8px 0 #1f2430", transform: `rotate(${-2 + float(f, 5, 1.2, 60)}deg)`, whiteSpace: "nowrap" }}>
      DIA {d} <span style={{ fontSize: 40, opacity: 0.8 }}>· {times(d)}</span>
    </div>
  );
};

const Morph: React.FC<LP> = ({ layer, f, dark }) => {
  const p = layer.props ?? {};
  const toF = p.to_frame ?? 1e9;
  const flip = interpolate(f, [toF - 6, toF, toF + 6], [1, 0, 1], clamp);
  const isTo = f >= toF;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ transform: `scaleX(${flip}) rotate(${isTo ? Math.sin(f / 4) * 6 : 0}deg)` }}><Icon name={isTo ? p.to_icon : p.from_icon} size={240} /></div>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 44, color: dark ? "#fff" : "#1f2430" }}>{isTo ? `= ${p.label_to}` : p.label_from}</div>
    </div>
  );
};

const Bookshelf: React.FC<LP> = ({ layer, f }) => {
  const p = layer.props ?? {};
  const end = p.label_frame ?? layer.at_frame + 40;
  const pr = ease(f, layer.at_frame, Math.max(10, end - layer.at_frame));
  const colors = ["#ff6b6b", "#4dabf7", "#ffd43b", "#69db7c", "#b197fc", "#ffa94d"];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
      <div style={{ display: "flex", flexWrap: "wrap", width: 1100, gap: 6, justifyContent: "center" }}>
        {Array.from({ length: 64 }).map((_, i) => {
          const s = spr(f, layer.at_frame + i * 0.6, { damping: 13 });
          const read = i / 64 < pr;
          return <div key={i} style={{ width: 28, height: 100 + rand(i) * 40, borderRadius: 4, background: colors[i % 6], transform: `translateY(${(1 - s) * -600}px) rotate(${read ? -8 : 0}deg)`, opacity: read ? 0.45 : 1, border: "3px solid #1f2430" }} />;
        })}
      </div>
      <div style={{ width: 900, height: 34, borderRadius: 17, background: "rgba(255,255,255,.15)", overflow: "hidden" }}>
        <div style={{ width: `${pr * 100}%`, height: "100%", background: "#69db7c" }} />
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 44, color: "#fff", opacity: f >= end ? 1 : 0.6 }}>{f >= end ? p.label : `biblioteca: ${Math.round(pr * 100)}%`}</div>
    </div>
  );
};

const GLYPHS = "∑∫πΩ√∞≈≠λΔ#@%&";
const TextMorph: React.FC<LP> = ({ layer, f }) => {
  const p = layer.props ?? {};
  const toF = p.to_frame ?? 1e9;
  const from: string = p.from, to: string = p.to;
  const len = Math.max(from.length, to.length);
  const chars = Array.from({ length: len }).map((_, i) => {
    const start = toF + i * 0.6;
    if (f < start) return from[i] ?? " ";
    if (f < start + 8) return GLYPHS[Math.floor(rand(i + Math.floor(f / 2)) * GLYPHS.length)];
    return to[i] ?? " ";
  });
  const done = f >= toF + len * 0.6 + 8;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <div style={{ fontFamily: "DejaVu, Nunito", fontSize: p.size, fontWeight: 700, color: done ? "#69db7c" : "#ffd166", whiteSpace: "pre", background: "rgba(0,0,0,.25)", padding: "20px 40px", borderRadius: 20 }}>{chars.join("")}</div>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: "#cdd5ee" }}>{done ? "lista de supermercado" : "hieróglifos?"}</div>
    </div>
  );
};

const Paper: React.FC<LP> = ({ layer, f }) => {
  const p = layer.props ?? {};
  const sh = ease(f, p.shrink_frame ?? 1e9, 18);
  const lines = Math.round(lerp(14, 3, sh));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 50 }}>
      <div style={{ width: 420, padding: 34, background: "#fff", borderRadius: 12, transform: `scale(${lerp(1, 0.72, sh)}) rotate(${-3 + float(f, 2, 1.5, 70)}deg)`, boxShadow: "14px 14px 0 rgba(0,0,0,.3)" }}>
        <div style={{ fontFamily: TITLE, fontSize: 34, fontWeight: 800, color: "#1f2430", marginBottom: 14 }}>{p.title}</div>
        {Array.from({ length: lines }).map((_, i) => <div key={i} style={{ height: 12, margin: "12px 0", borderRadius: 6, background: "#ced4da", width: `${60 + rand(i) * 40}%` }} />)}
      </div>
      {sh > 0.05 && <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 46, color: "#fff", opacity: sh, maxWidth: 520 }}>versão “simplificada”<br /><span style={{ color: "#ffd166" }}>(ainda indecifrável)</span></div>}
    </div>
  );
};

const BreakBar: React.FC<LP> = ({ layer, f }) => {
  const p = layer.props ?? {};
  const b = easeOut(f, p.break_frame ?? 1e9, 20);
  const half = (side: -1 | 1, label: string) => (
    <div style={{ width: 560, height: 90, background: side < 0 ? "linear-gradient(90deg,#74c0fc,#b197fc)" : "linear-gradient(90deg,#b197fc,#f783ac)", borderRadius: side < 0 ? "45px 0 0 45px" : "0 45px 45px 0",
      display: "flex", alignItems: "center", justifyContent: side < 0 ? "flex-start" : "flex-end", padding: "0 30px", boxSizing: "border-box",
      fontFamily: FONT, fontWeight: 900, fontSize: 34, color: "#1f2430", transform: `translate(${side * b * 160}px, ${b * 120}px) rotate(${side * b * 16}deg)` }}>{label}</div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
      <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 60, color: "#fff" }}>{p.label}</div>
      <div style={{ display: "flex" }}>{half(-1, "pessoa comum")}{half(1, "gênio")}</div>
      {b > 0 && <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 90, color: "#ffd166", transform: `scale(${spr(f, p.break_frame, { damping: 8 })})` }}>QUEBROU.</div>}
    </div>
  );
};

const Crowd: React.FC<LP> = ({ layer, f }) => {
  const p = layer.props ?? {};
  const g = p.grow_frame ?? 1e9;
  const k = f < g ? 0 : Math.min(9, Math.floor((f - g) / 4) + 1);
  const n = 2 ** k;
  const cell = Math.min(200, Math.sqrt((1500 * 560) / n));
  const cols = Math.max(1, Math.floor(1500 / cell));
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{ display: "flex", flexWrap: "wrap", width: cols * cell, justifyContent: "center" }}>
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} style={{ width: cell, height: cell, transform: `translateY(${float(f, i, cell * 0.05, 30)}px)` }}><Icon name="person" size={cell * 0.9} /></div>
        ))}
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 46, color: "#fff" }}>
        {k === 0 ? "um gênio" : k < 9 ? "gênios…" : "uma cidade inteira de gênios"}{f >= (p.label_frame ?? 1e9) ? <span style={{ color: "#69db7c" }}> · {p.label}</span> : null}
      </div>
    </div>
  );
};

const Shower: React.FC<LP> = ({ layer, f }) => {
  const p = layer.props ?? {};
  const ideas = ["E = ?", "∑", "∞", "√π", "Δ≠0", "★"];
  const foam = easeOut(f, p.foam_frame ?? 1e9, 20);
  return (
    <svg width={900} height={700} viewBox="0 0 900 700" style={{ overflow: "visible" }}>
      <path d="M 300 40 H 470 Q 500 40 500 80 V 120" fill="none" stroke="#adb5bd" strokeWidth={22} strokeLinecap="round" />
      <path d="M 430 120 H 570 L 540 160 H 460 Z" fill="#ced4da" stroke="#1f2430" strokeWidth={5} />
      {Array.from({ length: 24 }).map((_, i) => {
        const y = 170 + ((f * 12 + i * 37) % 280);
        const x = 470 + (i % 6) * 12 + (y - 170) * ((i % 6) - 2.5) * 0.12;
        return <line key={i} x1={x} y1={y} x2={x} y2={y + 22} stroke="#74c0fc" strokeWidth={5} strokeLinecap="round" />;
      })}
      <circle cx={500} cy={520} r={110} fill="#F4C7A1" stroke="#1f2430" strokeWidth={6} />
      <path d="M 400 520 Q 400 400 500 400 Q 600 400 600 520 Q 560 470 500 470 Q 440 470 400 520 Z" fill="#3B2416" />
      <path d="M 455 545 q 12 10 24 0 M 521 545 q 12 10 24 0" fill="none" stroke="#1f2430" strokeWidth={6} strokeLinecap="round" />
      <path d="M 470 585 Q 500 605 530 585" fill="none" stroke="#1f2430" strokeWidth={6} strokeLinecap="round" />
      {Array.from({ length: 10 }).map((_, i) => (
        <circle key={i} cx={410 + i * 20} cy={410 - Math.abs(i - 4.5) * 4 - foam * 20 * rand(i)} r={foam * (24 + rand(i + 2) * 22)} fill="#fff" stroke="#dbe4ff" strokeWidth={3} />
      ))}
      {f >= (p.ideas_frame ?? 1e9) && ideas.map((t, i) => {
        const st = (p.ideas_frame as number) + i * 6;
        if (f < st) return null;
        const k = ((f - st) % 90) / 90;
        return <text key={i} x={500 + (i % 2 ? 1 : -1) * (160 + i * 25)} y={480 - k * 380} fontSize={56} fontFamily="DejaVu, Nunito" fontWeight={700} fill="#ffd166" textAnchor="middle" opacity={1 - k}>{t}</text>;
      })}
    </svg>
  );
};

/* ---- Gráfico 2^n ---- */
const Chart: React.FC<LP> = ({ layer, f }) => {
  const p = layer.props ?? {};
  const W = 1400, H = 600, ox = 120, oy = 680;
  const X = (d: number) => ox + (d / 30) * W;
  const Y = (v: number) => oy - (v / 2 ** 30) * H;
  const pts: [number, number][] = [];
  for (let d = 0; d <= 30.0001; d += 0.25) pts.push([X(d), Y(2 ** d)]);
  let len = 0;
  const cum = [0];
  for (let i = 1; i < pts.length; i++) { len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); cum.push(len); }
  const drawEnd = (p.draw_frame ?? layer.at_frame + 30) + 24;
  const pr = ease(f, layer.at_frame + 6, Math.max(20, drawEnd - layer.at_frame - 6));
  const headI = cum.findIndex((c) => c >= pr * len);
  const head = pts[Math.max(0, headI)];
  const d = "M " + pts.map((q) => q.join(" ")).join(" L ");
  const show = (k: string) => f >= (p[k] ?? 1e9);
  const sp = (k: string) => spr(f, p[k] ?? 1e9, { damping: 12 });
  const v29 = 2 ** 29, v30 = 2 ** 30;
  const txt = { fontFamily: FONT, fontWeight: 900 } as const;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <g transform="translate(160,160)">
        <line x1={ox} y1={oy} x2={ox + W + 40} y2={oy} stroke="#cdd5ee" strokeWidth={5} />
        <line x1={ox} y1={oy} x2={ox} y2={oy - H - 60} stroke="#cdd5ee" strokeWidth={5} />
        {[0, 5, 10, 15, 20, 25, 30].map((t) => (
          <g key={t}><line x1={X(t)} y1={oy} x2={X(t)} y2={oy + 14} stroke="#cdd5ee" strokeWidth={4} /><text x={X(t)} y={oy + 52} fontSize={32} fill="#cdd5ee" textAnchor="middle" {...txt}>{t}</text></g>
        ))}
        <text x={ox + W + 40} y={oy + 96} fontSize={32} fill="#cdd5ee" textAnchor="end" {...txt}>dia</text>
        <text x={ox + 24} y={oy - H - 20} fontSize={32} fill="#cdd5ee" {...txt}>inteligência (×)</text>
        {show("wall_frame") && Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x={X(29.2) + (i % 2) * 30} y={Y(v30) + i * 70} width={60} height={60} fill="#e8590c" opacity={0.35 * sp("wall_frame")} stroke="#ffa94d" strokeWidth={3} />
        ))}
        <path d={d} fill="none" stroke="#ffd166" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${len} ${len}`} strokeDashoffset={len * (1 - pr)} />
        {pr > 0 && pr < 1 && <circle cx={head[0]} cy={head[1]} r={16} fill="#fff" />}
        {[10, 20].map((dd) => pr * 30 >= dd && (
          <g key={dd}><circle cx={X(dd)} cy={Y(2 ** dd)} r={10} fill="#4dabf7" /><text x={X(dd)} y={Y(2 ** dd) - 30} fontSize={30} fill="#9ec5fe" textAnchor="middle" {...txt}>dia {dd}: {times(dd)}</text></g>
        ))}
        {show("exact_frame") && (
          <g transform={`translate(${X(30) - 30},${Y(v30) + 10}) scale(${sp("exact_frame")})`}>
            <rect x={-560} y={-36} width={540} height={72} rx={16} fill="#ffd166" />
            <text x={-290} y={14} fontSize={40} fill="#1f2430" textAnchor="middle" {...txt}>dia 30: {times(30)}</text>
          </g>
        )}
        {show("gain_frame") && (
          <g opacity={sp("gain_frame")}>
            <line x1={X(30) + 30} y1={Y(v29)} x2={X(30) + 30} y2={lerp(Y(v29), Y(v30), sp("gain_frame"))} stroke="#ff6b6b" strokeWidth={14} strokeLinecap="round" />
            <text x={X(30) + 50} y={Y(v29) - H / 4 + 10} fontSize={30} fill="#ff8787" {...txt}><tspan x={X(30) + 52} dy={0}>ganho</tspan><tspan x={X(30) + 52} dy={36}>do dia 30</tspan><tspan x={X(30) + 52} dy={36}>{ptBR(v30 - v29)}</tspan></text>
          </g>
        )}
        {show("sum_frame") && (
          <g opacity={sp("sum_frame")}>
            <line x1={X(29) - 26} y1={Y(1)} x2={X(29) - 26} y2={lerp(Y(1), Y(v29), sp("sum_frame"))} stroke="#4dabf7" strokeWidth={14} strokeLinecap="round" />
            <g transform={`translate(${X(29) - 50},${Y(v29 / 2)})`}>
              <rect x={-470} y={-60} width={440} height={120} rx={16} fill="rgba(77,171,247,.18)" stroke="#4dabf7" strokeWidth={3} />
              <text x={-250} y={-14} fontSize={30} fill="#9ec5fe" textAnchor="middle" {...txt}>ganhos dos dias 1–29</text>
              <text x={-250} y={30} fontSize={34} fill="#d0ebff" textAnchor="middle" {...txt}>somados: {ptBR(v29 - 1)}</text>
            </g>
          </g>
        )}
        {show("flat_frame") && (
          <g opacity={sp("flat_frame")}>
            <path d={`M ${X(4)} ${oy - 150} Q ${X(6)} ${oy - 60} ${X(9)} ${oy - 18}`} fill="none" stroke="#fff" strokeWidth={5} markerEnd="url(#arr)" />
            <text x={X(1)} y={oy - 170} fontSize={40} fill="#fff" {...txt}>dias 1–20: “deitada”</text>
          </g>
        )}
        {show("wall_frame") && (
          <text x={X(27.6)} y={Y(v30 * 0.5)} fontSize={80} fill="#ffa94d" textAnchor="middle" transform={`rotate(-90 ${X(27.6)} ${Y(v30 * 0.5)}) scale(1)`} {...txt} opacity={sp("wall_frame")}>PAREDE</text>
        )}
        <defs><marker id="arr" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#fff" /></marker></defs>
      </g>
    </svg>
  );
};

const IconRow: React.FC<LP> = ({ layer, f, dark }) => {
  const size = layer.props?.size ?? 150;
  return (
    <div style={{ display: "flex", gap: 60 }}>
      {(layer.items ?? []).map((it, i) => {
        const s = spr(f, it.at_frame, { damping: 9, stiffness: 160 });
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transform: `scale(${s}) translateY(${float(f, i, 6, 45)}px)`, opacity: s > 0.01 ? 1 : 0 }}>
            <Icon name={it.icon} size={size} f={f - it.at_frame} />
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size * 0.28, color: dark ? "#fff" : "#1f2430" }}>{it.label}</div>
          </div>
        );
      })}
    </div>
  );
};

const Plant: React.FC<LP> = ({ layer, f, dark }) => {
  const p = layer.props ?? {};
  const local = f - layer.at_frame;
  const h = 40 + local * 0.12;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 80 }}>
      <svg width={360} height={420} viewBox="0 0 360 420">
        <path d={`M180 300 Q ${180 + Math.sin(local / 30) * 6} ${300 - h / 2} 180 ${300 - h}`} stroke="#2f9e44" strokeWidth={10} fill="none" />
        <ellipse cx={160} cy={300 - h * 0.7} rx={26} ry={12} fill="#40c057" transform={`rotate(-30 160 ${300 - h * 0.7})`} />
        <ellipse cx={200} cy={300 - h} rx={26} ry={12} fill="#40c057" transform={`rotate(25 200 ${300 - h})`} />
        <path d="M100 300 H260 L240 410 H120 Z" fill="#e8590c" stroke="#1f2430" strokeWidth={6} />
        <rect x={90} y={290} width={180} height={26} rx={8} fill="#d9480f" stroke="#1f2430" strokeWidth={6} />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: FONT, fontWeight: 900, color: dark ? "#fff" : "#1f2430" }}>
        <div style={{ fontSize: 44 }}>altura: {(h / 40).toFixed(2)} cm</div>
        <div style={{ fontSize: 36, opacity: 0.7 }}>(crescendo no ritmo dela)</div>
        {f >= (p.label_frame ?? 1e9) && <div style={{ fontSize: 54, color: "#e8590c", transform: `scale(${spr(f, p.label_frame, { damping: 9 })}) rotate(-3deg)` }}>{p.label}</div>}
      </div>
    </div>
  );
};

const Column: React.FC<LP> = ({ layer, f }) => {
  const p = layer.props ?? {};
  const local = f - (p.subtitle_frame ?? 1e9);
  const sub: string = p.subtitle;
  const n = Math.floor(interpolate(local, [0, sub.length * 0.9], [0, sub.length], clamp));
  const gF = p.grow_frame ?? 1e9;
  const hFast = f < gF ? 20 : 20 + 440 * (2 ** (10 * easeOut(f, gF, 30)) - 1) / 1023;
  const hSlow = f < gF ? 20 : 20 + Math.min(110, (f - gF) * 0.9);
  const h = p.grow === "fast" ? hFast : hSlow;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: 620 }}>
      <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 74, color: p.color }}>{p.title}</div>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: "#fff", height: 50 }}>{sub.slice(0, Math.max(0, n))}</div>
      <div style={{ height: 470, display: "flex", alignItems: "flex-end" }}>
        <div style={{ width: 160, height: h, borderRadius: "20px 20px 6px 6px", background: p.color, boxShadow: `0 0 40px ${p.color}`, transform: `scaleX(${1 + 0.03 * Math.sin(f / 7)})` }} />
      </div>
    </div>
  );
};

const KINDS: Record<string, React.FC<LP>> = {
  kinetic: Kinetic, "sync-words": SyncWords, stamp: Stamp, icon: IconLayer, equation: Equation, ladder: Ladder, counter: Counter,
  blocks: Blocks, daychip: DayChip, morph: Morph, bookshelf: Bookshelf, textmorph: TextMorph, paper: Paper, breakbar: BreakBar,
  crowd: Crowd, shower: Shower, chart: Chart, iconrow: IconRow, plant: Plant, column: Column,
};

/* ---- Envelope de entrada/saída (variado por tipo de entrada) ---- */
const LayerShell: React.FC<LP & { i: number }> = ({ layer, scene, f, dark, i }) => {
  if (f < layer.at_frame) return null;
  const local = f - layer.at_frame;
  const ex = layer.until_frame !== undefined ? easeOut(f, layer.until_frame, 10) : 0;
  if (ex >= 1) return null;
  const Comp = KINDS[layer.kind];
  if (!Comp) return null;
  const [x, y] = SLOTS[layer.slot ?? "center"] ?? SLOTS.center;
  const s = spr(f, layer.at_frame, { damping: 13 });
  let tf = "";
  let op = 1;
  switch (layer.enter) {
    case "slam": { const k = easeOut(local, 0, 8); tf = `scale(${lerp(2.6, 1, k)}) rotate(${lerp(-12, 0, k)}deg)`; op = k; break; }
    case "drop": tf = `translateY(${(1 - spr(f, layer.at_frame, { damping: 9, stiffness: 120 })) * -500}px)`; break;
    case "slide-up": tf = `translateY(${(1 - s) * 140}px)`; op = s; break;
    case "slide-right": tf = `translateX(${(1 - s) * -600}px)`; break;
    case "wobble": tf = `rotate(${Math.sin(local / 3) * 8 * Math.max(0, 1 - local / 30)}deg) scale(${0.5 + 0.5 * s})`; break;
    case "typewriter": tf = ""; break;
    default: tf = layer.kind === "chart" ? "" : `scale(${s})`;
  }
  // saída alternada: encolher-girando ou deslizar
  const exitTf = i % 2 ? `translateX(${-ex * 900}px)` : `scale(${1 - ex * 0.7}) rotate(${ex * 25}deg)`;
  const drift = layer.kind === "chart" ? "" : `translateY(${float(f, i, 6, 85)}px) rotate(${float(f, i + 3, 0.6, 110)}deg)`;
  if (layer.slot === "full") {
    return <AbsoluteFill style={{ opacity: op * (1 - ex), transform: `${tf} ${exitTf}` }}><Comp layer={layer} scene={scene} f={f} dark={dark} /></AbsoluteFill>;
  }
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) ${drift} ${tf} ${exitTf}`, opacity: op * (1 - ex) }}>
      <Comp layer={layer} scene={scene} f={f} dark={dark} />
    </div>
  );
};

export const EditStage: React.FC<{ scene: Scene; f: number }> = ({ scene, f }) => {
  const dark = !LIGHT_BG.includes(scene.background ?? "");
  return <AbsoluteFill>{(scene.layers ?? []).map((l, i) => <LayerShell key={l.id} layer={l} scene={scene} f={f} dark={dark} i={i} />)}</AbsoluteFill>;
};
