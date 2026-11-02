import React from "react";
import { mixColor, rand } from "../anim";

export type SetState = { day: number; dark: number; dusk: number; f: number; variant: string };
const ink = "#1f2430";
export const FLOOR_Y = 930;

const Sky: React.FC<{ x: number; y: number; w: number; h: number; s: SetState; city?: boolean }> = ({ x, y, w, h, s, city }) => {
  const top = mixColor("#0b1640", s.variant === "evening" || s.variant === "warm" ? "#ff9f68" : "#7cc8ff", s.day);
  const bot = mixColor("#2a2f6b", s.variant === "evening" || s.variant === "warm" ? "#ffd8a8" : "#d0ecff", s.day);
  const id = `sky${x}${y}`;
  const sunY = y + h * (1.05 - 0.75 * s.day);
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bot} /></linearGradient>
        <clipPath id={id + "c"}><rect x={x} y={y} width={w} height={h} /></clipPath>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={`url(#${id})`} />
      <g clipPath={`url(#${id}c)`}>
        {Array.from({ length: 14 }).map((_, i) => (
          <circle key={i} cx={x + rand(i) * w} cy={y + rand(i + 50) * h * 0.7} r={2 + rand(i + 9) * 2} fill="#fff" opacity={(1 - s.day) * (0.5 + 0.5 * Math.sin(s.f / 9 + i))} />
        ))}
        <circle cx={x + w * 0.7} cy={y + h * 0.3} r={34} fill="#f1f3f5" opacity={1 - s.day} />
        <circle cx={x + w * 0.7 + 14} cy={y + h * 0.3 - 8} r={30} fill={top} opacity={1 - s.day} />
        <circle cx={x + w * 0.3} cy={sunY} r={44} fill="#ffd43b" opacity={s.day} />
        <g fill="#fff" opacity={0.85 * s.day}>
          <ellipse cx={x + ((s.f * 0.4) % (w + 200)) - 100} cy={y + h * 0.35} rx={60} ry={20} />
          <ellipse cx={x + ((s.f * 0.25 + 300) % (w + 200)) - 100} cy={y + h * 0.18} rx={44} ry={15} />
        </g>
        {city && Array.from({ length: 9 }).map((_, i) => (
          <g key={i}>
            <rect x={x + i * (w / 9)} y={y + h - 60 - rand(i + 3) * 140} width={w / 9 - 8} height={300} fill={mixColor("#1b1f3b", "#8a94b8", s.day)} />
            {Array.from({ length: 4 }).map((_, j) => <rect key={j} x={x + i * (w / 9) + 10} y={y + h - 40 - rand(i + 3) * 140 + j * 30} width={10} height={12} fill="#ffe066" opacity={0.3 + (1 - s.day) * 0.6} />)}
          </g>
        ))}
      </g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#fff" strokeWidth={16} />
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke="#fff" strokeWidth={10} />
      <rect x={x - 20} y={y + h} width={w + 40} height={18} rx={4} fill="#e9ecef" />
    </g>
  );
};

const Wall: React.FC<{ s: SetState; day: string; night: string; floorDay: string; floorNight: string; stripes?: boolean }> = ({ s, day, night, floorDay, floorNight, stripes }) => (
  <g>
    <rect x={-600} y={-500} width={3120} height={FLOOR_Y + 500} fill={mixColor(night, day, s.day)} />
    {stripes && Array.from({ length: 30 }).map((_, i) => <rect key={i} x={-600 + i * 110} y={-500} width={40} height={FLOOR_Y + 500} fill="#fff" opacity={0.05} />)}
    <rect x={-600} y={FLOOR_Y - 14} width={3120} height={14} fill={mixColor("#2a2a3a", "#ffffff", s.day)} opacity={0.6} />
    <rect x={-600} y={FLOOR_Y} width={3120} height={700} fill={mixColor(floorNight, floorDay, s.day)} />
    {Array.from({ length: 16 }).map((_, i) => <line key={i} x1={-600 + i * 220} y1={FLOOR_Y} x2={-900 + i * 260} y2={FLOOR_Y + 500} stroke="#000" opacity={0.08} strokeWidth={4} />)}
  </g>
);

/** Fundo do cenário (atrás dos personagens). */
export const SetBack: React.FC<{ name: string; s: SetState }> = ({ name, s }) => {
  if (name === "bedroom") {
    return (
      <g>
        <Wall s={s} day="#ffe3c2" night="#2b2d5c" floorDay="#c98f5a" floorNight="#4a3a4a" stripes />
        <Sky x={1160} y={150} w={360} h={300} s={s} />
        {/* quadro */}
        <rect x={300} y={200} width={200} height={150} rx={6} fill="#fff" stroke={ink} strokeWidth={5} />
        <path d="M320 330 L380 260 L420 300 L450 270 L480 330 Z" fill="#69db7c" /><circle cx={450} cy={240} r={16} fill="#ffd43b" />
        {/* criado-mudo + despertador */}
        <rect x={980} y={760} width={150} height={170} rx={8} fill="#b07d4f" stroke={ink} strokeWidth={4} />
        <circle cx={1055} cy={715} r={42} fill="#fa5252" stroke={ink} strokeWidth={4} />
        <circle cx={1055} cy={715} r={30} fill="#fff" />
        <line x1={1055} y1={715} x2={1055} y2={693} stroke={ink} strokeWidth={4} transform={`rotate(${s.f * 2} 1055 715)`} />
        <line x1={1055} y1={715} x2={1070} y2={715} stroke={ink} strokeWidth={4} />
        {/* cama */}
        <rect x={1180} y={640} width={40} height={290} rx={10} fill="#8d5a3b" />
        <rect x={1190} y={760} width={620} height={110} rx={20} fill="#fff" stroke={ink} strokeWidth={4} />
        <rect x={1230} y={710} width={170} height={70} rx={30} fill="#e7f5ff" stroke={ink} strokeWidth={4} />
        <path d="M1380 760 Q1600 720 1810 760 L1810 870 L1380 870 Z" fill="#748ffc" stroke={ink} strokeWidth={4} />
        <rect x={1790} y={700} width={36} height={230} rx={10} fill="#8d5a3b" />
        {/* abajur */}
        <rect x={1010} y={600} width={10} height={70} fill={ink} />
      </g>
    );
  }
  if (name === "kitchen") {
    return (
      <g>
        <Wall s={s} day={s.variant === "evening" ? "#ffd6a5" : "#d8f3dc"} night="#1f2a44" floorDay="#adb5bd" floorNight="#3a3f52" />
        {/* azulejos */}
        {Array.from({ length: 13 }).map((_, i) => Array.from({ length: 3 }).map((_, j) => (
          <rect key={`${i}${j}`} x={1000 + i * 110} y={420 + j * 70} width={104} height={64} fill="#fff" opacity={0.35} />
        )))}
        <Sky x={480} y={150} w={380} h={290} s={s} />
        {/* geladeira */}
        <rect x={80} y={300} width={260} height={630} rx={24} fill="#e9ecef" stroke={ink} strokeWidth={5} />
        <line x1={80} y1={520} x2={340} y2={520} stroke={ink} strokeWidth={4} />
        <rect x={300} y={360} width={14} height={110} rx={6} fill="#868e96" /><rect x={300} y={560} width={14} height={140} rx={6} fill="#868e96" />
        <rect x={130} y={580} width={60} height={46} fill="#ffd43b" transform="rotate(-6 160 600)" />
        {/* armários */}
        {[0, 1, 2, 3].map((i) => <rect key={i} x={1040 + i * 260} y={120} width={240} height={200} rx={12} fill="#f8f9fa" stroke={ink} strokeWidth={4} />)}
        {/* bancada */}
        <rect x={1000} y={640} width={1500} height={290} fill="#ced4da" stroke={ink} strokeWidth={4} />
        <rect x={980} y={622} width={1540} height={26} rx={6} fill="#495057" />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={1030 + i * 260} y={680} width={230} height={220} rx={10} fill="#e9ecef" stroke={ink} strokeWidth={3} />)}
        {/* luminária */}
        <line x1={760} y1={-500} x2={760} y2={40} stroke={ink} strokeWidth={4} />
        <path d="M700 40 L820 40 L790 0 L730 0 Z" fill="#343a40" />
        <ellipse cx={760} cy={44} rx={30} ry={10} fill="#ffe066" opacity={0.4 + (1 - s.day) * 0.6} />
      </g>
    );
  }
  if (name === "living") {
    return (
      <g>
        <Wall s={s} day={s.variant === "evening" ? "#e5dbff" : "#d0ebff"} night="#2b2d5c" floorDay="#b58863" floorNight="#4a3a4a" stripes />
        <rect x={160} y={200} width={170} height={220} rx={6} fill="#fff" stroke={ink} strokeWidth={5} />
        <circle cx={245} cy={290} r={50} fill="#ffa8a8" />
        <rect x={1590} y={220} width={200} height={140} rx={6} fill="#fff" stroke={ink} strokeWidth={5} />
        <path d="M1600 350 L1660 280 L1700 320 L1780 250 L1780 350 Z" fill="#74c0fc" />
        {/* sofá */}
        <rect x={560} y={640} width={800} height={200} rx={50} fill="#5c7cfa" stroke={ink} strokeWidth={5} />
        <rect x={520} y={700} width={110} height={190} rx={40} fill="#4c6ef5" stroke={ink} strokeWidth={5} />
        <rect x={1290} y={700} width={110} height={190} rx={40} fill="#4c6ef5" stroke={ink} strokeWidth={5} />
        <rect x={620} y={760} width={680} height={110} rx={30} fill="#748ffc" stroke={ink} strokeWidth={5} />
        {/* planta */}
        <path d="M120 930 L100 800 L220 800 L200 930 Z" fill="#e8590c" stroke={ink} strokeWidth={4} />
        {[0, 1, 2, 3, 4].map((i) => (
          <ellipse key={i} cx={160 + (i - 2) * 26} cy={720 - Math.abs(i - 2) * -14} rx={22} ry={70} fill="#2f9e44" stroke={ink} strokeWidth={3}
            transform={`rotate(${(i - 2) * 22 + Math.sin(s.f / 30 + i) * 3} 160 800)`} />
        ))}
        {/* luminária de chão */}
        <line x1={1760} y1={480} x2={1760} y2={930} stroke={ink} strokeWidth={8} />
        <path d="M1690 480 L1830 480 L1800 400 L1720 400 Z" fill="#ffd43b" stroke={ink} strokeWidth={4} />
        <ellipse cx={1760} cy={930} rx={60} ry={14} fill={ink} />
      </g>
    );
  }
  // table
  return (
    <g>
      <Wall s={s} day="#ffe8cc" night="#3b2f4a" floorDay="#a47148" floorNight="#4a3a3a" />
      <Sky x={680} y={130} w={560} h={380} s={s} city />
      {[260, 1660].map((x, i) => (
        <g key={i}>
          <line x1={x} y1={-500} x2={x} y2={150} stroke={ink} strokeWidth={4} />
          <path d={`M${x - 70} 150 Q${x} 60 ${x + 70} 150 Z`} fill="#ff922b" stroke={ink} strokeWidth={4} />
          <ellipse cx={x} cy={156} rx={50} ry={12} fill="#ffe066" opacity={0.7 + 0.2 * Math.sin(s.f / 20)} />
        </g>
      ))}
      {/* cadeiras */}
      {[640, 1280].map((x) => <rect key={x} x={x - 120} y={560} width={240} height={260} rx={30} fill="#9c6644" stroke={ink} strokeWidth={5} />)}
    </g>
  );
};

/** Frente do cenário (na frente dos personagens). */
export const SetFront: React.FC<{ name: string; s: SetState }> = ({ name, s }) => {
  const overlay = (
    <rect x={-600} y={-500} width={3120} height={2200} fill="#0b1030" opacity={s.dark * 0.55 + s.dusk * 0.4} style={{ mixBlendMode: "multiply" }} />
  );
  if (name === "table") {
    return (
      <g>
        <rect x={360} y={740} width={1200} height={30} rx={10} fill="#7f5539" stroke={ink} strokeWidth={5} />
        <rect x={400} y={770} width={1120} height={200} fill="#9c6644" stroke={ink} strokeWidth={5} />
        <rect x={400} y={770} width={1120} height={18} fill="#000" opacity={0.15} />
        {overlay}
      </g>
    );
  }
  return overlay;
};
