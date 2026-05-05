## Problema

Ao enviar uma mensagem em uma conversa do Plantão (instância global), o balão aparece verde (cor de instância pessoal) por alguns segundos e só fica roxo depois que o realtime/refetch traz a mensagem persistida com `metadata.source_instance = "global"`.

## Causa

Em `src/hooks/use-conversations.ts` (função `sendMessage`), a mensagem otimista é criada sem `source_instance` no metadata. Como o renderizador em `ConversationThread.tsx` (linha ~562) faz `msg.metadata?.source_instance === "global"` para escolher roxo vs verde, o default cai em verde até a mensagem real chegar.

## Correção

Em `sendMessage` (use-conversations.ts ~linha 682), incluir `source_instance` no `optimisticMetadata` derivado de `conversation.source_instance` (default `"personal"`):

```ts
const conversationSourceInstance = (conversation as any)?.source_instance || "personal";
const optimisticMetadata = {
  ...(normalizedPayload.metadata || {}),
  client_id: clientId,
  source_instance: conversationSourceInstance,
  ...(fileToUpload ? {...} : {}),
  ...(localPreviewUrl ? {...} : {}),
};
```

Isso faz o balão já nascer roxo quando a conversa for global, e verde para pessoal — sem flicker.
