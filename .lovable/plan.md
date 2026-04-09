

## Dar acesso às conversas pessoais dos corretores (com card no Kanban) para Admin e Líder

### Problema atual
O Admin Inbox (`/admin/inbox`) e o Broker Inbox (`/corretor/inbox`) só mostram as conversas pessoais do **próprio** usuário logado. Admins e líderes não conseguem supervisionar as conversas pessoais dos corretores que têm cards no Kanban.

### Solução
Adicionar uma nova aba **"Equipe"** no Admin Inbox e no Broker Inbox (para líderes), que lista conversas pessoais de outros corretores que tenham `lead_id` preenchido (card no Kanban).

### Mudanças

**1. `src/hooks/use-conversations.ts`**
- Adicionar suporte a um novo `inboxTab` ou parâmetro para buscar conversas pessoais de **outros** corretores filtradas por `lead_id IS NOT NULL`
- Quando o modo "equipe" estiver ativo:
  - Admin: não filtrar por `broker_id` (RLS já garante visibilidade total)
  - Líder: não filtrar por `broker_id` (RLS já filtra pelo `lider_id`)
  - Filtrar `source_instance = 'personal'` e `lead_id IS NOT NULL`
  - Excluir conversas do próprio usuário (para não duplicar com a aba "Atendimento")

**2. `src/pages/AdminInbox.tsx`**
- Adicionar aba "Equipe" ao lado de "Novos", "Atendimento" e "Arquivados"
- Quando aba "Equipe" ativa, usar `useConversations` sem filtro de `brokerId`, com `sourceInstance: "personal"` e flag para filtrar apenas conversas com `lead_id`
- Adicionar filtro de corretor (Select) para refinar por corretor específico

**3. `src/pages/BrokerInbox.tsx`**
- Para líderes (`isLeader`): adicionar a mesma aba "Equipe" com a mesma lógica
- RLS existente já garante que líderes só veem conversas de corretores com `lider_id = get_my_broker_id()`

**4. `src/hooks/use-conversations.ts` — tipo `BrokerInboxTab`**
- Expandir: `"novos" | "atendimento" | "arquivados" | "equipe"`

**5. RLS — Sem alteração necessária**
As policies existentes já cobrem:
- `Admins podem ver todas as conversas` (SELECT)
- `Lideres podem ver conversas do time` (SELECT, via `brokers.lider_id`)
- `conversation_messages` também tem policies para admin e líderes

### O que NÃO muda
- A aba "Novos" e "Atendimento" continuam mostrando apenas conversas do próprio usuário
- A aba "Arquivados" continua igual
- Nenhuma migração SQL necessária

