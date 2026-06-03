## Objetivo

Áudio do WhatsApp toca **inline** em qualquer dispositivo (iPhone, Android, desktop) **e** chega com **transcrição automática** em texto logo abaixo do player. Sem fallback "Abrir/Baixar".

## Parte 1 — Player inline (resolve o iOS)

iOS Safari não decodifica `.ogg/opus` nativamente. Em vez de depender do `<audio>`, decodificamos o Opus no próprio navegador via WebAssembly e tocamos pelo Web Audio API — funciona idêntico em todo lugar.

Biblioteca: [`opus-decoder`](https://www.npmjs.com/package/opus-decoder) (wasm ~200KB, carregada sob demanda no primeiro Play — não impacta bundle inicial).

### Novo componente `OpusAudioPlayer`
Arquivo: `src/components/inbox/OpusAudioPlayer.tsx`
- Tenta `<audio>` nativo (caminho rápido em desktop/Android).
- Se `canPlayType` retornar vazio OU disparar `error`, faz fetch → decodifica Opus → PCM via `opus-decoder` → `AudioBuffer` → toca via Web Audio API.
- UI: ícone de microfone, botão play/pause, barra de progresso clicável, tempo decorrido/total, velocidade (1x / 1.5x / 2x).
- Cache do `AudioBuffer` por URL para não redecodificar a cada play/pause.
- `AudioContext.resume()` dentro do gesto do Play (exigência do iOS).

### Substituir `AudioMessage` em `MessageMedia.tsx`
Remover `AudioMessage`, `audioIsPlayable`, estado `fallback` e card "Abrir/Baixar". Branch `isAudio` renderiza só `<OpusAudioPlayer ... />` + bloco de transcrição (parte 2).

### Dependência
`bun add opus-decoder`.

## Parte 2 — Transcrição automática

Toda mensagem de áudio é transcrita em português e exibida em um bloco "Transcrição" abaixo do player (estilo "Transcript" do WhatsApp).

### Onde transcrever
**Na recepção, no webhook** — não em runtime no client. Vantagens:
- Transcreve uma vez, salva no banco, todos os corretores reusam.
- Aparece pronto quando o corretor abre a conversa.
- Não consome créditos sempre que alguém revê a conversa.

### Stack
- **Lovable AI Gateway** com `google/gemini-2.5-flash` (já configurado, sem chave nova).
- Gemini aceita áudio como `inline_data` (base64) em chamadas `/v1/chat/completions` e devolve a transcrição.
- Custo baixo, latência boa para áudios típicos de WhatsApp (< 2 min).

### Mudanças no backend
1. **`supabase/functions/whatsapp-webhook/index.ts`** — quando `message_type === 'audio'` e a mídia já está disponível (após o download/storage que já fazemos), invocar (fire-and-forget, com `EdgeRuntime.waitUntil`) uma nova função `transcribe-audio` passando `message_id` e `storage_path`. Não bloqueia o ack do webhook.
2. **Nova edge function `supabase/functions/transcribe-audio/index.ts`** — baixa o arquivo do Storage, converte para base64, chama Gemini Flash via Lovable AI Gateway com prompt "Transcreva fielmente este áudio em português brasileiro, sem comentários extras", recebe o texto e atualiza `messages.metadata.transcription = { text, status: 'done', model, generated_at }`. Trata 429/402 marcando `status: 'rate_limited'` ou `'failed'` (a UI mostra um botão "Tentar novamente" que reinvoca a função).
3. **Migração**: nenhum schema novo — usamos o `metadata` jsonb que já existe em `messages`.

### Mudanças no frontend
- `OpusAudioPlayer` recebe `transcription?: { status, text }` como prop.
- Abaixo do player: bloco discreto com label "Transcrição" + texto. Estados:
  - `pending` (default ao receber) → "Transcrevendo áudio…" com shimmer.
  - `done` → texto completo, com botão "ocultar/mostrar" se for longo.
  - `failed` / `rate_limited` → "Não foi possível transcrever" + botão "Tentar novamente" (chama `transcribe-audio` via `supabase.functions.invoke`).
- Realtime: a UI já escuta `messages` updates; quando `metadata.transcription` mudar, re-renderiza automaticamente.

### Backfill (opcional, posterior)
Não cobrir agora. Áudios antigos seguem sem transcrição até alguém clicar em "Transcrever" (botão pequeno no player quando `transcription` for ausente). Simples e barato.

## Fora de escopo
- Waveform visual estilo WhatsApp.
- Transcodificação server-side com ffmpeg.
- Tradução automática (só transcrição em PT-BR).
- Backfill em massa de áudios antigos.
- Gravação de áudio pelo corretor.
