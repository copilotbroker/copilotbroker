## Visão geral

Hoje `conversations.source_instance` existe (`personal` default, `global` para plantão), mas:
- O modal "Adicionar Lead" não pergunta a instância → cria lead sem conversa, sumindo da lista.
- `unify_lead` funde por broker+phone sem considerar instância → pode juntar pessoal com global.
- Botão "Conversar" não resolve instância — abre lista genérica.
- Duplicidade não distingue base global (org-wide) de base pessoal (do corretor).
- Não há badge visual claro de Global/Pessoal em todos os pontos.

Vamos formalizar a regra: **toda conversa tem `source_instance` definido; toda criação manual cria conversa placeholder na instância escolhida; duplicidade respeita o escopo da instância**.

---

## 1. Backend (migração)

### 1.1 Conversas placeholder
Permitir conversas sem mensagens listadas como "Novo":
- Garantir que `conversations.last_message_at` e `last_message_preview` aceitem placeholder ("Lead adicionado manualmente").
- Já existe `auto_create_conversation_for_lead` para criar conversa pessoal — vamos estender.

### 1.2 Nova RPC `create_manual_lead_with_conversation(_name, _whatsapp, _project_id, _instance, _broker_id?, _origin?)`
SECURITY DEFINER, retorna `{ lead_id, conversation_id, action: 'created' | 'opened_existing' | 'blocked_global' | 'suggest_personal', existing_broker_name? }`.

Lógica:
- Normaliza telefone (`55` + dígitos, mesma normalização já usada).
- **Se `_instance = 'global'`:**
  - Busca qualquer conversa `source_instance='global'` na mesma organização (via `broker_whatsapp_instances`/global config) com mesmo `phone_normalized`.
  - Se existe e `broker_id = caller`: abre (retorna `opened_existing`).
  - Se existe e `broker_id != caller` e `attendance_started=true`: retorna `blocked_global` com nome do corretor — frontend mostra alerta e oferece "usar pessoal".
  - Se existe pendente (sem broker) ou não existe: cria lead + conversa global placeholder vinculada.
- **Se `_instance = 'personal'`:**
  - Busca conversa `source_instance='personal'` com `broker_id = caller` e mesmo `phone_normalized`.
  - Se existe: abre (`opened_existing`).
  - Senão: cria lead (broker_id = caller) + conversa pessoal placeholder.
  - Não bloqueia se existir global ou pessoal de outro corretor.

### 1.3 Ajustar `unify_lead`
Adicionar cláusula: só funde se ambos leads tiverem mesmo escopo de instância (mesma conversation `source_instance`). Caso contrário, mantém separados.

### 1.4 Trigger de início de atendimento
Adicionar trigger em `whatsapp_message_queue` (INSERT com status `scheduled/queued` por follow-up manual) e em `lead_interactions` (tipos `follow_up_criado`, `cadencia_criada`) que:
- Marca `leads.status_distribuicao = 'atendimento_iniciado'` se ainda em pré-atendimento.
- Marca `leads.atendimento_iniciado_em = now()` se nulo.
- Marca `conversations.attendance_started = true` na conversa correspondente.

(A 1ª mensagem outbound já marca via trigger `update_conversation_on_message` — manter.)

### 1.5 Backfill seguro (one-shot)
- Para `conversations.source_instance IS NULL` → `'personal'` (default já cobre, mas garante).
- Para `leads` sem conversa: criar conversa placeholder usando `auto_create_conversation_for_lead` (que já existe) — rodar para órfãos.
- Não tocar em conversas existentes com instância já definida.

---

## 2. Frontend — modal "Adicionar Lead"

`src/components/admin/AddLeadModal.tsx`:
- Novo campo obrigatório `Atender por`: rádio com 2 opções:
  - 🟣 **WhatsApp do Plantão (Global)**
  - 🟢 **Meu WhatsApp Pessoal** (só aparece se há corretor logado/selecionado)
- Substituir o INSERT direto + `unify_lead` pela RPC nova `create_manual_lead_with_conversation`.
- Tratar respostas:
  - `created` / `opened_existing` → toast + `onSuccess(conversation_id)`.
  - `blocked_global` → AlertDialog: "Este lead já está sendo atendido por [Nome]. Deseja chamar pela sua instância pessoal?" → [Sim, usar pessoal] re-chama RPC com `_instance='personal'`; [Cancelar] fecha.

## 3. Frontend — botão "Conversar"

Criar helper `resolveConversationForLead(leadId)` em `src/hooks/use-conversations.ts`:
- Busca conversa do lead ordenada por `last_message_at DESC`.
- Retorna `{ conversationId, sourceInstance }`.
- Navegação: `/corretor/inbox?conversationId=X` se `personal`, `/corretor/plantao?conversationId=X` se `global` (mesma lógica para admin).

Aplicar em `KanbanCard`, `LeadPage`, `LeadDetailSheet`.

## 4. Frontend — badges visuais

Criar `src/components/inbox/InstanceBadge.tsx`:
- Props: `instance: 'global' | 'personal'`, `brokerName?: string`.
- Global: roxo, ícone Building, texto "Plantão".
- Personal: verde, ícone User, texto "Pessoal" ou "WhatsApp de [Nome]".

Usar em:
- `KanbanCard`
- `ConversationList` (item já tem indicador parcial — padronizar)
- `ConversationThread` header
- `LeadDetailSheet` / `LeadPage`
- `AddLeadModal` (preview)
- Composer de mensagem: linha sutil acima do input — "Enviando pelo WhatsApp do Plantão" ou "Enviando pelo WhatsApp pessoal de [Nome]".

## 5. Sincronia realtime

Já há subscriptions em `use-conversations.ts` e `use-kanban-column.ts`. Garantir:
- Após RPC `create_manual_lead_with_conversation`, invalidar `["kanban-column"]` e `["conversations"]`.
- Subscription em `conversations` INSERT/UPDATE já dispara refetch da lista correta porque `source_instance` é filtrado na query.

## 6. Listas Plantão vs Pessoal

`use-conversations.ts` já filtra por `source_instance` (linhas 241/260/262). Vamos garantir:
- `BrokerPlantao` mostra `source_instance='global'`.
- `BrokerInbox` mostra `source_instance != 'global'` (pessoal).
- Conversas placeholder (sem mensagens) aparecem com badge "Novo" e preview "Lead adicionado manualmente" — já compatível porque ordenamos por `last_message_at` (que terá `created_at` da conversa).

---

## Arquivos afetados

**Migration:**
- nova migration (RPC, ajuste `unify_lead`, trigger de start-attendance, backfill).

**Backend (edge):** nenhum (lógica concentrada em RPC).

**Frontend:**
- `src/components/admin/AddLeadModal.tsx` — campo instância + RPC + alerta duplicidade.
- `src/hooks/use-conversations.ts` — helper `resolveConversationForLead`.
- `src/components/inbox/InstanceBadge.tsx` — novo.
- `src/components/crm/KanbanCard.tsx` — badge + botão Conversar resolvido.
- `src/components/crm/LeadDetailSheet.tsx` — badge + Conversar.
- `src/pages/LeadPage.tsx` — badge + Conversar.
- `src/components/inbox/ConversationThread.tsx` — badge no header + linha "Enviando por…" no composer.
- `src/components/inbox/ConversationList.tsx` — padronizar badge.

---

## Fora de escopo

- Não mexer em roleta/distribuição (lead criado manual não entra em roleta).
- Não alterar fluxo de webhook (já corrigido em ciclo anterior).
- Não migrar conversas históricas com `source_instance` já definido.
- Não criar coluna `instance_review_needed` — inferência segura conforme aprovado.

## Critérios de aceite

Cobrem todos os cenários listados no pedido: cadastro com seleção de instância, conversa placeholder visível na lista certa, badge em todas as telas, Conversar abre conversa correta, duplicidade global bloqueia + sugere pessoal, duplicidade pessoal só dentro do próprio corretor, follow-up move para Atendimento, realtime sem refresh.
