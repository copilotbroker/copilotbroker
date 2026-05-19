## Objetivo

Resolver na raiz o problema de corretores (Jaqueline e outros 5) que não conseguem inativar leads cuja conversa já foi assumida no Plantão mas `leads.broker_id` permaneceu `NULL`. A RLS de UPDATE em `leads` exige `broker_id = brokers.id` do usuário, então qualquer ação (inativar, avançar status, etc.) é silenciosamente bloqueada.

## Causa raiz

Em algum caminho legado (antes dos RPCs `claim_disputed_lead` / `pull_global_conversation_to_personal`, ou via UPDATE direto na conversa), a conversa foi atribuída ao corretor (`conversations.broker_id` preenchido, `attendance_started=true`) mas `leads.broker_id` nunca foi sincronizado. Hoje existem 29 leads nessa situação, distribuídos entre 6 corretores.

## Solução

Duas mudanças no banco, ambas em uma única migration:

### 1. Trigger preventivo em `conversations`

`AFTER UPDATE` em `conversations`: quando `broker_id` for setado ou `attendance_started` virar `true`, e houver `lead_id`, fazer:

```sql
UPDATE leads
SET broker_id = NEW.broker_id, updated_at = now()
WHERE id = NEW.lead_id
  AND broker_id IS NULL
  AND NEW.broker_id IS NOT NULL;
```

Defesa em profundidade — garante sincronização independente do caminho (RPC, edge function, UPDATE direto, etc.).

### 2. Backfill dos 29 leads órfãos

```sql
UPDATE leads l
SET broker_id = c.broker_id, updated_at = now()
FROM conversations c
WHERE c.lead_id = l.id
  AND l.broker_id IS NULL
  AND c.broker_id IS NOT NULL
  AND c.attendance_started = true;
```

Os 6 corretores afetados voltam a conseguir inativar/atuar nos leads imediatamente.

## Fora de escopo

- Nenhuma mudança de UI (`PerdaModal`, `use-lead-actions`, `LeadCard`).
- Nenhuma alteração nas políticas RLS — a regra "só agir após iniciar atendimento" já é corretamente aplicada por ela.
- Nenhuma mudança nos RPCs existentes (já sincronizam corretamente).
