## Problema

Ao inativar o lead pelo botão "Inativar Lead" dentro da conversa do WhatsApp (Plantão), o lead vai para `status = 'inactive'`, mas a conversa permanece visível na lista do inbox. Isso acontece porque `useInactivateLeadFromConversation` só atualiza a tabela `leads` — nada acontece em `conversations`. A query do `useConversations` filtra apenas por `is_archived`, não pelo status do lead, então a conversa continua aparecendo normalmente.

## Solução

Estender o fluxo de inativação para também arquivar e fechar a(s) conversa(s) vinculada(s) ao lead, espelhando o que `archiveConversation` já faz no inbox.

### Mudanças

1. **`src/hooks/use-inactivate-lead-from-conversation.ts`**
   - Após o `update` em `leads`, executar:
     ```ts
     await supabase
       .from("conversations")
       .update({ is_archived: true, status: "closed", updated_at: now })
       .eq("lead_id", leadId);
     ```
   - Cancelar mensagens agendadas em aberto para o lead (mesmo padrão de `archiveConversation` em `use-conversations.ts`: `whatsapp_message_queue` com `status in ('queued','scheduled')` → `cancelled`), para não disparar follow-ups depois de inativar.

2. **`src/pages/BrokerPlantao.tsx`** (handler `onInactivateLead`)
   - Manter `fetchConversations()` + `handleBack()` — a conversa já sai da lista por estar arquivada.
   - Sem mudanças visuais.

### Observações

- O Kanban continua refletindo o lead como inativo (já funciona).
- Conversa arquivada continua acessível na aba "Arquivados" se o usuário quiser revisitar.
- Não é necessário filtrar por `lead.status` na query do inbox — o arquivamento já resolve para todos os contextos (Plantão, Inbox pessoal, Admin).
