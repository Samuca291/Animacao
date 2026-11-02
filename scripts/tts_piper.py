#!/usr/bin/env python3
"""
Narração offline (fallback sem chave ElevenLabs) com Piper TTS, voz pt_BR-faber-medium.

Timestamps por palavra: o modelo VITS não expõe alinhamento, então usamos o método
de prefixos com noise_w=0 (duração determinística): o fim da palavra k é a duração
falada (sem silêncio final) do prefixo w[0..k] da frase. Cada frase é sintetizada
inteira (áudio natural) e as frases são unidas com pausas conhecidas.

Saída: public/audio/<scene>.wav + data/timings.json (mesmo formato do narrate.mjs).
Uso: python3 scripts/tts_piper.py [--length-scale 1.0] [--only s01-gancho]
"""
import json, re, sys, wave, argparse, os
import numpy as np
from piper import PiperVoice
from piper.config import SynthesisConfig

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument("--length-scale", type=float, default=1.18)
ap.add_argument("--only", default=None)
args = ap.parse_args()

voice = PiperVoice.load(os.path.join(ROOT, ".tts/pt_BR-faber-medium.onnx"))
SR = voice.config.sample_rate
cfg = SynthesisConfig(length_scale=args.length_scale, noise_scale=0.6, noise_w_scale=0.0)

PAUSE = {".": 0.38, "?": 0.42, "!": 0.38, ":": 0.26, "…": 0.4}
LEAD = 0.0


def synth(text):
    parts = [c.audio_float_array for c in voice.synthesize(text, syn_config=cfg)]
    return np.concatenate(parts) if parts else np.zeros(1, dtype=np.float32)


def speech_bounds(a, thr=0.012):
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0:
        return 0, len(a)
    return int(idx[0]), int(idx[-1]) + 1


def split_sentences(words):
    out, cur = [], []
    for w in words:
        cur.append(w)
        if w[-1] in ".?!:…":
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return out


sb = json.load(open(os.path.join(ROOT, "storyboard.json"), encoding="utf-8"))
tpath = os.path.join(ROOT, "data/timings.json")
os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
os.makedirs(os.path.join(ROOT, "public/audio"), exist_ok=True)
timings = {"source": "piper:pt_BR-faber-medium", "method": "prefix-duration", "scenes": {}}
if args.only and os.path.exists(tpath):
    timings = json.load(open(tpath, encoding="utf-8"))

for sc in sb["scenes"]:
    if args.only and sc["id"] != args.only:
        continue
    words = sc["narration"].split()
    sentences = split_sentences(words)
    audio = [np.zeros(int(LEAD * SR), dtype=np.float32)]
    t = LEAD
    wt = []
    for si, sent in enumerate(sentences):
        full = synth(" ".join(sent))
        s0, s1 = speech_bounds(full)
        full = full[s0:s1]
        total = len(full) / SR
        ends = []
        for k in range(1, len(sent)):
            # estimativa A: duração do prefixo w[0..k-1] (tende a superestimar: alongamento final)
            p = synth(" ".join(sent[:k]))
            a0, a1 = speech_bounds(p)
            pre = (a1 - a0) / SR
            # estimativa B: total − duração do sufixo w[k..] (tende a subestimar: início de frase)
            q = synth(" ".join(sent[k:]))
            b0, b1 = speech_bounds(q)
            suf = total - (b1 - b0) / SR
            ends.append((pre + suf) / 2)
        ends.append(total)
        # garante monotonia e encaixa no total da frase
        prev = 0.0
        for k, w in enumerate(sent):
            e = min(max(ends[k], prev + 0.06), total)
            wt.append({"text": w, "start": round(t + prev, 3), "end": round(t + e, 3)})
            prev = e
        audio.append(full)
        t += total
        if si < len(sentences) - 1:
            gap = PAUSE.get(sent[-1][-1], 0.3)
            audio.append(np.zeros(int(gap * SR), dtype=np.float32))
            t += gap
    data = np.concatenate(audio)
    data = data / max(1e-6, np.max(np.abs(data))) * 0.89
    pcm = (data * 32767).astype(np.int16)
    out = os.path.join(ROOT, "public/audio", sc["id"] + ".wav")
    with wave.open(out, "wb") as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())
    dur = len(pcm) / SR
    timings["scenes"][sc["id"]] = {"audio": "audio/" + sc["id"] + ".wav", "duration_s": round(dur, 3), "words": wt}
    print(f"{sc['id']}: {len(words)} palavras, {dur:.2f}s", flush=True)

json.dump(timings, open(tpath, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("total fala:", round(sum(s["duration_s"] for s in timings["scenes"].values()), 2), "s")
