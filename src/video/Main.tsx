import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, interpolate } from "remotion";
import { TransitionSeries, linearTiming, springTiming, type TransitionPresentation } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide, type SlideDirection } from "@remotion/transitions/slide";
import { wipe, type WipeDirection } from "@remotion/transitions/wipe";
import { flip, type FlipDirection } from "@remotion/transitions/flip";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { iris } from "@remotion/transitions/iris";
import timelineJson from "../data/timeline.json";
import type { Timeline, Transition } from "./types";
import { SceneRenderer, asset } from "./SceneRenderer";
import { clamp } from "./anim";

export const timeline = timelineJson as unknown as Timeline;

const FONTS: [string, string][] = [["Nunito", "fonts/Nunito.ttf"], ["Baloo2", "fonts/Baloo2.ttf"], ["DejaVu", "fonts/DejaVuSans.ttf"]];

function useFonts() {
  const [handle] = useState(() => delayRender("Carregando fontes"));
  useEffect(() => {
    Promise.all(
      FONTS.map(([name, file]) => {
        const ff = new FontFace(name, `url(${asset(file)})`, { weight: "200 1000" });
        return ff.load().then((l) => { document.fonts.add(l); }).catch(() => undefined);
      }),
    ).then(() => continueRender(handle));
  }, [handle]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function presentation(t: Transition): TransitionPresentation<any> {
  const W = timeline.width, H = timeline.height;
  switch (t.type) {
    case "slide": return slide({ direction: (t.direction ?? "from-right") as SlideDirection });
    case "wipe": return wipe({ direction: (t.direction ?? "from-left") as WipeDirection });
    case "flip": return flip({ direction: (t.direction ?? "from-right") as FlipDirection });
    case "clockWipe": return clockWipe({ width: W, height: H });
    case "iris": return iris({ width: W, height: H });
    default: return fade();
  }
}

/** Trilha com ducking leve sob a narração. */
function useMusicVolume() {
  const speech: [number, number][] = timeline.scenes.map((s) => [s.from + s.leadFrames, s.from + s.leadFrames + s.speechFrames]);
  return (f: number) => {
    let dist = 1e9;
    for (const [a, b] of speech) dist = Math.min(dist, f < a ? a - f : f > b ? f - b : 0);
    const duck = interpolate(dist, [0, 12], [0.055, 0.13], clamp);
    const fadeIO = interpolate(f, [0, 30, timeline.totalFrames - 75, timeline.totalFrames], [0, 1, 1, 0], clamp);
    return duck * fadeIO;
  };
}

export const Main: React.FC<{ music?: boolean }> = ({ music = true }) => {
  useFonts();
  const vol = useMusicVolume();
  const n = timeline.scenes.length;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <TransitionSeries>
        {timeline.scenes.map((s, i) => {
          const t = s.transition_out;
          const hasT = i < n - 1 && t && t.frames > 0 && t.type !== "cut" && t.type !== "none";
          return (
            <React.Fragment key={s.id}>
              <TransitionSeries.Sequence durationInFrames={s.durationInFrames}>
                <SceneRenderer scene={s} />
              </TransitionSeries.Sequence>
              {hasT && (
                <TransitionSeries.Transition
                  presentation={presentation(t!)}
                  timing={t!.timing === "spring" ? springTiming({ config: { damping: 200 }, durationInFrames: t!.frames }) : linearTiming({ durationInFrames: t!.frames })}
                />
              )}
            </React.Fragment>
          );
        })}
      </TransitionSeries>
      {music && <Audio src={asset("audio/trilha.wav")} loop volume={vol} />}
    </AbsoluteFill>
  );
};
