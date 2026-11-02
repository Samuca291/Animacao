import React from "react";
import { lerp, rand } from "../anim";

/* ================= PALETAS (fixas → aparência idêntica em todas as cenas) ================= */
export type Palette = {
  skin: string; skinShade: string; hair: string; top: string; topShade: string;
  bottom: string; shoes: string; accent: string; style: "ana" | "beto" | "tia";
};
export const ANA: Palette = {
  skin: "#F4C7A1", skinShade: "#E3A982", hair: "#3B2416", top: "#F5B82E", topShade: "#D99A12",
  bottom: "#2F4B7C", shoes: "#1F2430", accent: "#E63946", style: "ana",
};
export const BETO: Palette = {
  skin: "#9A6440", skinShade: "#80502F", hair: "#17110D", top: "#3FA37C", topShade: "#2E8563",
  bottom: "#4A4E5A", shoes: "#2A2A2A", accent: "#F1FAEE", style: "beto",
};
export const TIA: Palette = {
  skin: "#EDB98F", skinShade: "#D49C72", hair: "#A7A9AC", top: "#C2457A", topShade: "#9E2F5E",
  bottom: "#C2457A", shoes: "#5A2A3A", accent: "#FFD166", style: "tia",
};
export const PALETTES: Record<string, Palette> = { ana: ANA, beto: BETO, tia: TIA };

/* ================= POSES ================= */
// Ângulos em graus. Braço: [ombro, cotovelo]. 0 = para baixo; positivo = para fora/cima.
// Antebraço absoluto = ombro + cotovelo.
export type Pose = { la: [number, number]; ra: [number, number]; lean: number; head: number; y: number; mouth?: string };
const P = (la: [number, number], ra: [number, number], lean = 0, head = 0, y = 0, mouth?: string): Pose => ({ la, ra, lean, head, y, mouth });

export function poseAt(name: string, t: number): Pose {
  const s = Math.sin(t / 4);
  switch (name) {
    case "wave": return P([12, 8], [150, 25 + 22 * Math.sin(t / 3)], -2, 4);
    case "point": return P([15, 10], [100, -8], 3, -3);
    case "think": return P([12, -95], [22, 168], 0, 6);
    case "shrug": return P([62, 68], [62, 68], 0, 7, -6);
    case "celebrate": return P([158, 14 + 8 * s], [158, 14 - 8 * s], 0, -4, -Math.abs(Math.sin(t / 5)) * 22);
    case "facepalm": return P([12, 8], [20, 176], 0, 12, 4);
    case "yawn": return P([12, 8], [26, 168], 0, -10, 0, "yawn");
    case "stretch": return P([170 + 5 * s, 4], [170 - 5 * s, 4], 2 * s, -6, -8);
    case "sleep": return P([7, 4], [7, 4], 0, 18, 10);
    case "hold": return P([12, 8], [22, 78], 0, 0);
    case "explain": return P([45 + 12 * Math.sin(t / 6), 55], [72 + 16 * Math.sin(t / 5 + 1), 38], 2 * Math.sin(t / 9), 3, 0, "talk");
    case "talk": return P([14, 10], [34, 52 + 16 * Math.sin(t / 5)], 0, 3, 0, "talk");
    case "laugh": return P([16, -96], [16, -96], 0, -9, -Math.abs(Math.sin(t / 3.2)) * 10, "laugh");
    case "proud": return P([42, -102], [42, -102], 0, -6, -4);
    case "hug": return P([10, -150], [10, -150], 0, 10, 2);
    default: return P([12, 8], [12, 8], 0, 0);
  }
}
export const mixPose = (a: Pose, b: Pose, t: number): Pose => ({
  la: [lerp(a.la[0], b.la[0], t), lerp(a.la[1], b.la[1], t)],
  ra: [lerp(a.ra[0], b.ra[0], t), lerp(a.ra[1], b.ra[1], t)],
  lean: lerp(a.lean, b.lean, t), head: lerp(a.head, b.head, t), y: lerp(a.y, b.y, t),
  mouth: t > 0.5 ? b.mouth : a.mouth,
});

/* ================= GEOMETRIA ================= */
const SH_Y = -455, SH_X = 78, UP = 118, LO = 112, HEAD_Y = -592, HEAD_R = 92;
const rad = (d: number) => (d * Math.PI) / 180;
function armPts(side: -1 | 1, [a, e]: [number, number]) {
  const dir = (A: number) => (side === 1 ? [Math.sin(rad(A)), Math.cos(rad(A))] : [-Math.sin(rad(A)), Math.cos(rad(A))]);
  const s = [side * SH_X, SH_Y];
  const d1 = dir(a), d2 = dir(a + e);
  const el = [s[0] + d1[0] * UP, s[1] + d1[1] * UP];
  const h = [el[0] + d2[0] * LO, el[1] + d2[1] * LO];
  return { s, el, h, handAngle: a + e };
}

/* ================= ROSTO ================= */
function Face({ expr, t, talking, seed, mouthOverride, pal }: { expr: string; t: number; talking: boolean; seed: number; mouthOverride?: string; pal: Palette }) {
  const ink = "#2A1A12";
  // piscar determinístico
  const cycle = 95 + Math.floor(rand(seed) * 40);
  const ph = (t + seed * 13) % cycle;
  const blink = ph < 4 ? 1 - Math.abs(ph - 2) / 2 : 0;
  const ex = 32, ey = HEAD_Y - 2;
  const closed = ["laugh", "asleep"].includes(expr);
  let eyeRy = { surprised: 20, happy: 13, sleepy: 9, smug: 11 }[expr as "happy"] ?? 16;
  eyeRy = eyeRy * (1 - blink * 0.9);
  const look = { thinking: [5, -6], awkward: [7, 1], sad: [0, 5], worried: [-2, 2], confused: [3, -2] }[expr as "sad"] ?? [0, 0];
  const pupilR = expr === "surprised" ? 6 : 8;

  const brows: Record<string, [number, number]> = {
    happy: [-6, -6], surprised: [-14, -14], thinking: [-10, 2], smug: [2, -6], awkward: [-8, 4],
    sleepy: [4, 4], worried: [-4, -4], sad: [-2, -2], confused: [-12, 6], laugh: [-8, -8],
  };
  const tilt: Record<string, number> = { worried: 14, sad: 16, awkward: 10, smug: -6, confused: -12 };
  const [bl, br] = brows[expr] ?? [0, 0];
  const bt = tilt[expr] ?? 0;

  const talkOpen = talking ? Math.max(0, Math.sin(t / 2.1)) * 0.8 + 0.2 * Math.max(0, Math.sin(t / 1.3)) : 0;
  const mouthY = HEAD_Y + 46;
  const mk = mouthOverride === "yawn" ? "yawn" : mouthOverride === "laugh" ? "laugh" : expr;
  let mouth: React.ReactNode;
  if (talking && !["laugh", "yawn"].includes(mk)) {
    mouth = <ellipse cx={0} cy={mouthY} rx={14} ry={3 + talkOpen * 12} fill="#7A2E2E" />;
  } else if (mk === "laugh") {
    mouth = <path d={`M -26 ${mouthY - 6} Q 0 ${mouthY + 34} 26 ${mouthY - 6} Z`} fill="#7A2E2E" stroke={ink} strokeWidth={3} />;
  } else if (mk === "yawn") {
    mouth = <ellipse cx={0} cy={mouthY + 2} rx={13} ry={19} fill="#7A2E2E" />;
  } else if (mk === "surprised") {
    mouth = <ellipse cx={0} cy={mouthY} rx={10} ry={13} fill="#7A2E2E" />;
  } else if (mk === "happy") {
    mouth = <path d={`M -24 ${mouthY - 6} Q 0 ${mouthY + 22} 24 ${mouthY - 6} Z`} fill="#fff" stroke={ink} strokeWidth={3.5} strokeLinejoin="round" />;
  } else if (mk === "smug") {
    mouth = <path d={`M -16 ${mouthY + 2} Q 6 ${mouthY + 8} 22 ${mouthY - 8}`} fill="none" stroke={ink} strokeWidth={4.5} strokeLinecap="round" />;
  } else if (mk === "awkward" || mk === "confused") {
    mouth = <path d={`M -20 ${mouthY + 2} q 7 -8 13 0 q 7 8 13 0 q 7 -8 13 0`} fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" />;
  } else if (mk === "sad" || mk === "worried") {
    mouth = <path d={`M -16 ${mouthY + 8} Q 0 ${mouthY - 6} 16 ${mouthY + 8}`} fill="none" stroke={ink} strokeWidth={4.5} strokeLinecap="round" />;
  } else if (mk === "asleep" || mk === "sleepy") {
    mouth = <ellipse cx={0} cy={mouthY + 2} rx={7} ry={5} fill="#7A2E2E" />;
  } else if (mk === "thinking") {
    mouth = <path d={`M -8 ${mouthY + 2} L 16 ${mouthY - 2}`} stroke={ink} strokeWidth={4.5} strokeLinecap="round" />;
  } else {
    mouth = <path d={`M -16 ${mouthY - 2} Q 0 ${mouthY + 10} 16 ${mouthY - 2}`} fill="none" stroke={ink} strokeWidth={4.5} strokeLinecap="round" />;
  }

  return (
    <g>
      {/* bochechas */}
      <ellipse cx={-52} cy={HEAD_Y + 26} rx={15} ry={9} fill="#F28B82" opacity={pal.style === "beto" ? 0.25 : 0.5} />
      <ellipse cx={52} cy={HEAD_Y + 26} rx={15} ry={9} fill="#F28B82" opacity={pal.style === "beto" ? 0.25 : 0.5} />
      {/* olhos */}
      {[-1, 1].map((s) =>
        closed || blink > 0.85 ? (
          <path key={s} d={expr === "laugh" ? `M ${s * ex - 13} ${ey + 4} Q ${s * ex} ${ey - 12} ${s * ex + 13} ${ey + 4}` : `M ${s * ex - 13} ${ey} Q ${s * ex} ${ey + 10} ${s * ex + 13} ${ey}`}
            fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />
        ) : (
          <g key={s}>
            <ellipse cx={s * ex} cy={ey} rx={14} ry={eyeRy} fill="#fff" stroke={ink} strokeWidth={2.5} />
            <circle cx={s * ex + look[0]} cy={ey + look[1]} r={Math.min(pupilR, eyeRy)} fill={ink} />
            <circle cx={s * ex + look[0] + 3} cy={ey + look[1] - 3} r={2.4} fill="#fff" />
            {(expr === "smug" || expr === "sleepy") && <rect x={s * ex - 16} y={ey - 22} width={32} height={expr === "sleepy" ? 22 : 16} fill={pal.skin} />}
          </g>
        ),
      )}
      {/* sobrancelhas */}
      <line x1={-ex - 16} y1={ey - 28 + bl + bt / 2} x2={-ex + 14} y2={ey - 28 + bl - bt / 2} stroke={pal.hair === "#A7A9AC" ? "#6d6f72" : pal.hair} strokeWidth={6} strokeLinecap="round" />
      <line x1={ex - 14} y1={ey - 28 + br - bt / 2} x2={ex + 16} y2={ey - 28 + br + bt / 2} stroke={pal.hair === "#A7A9AC" ? "#6d6f72" : pal.hair} strokeWidth={6} strokeLinecap="round" />
      {mouth}
      {expr === "awkward" && <path d={`M 78 ${HEAD_Y - 40} q 8 14 0 20 q -8 -6 0 -20`} fill="#7cc6fe" />}
      {expr === "sad" && <ellipse cx={-ex - 4} cy={ey + 24} rx={4} ry={7} fill="#7cc6fe" />}
    </g>
  );
}

/* ================= CABELO / ACESSÓRIOS por personagem ================= */
function HairBack({ pal }: { pal: Palette }) {
  if (pal.style === "ana")
    return <path d={`M -104 ${HEAD_Y + 10} Q -112 ${HEAD_Y - 110} 0 ${HEAD_Y - 112} Q 112 ${HEAD_Y - 110} 104 ${HEAD_Y + 10} L 106 ${HEAD_Y + 78} Q 60 ${HEAD_Y + 92} 40 ${HEAD_Y + 70} L -40 ${HEAD_Y + 70} Q -60 ${HEAD_Y + 92} -106 ${HEAD_Y + 78} Z`} fill={pal.hair} />;
  if (pal.style === "tia")
    return <circle cx={0} cy={HEAD_Y - 112} r={42} fill={pal.hair} />;
  return null;
}
function HairFront({ pal }: { pal: Palette }) {
  if (pal.style === "ana")
    return (
      <g>
        <path d={`M -96 ${HEAD_Y - 10} Q -90 ${HEAD_Y - 104} 0 ${HEAD_Y - 100} Q 92 ${HEAD_Y - 104} 98 ${HEAD_Y - 6} Q 60 ${HEAD_Y - 44} 10 ${HEAD_Y - 50} Q -40 ${HEAD_Y - 40} -96 ${HEAD_Y - 10} Z`} fill={pal.hair} />
        {/* presilha vermelha — marca registrada da Ana */}
        <rect x={44} y={HEAD_Y - 70} width={34} height={14} rx={6} fill={pal.accent} transform={`rotate(-22 61 ${HEAD_Y - 63})`} />
      </g>
    );
  if (pal.style === "beto")
    return (
      <g>
        <path d={`M -94 ${HEAD_Y - 14} Q -92 ${HEAD_Y - 108} 0 ${HEAD_Y - 104} Q 94 ${HEAD_Y - 108} 94 ${HEAD_Y - 14} Q 70 ${HEAD_Y - 60} 0 ${HEAD_Y - 62} Q -70 ${HEAD_Y - 60} -94 ${HEAD_Y - 14} Z`} fill={pal.hair} />
        {/* óculos */}
        <g fill="none" stroke="#1d1d1d" strokeWidth={4.5}>
          <circle cx={-32} cy={HEAD_Y - 2} r={24} /><circle cx={32} cy={HEAD_Y - 2} r={24} />
          <line x1={-8} y1={HEAD_Y - 4} x2={8} y2={HEAD_Y - 4} />
        </g>
      </g>
    );
  return (
    <g>
      <path d={`M -94 ${HEAD_Y - 6} Q -94 ${HEAD_Y - 104} 0 ${HEAD_Y - 100} Q 94 ${HEAD_Y - 104} 94 ${HEAD_Y - 6} Q 50 ${HEAD_Y - 70} 0 ${HEAD_Y - 66} Q -50 ${HEAD_Y - 70} -94 ${HEAD_Y - 6} Z`} fill={pal.hair} />
      <circle cx={-92} cy={HEAD_Y + 26} r={8} fill={pal.accent} /><circle cx={92} cy={HEAD_Y + 26} r={8} fill={pal.accent} />
    </g>
  );
}

/* ================= ITENS DE MÃO ================= */
export function HeldItem({ item, t }: { item: string; t: number }) {
  switch (item) {
    case "newspaper":
      return (
        <g transform="translate(-10,-70) rotate(-8)">
          <rect x={-60} y={-40} width={120} height={90} rx={4} fill="#fbfbf4" stroke="#333" strokeWidth={3} />
          {Array.from({ length: 4 }).map((_, r) => Array.from({ length: 5 }).map((_, c) => (
            <rect key={`${r}-${c}`} x={-50 + c * 20} y={-30 + r * 18} width={17} height={15} fill={(r + c) % 3 === 0 ? "#333" : "#fff"} stroke="#555" strokeWidth={1.5} />
          )))}
        </g>
      );
    case "phone":
      return (
        <g transform={`translate(0,-30) rotate(${Math.sin(t / 1.5) * 6})`}>
          <rect x={-22} y={-40} width={44} height={80} rx={8} fill="#222" />
          <rect x={-17} y={-32} width={34} height={60} rx={3} fill="#7fd1ff" />
        </g>
      );
    case "mug":
      return (
        <g transform="translate(0,-26)">
          <rect x={-24} y={-30} width={48} height={52} rx={8} fill="#ffffff" stroke="#333" strokeWidth={3} />
          <path d="M 24 -18 q 20 0 20 14 q 0 14 -20 14" fill="none" stroke="#333" strokeWidth={5} />
          <rect x={-24} y={-8} width={48} height={10} fill="#E63946" />
        </g>
      );
    case "sheet":
      return (
        <g transform="translate(-30,-60)">
          <rect x={-70} y={-50} width={140} height={100} rx={18} fill="#cfe8ff" stroke="#5a8fc2" strokeWidth={4} />
          <path d="M -70 -20 Q 0 -45 70 -20 M -70 20 Q 0 45 70 20" fill="none" stroke="#5a8fc2" strokeWidth={3} strokeDasharray="8 6" />
        </g>
      );
    case "pizza":
      return (
        <g transform="translate(-20,-40) rotate(-20)">
          <path d="M 0 -70 L 50 40 Q 0 58 -50 40 Z" fill="#ffcf5c" stroke="#c98a1f" strokeWidth={5} />
          <path d="M -50 40 Q 0 58 50 40 L 54 50 Q 0 70 -54 50 Z" fill="#d9822b" />
          {[[-8, -10], [14, 18], [-18, 26]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={9} fill="#d1495b" />)}
        </g>
      );
    default:
      return null;
  }
}

/* ================= PERSONAGEM ================= */
export type CharacterProps = {
  pal: Palette; pose: Pose; expr: string; t: number; seed?: number;
  talking?: boolean; item?: string | null; walk?: number; facing?: 1 | -1;
};

export const Character: React.FC<CharacterProps> = ({ pal, pose, expr, t, seed = 1, talking = false, item = null, walk = 0, facing = 1 }) => {
  const breath = Math.sin(t / 22) * 0.012;
  const bob = Math.sin(t / 22) * 2;
  const L = armPts(-1, pose.la);
  const R = armPts(1, pose.ra);
  const legSwing = walk ? Math.sin(t / 3) * 16 * walk : 0;
  const isDress = pal.style === "tia";
  const arm = (A: ReturnType<typeof armPts>) => (
    <g>
      <line x1={A.s[0]} y1={A.s[1]} x2={A.el[0]} y2={A.el[1]} stroke={pal.top} strokeWidth={38} strokeLinecap="round" />
      <line x1={A.el[0]} y1={A.el[1]} x2={A.h[0]} y2={A.h[1]} stroke={pal.top} strokeWidth={34} strokeLinecap="round" />
      <circle cx={A.h[0]} cy={A.h[1]} r={21} fill={pal.skin} stroke={pal.skinShade} strokeWidth={3} />
    </g>
  );
  return (
    <g transform={`scale(${facing},1) translate(0,${pose.y}) rotate(${pose.lean} 0 -250)`}>
      {/* sombra */}
      <ellipse cx={0} cy={-pose.y} rx={110} ry={16} fill="#000" opacity={0.18} />
      {/* pernas */}
      {[-1, 1].map((s) => (
        <g key={s} transform={`rotate(${s * legSwing} ${s * 27} -250)`}>
          <rect x={s * 27 - 22} y={-260} width={44} height={240} rx={18} fill={isDress ? pal.skin : pal.bottom} />
          <ellipse cx={s * 27 + s * 10} cy={-14} rx={36} ry={17} fill={pal.shoes} />
        </g>
      ))}
      <g transform={`translate(0,${bob}) scale(1,${1 + breath})`} style={{ transformOrigin: "0px -250px" }}>
        {/* tronco */}
        {isDress ? (
          <path d="M -74 -470 Q -82 -360 -112 -150 L 112 -150 Q 82 -360 74 -470 Q 0 -492 -74 -470 Z" fill={pal.top} />
        ) : (
          <path d="M -76 -470 Q -86 -350 -70 -238 Q 0 -222 70 -238 Q 86 -350 76 -470 Q 0 -494 -76 -470 Z" fill={pal.top} />
        )}
        {!isDress && <rect x={-70} y={-262} width={140} height={26} rx={10} fill={pal.topShade} />}
        {pal.style === "ana" && <path d="M -20 -480 L 0 -446 L 20 -480" fill="none" stroke={pal.topShade} strokeWidth={6} />}
        {pal.style === "beto" && <path d="M -26 -482 L 0 -440 L 26 -482" fill={pal.accent} />}
        {pal.style === "tia" && <circle cx={0} cy={-440} r={10} fill={pal.accent} />}
        {/* pescoço + cabeça */}
        <rect x={-17} y={-512} width={34} height={46} fill={pal.skinShade} />
        <g transform={`rotate(${pose.head} 0 -500)`}>
          <HairBack pal={pal} />
          <circle cx={-90} cy={HEAD_Y + 6} r={16} fill={pal.skinShade} />
          <circle cx={90} cy={HEAD_Y + 6} r={16} fill={pal.skinShade} />
          <circle cx={0} cy={HEAD_Y} r={HEAD_R} fill={pal.skin} />
          <Face expr={expr} t={t} talking={talking || pose.mouth === "talk"} seed={seed} mouthOverride={pose.mouth} pal={pal} />
          <HairFront pal={pal} />
        </g>
        {arm(L)}
        {arm(R)}
        {item && (
          <g transform={`translate(${R.h[0]},${R.h[1]})`}>
            <HeldItem item={item} t={t} />
            <circle cx={0} cy={0} r={21} fill={pal.skin} stroke={pal.skinShade} strokeWidth={3} />
          </g>
        )}
      </g>
    </g>
  );
};
