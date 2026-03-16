

## Plano: Melhorias no Inbox — Nomes dos Leads e Sincronização de Leitura

### Problema 1: Nomes dos leads não aparecem

A query atual já faz JOIN com `leads` e busca o `name`. Se o nome não aparece, significa que a conversa **não tem `lead_id` vinculado** — quando isso acontece, o fallback é exibir o telefone. A query está correta:

```
lead:leads!conversations_lead_id_fkey(id, name, status, ...)
```

E o display em `ConversationList.tsx` linha 296 já faz: `const leadName = (conv.lead as any)?.name || conv.phone;`

**Solução**: Para conversas sem lead vinculado, buscar o nome do contato pelo `phone` na tabela `leads` (match por WhatsApp). Alterar o `fetchConversations` para, após o query principal, fazer um segundo pass nas conversas sem `lead_id` e tentar encontrar o nome via `leads.whatsapp`.

### Problema 2: Marcar como lida quando lida no celular

O webhook já recebe eventos `messages.update` (status do message), mas o `handleMessageStatusUpdate` atual **não atualiza** o `conversation_messages.status` nem zera o `unread_count` da conversa quando o status é `read`.

UAZAPI envia status updates com valores como `"read"`, `"delivered"`, `"played"`. Quando uma mensagem inbound é marcada como `read` no celular do corretor, a UAZAPI envia um webhook com esse status.

**Solução**: No `handleMessageStatusUpdate`, quando o status for `"read"`:
1. Atualizar o `conversation_messages.status` para `"read"` pelo `uazapi_message_id`
2. Buscar a conversa associada e zerar o `unread_count` + mudar status para `"attending"`

### Arquivos a editar

| Ação | Arquivo |
|------|---------|
| Editar | `src/hooks/use-conversations.ts` — enriquecer conversas sem lead com nome do lead via phone match |
| Editar | `supabase/functions/whatsapp-webhook/index.ts` — no `handleMessageStatusUpdate`, sincronizar read status com `conversations.unread_count` |

### Detalhes técnicos

**use-conversations.ts**: Após o fetch principal, para conversas onde `lead` é null mas `phone_normalized` existe, fazer uma query batch em `leads` filtrando por whatsapp similar. Mapear os nomes encontrados de volta nas conversas.

**whatsapp-webhook**: Em `handleMessageStatusUpdate`, quando `status === "read"`:
```typescript
// Update conversation_messages status
await supabase
  .from("conversation_messages")
  .update({ status: "read" })
  .eq("uazapi_message_id", messageId);

// Find conversation and reset unread
const { data: msg } = await supabase
  .from("conversation_messages")
  .select("conversation_id")
  .eq("uazapi_message_id", messageId)
  .maybeSingle();

if (msg) {
  await supabase
    .from("conversations")
    .update({ unread_count: 0, status: "attending" })
    .eq("id", msg.conversation_id);
}
```

