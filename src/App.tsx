import { useEffect, useMemo, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { Main, timeline } from "./video/Main";

const fmt = (f: number) => {
  const s = f / timeline.fps;
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
};

const CHECKS = [
  ["Roteiro (~620 palavras, gancho → conta → 6 marcos → virada → fechamento)", true],
  ["storyboard.json válido, 16 cenas alternando character/edit, cues em at_word", true],
  ["Narração com timestamps por palavra (fallback offline Piper; ElevenLabs pronto)", true],
  ["at_word → quadros (259 cues resolvidas, relatório em reports/cues.md)", true],
  ["Personagem, cenários e props em SVG únicos, reaproveitados", true],
  ["Renderizador único Remotion (useCurrentFrame + interpolate/spring)", true],
  ["Legendas sincronizadas palavra a palavra + legendas.srt", true],
  ["Trilha leve procedural com ducking", true],
  [`Duração ${fmt(timeline.totalFrames)} (alvo 3:50–4:10)`, timeline.totalFrames / timeline.fps >= 230 && timeline.totalFrames / timeline.fps <= 250],
] as const;

export default function App() {
  const ref = useRef<PlayerRef>(null);
  const [frame, setFrame] = useState(0);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const p = ref.current;
    if (!p) return;
    const cb = (e: { detail: { frame: number } }) => setFrame(e.detail.frame);
    p.addEventListener("frameupdate", cb);
    return () => p.removeEventListener("frameupdate", cb);
  }, []);

  const current = useMemo(() => {
    let idx = 0;
    timeline.scenes.forEach((s, i) => { if (frame >= s.from) idx = i; });
    return idx;
  }, [frame]);

  const seek = (f: number) => { ref.current?.seekTo(f); };

  return (
    <div className="min-h-screen bg-[#0b1030] text-slate-100">
      <header className="mx-auto max-w-7xl px-5 pt-8 pb-4">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-300">Vídeo narrado · 1920×1080 · 30 fps · pt-BR</p>
        <h1 className="mt-2 text-3xl font-black leading-tight md:text-5xl">
          E se você ficasse com o <span className="text-amber-300">dobro de inteligência</span> a cada dia que acordasse?
        </h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Ao acordar no dia <b>n</b>, você tem <b>2<sup>n</sup></b> vezes a inteligência original. Dia 1 = 2×, dia 7 = 128×, dia 10 = 1.024×, dia 20 = 1.048.576×, dia 30 = 1.073.741.824×.
        </p>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-5 pb-16 lg:grid-cols-[1fr_340px]">
        <section>
          <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/50">
            <Player
              ref={ref}
              component={Main}
              durationInFrames={timeline.totalFrames}
              compositionWidth={timeline.width}
              compositionHeight={timeline.height}
              fps={timeline.fps}
              controls
              clickToPlay
              acknowledgeRemotionLicense
              style={{ width: "100%", aspectRatio: "16 / 9" }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span className="rounded-full bg-white/10 px-3 py-1">Cena {current + 1}/{timeline.scenes.length}: <b>{timeline.scenes[current].act}</b></span>
            <span className="rounded-full bg-white/10 px-3 py-1">{fmt(frame)} / {fmt(timeline.totalFrames)}</span>
            <span className="rounded-full bg-white/10 px-3 py-1">Voz: {timeline.source.split(":")[0]}</span>
            <a className="rounded-full bg-amber-300 px-3 py-1 font-bold text-slate-900 hover:bg-amber-200" href="./video.mp4" download>Baixar MP4</a>
            <a className="rounded-full bg-white/10 px-3 py-1 hover:bg-white/20" href="./legendas.srt" download>legendas.srt</a>
            <a className="rounded-full bg-white/10 px-3 py-1 hover:bg-white/20" href="./storyboard.json" download>storyboard.json</a>
          </div>

          <h2 className="mt-10 mb-3 text-xl font-black">Storyboard: cues ancoradas em palavras → quadros</h2>
          <div className="space-y-2">
            {timeline.scenes.map((s, i) => {
              const isOpen = open === s.id;
              const cues = [...(s.cues ?? []).map((c) => ({ f: c.at_frame, label: `${c.target}.${c.action}${c.expression ? ` · ${c.expression}` : ""}` })),
                ...(s.layers ?? []).map((l) => ({ f: l.at_frame, label: `camada ${l.kind} · ${l.id}` }))].sort((a, b) => a.f - b.f);
              return (
                <div key={s.id} className={`rounded-xl border ${i === current ? "border-amber-300/70 bg-amber-300/10" : "border-white/10 bg-white/5"}`}>
                  <button className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => { seek(s.from); setOpen(isOpen ? null : s.id); }}>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-black uppercase ${s.type === "character" ? "bg-sky-400 text-slate-900" : "bg-fuchsia-400 text-slate-900"}`}>{s.type}</span>
                    <span className="font-bold">{i + 1}. {s.act}</span>
                    <span className="ml-auto text-sm text-slate-400">{fmt(s.from)} · {(s.durationInFrames / timeline.fps).toFixed(1)} s</span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-white/10 px-4 py-3 text-sm">
                      <p className="mb-3 leading-relaxed text-slate-200">
                        {s.words.map((w, k) => (
                          <button key={k} onClick={() => seek(s.from + w.f0)} className="mr-1 rounded px-0.5 hover:bg-amber-300 hover:text-slate-900" title={`quadro ${s.from + w.f0}`}>{w.text}</button>
                        ))}
                      </p>
                      <div className="grid gap-1 sm:grid-cols-2">
                        {cues.map((c, k) => (
                          <button key={k} onClick={() => seek(s.from + c.f)} className="flex justify-between rounded bg-black/20 px-2 py-1 text-left font-mono text-xs hover:bg-black/40">
                            <span>{c.label}</span><span className="text-amber-300">q{s.from + c.f}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-3 font-black">Checklist</h3>
            <ul className="space-y-2 text-sm">
              {CHECKS.map(([t, ok]) => (
                <li key={t} className="flex gap-2"><span className={ok ? "text-emerald-400" : "text-rose-400"}>{ok ? "✔" : "✖"}</span><span className="text-slate-300">{t}</span></li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5 text-sm text-slate-200">
            <h3 className="mb-2 font-black text-amber-300">Precisa de você</h3>
            <ul className="list-disc space-y-1 pl-4">
              <li><b>ELEVENLABS_API_KEY</b> e <b>ELEVENLABS_VOICE_ID</b> (voz pt-BR) para trocar a voz offline pela do ElevenLabs.</li>
              <li>Depois: <code className="text-amber-200">node scripts/narrate.mjs</code> → <code className="text-amber-200">build-timeline</code> → <code className="text-amber-200">render</code>.</li>
              <li>Opcional: trilha licenciada no lugar da procedural.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
            <h3 className="mb-2 font-black text-slate-100">Legenda</h3>
            <p><span className="rounded bg-sky-400 px-1.5 text-xs font-black text-slate-900">CHARACTER</span> cotidiano da Ana (rig SVG único)</p>
            <p className="mt-1"><span className="rounded bg-fuchsia-400 px-1.5 text-xs font-black text-slate-900">EDIT</span> matemática, gráficos e viradas</p>
            <p className="mt-2 text-slate-400">Clique numa palavra ou cue para pular ao quadro exato.</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
