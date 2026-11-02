import React from "react";
import { AbsoluteFill, Audio, Sequence, getRemotionEnvironment, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { Scene } from "./types";
import { clamp, decay, easeOut, spr } from "./anim";
import { track, type Ev, CharacterStage, DayBadge, OverlayTitles } from "./CharacterScene";
import { EditBackground, EditStage } from "./EditScene";

/** Caminho de asset: staticFile no render; relativo no Player web (funciona em subpastas). */
export const asset = (p: string) => (getRemotionEnvironment().isPlayer ? `./${p}` : staticFile(p));

/* ---------- Câmera: zoom/pan/punch/shake ancorados em palavras + deriva contínua ---------- */
function camera(scene: Scene, f: number) {
  const cues = (scene.cues ?? []).filter((c) => c.target === "camera");
  const sEv: Ev[] = [], xEv: Ev[] = [], yEv: Ev[] = [];
  let punch = 0, shake = 0;
  for (const c of cues) {
    if (c.action === "zoom" || c.action === "reset") {
      const z = c.action === "reset" ? { scale: 1, x: 0, y: 0 } : c;
      sEv.push({ at: c.at_frame, target: z.scale ?? 1, dur: 22 });
      xEv.push({ at: c.at_frame, target: z.x ?? 0, dur: 22 });
      yEv.push({ at: c.at_frame, target: z.y ?? 0, dur: 22 });
    }
    if (c.action === "punch") punch += ((c.scale ?? 1.08) - 1) * Math.sin(Math.min(1, (f - c.at_frame) / 14) * Math.PI) * (f >= c.at_frame ? 1 : 0);
    if (c.action === "shake") shake += decay(f, c.at_frame, 16);
  }
  const drift = scene.type === "character" ? 1.02 + 0.015 * Math.sin(f / 140) : 1 + 0.012 * Math.sin(f / 110);
  const s = track(1, sEv, f) * drift + punch;
  const x = track(0, xEv, f) + (scene.type === "character" ? 14 * Math.sin(f / 190) : 0);
  const y = track(0, yEv, f);
  const jx = shake * 14 * Math.sin(f * 2.7), jy = shake * 10 * Math.cos(f * 3.3), jr = shake * 1.2 * Math.sin(f * 2.1);
  return `translate(${jx}px, ${jy}px) rotate(${jr}deg) scale(${s}) translate(${-x}px, ${-y}px)`;
}

/* ---------- Legendas sincronizadas (palavra atual destacada) ---------- */
const Captions: React.FC<{ scene: Scene; f: number }> = ({ scene, f }) => {
  const c = scene.captions.find((k) => f >= k.from && f < k.to);
  if (!c) return null;
  const s = spr(f, c.from, { damping: 16, stiffness: 220 });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 46, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div style={{
        maxWidth: 1500, padding: "12px 28px", borderRadius: 18, background: "rgba(10,12,30,0.72)", textAlign: "center",
        fontFamily: "Nunito, DejaVu, sans-serif", fontWeight: 800, fontSize: 44, lineHeight: 1.25, color: "#fff",
        transform: `translateY(${(1 - s) * 30}px)`, opacity: Math.min(1, s * 1.6),
      }}>
        {c.words.map((wi, k) => {
          const w = scene.words[wi];
          const next = scene.words[wi + 1];
          const on = f >= w.f0 && (next ? f < next.f0 : f < w.f1 + 10);
          const past = f >= w.f0;
          return (
            <span key={k} style={{ color: on ? "#ffd166" : past ? "#fff" : "rgba(255,255,255,.55)", display: "inline-block", transform: `scale(${on ? 1.06 : 1})`, margin: "0 6px" }}>{w.text}</span>
          );
        })}
      </div>
    </div>
  );
};

/* ---------- Efeitos globais ---------- */
const Fx: React.FC<{ scene: Scene; f: number }> = ({ scene, f }) => {
  const flashes = (scene.cues ?? []).filter((c) => c.target === "fx" && c.action === "flash");
  const a = flashes.reduce((m, c) => Math.max(m, decay(f, c.at_frame, 12)), 0);
  return a > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: a * 0.8 }} /> : null;
};

/** Renderizador único para os dois tipos de cena. */
export const SceneRenderer: React.FC<{ scene: Scene }> = ({ scene }) => {
  const f = useCurrentFrame();
  const vignette = interpolate(f, [0, 20], [0.5, 0.25], clamp);
  return (
    <AbsoluteFill style={{ background: "#0b1030", overflow: "hidden" }}>
      {scene.type === "edit" && <EditBackground kind={scene.background ?? "stars"} f={f} />}
      <AbsoluteFill style={{ transform: camera(scene, f) }}>
        {scene.type === "character" ? <CharacterStage scene={scene} f={f} /> : <EditStage scene={scene} f={f} />}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,${vignette}) 100%)`, pointerEvents: "none" }} />
      {scene.type === "character" && (
        <>
          <DayBadge scene={scene} f={f} />
          <OverlayTitles scene={scene} f={f} />
        </>
      )}
      <Captions scene={scene} f={f} />
      <Fx scene={scene} f={f} />
      {scene.audio && (
        <Sequence from={scene.leadFrames} layout="none">
          <Audio src={asset(scene.audio)} volume={(af) => interpolate(af, [0, 3], [0, 1], clamp)} />
        </Sequence>
      )}
      {/* indicador de progresso da cena (movimento sutil constante) */}
      <div style={{ position: "absolute", left: 0, top: 0, height: 6, width: `${easeOut(f, 0, scene.durationInFrames) * 100}%`, background: "rgba(255,209,102,.7)" }} />
    </AbsoluteFill>
  );
};
