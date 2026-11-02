import React from "react";
import { rand } from "../anim";

const ink = "#1f2430";

/** Vapor animado (quadro f). */
export const Steam: React.FC<{ f: number; x: number; y: number; strength?: number }> = ({ f, x, y, strength = 1 }) => (
  <g opacity={0.75 * strength}>
    {[0, 1, 2].map((i) => {
      const k = ((f + i * 20) % 60) / 60;
      return (
        <path key={i} d={`M ${x - 16 + i * 16} ${y - k * 70} q 10 -14 0 -28 q -10 -14 0 -28`} fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={1 - k} />
      );
    })}
  </g>
);

/** Props de cenário. y = superfície onde o objeto está apoiado. */
export const SceneProp: React.FC<{ id: string; x: number; y: number; f: number; state?: Record<string, number>; steam?: boolean }> = ({ id, x, y, f, state = {}, steam }) => {
  switch (id) {
    case "airfryer":
      return (
        <g transform={`translate(${x},${y})`}>
          <rect x={-80} y={-170} width={160} height={170} rx={34} fill="#2b2f36" stroke={ink} strokeWidth={4} />
          <rect x={-60} y={-90} width={120} height={70} rx={14} fill="#3d434d" />
          <rect x={-20} y={-60} width={40} height={10} rx={5} fill="#868e96" />
          <circle cx={0} cy={-128} r={20} fill="#495057" stroke="#adb5bd" strokeWidth={3} />
          <line x1={0} y1={-128} x2={10} y2={-142} stroke="#ff922b" strokeWidth={4} />
        </g>
      );
    case "mug":
      return (
        <g transform={`translate(${x},${y})`}>
          <rect x={-30} y={-64} width={60} height={64} rx={10} fill="#fff" stroke={ink} strokeWidth={4} />
          <path d="M 30 -50 q 26 0 26 18 q 0 18 -26 18" fill="none" stroke={ink} strokeWidth={6} />
          <rect x={-30} y={-36} width={60} height={12} fill="#E63946" />
          {steam && <Steam f={f} x={0} y={-74} />}
        </g>
      );
    case "microwave": {
      const fixed = state.fixed ?? 0;
      const spark = fixed > 0 && fixed < 1;
      return (
        <g transform={`translate(${x},${y})`}>
          <rect x={-140} y={-150} width={280} height={150} rx={14} fill="#dee2e6" stroke={ink} strokeWidth={4} />
          <rect x={-120} y={-130} width={170} height={110} rx={10} fill={fixed >= 1 ? "#ffe8a3" : "#343a40"} />
          <rect x={70} y={-130} width={54} height={28} rx={4} fill="#212529" />
          <text x={97} y={-109} fontSize={20} textAnchor="middle" fill={fixed >= 1 ? "#51cf66" : Math.floor(f / 8) % 2 ? "#ff6b6b" : "#212529"} fontFamily="Nunito" fontWeight={900}>{fixed >= 1 ? "OK" : "12:00"}</text>
          {[0, 1, 2].map((i) => <circle key={i} cx={97} cy={-80 + i * 22} r={7} fill="#adb5bd" />)}
          {spark && Array.from({ length: 6 }).map((_, i) => {
            const a = (i / 6) * Math.PI * 2 + f / 5;
            return <path key={i} d="M0 -14 L4 -4 L14 0 L4 4 L0 14 L-4 4 L-14 0 L-4 -4 Z" fill="#ffd43b" transform={`translate(${Math.cos(a) * 170},${-75 + Math.sin(a) * 100}) scale(${0.8 + rand(i + Math.floor(f / 3)) })`} />;
          })}
        </g>
      );
    }
    case "kettle": {
      const boil = state.boil ?? 0;
      const wob = boil > 0 ? Math.sin(f / 1.5) * 2 * boil : 0;
      return (
        <g transform={`translate(${x},${y}) rotate(${wob})`}>
          <path d="M -70 0 L -60 -110 Q 0 -140 60 -110 L 70 0 Z" fill="#e8590c" stroke={ink} strokeWidth={4} />
          <path d="M -40 -128 Q 0 -190 40 -128" fill="none" stroke={ink} strokeWidth={9} strokeLinecap="round" />
          <path d="M 60 -80 L 110 -110 L 104 -96 L 66 -50 Z" fill="#d9480f" stroke={ink} strokeWidth={4} />
          <rect x={-74} y={-6} width={148} height={10} rx={4} fill="#495057" />
          {boil > 0 && <Steam f={f} x={112} y={-118} strength={boil} />}
        </g>
      );
    }
    case "whiteboard": {
      const d = state.density ?? 0;
      const lines = [
        "∂ψ/∂t = Ĥψ  ⊗  Λ(κ)", "∑ ∫∫ ∇·F dV ≈ Ω³", "lim n→∞ (1+1/n)ⁿ", "μ(x) ∝ e^(−βE) · ζ(s)", "Γ ⊢ φ ⟹ ψ", "≡ ∮ A·dl · ℵ₀",
      ];
      const visible = Math.round(d * 2);
      return (
        <g transform={`translate(${x},${y})`}>
          <rect x={-300} y={-170} width={600} height={340} rx={10} fill="#fff" stroke="#868e96" strokeWidth={10} />
          {lines.slice(0, visible).map((l, i) => (
            <text key={i} x={-270} y={-120 + i * 50} fontSize={34} fill={i % 2 ? "#1c7ed6" : "#e03131"} fontFamily="Nunito" fontWeight={700} transform={`rotate(${(rand(i) - 0.5) * 4} 0 ${-120 + i * 50})`}>{l}</text>
          ))}
          {visible === 0 && <text x={0} y={14} fontSize={48} textAnchor="middle" fill="#1c7ed6" fontFamily="Baloo2" fontWeight={800}>Tudo está conectado. ★</text>}
          <rect x={-120} y={170} width={240} height={14} rx={4} fill="#adb5bd" />
        </g>
      );
    }
    default:
      return null;
  }
};
