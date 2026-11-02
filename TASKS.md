# TASKS — "O dobro de inteligência a cada dia"

Vídeo: 1920x1080 · 30 fps · pt-BR · **3:55,8** (7074 quadros) · 16 cenas (8 character + 8 edit, alternadas)

## Pipeline
```
storyboard.json
  ├─ ELEVENLABS: node scripts/narrate.mjs        (precisa ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID)
  └─ OFFLINE:    python3 scripts/tts_piper.py     (Piper, voz pt_BR-faber-medium — usado agora)
        → data/timings.json (timestamps por palavra) + public/audio/<cena>.(mp3|wav)
node scripts/build-timeline.mjs   → src/data/timeline.json · reports/cues.md · public/legendas.srt
node scripts/make-music.mjs       → public/audio/trilha.wav
node scripts/render.mjs           → out/video.mp4   (--stills 120,300 para quadros de conferência)
npm run build                     → player web (dist/)
```
Render local: Chrome headless precisa de `.libs/` (libnss3/libnspr4 extraídas de .deb do Debian); o script já define LD_LIBRARY_PATH.

## Checklist
- [x] 1. Roteiro com ~620 palavras → `ROTEIRO.md` (gancho, conta, dias 1/3/7/10/20/30, virada aos 3:00, fechamento)
- [x] 2. `storyboard.json`: 16 cenas, `at_word` + `nth`, sem segundos; 259 cues/camadas resolvidas, 0 erros
- [x] 3. Script ElevenLabs `/with-timestamps` (caractere → palavra, duração via ffprobe) — **aguarda chave**
- [x] 3b. Narração real offline (Piper) com timestamps por palavra (prefixo/sufixo, noise_w=0)
- [x] 3c. at_word → quadros + validações (8–20 s por cena, total 3:50–4:10, alternância, números falados)
- [x] 4. Assets SVG únicos: `Character.tsx` (rig + paletas fixas ANA/BETO/TIA), `Sets.tsx`, `Props.tsx`, `Icons.tsx`
- [x] 5. Renderizador único `SceneRenderer.tsx` (câmera, legendas, áudio, fx) → `CharacterStage` | `EditStage`
- [x] 6. Legendas palavra a palavra (no vídeo) + `public/legendas.srt`
- [x] 6b. Trilha procedural com ducking sob a fala
- [x] 6c. Render MP4 → `out/video.mp4` (cópia em `public/video.mp4`)
- [x] 7. Verificações (abaixo)
- [x] 8. `npm run build` do player web

## Verificações feitas
- Duração: 235,8 s ✅ · cenas entre 8,97 s e 19,83 s ✅ · virada começa em 3:00,6 ✅
- Números: 2¹=2, 2²=4, 2³=8, 2⁷=128, 2¹⁰=1.024, 2²⁰=1.048.576, 2³⁰=1.073.741.824 gerados por código (`2 ** dia`) e conferidos
  contra a fala da cena 3 (build-timeline falha se faltar). Cena 11: ganho do dia 30 = 536.870.912 > soma dos ganhos 1–29 = 536.870.911 ✅
- Quadros-chave renderizados e inspecionados (out/stills):
  - character: s02 "dorme" (q347 → luz apaga, zzz, olhos fechados) · s04 "manual" (q1493 → aponta, balão "Ahhh…") ·
    s06 "rir" (q2652 → risada forçada + punch) · s10 "simplifica" (q4442 → quadro com 2 linhas) · s13 "acompanha" (q6138 → amigos saem) · s15 "vezes" (cartão final)
  - edit: s01 "spoiler" · s03 "bilhão" (q1219 → contador 1.073.741.824× + flash) · s09 "cidade" (q3905 → multidão dobra) · s11 "somados" (q4949 → barra azul)
- Personagem: a mesma paleta/rig (`ANA`) em todas as 8 cenas de bonecos (presilha vermelha, cabelo chanel, suéter mostarda) ✅

## Correções feitas durante a revisão
- s11 e s12 eram ambas `edit` e o total dava 3:42 → nova cena character `s11b-pronto` ("agora eu resolvo tudo… né?")
- Expressão "preocupada" parecia brava (sobrancelhas invertidas) → corrigida
- Gráfico do dia 30: contador/chip cobriam os rótulos → reposicionados
- Rótulo "512 gênios" (número fora do roteiro) → "uma cidade inteira de gênios"

## Pendências que dependem de você
- [ ] `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` → rodar narrate → build-timeline → render (as durações se ajustam sozinhas ao novo áudio)
- [ ] (opcional) Trilha licenciada no lugar da procedural
