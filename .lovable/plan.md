# Corrigir conversa global órfã após reassinatura por timeout

## Causa raiz

Quando `roleta-timeout` reassina um lead pelo caminho **lead-based**, ele atualiza `leads.broker_id` mas **não** atualiza a `conversation` global vinculada. Resultado: a conversa fica presa ao corretor anterior e o novo corretor não a vê em "Plantão > Meus" (filtro `broker_id = current`). A cadência migra normalmente porque o trigger `migrate_queue_on_broker_change` cuida da fila de mensagens — só a conversa fica órfã.

Comparativo:
- `transfer_lead` (transferência manual) já migra a conversa corretamente.
- `roleta-timeout` no caminho **conversation-based** (linha ~487) também migra.
- `roleta-timeout` no caminho **lead-based** (linhas 210-256) **não migra** — esse é o bug.

## Mudanças

### 1. Edge `supabase/functions/roleta-timeout/index.ts` — caminho lead-based

Logo após o `UPDATE leads` (≈ linha 221), localizar a conversa global vinculada e migrá-la para o novo broker:

```ts
// Migrar conversa global vinculada para o novo broker
const phoneNorm = lead.whatsapp
  ? (() => {
      const digits = String(lead.whatsapp).replace(/\D/g, "");
      return digits.length <= 11 ? `55${digits}` : digits;
    })()
  : null;

await supabase
  .from("conversations")
  .update({
    broker_id: newBrokerId,
    reserva_expira_em: statusDistribuicao === "fallback_lider" ? null : newExpira.toISOString(),
    updated_at: new Date().toISOString(),
  })
  .eq("source_instance", "global")
  .or(`lead_id.eq.${lead.id}${phoneNorm ? `,phone_normalized.eq.${phoneNorm}` : ""}`);
```

### 2. Backfill (migration única)

Corrigir conversas globais já órfãs:

```sql
UPDATE conversations c
SET broker_id = l.broker_id, updated_at = now()
FROM leads l
WHERE c.lead_id = l.id
  AND c.source_instance = 'global'
  AND l.broker_id IS NOT NULL
  AND c.broker_id IS DISTINCT FROM l.broker_id;
```

## Fora de escopo (agora)

- Não alterar `transfer_lead` (já correto).
- Não mexer no trigger de migração da fila de cadência.
- Não criar conversa pessoal automática — a global migrada já permite atendimento via Plantão.
- UX de "Novo até abrir" (coluna `first_opened_at` + reclassificação no BrokerInbox/Plantão) fica para depois, após validar a correção com o caso do Davi.

## Validação

1. Deploy da edge `roleta-timeout`.
2. Rodar o backfill.
3. Confirmar que a conversa do Davi (e demais reassinaturas recentes) aparece em "Plantão > Meus" do corretor atual.
