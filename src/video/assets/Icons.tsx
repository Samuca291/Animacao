import React from "react";

// Ícones SVG (viewBox 0 0 100 100). `f` = quadro local (para ícones animados).
export const IconShape: React.FC<{ name: string; f?: number; spin?: number }> = ({ name, f = 0, spin = 1 }) => {
  const ink = "#1f2430";
  switch (name) {
    case "brain":
      return (
        <g>
          <path d="M50 14 C30 8 12 22 16 40 C6 48 8 66 20 70 C22 84 40 90 50 82 C60 90 78 84 80 70 C92 66 94 48 84 40 C88 22 70 8 50 14 Z" fill="#ff8fab" stroke={ink} strokeWidth={4} />
          <path d="M50 16 V82 M30 30 q10 6 4 16 M70 30 q-10 6 -4 16 M26 56 q12 0 14 12 M74 56 q-12 0 -14 12" fill="none" stroke={ink} strokeWidth={3.5} strokeLinecap="round" />
        </g>
      );
    case "sheet":
      return (
        <g>
          <rect x={10} y={14} width={80} height={72} rx={6} fill="#fff" stroke={ink} strokeWidth={4} />
          <rect x={10} y={14} width={80} height={14} rx={6} fill="#2f9e44" />
          {[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={16 + c * 25} y={34 + r * 12} width={21} height={8} fill={(r + c) % 2 ? "#d3f9d8" : "#b2f2bb"} />))}
        </g>
      );
    case "clock": {
      const a = f * 6 * spin;
      return (
        <g>
          <circle cx={50} cy={50} r={40} fill="#fff" stroke={ink} strokeWidth={5} />
          {Array.from({ length: 12 }).map((_, i) => <line key={i} x1={50} y1={14} x2={50} y2={20} stroke={ink} strokeWidth={3} transform={`rotate(${i * 30} 50 50)`} />)}
          <line x1={50} y1={50} x2={50} y2={28} stroke={ink} strokeWidth={5} strokeLinecap="round" transform={`rotate(${a / 12} 50 50)`} />
          <line x1={50} y1={50} x2={50} y2={18} stroke="#e03131" strokeWidth={3} strokeLinecap="round" transform={`rotate(${a} 50 50)`} />
          <circle cx={50} cy={50} r={4} fill={ink} />
        </g>
      );
    }
    case "check":
      return (
        <g>
          <circle cx={50} cy={50} r={40} fill="#40c057" stroke={ink} strokeWidth={4} />
          <path d="M30 52 L44 66 L72 36" fill="none" stroke="#fff" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "x":
      return (
        <g>
          <circle cx={50} cy={50} r={40} fill="#fa5252" stroke={ink} strokeWidth={4} />
          <path d="M34 34 L66 66 M66 34 L34 66" stroke="#fff" strokeWidth={10} strokeLinecap="round" />
        </g>
      );
    case "book":
      return (
        <g>
          <rect x={18} y={12} width={64} height={76} rx={4} fill="#4263eb" stroke={ink} strokeWidth={4} />
          <rect x={26} y={12} width={6} height={76} fill="#364fc7" />
          <rect x={38} y={28} width={36} height={8} rx={2} fill="#fff" />
          <rect x={38} y={42} width={26} height={5} rx={2} fill="#bac8ff" />
        </g>
      );
    case "meme":
      return (
        <g>
          <circle cx={50} cy={50} r={40} fill="#ffd43b" stroke={ink} strokeWidth={4} />
          <path d="M28 40 q6 -8 12 0 M60 40 q6 -8 12 0" fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" />
          <path d="M26 54 Q50 86 74 54 Z" fill="#7a2e2e" stroke={ink} strokeWidth={3} />
          <ellipse cx={22} cy={44} rx={5} ry={9} fill="#74c0fc" /><ellipse cx={78} cy={44} rx={5} ry={9} fill="#74c0fc" />
        </g>
      );
    case "warning":
      return (
        <g>
          <path d="M50 10 L92 86 H8 Z" fill="#ffd43b" stroke={ink} strokeWidth={5} strokeLinejoin="round" />
          <rect x={45} y={36} width={10} height={28} rx={4} fill={ink} /><circle cx={50} cy={74} r={6} fill={ink} />
        </g>
      );
    case "folder":
      return (
        <g>
          <path d="M10 26 H40 L48 34 H90 V82 H10 Z" fill="#ffc078" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
          <path d="M10 40 H90" stroke={ink} strokeWidth={3} />
          <text x={50} y={70} fontSize={22} textAnchor="middle" fill={ink} fontFamily="Baloo2" fontWeight={800}>0</text>
        </g>
      );
    case "flask":
      return (
        <g>
          <path d="M38 10 H62 M42 10 V38 L18 82 Q16 90 26 90 H74 Q84 90 82 82 L58 38 V10" fill="#e7f5ff" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
          <path d="M28 70 L72 70 L80 84 Q80 88 74 88 H26 Q20 88 22 84 Z" fill="#69db7c" />
          <circle cx={44} cy={62 - ((f * 1.2) % 30)} r={4} fill="#fff" opacity={0.8} />
        </g>
      );
    case "tube":
      return (
        <g transform="rotate(18 50 50)">
          <rect x={38} y={8} width={24} height={80} rx={12} fill="#f8f0fc" stroke={ink} strokeWidth={4} />
          <rect x={41} y={46} width={18} height={39} rx={9} fill="#da77f2" />
        </g>
      );
    case "hourglass": {
      const k = (f % 90) / 90;
      return (
        <g>
          <path d="M24 10 H76 M24 90 H76" stroke={ink} strokeWidth={6} strokeLinecap="round" />
          <path d="M30 12 Q30 40 50 50 Q70 40 70 12 Z M30 88 Q30 60 50 50 Q70 60 70 88 Z" fill="#fff9db" stroke={ink} strokeWidth={4} />
          <path d={`M${36 + k * 10} ${16 + k * 24} Q50 ${44} ${64 - k * 10} ${16 + k * 24} Z`} fill="#fab005" />
          <path d={`M34 86 Q50 ${86 - k * 22} 66 86 Z`} fill="#fab005" />
          <line x1={50} y1={50} x2={50} y2={84} stroke="#fab005" strokeWidth={2} />
        </g>
      );
    }
    case "chat":
      return (
        <g>
          <path d="M14 20 H70 Q78 20 78 28 V54 Q78 62 70 62 H38 L24 76 V62 H14 Q6 62 6 54 V28 Q6 20 14 20 Z" fill="#74c0fc" stroke={ink} strokeWidth={4} />
          <path d="M40 46 H86 Q94 46 94 54 V74 Q94 82 86 82 H80 V92 L70 82 H40 Q32 82 32 74 V54 Q32 46 40 46 Z" fill="#ffd8a8" stroke={ink} strokeWidth={4} />
        </g>
      );
    case "people":
      return (
        <g stroke={ink} strokeWidth={4}>
          <circle cx={30} cy={34} r={13} fill="#F4C7A1" /><path d="M8 84 Q8 54 30 54 Q52 54 52 84 Z" fill="#F5B82E" />
          <circle cx={70} cy={34} r={13} fill="#9A6440" /><path d="M48 84 Q48 54 70 54 Q92 54 92 84 Z" fill="#3FA37C" />
        </g>
      );
    case "person":
      return (
        <g>
          <circle cx={50} cy={34} r={18} fill="#F4C7A1" stroke={ink} strokeWidth={4} />
          <path d="M20 92 Q20 58 50 58 Q80 58 80 92 Z" fill="#748ffc" stroke={ink} strokeWidth={4} />
          <path d="M34 26 Q50 6 66 26" fill="none" stroke="#ffd43b" strokeWidth={6} strokeLinecap="round" />
        </g>
      );
    case "zzz":
      return (
        <g fontFamily="Baloo2" fontWeight={800} fill="#4c6ef5">
          <text x={10} y={80} fontSize={42}>z</text><text x={40} y={58} fontSize={34}>z</text><text x={64} y={38} fontSize={26}>z</text>
        </g>
      );
    case "bulb":
      return (
        <g>
          <path d="M50 10 C28 10 18 30 26 48 C30 58 38 62 38 72 H62 C62 62 70 58 74 48 C82 30 72 10 50 10 Z" fill="#ffe066" stroke={ink} strokeWidth={4} />
          <rect x={38} y={74} width={24} height={14} rx={3} fill="#adb5bd" stroke={ink} strokeWidth={3} />
        </g>
      );
    case "route":
      return (
        <g>
          <path d="M18 80 C40 80 30 46 54 46 C76 46 70 20 84 18" fill="none" stroke="#4dabf7" strokeWidth={7} strokeDasharray="10 7" strokeDashoffset={-f} strokeLinecap="round" />
          <circle cx={18} cy={80} r={9} fill="#fa5252" stroke={ink} strokeWidth={3} />
          <path d="M84 4 C74 4 72 16 84 30 C96 16 94 4 84 4 Z" fill="#40c057" stroke={ink} strokeWidth={3} />
        </g>
      );
    case "phone":
      return (
        <g transform={`rotate(${Math.sin(f / 1.4) * 8} 50 50)`}>
          <rect x={30} y={10} width={40} height={80} rx={8} fill="#343a40" />
          <rect x={35} y={18} width={30} height={60} rx={3} fill="#74c0fc" />
        </g>
      );
    default:
      return <circle cx={50} cy={50} r={40} fill="#ccc" />;
  }
};

export const Icon: React.FC<{ name: string; size: number; f?: number; spin?: number }> = ({ name, size, f, spin }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
    <IconShape name={name} f={f} spin={spin} />
  </svg>
);
