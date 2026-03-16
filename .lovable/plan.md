
Objetivo
- Fazer a mensagem mais recente realmente aparecer dentro da conversa aberta.
- Reforçar a sincronização do chat e da lista do Inbox para evitar novos “sumiços”.

Diagnóstico confirmado
- A lista do Inbox está correta: a conversa do Maicon mostra `last_message_preview: "Teste 2"` e `last_message_at` recente.
- O problema está no carregamento do histórico da conversa aberta:
  - o hook `useConversationMessages` busca `conversation_messages` com `order=created_at.asc&limit=200`
  - isso traz as 200 mensagens mais antigas, não as mais recentes
  - em conversas longas, a mensagem nova fica fora do recorte e não aparece no chat
- Além disso, o chat depende fortemente de realtime; se um evento falhar, a lista e a thread podem ficar dessincronizadas.

O que vou ajustar
1. Corrigir a query da conversa aberta
- Alterar o carregamento inicial do histórico para buscar as mensagens mais recentes da conversa, não as mais antigas.
- Estratégia:
  - buscar em ordem decrescente com limite
  - reordenar no frontend para exibição cronológica
- Assim o chat sempre abrirá já com as últimas mensagens, incluindo “Teste 2”.

2. Garantir atualização em tempo real com fallback
- Manter a subscription realtime de `conversation_messages`.
- Adicionar fallback por polling incremental no hook da conversa aberta:
  - buscar mensagens novas após o último `created_at` carregado
  - deduplicar por `id`
  - usar backoff para não gerar carga desnecessária
- Isso cobre falhas silenciosas de realtime.

3. Reforçar a lista do Inbox
- Aplicar a mesma ideia de resiliência na lista:
  - manter realtime de `conversations`
  - adicionar polling leve/incremental para garantir que preview, horário e ordem não fiquem desatualizados
- Preservar ordenação por `last_message_at desc`.

4. Validar seleção da conversa
- Revisar se `selectedConversation` é atualizado quando a lista recebe novos dados, para evitar header/previews defasados após novas mensagens.

Arquivos a ajustar
- `src/hooks/use-conversations.ts`
- possivelmente `src/pages/BrokerInbox.tsx` se eu precisar sincronizar melhor `selectedConversation` com a lista atualizada

Resultado esperado
- Ao abrir a conversa do Maicon, a mensagem “Teste 2” aparecerá no histórico.
- Novas mensagens passarão a surgir no chat aberto mesmo se o realtime falhar momentaneamente.
- A lista e a thread ficarão consistentes entre si.

Validação após implementação
- Abrir `/corretor/inbox`
- Selecionar “Maicon Teste”
- Confirmar que a mensagem mais recente exibida na lista também aparece no fim da conversa
- Confirmar que uma nova mensagem recebida entra:
  - na lista do Inbox
  - no preview
  - e dentro da thread aberta
