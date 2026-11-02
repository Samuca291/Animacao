import { interpolate, spring, Easing } from "remotion";

export const FPS = 30;
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 linear entre a e a+d (clamp). */
export const prog = (f: number, a: number, d: number) => interpolate(f, [a, a + d], [0, 1], clamp);

/** 0→1 com easing in-out. */
export const ease = (f: number, a: number, d: number) =>
  interpolate(f, [a, a + d], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

/** 0→1 easing out (rápido no início). */
export const easeOut = (f: number, a: number, d: number) =>
  interpolate(f, [a, a + d], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

/** spring iniciando no quadro `a`. */
export const spr = (f: number, a: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) =>
  f < a ? 0 : spring({ frame: f - a, fps: FPS, config: { damping: 12, stiffness: 140, mass: 0.8, ...cfg } });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Flutuação contínua determinística (evita texto/objeto parado). */
export const float = (f: number, seed = 0, amp = 6, period = 70) =>
  Math.sin(((f + seed * 37) / period) * Math.PI * 2) * amp;

/** decaimento de 1→0 após quadro a (para punch/shake). */
export const decay = (f: number, a: number, d: number) => (f < a ? 0 : Math.max(0, 1 - (f - a) / d));

/** ruído pseudo-aleatório determinístico. */
export const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const ptBR = (n: number) => Math.round(n).toLocaleString("pt-BR").replace(/\u00a0/g, ".");
export const times = (day: number) => `${ptBR(2 ** day)}×`;

/** Interpola cor hex. */
export const mixColor = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const m = (s: number) => Math.round(lerp(ch(pa, s), ch(pb, s), Math.max(0, Math.min(1, t))));
  return `rgb(${m(16)},${m(8)},${m(0)})`;
};

/** Último item com at_frame <= f, mais o anterior e progresso da troca. */
export function active<T extends { at_frame: number }>(list: T[], f: number, blend = 8) {
  let cur: T | null = null;
  let prev: T | null = null;
  for (const c of list) {
    if (c.at_frame <= f) {
      prev = cur;
      cur = c;
    }
  }
  const t = cur ? ease(f, cur.at_frame, blend) : 1;
  return { cur, prev, t };
}
