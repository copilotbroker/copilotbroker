## Problema

Quando o corretor clica em **"Puxar para meu WhatsApp"** numa conversa do Plantão (instância global), o app faz:

```ts
update conversations set source_instance='personal' where id=...
```

Isso falha por causa do índice único:

```
idx_conversations_broker_phone UNIQUE (broker_id, phone_normalized, COALESCE(source_instance,'personal'))
```

Se o corretor **já tem uma conversa pessoal com o mesmo telefone**, virar a global em personal viola o índice → "Erro ao migrar conversa".

Além disso, hoje a conversa global fica "presa" naquele corretor (continua existindo como personal), o que impede que esse mesmo lead, ao chamar de novo, caia na roleta.

## Comportamento esperado

- **Global**: 1 conversa por telefone (índice `idx_conversations_global_phone_unique`). Só 1 corretor pode estar atendendo lá.
- **Personal**: várias conversas pessoais para o mesmo telefone podem coexistir (1 por corretor).
- Ao "Puxar":
  - Se o corretor **não** tem conversa pessoal com aquele telefone → simplesmente vira `personal`.
  - Se **já tem** uma conversa pessoal com aquele telefone → **unificar**: mover mensagens da global para a pessoal existente, atualizar lead, **deletar a conversa global** para liberar o telefone, fazendo com que a próxima mensagem entre na roleta novamente.

## Solução

### 1. Migration: criar RPC `pull_global_conversation_to_personal`

`SECURITY DEFINER`, recebe `_conversation_id uuid`. Lógica:

1. Resolver `_caller_broker_id` via `get_my_broker_id()` (se admin sem broker, abortar com erro claro).
2. Carregar a conversa origem; validar `source_instance='global'`.
3. Buscar conversa pessoal existente: `broker_id=_caller AND phone_normalized=<phone> AND source_instance='personal'`.
4. **Caso A — existe pessoal**:
   - `UPDATE conversation_messages SET conversation_id=<personal_id> WHERE conversation_id=<global_id>`.
   - `UPDATE whatsapp_message_queue SET conversation_id=<personal_id> WHERE conversation_id=<global_id>` (se a coluna existir; checar e ignorar se não).
   - Atualizar a conversa pessoal: `lead_id` (se a global tinha e a pessoal não), `attendance_started=true`, `display_name`, `last_message_*` recomputados a partir da última mensagem, `unread_count` recomputado.
   - Atualizar lead vinculado: `broker_id=_caller`, `corretor_atribuido_id=_caller`, `status_distribuicao='atendimento_iniciado'`, `atendimento_iniciado_em=COALESCE(...,now())`.
   - `DELETE FROM conversations WHERE id=<global_id>` → libera o telefone do índice global; próxima inbound passa pelo webhook → roleta.
   - Registrar `lead_interactions` tipo `note` ("Conversa global unificada na pessoal por <broker>").
5. **Caso B — não existe pessoal**:
   - `UPDATE conversations SET source_instance='personal', broker_id=_caller, attendance_started=true, updated_at=now() WHERE id=<global_id>`.
6. Retornar `jsonb { success, conversation_id, merged }`.

Tratar tudo dentro do bloco para evitar deadlock com triggers; usar `FOR UPDATE` na conversa global no início.

### 2. Frontend: usar a RPC

Em `src/pages/BrokerPlantao.tsx` (`handlePullToPersonal`) e `src/pages/AdminPlantao.tsx` (`handlePullToPersonal`):

```ts
const { data, error } = await supabase.rpc("pull_global_conversation_to_personal", {
  _conversation_id: selectedConversation.id,
});
if (error) throw error;
const targetId = (data as any)?.conversation_id ?? selectedConversation.id;
const merged = (data as any)?.merged;
toast.success(merged
  ? "Conversa unificada com seu WhatsApp pessoal!"
  : "Conversa migrada para seu WhatsApp pessoal!");
navigate(`${basePath}/inbox?conversationId=${targetId}`);
```

Sem outras mudanças visuais.

### 3. Memória

Adicionar 1 entrada em `mem://features/whatsapp-pull-to-personal` documentando a regra (global=1, personal=N; pull unifica e deleta global) e referência no `mem://index.md`.

## Arquivos afetados

- `supabase/migrations/<novo>.sql` (nova função RPC)
- `src/pages/BrokerPlantao.tsx` (handlePullToPersonal)
- `src/pages/AdminPlantao.tsx` (handlePullToPersonal)
- `mem://features/whatsapp-pull-to-personal` + `mem://index.md`

## Riscos

- Mover `conversation_messages` em massa: rápido (índice por `conversation_id`).
- Triggers de `update_conversation_on_message` rodam só em INSERT, então `UPDATE conversation_id` não dispara recomputo automático — por isso recomputamos `last_message_*` e `unread_count` manualmente na pessoal.
- Caso `whatsapp_message_queue` não tenha `conversation_id`, ignorar silenciosamente (verificar schema antes de gerar a migration).