## Diagnóstico

Hoje as ações de Kanban e Inbox vivem em código separado e divergem:

| Ação | Kanban (`useKanbanLeads`) | Inbox (handlers locais nas páginas) |
|---|---|---|
| Iniciar atendimento | `iniciarAtendimento` muda `status → info_sent`, grava interação, invalida queries | `BrokerPlantao.handleStartAttendance` / `AdminPlantao.handleStartAttendance` / `BrokerInbox.handleStartAttendance` duplicam a lógica, cada um com pequenas diferenças |
| Avançar etapa | flow completo com modais (agendamento, comparecimento, proposta, venda) | `handleAdvanceStatus` faz só `update({status})` cru — não cria interação, não invalida nada |
| Inativar lead | `inactivateLead` (PerdaModal no Kanban) cancela cadência + atualiza lead | `useInactivateLeadFromConversation` existe e faz tudo (cancela cadência, arquiva conversa, cancela fila WhatsApp), mas só está plugado em **`BrokerPlantao`** — `BrokerInbox`, `AdminInbox` e `AdminPlantao` **não passam `onInactivateLead`** ao `ConversationThread`, então o botão Inativar nem aparece |

Resultado prático:
- Inativar pelo Plantão funciona; pelos outros inboxes nem dá pra clicar.
- "Iniciar atendimento" pelo inbox às vezes não reflete no Kanban porque a invalidação do React Query não roda nas páginas do inbox e o realtime depende da tabela `leads` estar no `supabase_realtime` publication (só `conversations` e `messages` foram adicionadas explicitamente).

## Solução

Centralizar todas as transições de status do lead em **um único hook compartilhado** que:
1. Atualiza o banco (lead + conversa quando aplicável).
2. Loga `lead_interactions`.
3. Invalida as React Query keys do Kanban (`kanban-column`, `kanban-count`, `kanban-active-flow-ids`).
4. É chamado tanto pelo Kanban quanto pelo Inbox.

Com a invalidação compartilhada + realtime ativo, os dois lados ficam sempre em sincronia sem polling pesado.

### Passos

**1. Habilitar realtime para `leads`** (migration)
- `ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;`
- Garante que mudanças feitas em qualquer aba/usuário propaguem para o `KanbanBoard` (que já tem o subscriber em `kanban-realtime`).

**2. Criar `src/hooks/use-lead-actions.ts`** — hook único e leve com:
- `iniciarAtendimento(leadId, { conversationId? })` — move `new → info_sent`, marca `attendance_started` na conversa se passada, loga interação, invalida `["kanban-column"]` para `new` e `info_sent`.
- `advanceStatus(leadId, fromStatus, toStatus, { note? })` — substitui o `handleAdvanceStatus` cru das páginas de inbox; cria `lead_interactions` com `interaction_type="status_change"`, invalida queries afetadas.
- `inactivateLead(leadId, reason)` — versão única que combina o que `useInactivateLeadFromConversation` e `useKanbanLeads.inactivateLead` fazem hoje: cancela cadência, atualiza lead (`status=inactive`, `inactivation_reason`, `inactivated_at`, `data_perda`, `etapa_perda`), arquiva conversas vinculadas (`is_archived=true, status="closed"`), cancela fila WhatsApp, loga interação, invalida queries.

**3. Refatorar pontos de uso**
- `useKanbanLeads.iniciarAtendimento` e `.inactivateLead` viram wrappers finos sobre `useLeadActions`.
- `BrokerPlantao`, `AdminPlantao`, `BrokerInbox`, `AdminInbox`:
  - `handleStartAttendance` passa a chamar `useLeadActions.iniciarAtendimento`.
  - `handleAdvanceStatus` passa a chamar `useLeadActions.advanceStatus`.
  - **Plugar `onInactivateLead={(reason) => leadActions.inactivateLead(lead.id, reason)}`** no `ConversationThread` em todas as 4 páginas (hoje só `BrokerPlantao` tem).
- Apagar `useInactivateLeadFromConversation` (substituído).

**4. UI/UX**
- Sem mudanças visuais — botão Inativar (já existe no `ConversationThread`) e botão "Avançar para X" (em `LeadContextPanel`) passam a funcionar consistentemente em todos os inboxes.
- Toast unificado ("Lead inativado", "Atendimento iniciado", "Status atualizado para X").

### Resultado esperado

- Inativar lead em qualquer inbox = lead some do Kanban (vai pra coluna Inativos), cadências canceladas, conversa arquivada.
- Iniciar atendimento no inbox = card no Kanban move automaticamente de "Novos" para "Info Enviada" em tempo real (via realtime + invalidação).
- Avançar etapa no `LeadContextPanel` do inbox = card move de coluna no Kanban e gera linha no histórico do lead.
- Solução leve: zero polling extra, apenas o canal realtime de `leads` + invalidações pontuais por status afetado.

### Arquivos tocados

- novo: `src/hooks/use-lead-actions.ts`
- editado: `src/hooks/use-kanban-leads.ts` (delegar para o novo hook)
- editado: `src/pages/BrokerInbox.tsx`, `src/pages/AdminInbox.tsx`, `src/pages/BrokerPlantao.tsx`, `src/pages/AdminPlantao.tsx` (handlers + prop `onInactivateLead`)
- removido: `src/hooks/use-inactivate-lead-from-conversation.ts`
- migration: adicionar `public.leads` ao `supabase_realtime` publication
