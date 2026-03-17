
Objetivo

Adicionar um segundo fluxo de envio no Inbox: além do botão amarelo de envio imediato, incluir um botão ao lado para programar uma mensagem de texto com data e hora. Essa mensagem programada deve aparecer em 3 lugares:
1. na própria conversa,
2. na timeline do lead,
3. na fila geral de mensagens do WhatsApp.

O que já existe no projeto

- O composer do Inbox já concentra o texto digitado e o botão de enviar em `src/components/inbox/ConversationThread.tsx`.
- O envio imediato já passa por `useConversationMessages` e pela function `inbox-send-message`.
- Já existe uma fila operacional em `whatsapp_message_queue`, consumida pela automação em `whatsapp-message-sender`.
- A timeline do lead já usa `lead_interactions` com realtime.
- O projeto já tem padrão visual pronto para calendário/popover, inclusive com `Calendar` + `Popover` e `pointer-events-auto`.

Decisão validada

- Primeira versão será apenas para mensagem de texto, sem anexos programados.

Abordagem de implementação

1. Criar o agendamento no mesmo composer do Inbox
- Em `ConversationThread`, adicionar um botão ao lado do enviar imediato.
- Ao clicar, abrir um pequeno fluxo de agendamento com:
  - seleção de data,
  - seleção de horário,
  - confirmação.
- O conteúdo virá exatamente do campo “Digite sua mensagem”.
- O botão só habilita quando houver texto válido.

2. Persistir o agendamento na fila existente
- Em vez de criar tabela nova, reutilizar `whatsapp_message_queue`.
- Ao confirmar:
  - inserir um item com `broker_id`, `lead_id`, `phone`, `message`, `scheduled_at`, `status`.
- Isso mantém compatibilidade com a fila já processada pelo backend.
- Não precisa alterar schema para a primeira versão.

3. Fazer a conversa mostrar a mensagem programada inline
- Como `conversation_messages` não tem campo nativo de “scheduled_at”, usar mensagem de sistema/outbound no próprio histórico com metadata identificando:
  - que é programada,
  - data/hora prevista,
  - queue id.
- Atualizar `useConversationMessages` para:
  - carregar também essas mensagens programadas,
  - exibir badge/estado visual diferente de “enviado”,
  - quando a fila for realmente enviada pelo motor, evitar duplicação visual ou reconciliar pelo metadata/queue id.
- No bubble da conversa, mostrar algo como “Programada para dd/MM às HH:mm”.

4. Exibir a fila dentro da conversa
- Abaixo do `CadenceCountdown` ou antes da lista de mensagens, adicionar um bloco “Mensagens programadas desta conversa”.
- Buscar em `whatsapp_message_queue` filtrando pelo `lead_id` ou telefone/broker da conversa.
- Mostrar:
  - texto,
  - horário programado,
  - status,
  - ação de cancelar.
- Esse bloco deve atualizar em tempo real/polling, reaproveitando padrão do hook de fila já existente.

5. Refletir na timeline do lead
- Ao programar, inserir também uma interação em `lead_interactions` com canal `whatsapp`.
- Como o enum de interação é limitado, seguir o padrão existente usando um tipo já permitido e descrever no `notes` que a mensagem foi programada, com data/hora e preview do texto.
- Assim a timeline passa a mostrar o evento imediatamente, sem mudança estrutural no banco.
- Se a mensagem for cancelada, registrar outra interação correspondente.

6. Reaproveitar e estender padrões existentes
- Inspirar visualmente no `QueueTab` para status e comportamento de cancelamento.
- Inspirar o date picker no padrão de `AgendamentoModal`.
- Para BrokerInbox e AdminInbox, centralizar a nova lógica no hook/componente compartilhado, para evitar divergência entre os dois painéis.

Arquivos que eu alteraria

- `src/components/inbox/ConversationThread.tsx`
- `src/hooks/use-conversations.ts`
- possivelmente um novo hook reutilizável para fila por conversa/lead
- `src/pages/AdminInbox.tsx`
- `src/pages/BrokerInbox.tsx`

Detalhes técnicos importantes

- Não vejo necessidade de migration para essa primeira versão.
- Vou reutilizar `whatsapp_message_queue`, que já tem `scheduled_at`, `status`, `lead_id`, `broker_id` e `message`.
- Para a timeline, como o enum de `interaction_type` é fechado, a forma mais segura é registrar como um tipo já aceito com `notes` sem mexer na estrutura agora.
- Precisa haver reconciliação visual entre:
  - mensagem programada criada no Inbox,
  - mensagem efetivamente enviada depois pelo processador da fila,
  para o usuário não ver duas mensagens “iguais” sem contexto.

Resultado esperado

- O corretor digita a mensagem no campo normal.
- Pode escolher:
  - enviar agora,
  - ou programar ao lado com data e hora.
- A mensagem programada aparece:
  - no histórico da conversa,
  - na timeline do lead,
  - na fila geral de mensagens.
- Quando chegar o horário, o motor existente envia normalmente usando a mesma infraestrutura já ativa.
