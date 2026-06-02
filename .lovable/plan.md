## Objetivo

Resolver 3 problemas relatados pelos corretores no Inbox (mobile e desktop):

1. **Áudio não toca no celular** (iOS Safari não suporta OGG/Opus, codec padrão do WhatsApp).
2. **Links não viram clicáveis** (texto cru, sem `<a>`).
3. **Respostas citadas** (reply) não aparecem: nem visualização da mensagem original respondida pelo cliente, nem possibilidade do corretor responder uma mensagem específica.

---

## 1. Áudio no mobile (iOS)

**Causa:** WhatsApp envia áudio em `.ogg` (Opus). iOS Safari não decodifica Opus, então o `<audio>` aparece mas não roda. O `media-1780...ogg` no print confirma.

**Solução:**
- Em `MessageMedia.tsx`, no bloco de áudio:
  - Detectar iOS/Safari via `navigator.userAgent` + checar `audio.canPlayType('audio/ogg; codecs=opus')`.
  - Quando não houver suporte, renderizar um card "Áudio do WhatsApp" com:
    - Botão "Abrir" (`<a href={url} target="_blank">`) que delega ao app/sistema.
    - Botão "Baixar" (`<a download>`).
    - Texto explicativo curto: "Seu navegador não reproduz este formato. Toque em Abrir/Baixar para ouvir."
  - Quando houver suporte, manter o `<audio controls>` atual.
- Adicionar `onError` no `<audio>` para, em caso de falha em runtime, fazer fallback para o mesmo card de download (cobre Android antigo / desktop sem codec).
- Manter o `type={mimeType}` para que o browser declare o codec corretamente.

Sem mudança no backend; nenhum transcode no servidor.

---

## 2. Links clicáveis (entrada e saída)

**Causa:** `ConversationThread.tsx` renderiza texto com `<p>{msg.content}</p>` cru.

**Solução:**
- Criar `src/lib/linkify.tsx` com `renderTextWithLinks(content: string): ReactNode[]` que:
  - Usa regex robusta (`/(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi`).
  - Divide a string e gera `<a href target="_blank" rel="noopener noreferrer" className="underline text-emerald-300 hover:text-emerald-200 break-all">` para cada match (normalizando `www.` → `https://www.`).
  - Preserva `whitespace-pre-wrap` ao redor (retorna nodes para serem renderizados dentro do `<p>`).
- Em `ConversationThread.tsx`, substituir o `<p>{msg.content}</p>` do bloco `message_type === "text"` por `<p className="whitespace-pre-wrap break-words">{renderTextWithLinks(msg.content)}</p>`.
- Aplicar o mesmo helper na legenda de mídia (`caption`) em `MessageMedia.tsx`.

Funciona para inbound e outbound, mobile e desktop.

---

## 3. Respostas citadas (reply / quoted message)

Maior das três mudanças. Cobre exibição da resposta recebida + UI para o corretor responder uma mensagem específica.

### 3a. Captura no webhook (inbound + outbound espelhado)

Em `supabase/functions/whatsapp-webhook/index.ts`, na extração da mensagem:
- Ler `contextInfo.quotedMessage` + `contextInfo.stanzaId` + `contextInfo.participant` (mesmos caminhos já usados para `externalAdReply`).
- Quando presente, montar:

```ts
quoted: {
  stanza_id: string,        // id WA da msg respondida
  sender_name: string|null, // participant ou senderName
  content: string,          // texto extraído de quotedMessage.conversation / extendedTextMessage.text / imageMessage.caption / etc.
  message_type: "text"|"image"|"audio"|"video"|"document"|"sticker",
}
```

- Antes de inserir na `conversation_messages`, tentar resolver o `stanza_id` para o id local:
  - `select id from conversation_messages where uazapi_message_id = stanza_id and conversation_id = X`.
  - Se achar, gravar também `quoted.local_message_id` para o front conseguir rolar até a msg.
- Mesclar no `metadata` existente: `{ ...meta, quoted }`. Não precisa de migration (coluna `metadata jsonb`).

### 3b. Envio com reply (UAZAPI)

`supabase/functions/inbox-send-message/index.ts`:
- Aceitar novo campo opcional no body: `replyToMessageId` (uazapi_message_id da mensagem que está sendo respondida).
- Em `sendViaUAZAPI`, quando presente, incluir no body do POST para UAZAPI o parâmetro `replyid` (UAZAPI v2 suporta esse campo em `/send/text` e `/send/media`).
- Buscar a mensagem local pelo `id` enviado pelo front (mais seguro) → pegar `uazapi_message_id`, sender, conteúdo curto, type → gravar bloco `quoted` no `metadata` da mensagem que estamos inserindo (espelho local imediato, antes do webhook).

### 3c. Hook `use-conversations.ts`

- Estender `OutboundMessagePayload`:
  ```ts
  replyTo?: {
    messageId: string;       // id local da msg respondida
    uazapiMessageId?: string;
    senderName?: string|null;
    content: string;
    messageType: string;
  }
  ```
- Encaminhar para `inbox-send-message` como `replyToMessageId` (uazapi) e gravar `quoted` no metadata otimista.

### 3d. UI no `ConversationThread.tsx`

- **Estado:** `replyingTo: ConversationMessage | null`.
- **Acionar reply:** ícone "Responder" (lucide `CornerUpLeft`) que aparece ao hover sobre a bolha no desktop e via long-press no mobile (usar `onContextMenu` + `onTouchStart` 500ms). Alternativa simples: pequeno menu kebab por mensagem. Vamos com o ícone hover + long-press no mobile.
- **Pré-visualização acima do textarea:** card com borda colorida lateral mostrando `senderName` + snippet (max 80 chars), com `X` para cancelar. Mesmo padrão do print do WhatsApp.
- **Renderização da quoted dentro da bolha:** acima do conteúdo, ler `msg.metadata.quoted`:
  - Card menor com borda esquerda colorida, nome do remetente, snippet do conteúdo (ou label "🎤 Áudio" / "📷 Foto" / "📎 Documento" se não-texto).
  - Click no card → se `quoted.local_message_id` existir, rolar até o elemento (`scrollIntoView({ behavior:"smooth", block:"center" })`) e dar um destaque temporário (classe `ring-2 ring-primary` por 1.5s). Se não, snackbar "Mensagem original não encontrada nesta conversa".
- **No `handleSend`:** se `replyingTo`, incluir no payload e limpar após envio bem-sucedido.

### 3e. KanbanCardComposer e outros senders

Fora de escopo (manter envio simples sem reply). Apenas o Inbox/ConversationThread terá a feature.

---

## Critérios de aceite

1. iPhone: áudios `.ogg` do WhatsApp mostram botões Abrir/Baixar funcionais; não aparece player quebrado.
2. Desktop + Android Chrome: áudios continuam tocando inline como hoje.
3. Mensagens com `https://...` ou `www....` aparecem como link clicável que abre em nova aba, tanto inbound quanto outbound, desktop e mobile.
4. Cliente respondendo uma mensagem específica do corretor no WhatsApp → no Inbox aparece bloco quoted dentro da bolha do cliente, com snippet da mensagem original; clique rola até ela.
5. Corretor clica no ícone "Responder" (ou long-press no mobile) em uma mensagem do cliente → aparece preview acima do textarea, envia, e do lado do cliente (WhatsApp real) a mensagem chega como reply (`replyid` aceito pela UAZAPI).
6. Sem regressão em envio de mídia, agendamento ou follow-ups.

---

## Arquivos afetados

- `src/lib/linkify.tsx` (novo)
- `src/components/inbox/MessageMedia.tsx` (áudio iOS + linkify caption)
- `src/components/inbox/ConversationThread.tsx` (linkify, UI quoted display + reply action + preview)
- `src/hooks/use-conversations.ts` (payload `replyTo`)
- `supabase/functions/whatsapp-webhook/index.ts` (extrair `contextInfo.quotedMessage`, gravar `metadata.quoted`)
- `supabase/functions/inbox-send-message/index.ts` (aceitar `replyToMessageId`, passar `replyid` para UAZAPI, espelhar `quoted` no metadata local)

Sem migration de banco (usa coluna `metadata jsonb` existente).
