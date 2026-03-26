

# Roleta de Atendimento WhatsApp — Plano de Implementação

## Contexto atual

Hoje o sistema tem:
- **Roletas vinculadas a empreendimentos (projects)**: quando um lead chega via landing page de um empreendimento, o trigger `trigger_roleta_distribuir` distribui automaticamente.
- **Webhook WhatsApp** (`whatsapp-webhook`): recebe mensagens e as arquiva em `conversations` vinculadas ao corretor dono da instância (`broker_whatsapp_instances`). Mensagens da instância global **não são arquivadas** (o `archiveMessageToConversation` faz lookup em `broker_whatsapp_instances`, e a instância global está em `global_whatsapp_config` — não retorna broker, logo o `if (!inst) return` silencia a mensagem).
- **Inbox do corretor**: filtra conversas por `broker_id` do corretor logado.

## Problema central

Mensagens recebidas na instância global não têm um `broker_id` definido. O sistema precisa:
1. Identificar se o remetente já tem corretor atribuído → rotear para ele
2. Se não tem → entrar na roleta WhatsApp → distribuir
3. Ao assumir → criar/unificar lead no CRM

---

## Mudanças necessárias

### 1. Schema: coluna `tipo_origem` na tabela `roletas`

Adicionar campo para distinguir roletas de landing page vs WhatsApp global.

```sql
ALTER TABLE public.roletas ADD COLUMN tipo_origem text NOT NULL DEFAULT 'landing_page';
-- Valores: 'landing_page' | 'whatsapp_global'
```

Também adicionar campo `source_instance` na tabela `conversations` para identificar a origem:

```sql
ALTER TABLE public.conversations ADD COLUMN source_instance text DEFAULT NULL;
-- Valores: NULL (instância do corretor) | 'global' (instância global)
```

### 2. UI: Redesign do formulário "Nova Roleta"

**Arquivo**: `src/components/admin/RoletaManagement.tsx`

- Adicionar campo `tipo_origem` no form de criação com toggle/radio:
  - **Landing Pages** (default): mostra seleção de empreendimentos (comportamento atual)
  - **WhatsApp Global**: oculta seleção de empreendimentos (a roleta é vinculada à instância global)
- Exibir badge visual no card da roleta indicando o tipo

### 3. Webhook: roteamento de mensagens da instância global

**Arquivo**: `supabase/functions/whatsapp-webhook/index.ts`

Modificar `archiveMessageToConversation` e `handleIncomingMessage`:

1. Se `instanceName` corresponde a `global_whatsapp_config` (não a `broker_whatsapp_instances`):
   - Buscar lead existente pelo telefone em `leads`
   - **Caso A**: lead tem `broker_id` → criar/atualizar conversa vinculada a esse broker com `source_instance = 'global'`, arquivar mensagem normalmente
   - **Caso B**: lead não existe ou não tem `broker_id` → buscar roleta ativa com `tipo_origem = 'whatsapp_global'` → distribuir via round-robin (mesma lógica de `roleta-distribuir`, inline ou via invoke) → criar lead com `lead_origin = 'whatsapp_plantao'` e `source = 'whatsapp_global'` → criar conversa vinculada ao broker atribuído com `source_instance = 'global'`

2. Para mensagens subsequentes, o lead já terá `broker_id`, então cairá no Caso A.

### 4. Criação/unificação de lead ao assumir

No fluxo do webhook (Caso B):
- Criar lead: `name = pushName || phone`, `whatsapp = phone`, `lead_origin = 'whatsapp_plantao'`, `source = 'whatsapp_global'`
- Chamar `unify_lead` para verificar duplicatas
- Vincular conversa ao lead criado/unificado
- O lead no Kanban fica vinculado ao broker atribuído; em transferências futuras, o card segue o novo broker (já funciona assim com `transfer_lead`)

### 5. Inbox: ícone de origem WhatsApp

**Arquivos**: `src/components/inbox/ConversationList.tsx`, `src/components/inbox/ConversationThread.tsx`

- No avatar/círculo da conversa:
  - `source_instance = 'global'` → ícone WhatsApp escuro (dark)
  - `source_instance = NULL` (instância do corretor) → ícone WhatsApp claro (light)
- Buscar `source_instance` do `conversations` no hook `useConversations`

### 6. Persistência do vínculo

Já funciona naturalmente: uma vez que o lead tem `broker_id` e a conversa tem `broker_id`, mensagens futuras do mesmo telefone são roteadas para o mesmo broker (Caso A). O histórico permanece na mesma conversa canônica.

---

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| **Migration SQL** | `roletas.tipo_origem`, `conversations.source_instance` |
| `src/types/roleta.ts` | Adicionar `tipo_origem` ao tipo `Roleta` |
| `src/components/admin/RoletaManagement.tsx` | Toggle tipo_origem no form, badge no card |
| `supabase/functions/whatsapp-webhook/index.ts` | Roteamento global: lookup lead → caso A/B, criar lead, distribuir, unificar |
| `src/hooks/use-conversations.ts` | Incluir `source_instance` no select e no tipo `Conversation` |
| `src/components/inbox/ConversationList.tsx` | Ícone WhatsApp dark/light baseado em `source_instance` |
| `src/components/inbox/ConversationThread.tsx` | Ícone WhatsApp dark/light no header |

## Fluxo resumido

```text
Mensagem chega no webhook
  ↓
instanceName é da global_whatsapp_config?
  ├── NÃO → fluxo atual (instância do corretor)
  └── SIM → buscar lead pelo telefone
        ├── Lead TEM broker_id → roteiar para o broker (Caso A)
        └── Lead NÃO tem broker_id → roleta whatsapp_global
              ├── Distribuir (round-robin)
              ├── Criar/unificar lead (origin=whatsapp_plantao)
              ├── Criar conversa (source_instance=global)
              └── Notificar broker
```

