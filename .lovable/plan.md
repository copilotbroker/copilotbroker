
## Objetivo

Fechar as 3 lacunas restantes da implementação de clareza de instâncias e validar o caso real Jaqueline/Olvideo.

---

## 1. Realtime nas listas de conversa (item 10)

**Problema:** placeholder criado por `create_manual_lead_with_conversation` aparece só após refetch manual.

**Solução:**
- Adicionar canal Realtime em `useConversations` (`src/hooks/use-conversations.ts`) escutando `postgres_changes` INSERT/UPDATE em `public.conversations` filtrado por `broker_id` (pessoal) e por `source_instance=eq.global` (plantão).
- Em cada evento, invalidar as queries de lista (`["conversations", ...]`) e, se aplicável, `["plantao-novos-count"]`.
- Garantir que a tabela `conversations` está em `supabase_realtime` (migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;` — idempotente via `DO $$ ... EXCEPTION WHEN duplicate_object ... $$`).
- Setar `REPLICA IDENTITY FULL` em `conversations` se ainda não estiver, para o payload trazer o registro completo.

## 2. Ampliar trigger de "início de atendimento" (item 4)

**Hoje cobre:** envio de mensagem (`whatsapp_message_queue`) e outbound em `conversation_messages`.

**Ampliar para também marcar `status='info_sent'` + `atendimento_iniciado_em=now()` quando:**

a) **Criar agendamento/tarefa** — trigger `AFTER INSERT ON public.calendar_events` chamando `mark_lead_attendance_on_event()` que faz update no lead vinculado (se `lead_id IS NOT NULL` e status atual em `('new','contacted')`).

b) **Registrar nota** — trigger `AFTER INSERT ON public.lead_interactions` quando `interaction_type = 'note'` (mesma lógica condicional).

c) **Clique em "Conversar"** — adicionar chamada explícita a `iniciarAtendimento(leadId, { silent: true })` no handler do botão "Conversar" / "Abrir conversa interna" em `KanbanCard`, `LeadDetailSheet`, `LeadPage` quando o lead está em `new`/`contacted`. Não usar trigger DB porque é uma ação puramente de UI sem evento persistido.

Em todos os casos, registrar `lead_interactions` com `interaction_type='atendimento_iniciado'` para auditoria (já feito pelo helper `iniciarAtendimento`).

## 3. InstanceBadge nos modais de follow-up/cadência (item 5)

Adicionar `<InstanceBadge verbose instance={...} brokerName={...} />` no cabeçalho (logo abaixo do título) de:
- `src/components/crm/FollowUpSheet.tsx`
- `src/components/crm/CadenciaSheet.tsx`
- `src/components/whatsapp/NewFollowUpWizard.tsx` (no header, indicando por qual instância o broker irá disparar — sempre pessoal nesse contexto, mas deixar explícito)

A instância é resolvida via `resolveConversationForLead(leadId)` ou, no caso de campanhas/cadências sem lead específico, pela instância pessoal do broker logado.

## 4. Teste manual Jaqueline/Olvideo

Roteiro a executar após o deploy:
1. Logar como corretor dono do lead.
2. Criar lead manual com telefone da Jaqueline, selecionar "Atender por: Pessoal".
3. Confirmar que o card aparece no Kanban com `InstanceBadge` verde (Pessoal).
4. Confirmar que a conversa-placeholder aparece imediatamente em `/corretor/inbox` (sem F5) — valida item 1.
5. Clicar em "Conversar" no Kanban → deve abrir o thread correto.
6. Tentar criar o mesmo telefone como global → deve bloquear e sugerir abrir a conversa pessoal existente.

---

## Detalhes técnicos

**Arquivos a editar/criar:**
- `src/hooks/use-conversations.ts` — canal Realtime.
- `src/components/crm/KanbanCard.tsx`, `LeadDetailSheet.tsx`, `src/pages/LeadPage.tsx` — chamar `iniciarAtendimento` no clique de "Conversar" (quando status em `new`/`contacted`).
- `src/components/crm/FollowUpSheet.tsx`, `CadenciaSheet.tsx`, `src/components/whatsapp/NewFollowUpWizard.tsx` — inserir `InstanceBadge`.
- Migration nova:
  - `ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;` (idempotente)
  - `ALTER TABLE public.conversations REPLICA IDENTITY FULL;`
  - Função `mark_lead_attendance_generic(p_lead_id uuid)` reutilizável.
  - Trigger `AFTER INSERT ON public.calendar_events` → chama a função.
  - Trigger `AFTER INSERT ON public.lead_interactions WHEN (NEW.interaction_type = 'note')` → chama a função.

**Critério de aceite:**
- Criar lead manual aparece em <2s nas listas sem refresh.
- Agendar uma visita ou adicionar uma nota em lead `new` move automaticamente para `info_sent`.
- Modais de follow-up/cadência mostram badge da instância usada.
- Cenário Jaqueline reproduzido com sucesso.
