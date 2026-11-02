import React from "react";
import { AbsoluteFill } from "remotion";
import type { Cue, Scene } from "./types";
import { active, ease, easeOut, float, lerp, prog, spr, times, clamp } from "./anim";
import { interpolate } from "remotion";
import { Character, PALETTES, mixPose, poseAt } from "./assets/Character";
import { SetBack, SetFront, FLOOR_Y, type SetState } from "./assets/Sets";
import { SceneProp } from "./assets/Props";
import { IconShape, Icon } from "./assets/Icons";

export type Ev = { at: number; target: number; dur: number };
/** Valor contínuo dirigido por eventos encadeados (cada evento parte do valor atual). */
export function track(init: number, evs: Ev[], f: number) {
  let fromV = init, prevT = init, prevAt = -1e9, prevDur = 1;
  for (const e of evs) {
    if (e.at > f) break;
    fromV = lerp(fromV, prevT, ease(e.at, prevAt, prevDur));
    prevT = e.target; prevAt = e.at; prevDur = e.dur;
  }
  return lerp(fromV, prevT, ease(f, prevAt, prevDur));
}

const CHAR_SCALE = 0.78;
const FONT = "Nunito, DejaVu, sans-serif";

function setState(scene: Scene, f: number): SetState {
  const variant = scene.setting?.variant ?? "day";
  const initDay = { night: 0, morning: 1, evening: 0.8, day: 1, warm: 0.85 }[variant] ?? 1;
  const cues = (scene.cues ?? []).filter((c) => c.target === "set");
  const dayEv: Ev[] = [], darkEv: Ev[] = [], duskEv: Ev[] = [];
  let cycleAt = -1;
  cues.forEach((c) => {
    if (c.action === "night") dayEv.push({ at: c.at_frame, target: 0, dur: 30 });
    if (c.action === "morning") { dayEv.push({ at: c.at_frame, target: 1, dur: 36 }); darkEv.push({ at: c.at_frame, target: 0, dur: 18 }); }
    if (c.action === "lights_off") darkEv.push({ at: c.at_frame, target: 1, dur: 10 });
    if (c.action === "dusk") duskEv.push({ at: c.at_frame, target: 1, dur: 60 });
    if (c.action === "cycle") cycleAt = c.at_frame;
  });
  let day = track(initDay, dayEv, f);
  if (cycleAt >= 0 && f >= cycleAt && f < cycleAt + 72) day = 0.5 + 0.5 * Math.cos((Math.PI * (f - cycleAt)) / 12);
  return { day, dark: track(0, darkEv, f), dusk: track(0, duskEv, f), f, variant };
}

/* ---------- Balões ---------- */
function wrap(text: string, max = 22) {
  if (text.length <= max) return [text];
  const mid = Math.floor(text.length / 2);
  let best = -1;
  for (let i = 0; i < text.length; i++) if (text[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return best < 0 ? [text] : [text.slice(0, best), text.slice(best + 1)];
}

const Bubble: React.FC<{ cue: Cue; x: number; headY: number; f: number }> = ({ cue, x, headY, f }) => {
  const local = f - cue.at_frame;
  const s = spr(f, cue.at_frame, { damping: 11, stiffness: 180 });
  const lines = cue.text ? wrap(cue.text) : [];
  const fs = 38;
  const icon = cue.icon ? 70 : 0;
  const tw = Math.max(...lines.map((l) => l.length), 0) * fs * 0.54;
  const w = Math.max(120, Math.min(640, tw + icon + 70));
  const h = Math.max(100, lines.length * fs * 1.2 + 50);
  const bx = Math.max(60 + w / 2, Math.min(1860 - w / 2, x + (x < 960 ? 40 : -40)));
  const by = headY - 70 - h / 2 + float(f, cue.at_frame, 5, 60);
  const thought = cue.style === "thought";
  return (
    <g transform={`translate(${bx},${by}) scale(${s}) rotate(${Math.sin(local / 18) * 1.2})`}>
      {thought ? (
        <g fill="#fff" stroke="#1f2430" strokeWidth={5}>
          <circle cx={(x - bx) * 0.6} cy={h / 2 + 34} r={14} />
          <circle cx={(x - bx) * 0.85} cy={h / 2 + 62} r={9} />
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} />
        </g>
      ) : (
        <g fill="#fff" stroke="#1f2430" strokeWidth={5} strokeLinejoin="round">
          <path d={`M ${-18 + (x - bx) * 0.3} ${h / 2 - 4} L ${(x - bx) * 0.7} ${h / 2 + 46} L ${26 + (x - bx) * 0.3} ${h / 2 - 4} Z`} />
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={28} />
          <rect x={-w / 2 + 3} y={h / 2 - 10} width={w - 6} height={8} fill="#fff" stroke="none" />
        </g>
      )}
      {cue.icon && (
        <g transform={`translate(${-w / 2 + 22 + (lines.length ? 0 : (w - 70) / 2 - 22)},${-35}) scale(0.7)`}>
          <IconShape name={cue.icon} f={local} />
        </g>
      )}
      {lines.map((l, i) => (
        <text key={i} x={icon / 2} y={(i - (lines.length - 1) / 2) * fs * 1.2 + fs * 0.35} textAnchor="middle" fontSize={fs} fontFamily={FONT} fontWeight={800} fill="#1f2430">
          {l.slice(0, Math.ceil(interpolate(local, [0, 10], [Math.min(l.length, 3), l.length], clamp)))}
        </text>
      ))}
    </g>
  );
};

/* ---------- Badge do dia (HTML, fora da câmera) ---------- */
export const DayBadge: React.FC<{ scene: Scene; f: number }> = ({ scene, f }) => {
  const cues = (scene.cues ?? []).filter((c) => c.target === "badge");
  let day: number | null = scene.badge_day ?? null;
  let changedAt = -100;
  let label: string | null = null;
  let glowAt = -1;
  for (const c of cues) {
    if (c.at_frame > f) break;
    if (c.action === "set") { day = c.day; changedAt = c.at_frame; label = null; }
    if (c.action === "count") {
      const k = Math.floor(interpolate(f, [c.at_frame, c.at_frame + 75], [c.from_day, c.to_day], clamp));
      if (k !== day) changedAt = c.at_frame + ((k - c.from_day) * 75) / (c.to_day - c.from_day);
      day = k;
    }
    if (c.action === "glow") glowAt = c.at_frame;
    if (c.action === "label") { label = c.text; changedAt = c.at_frame; }
  }
  if (day === null) return null;
  const flip = interpolate(f - changedAt, [0, 6, 12], [90, -10, 0], clamp);
  const enter = spr(f, 0, { damping: 14 });
  const glow = glowAt >= 0 && f >= glowAt ? 0.5 + 0.5 * Math.sin((f - glowAt) / 5) : 0;
  return (
    <div style={{
      position: "absolute", right: 48, top: 40, display: "flex", alignItems: "center", gap: 16,
      background: "rgba(20,24,48,0.88)", borderRadius: 28, padding: "14px 26px 14px 18px", color: "#fff",
      transform: `translateY(${(1 - enter) * -140}px) perspective(600px) rotateX(${flip}deg) rotate(${float(f, 3, 1.2, 90)}deg)`,
      boxShadow: `0 0 ${20 + glow * 50}px rgba(255,214,102,${0.25 + glow * 0.6})`, fontFamily: FONT,
    }}>
      <Icon name="brain" size={64} />
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontSize: 26, fontWeight: 800, opacity: 0.75, letterSpacing: 2 }}>DIA {day}</div>
        <div style={{ fontSize: 46, fontWeight: 900, color: "#ffd166", fontFamily: "Baloo2, Nunito" }}>{label ?? times(day)}</div>
      </div>
    </div>
  );
};

/* ---------- Títulos sobrepostos ---------- */
export const OverlayTitles: React.FC<{ scene: Scene; f: number }> = ({ scene, f }) => {
  const cues = (scene.cues ?? []).filter((c) => c.target === "overlay");
  return (
    <>
      {cues.map((c, i) => {
        const local = f - c.at_frame;
        if (local < 0) return null;
        if (c.action === "end") {
          const words = String(c.text).split(" ");
          return (
            <AbsoluteFill key={i} style={{ justifyContent: "center", alignItems: "center", background: `rgba(15,18,40,${interpolate(local, [0, 20], [0, 0.72], clamp)})` }}>
              <div style={{ maxWidth: 1400, textAlign: "center", fontFamily: "Baloo2, Nunito", fontSize: 86, fontWeight: 800, color: "#fff", lineHeight: 1.1, transform: `scale(${1 + local * 0.0012})` }}>
                {words.map((w, j) => {
                  const s = spr(f, c.at_frame + 4 + j * 3, { damping: 13 });
                  return <span key={j} style={{ display: "inline-block", margin: "0 12px", transform: `translateY(${(1 - s) * 60 + float(f, j, 4, 80)}px)`, opacity: s, color: j >= words.length - 3 ? "#ffd166" : "#fff" }}>{w}</span>;
                })}
              </div>
            </AbsoluteFill>
          );
        }
        const HOLD = 90;
        if (local > HOLD + 20) return null;
        const inn = spr(f, c.at_frame, { damping: 15 });
        const out = easeOut(local, HOLD, 16);
        return (
          <div key={i} style={{
            position: "absolute", left: 48, top: 44, padding: "16px 30px", borderRadius: 20, background: "#ffd166",
            color: "#1f2430", fontFamily: "Baloo2, Nunito", fontWeight: 800, fontSize: 48, letterSpacing: 1,
            transform: `translateX(${(1 - inn) * -700 - out * 900}px) rotate(${-2 + float(f, i, 1, 50)}deg) scale(${1 + 0.02 * Math.sin(local / 8)})`,
            boxShadow: "8px 8px 0 #1f2430",
          }}>{c.text}</div>
        );
      })}
    </>
  );
};

/* ---------- Cena de personagens ---------- */
export const CharacterStage: React.FC<{ scene: Scene; f: number }> = ({ scene, f }) => {
  const set = scene.setting?.name ?? "living";
  const s = setState(scene, f);
  const cues = scene.cues ?? [];
  const floor = FLOOR_Y + (set === "table" ? 70 : 0);

  const propState = (pid: string) => {
    const pc = cues.filter((c) => c.target === "prop" && c.prop === pid);
    const init = scene.props?.find((p) => p.id === pid);
    return {
      fixed: track(0, pc.filter((c) => c.action === "fix").map((c) => ({ at: c.at_frame, target: 1, dur: 36 })), f),
      boil: track(0, pc.filter((c) => c.action === "boil").map((c) => ({ at: c.at_frame, target: 1, dur: 20 })), f),
      density: track(init?.density ?? 0, pc.filter((c) => c.action === "density").map((c) => ({ at: c.at_frame, target: c.value, dur: 10 })), f),
    };
  };

  const chars = (scene.cast ?? []).map((m, idx) => {
    const my = cues.filter((c) => c.target === m.id);
    const initial: Cue = { at_frame: -1, target: m.id, action: m.pose ?? "idle", expression: m.expression ?? "neutral" };
    const poseCues: Cue[] = [initial, ...my.filter((c) => c.action !== "noop")];
    const { cur, prev } = active(poseCues, f);
    const tt = cur ? easeOut(f, cur.at_frame, 9) : 1;
    const pose = mixPose(poseAt(prev?.action ?? cur!.action, f), poseAt(cur!.action, f), prev ? tt : 1);
    let expr = m.expression ?? "neutral";
    let item: string | null = null;
    for (const c of poseCues) {
      if (c.at_frame > f) break;
      if (c.expression) expr = c.expression;
      item = c.action === "hold" ? c.item : null;
    }
    const moves = my.filter((c) => c.move_to !== undefined).map((c) => ({ at: c.at_frame, target: c.move_to as number, dur: 50 }));
    const x = track(m.x, moves, f);
    const walking = moves.some((mv) => f >= mv.at && f < mv.at + 50) ? 1 : 0;
    const squash = 1 - 0.035 * Math.sin(Math.min(1, cur ? (f - cur.at_frame) / 8 : 1) * Math.PI);
    return { id: m.id, idx, x, pose, expr, item, walking, squash, pal: PALETTES[m.id] ?? PALETTES.ana };
  });

  const headY = floor - 700 * CHAR_SCALE;
  const bubbles = (scene.cast ?? []).map((m) => {
    const bc = cues.filter((c) => c.target === "bubble" && c.owner === m.id && c.at_frame <= f);
    const last = bc[bc.length - 1];
    const ch = chars.find((c) => c.id === m.id)!;
    return last && last.action === "show" ? <Bubble key={m.id + last.at_frame} cue={last} x={ch.x} headY={headY} f={f} /> : null;
  });

  const rings = cues.find((c) => c.target === "fx" && c.action === "rings");
  const ana = chars.find((c) => c.id === "ana");

  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", overflow: "visible" }}>
      <SetBack name={set} s={s} />
      {set !== "table" && (scene.props ?? []).map((p, i) => <SceneProp key={i} id={p.id} x={p.x} y={p.y} f={f} steam={p.steam} state={propState(p.id)} />)}
      {chars.map((c) => (
        <g key={c.id} transform={`translate(${c.x},${floor}) scale(${CHAR_SCALE},${CHAR_SCALE * c.squash})`}>
          <Character pal={c.pal} pose={c.pose} expr={c.expr} t={f} seed={c.idx + 1} item={c.item} walk={c.walking} />
        </g>
      ))}
      <SetFront name={set} s={s} />
      {set === "table" && (scene.props ?? []).map((p, i) => <SceneProp key={i} id={p.id} x={p.x} y={p.y} f={f} steam state={propState(p.id)} />)}
      {rings && ana && f >= rings.at_frame && Array.from({ length: 6 }).map((_, i) => {
        const sp = spr(f, rings.at_frame + i * 4, { damping: 9 });
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const fade = 1 - prog(f, rings.at_frame + 70, 15);
        return (
          <g key={i} opacity={fade} transform={`translate(${ana.x + Math.cos(a) * 330 * sp},${headY + 140 + Math.sin(a) * 220 * sp}) scale(${sp * 0.9})`}>
            <g transform="translate(-50,-50)"><IconShape name="phone" f={f + i * 7} /></g>
          </g>
        );
      })}
      {bubbles}
    </svg>
  );
};
