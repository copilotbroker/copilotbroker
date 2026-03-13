

# Plano: Coluna "Copiloto Ativo" no Kanban

## Resumo

Repurpose o status existente `awaiting_docs` (já existe no enum do banco mas não é usado no Kanban) como "Copiloto Ativo". Quando uma cadência é ativada, o lead move para `awaiting_docs`; quando cancela/completa, volta para `info_sent`.

## Mudanças

### 1. Frontend — Configuração de status e Kanban

**`src/types/crm.ts`**
- Alterar label de `awaiting_docs` para "Copiloto Ativo" e ajustar cores (verde/lime para indicar automação ativa)

**`src/components/crm/KanbanBoard.tsx`**
- Adicionar `awaiting_docs` no array `STATUSES` entre `info_sent` e `scheduling`
- Adicionar `awaiting_docs` no `STATUS_ORDER`

**`src/components/crm/KanbanCard.tsx`**
- Adicionar `awaiting_docs` nos mappings `STATUS_PROGRESS`, `PROGRESS_COLORS`, `ACTION_CONFIG`
- ACTION_CONFIG para awaiting_docs: botão "Cancelar Cadência" ou "Agendar"

**`src/components/crm/KanbanColumn.tsx`**
- Já tem `awaiting_docs` no `STATUS_SQUARE_COLORS` — atualizar cor

**`src/components/admin/intelligence/`**
- Atualizar referências de funnel para incluir "Copiloto Ativo" como estágio separado

**`src/components/admin/LeadsAdvancedFilters.tsx`**
- Já inclui `awaiting_docs` — label será atualizado automaticamente via `STATUS_CONFIG`

### 2. Edge Functions — Mover lead automaticamente

**`supabase/functions/auto-cadencia-10d/index.ts`**
- Linha ~338: alterar `status: "info_sent"` para `status: "awaiting_docs"` quando a cadência é ativada
- Alterar `new_status` no log de interação para `"awaiting_docs"`

**`supabase/functions/whatsapp-webhook/index.ts`**
- Quando uma campanha é marcada como `completed` (linha ~222-227): buscar o lead_id da campanha e, se o lead estiver em `awaiting_docs`, mover de volta para `info_sent`

### 3. Client-side — Cancelamento de cadência

**`src/hooks/use-cadencia-ativa.ts`**
- Na função `cancelCadenciaForLead`: após cancelar a campanha, verificar se o lead está em `awaiting_docs` e mover para `info_sent`
- No hook `useCadenciaAtiva` cancelMutation: mesma lógica

**`src/hooks/use-kanban-leads.ts`**
- Na `inactivateLead` e `confirmarVenda`: já chamam `cancelCadenciaForLead` — o lead será movido automaticamente antes da ação final

### 4. Fluxo completo

```text
Lead novo → Pré Atendimento (new)
    ↓ cadência ativada automaticamente
Copiloto Ativo (awaiting_docs)
    ↓ cadência completa ou lead responde
Atendimento (info_sent)
    ↓ corretor agenda
Agendamento (scheduling) → ...
```

### Pontos de atenção
- O `whatsapp-message-sender` já move leads de `new` para `info_sent` no primeiro envio — precisa atualizar para mover para `awaiting_docs` também
- O `AnalyticsDashboard` tem cores por status — atualizar cor de `awaiting_docs`
- Leads que já estão em `info_sent` com cadência ativa não serão retroativamente movidos (apenas novos)

