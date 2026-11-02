#!/usr/bin/env node
// Render com Remotion.
//   node scripts/render.mjs                    → out/video.mp4 (1920x1080, 30 fps, h264 + AAC)
//   node scripts/render.mjs --stills 120,300   → out/stills/f<quadro>.png (conferência de quadros-chave)
//   --reuse  reaproveita o bundle em out/bundle   · --scale 0.5 para stills menores
import path from "node:path";
import fs from "node:fs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const libs = path.join(ROOT, ".libs");
if (fs.existsSync(libs)) process.env.LD_LIBRARY_PATH = `${libs}:${process.env.LD_LIBRARY_PATH ?? ""}`;

const { bundle } = await import("@remotion/bundler");
const { renderMedia, renderStill, selectComposition } = await import("@remotion/renderer");

const arg = (k) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : null);
const outDir = path.join(ROOT, "out");
const bundleDir = path.join(outDir, "bundle");
fs.mkdirSync(outDir, { recursive: true });

let serveUrl = bundleDir;
if (!process.argv.includes("--reuse") || !fs.existsSync(path.join(bundleDir, "index.html"))) {
  console.log("bundle…");
  serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/video/Root.tsx"), publicDir: path.join(ROOT, "public"), outDir: bundleDir });
}
const chromiumOptions = { gl: "swangle", disableWebSecurity: false };
const composition = await selectComposition({ serveUrl, id: "Main", chromiumOptions });
console.log(`composição: ${composition.durationInFrames} quadros (${(composition.durationInFrames / composition.fps).toFixed(2)} s)`);

const stills = arg("--stills");
if (stills) {
  fs.mkdirSync(path.join(outDir, "stills"), { recursive: true });
  for (const fr of stills.split(",").map(Number)) {
    const output = path.join(outDir, "stills", `f${fr}.png`);
    await renderStill({ composition, serveUrl, output, frame: fr, scale: Number(arg("--scale") ?? 0.5), chromiumOptions });
    console.log("still", output);
  }
  process.exit(0);
}

const t0 = Date.now();
let last = -1;
await renderMedia({
  composition, serveUrl, codec: "h264", audioCodec: "aac", crf: 22,
  outputLocation: path.join(outDir, "video.mp4"),
  concurrency: Number(arg("--concurrency") ?? 1),
  chromiumOptions,
  frameRange: arg("--range") ? arg("--range").split("-").map(Number) : undefined,
  onProgress: ({ progress, renderedFrames }) => {
    const p = Math.floor(progress * 100);
    if (p !== last) {
      last = p;
      const el = (Date.now() - t0) / 1000;
      console.log(`${p}% · ${renderedFrames} quadros · ${el.toFixed(0)} s`);
    }
  },
});
console.log("ok → out/video.mp4", ((Date.now() - t0) / 1000).toFixed(0), "s");
