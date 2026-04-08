

## Unificação de conversas e leads na transferência entre corretores

### Problema
Ao transferir o lead "Marcelo" para o Davi, o sistema não detecta que o Davi já possui uma conversa ativa com o mesmo número de telefone. Resultado: o Davi fica com duas conversas separadas para o mesmo contato (uma com lead vinculado, outra sem), sem unificação no Kanban nem no WhatsApp.

### Causa Raiz
A função `transfer_lead` (RPC) atualiza o `broker_id` do lead, e o `TransferLeadDialog` atualiza o `broker_id` da conversa de origem. Porém, nenhum ponto do fluxo verifica se o corretor destino já possui uma conversa com o mesmo telefone para consolidar os registros.

### Solução
Estender a lógica de transferência (no `transfer_lead` RPC) para detectar e unificar conversas duplicadas automaticamente.

### Alterações

**1. Atualizar a função `transfer_lead` no banco de dados**

Após atualizar o `broker_id` do lead, adicionar lógica para:
- Buscar conversa existente do novo corretor com o mesmo `phone_normalized`
- Se encontrar:
  - Migrar todas as mensagens (`conversation_messages`) da conversa de origem para a conversa existente do novo corretor
  - Vincular o `lead_id` na conversa existente (se ainda não vinculado)
  - Deletar a conversa de origem (agora vazia)
  - Atualizar `last_message_at`, `last_message_preview`, `unread_count` na conversa destino
- Se não encontrar: atualizar o `broker_id` da conversa de origem normalmente (comportamento atual)

**2. Atualizar `TransferLeadDialog` no frontend**

Remover a atualização manual de `conversations` após chamar `transfer_lead` RPC, pois a unificação já será tratada no banco. O frontend apenas:
- Chama `transfer_lead` RPC
- Se houver `conversationId` e o RPC já tratou a conversa, não faz update adicional
- Invalida as queries de conversas e kanban para refletir a unificação

**3. Limpar conversas órfãs do caso atual**

Aplicar uma correção de dados para o caso do Marcelo: unificar as 3 conversas globais (Davi, Edinardo, Maicon) com o mesmo telefone, mantendo apenas a do corretor que ficou com o lead.

### Detalhes Técnicos

Lógica adicionada ao `transfer_lead`:
```sql
-- Buscar conversa existente do novo corretor para o mesmo telefone
SELECT id INTO _existing_conv_id
FROM conversations
WHERE broker_id = _new_broker_id
  AND phone_normalized = _lead_phone_normalized
LIMIT 1;

IF _existing_conv_id IS NOT NULL AND _source_conv_id IS NOT NULL THEN
  -- Migrar mensagens
  UPDATE conversation_messages 
  SET conversation_id = _existing_conv_id
  WHERE conversation_id = _source_conv_id;
  
  -- Vincular lead
  UPDATE conversations 
  SET lead_id = _lead_id, display_name = _lead_name
  WHERE id = _existing_conv_id AND lead_id IS NULL;
  
  -- Remover conversa antiga
  DELETE FROM conversations WHERE id = _source_conv_id;
ELSE
  -- Mover conversa para novo corretor
  UPDATE conversations SET broker_id = _new_broker_id
  WHERE id = _source_conv_id;
END IF;
```

### Arquivos
- Migração SQL: atualizar função `transfer_lead` com lógica de unificação de conversas
- `src/components/crm/TransferLeadDialog.tsx`: simplificar lógica pós-RPC

