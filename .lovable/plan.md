
Corrigir o envio de áudio da inbox para que ele chegue no WhatsApp como áudio real, e não como texto “Audio”.

## Diagnóstico

O problema está em dois pontos do fluxo atual:

1. `src/components/inbox/ConversationThread.tsx`
- o gravador prioriza `audio/webm;codecs=opus`
- esse formato funciona no navegador, mas costuma não ser o formato mais compatível para envio como áudio/voz no WhatsApp

2. `supabase/functions/inbox-send-message/index.ts`
- o envio de mídia de áudio usa o mesmo fluxo genérico de mídia
- o payload inclui `text/caption` mesmo para áudio
- pelos sintomas e pelo comportamento da UAZAPI, isso faz o provedor tratar a requisição como mensagem textual/anexo inadequado, em vez de áudio reproduzível

Também encontrei um indício forte no histórico:
- os áudios recebidos do WhatsApp e arquivados pelo webhook chegam como `audio/ogg; codecs=opus`
- já os áudios gravados no sistema estão sendo enviados como `audio/webm;codecs=opus`

## Ajustes propostos

### 1) Padronizar gravação para formato compatível com WhatsApp
Arquivo: `src/components/inbox/ConversationThread.tsx`

- inverter a prioridade do `MediaRecorder` para preferir `audio/ogg;codecs=opus`
- usar `audio/webm` apenas como fallback
- manter extensão e `mime_type` coerentes com o blob gerado

Objetivo:
- produzir um arquivo mais próximo do formato que o WhatsApp já usa e o webhook já processa corretamente

### 2) Tratar áudio separado das demais mídias no edge function
Arquivo: `supabase/functions/inbox-send-message/index.ts`

Criar uma ramificação específica para `messageType === "audio"`:

- tentar primeiro endpoint específico de áudio, se suportado pela API
- se continuar usando `/send/media`, enviar corpo próprio para áudio
- não mandar `caption`/`text` para áudio gravado
- não usar conteúdo `"🎤 Áudio"` como texto efetivo no envio externo
- enviar apenas os campos de arquivo necessários (`number`, `file` ou `url`, tipo correto, `mimetype`, etc.)

Objetivo:
- evitar que a API interprete o áudio como mensagem textual

### 3) Separar “texto de preview” do conteúdo real enviado
Arquivos:
- `src/components/inbox/ConversationThread.tsx`
- `supabase/functions/inbox-send-message/index.ts`

Hoje o conteúdo `"🎤 Áudio"` está sendo reutilizado no fluxo inteiro. Vou separar isso em:
- conteúdo real do envio externo: vazio para áudio
- preview interno da inbox/timeline: `"Áudio"` ou nome do arquivo

Objetivo:
- manter boa UX interna sem contaminar o payload enviado ao WhatsApp

### 4) Preservar exibição e persistência no inbox
Arquivos:
- `supabase/functions/inbox-send-message/index.ts`
- sem necessidade de alterar `MessageMedia.tsx`

Após o envio:
- continuar salvando `message_type: "audio"`
- continuar salvando `metadata.file_url`, `mime_type`, `storage_path`, `file_name`
- ajustar apenas o `content` persistido para preview amigável, sem depender do texto enviado ao provedor

## Resultado esperado

Depois da correção:
- o corretor grava no inbox
- o sistema envia um arquivo de áudio compatível
- o destinatário recebe um áudio reproduzível no WhatsApp
- no inbox interno continua aparecendo como mensagem de áudio, com player e histórico corretos

## Arquivos a alterar

| Arquivo | Alteração |
|---|---|
| `src/components/inbox/ConversationThread.tsx` | Priorizar gravação em OGG/Opus e separar preview de conteúdo enviado |
| `supabase/functions/inbox-send-message/index.ts` | Criar payload específico para áudio e evitar envio de `text/caption` em mensagens de áudio |

## Observação importante

Se a UAZAPI dessa conta exigir um tipo específico além de `audio` (por exemplo `ptt`/`myaudio`), a estrutura já ficará pronta para ajustar isso no mesmo ponto central do edge function, sem mexer de novo no frontend.
