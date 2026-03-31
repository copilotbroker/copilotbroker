

## Envio Otimista de Mensagens (Texto, Mídia e Áudio)

### Diagnóstico

O hook `sendMessage` já cria uma mensagem otimista antes de chamar a edge function. Porém, no `ConversationThread.tsx`, o fluxo de **mídia/áudio** faz o upload ao Storage **antes** de chamar `onSendMessage`, atrasando a aparição da mensagem. Para **texto**, o `await` no `handleSend` já resolve rápido, mas o `isSending=true` bloqueia interação desnecessariamente.

```text
Atual (áudio/mídia):
  Gravar → Upload Storage (2-5s) → onSendMessage → otimista aparece

Corrigido:
  Gravar → otimista aparece imediato → Upload Storage + envio em background
```

### Solução

#### Arquivo: `src/components/inbox/ConversationThread.tsx`

**1. `handleSend` — texto puro (sem arquivo)**
- Remover o `await` em `onSendMessage(text)` — o hook já é fire-and-forget
- Não setar `isSending` para texto puro (a mensagem otimista já aparece e basta)

**2. `handleSend` — com arquivo (imagem, vídeo, documento)**
- Criar mensagem otimista local **antes** do upload, com um placeholder de "uploading"
- Mover o upload + send para um `void (async () => { ... })()` em background
- Ao completar, o realtime/polling substituirá a mensagem temp pela real

**3. `stopAndSendRecording` — áudio**
- Mesma abordagem: criar otimista imediatamente com `message_type: "audio"` e `status: "pending"`
- Upload + envio em background

#### Arquivo: `src/hooks/use-conversations.ts`

**4. Aceitar mensagem otimista pré-criada**
- Adicionar suporte a um campo opcional `_optimisticId` no payload para que o thread possa injetar a mensagem otimista antes mesmo de chamar `sendMessage`
- OU: extrair a lógica de criação de otimista para uma função utilitária que o thread possa chamar diretamente

### Abordagem escolhida (mais simples)

Mover a lógica de upload para **dentro** do hook `sendMessage`, passando o `File` como parte do payload. Assim o hook:
1. Cria a mensagem otimista imediatamente (com thumbnail/placeholder para mídia)
2. Faz upload + chamada à edge function em background

Isso centraliza tudo no hook e simplifica o `ConversationThread`.

#### Mudanças em `use-conversations.ts` → `sendMessage`
- Aceitar `file?: File` no `OutboundMessagePayload`
- Se `file` presente: criar otimista imediatamente → `void` background: upload ao Storage → invoke edge function
- Preview da otimista: para imagem, gerar `URL.createObjectURL(file)` como thumbnail local; para áudio, mostrar "🎤 Áudio"; para documento, "📎 nome.pdf"

#### Mudanças em `ConversationThread.tsx`
- `handleSend` com arquivo: passar `{ content, messageType, file }` diretamente para `onSendMessage` — sem fazer upload no componente
- `stopAndSendRecording`: passar `{ content: "", messageType: "audio", file: audioFile }` — sem upload no componente
- Remover toda lógica de `supabase.storage.upload` do componente
- `isSending` passa a ser apenas para bloquear duplo-clique por ~100ms, não para esperar resposta

### Resultado esperado
- Texto: aparece instantaneamente (já funciona, mas removeremos o bloqueio desnecessário do `isSending`)
- Áudio: aparece como "🎤 Áudio" com status `pending` no instante que o usuário para de gravar
- Imagem: aparece com thumbnail local instantaneamente
- Documento/Vídeo: aparece como "📎 arquivo.pdf" instantaneamente

### Arquivos alterados
- `src/hooks/use-conversations.ts` — aceitar `file` no payload, upload em background
- `src/components/inbox/ConversationThread.tsx` — simplificar handlers, remover upload

### O que NÃO muda
- Edge function `inbox-send-message`
- Lógica de merge/realtime
- Scheduled messages
- Toda a UI de renderização de mensagens

