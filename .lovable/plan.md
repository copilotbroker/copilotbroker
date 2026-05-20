# Por que a campanha do Pedro não dispara

Investigação no banco confirmou o problema:

- Pedro Rocha (Enove) — instância `enove_pedro_rocha`, broker `2834ab48-…`.
- A campanha "OPORTUNIDADE ATÉ 300K" está em `status = running` com 68 mensagens em `scheduled`.
- Na tabela `broker_whatsapp_instances`: `hourly_sent_count = 30` e `hourly_limit = 30` (mesma coisa no diário: `daily_sent_count = 30`, `daily_limit = 150`).
- Última mensagem efetivamente enviada: **14/05 às 14:36 BRT**. Desde então: zero envios em ~6 dias, apesar do cron `whatsapp-message-sender-process` rodar a cada minuto.

Olhando o código da `whatsapp-message-sender` (linhas 621–628), o loop pula a instância quando `hourly_sent_count >= hourly_limit`. Esses contadores **só zeram** se forem chamados os endpoints `/reset-hourly` (de hora em hora) e `/reset-daily` (1x por dia).

Conferindo `cron.job`, o **único cron WhatsApp existente é o `process` — não existe cron para `/reset-hourly` nem `/reset-daily`**. Resultado: depois que a instância do Pedro bateu 30 envios na primeira hora do dia 14, o contador nunca mais voltou a zero, e o sender pula a instância em todos os ticks. O "próximo envio" mostrado na UI é só o `scheduled_at` da próxima mensagem da fila, que continua no passado — daí a sensação de "vai e nunca dispara".

Isto não afeta só o Pedro: **qualquer corretor** que atingir o limite horário/diário fica travado para sempre na mesma campanha até alguém resetar manualmente no banco.

# Plano de correção (mínimo e cirúrgico)

## 1. Criar os 2 crons que faltam (migration SQL)

Agendar via `pg_cron` chamadas autenticadas aos endpoints já existentes da `whatsapp-message-sender`:

- `whatsapp-message-sender-reset-hourly` — `0 * * * *` (todo minuto 0 de cada hora UTC) → `POST /whatsapp-message-sender/reset-hourly`
- `whatsapp-message-sender-reset-daily` — `0 3 * * *` (03:00 UTC ≈ 00:00 BRT) → `POST /whatsapp-message-sender/reset-daily`

Mesma estrutura/headers do cron `whatsapp-message-sender-process` já existente (mesma anon key, `net.http_post`).

`/reset-daily` já cuida de despausar `whatsapp_message_queue` em `paused_by_system` que tenha `pause_reason` diferente de `whatsapp_disconnected` (linhas 1395–1399), o que é o comportamento desejado.

## 2. Backfill imediato para destravar quem já está preso

Na mesma migration, zerar contadores agora para todas as instâncias (one-shot), para não esperar até as 00:00 BRT:

```sql
UPDATE public.broker_whatsapp_instances
   SET hourly_sent_count = 0,
       daily_sent_count  = 0,
       updated_at        = now();
```

Isso libera a fila do Pedro (e qualquer outro corretor que esteja na mesma situação) no próximo tick do cron `process` (≤ 1 min).

## 3. Não mudar nada além disso

- **Não** mudo a lógica de contagem para o modelo "contar `sent` na última hora" (como o canal global faz nas linhas 459–469). Embora seja mais robusto, é uma refatoração maior e fora do escopo desta correção.
- **Não** mexo no front (`ScheduledMessagesPanel`, `useWhatsAppQueue`): o countdown estranho ("5563:56") é só sintoma — vai se normalizar sozinho assim que os envios voltarem a acontecer.
- **Não** mexo em `working_hours`, `warmup`, kill switch, instância ou campanha do Pedro.

# Arquivos previstos

- `supabase/migrations/<timestamp>_whatsapp_sender_reset_crons.sql` (novo) — cria os 2 cron jobs com `cron.schedule(...)` (guardado com `cron.unschedule` se já existir, por idempotência) e o `UPDATE` de backfill.

# Resultado esperado

- Em ≤ 1 minuto após a migration: a fila do Pedro recomeça a disparar respeitando `hourly_limit = 30` e `working_hours 09:00–21:00`.
- A cada hora cheia: `hourly_sent_count` zera automaticamente → sem mais travamentos.
- Todo dia às 00:00 BRT: `daily_sent_count` zera + mensagens `paused_by_system` (que não foram pausadas por desconexão) voltam para `scheduled`.

# Observação fora de escopo (não vou alterar, só registrando)

- A instância do Pedro tem `last_seen_at = 15/05`. Se na hora que destravar ela estiver realmente desconectada na UAZAPI, as mensagens vão falhar e cair no fluxo de `paused_by_system / whatsapp_disconnected` — aí é caso de reconectar o QR pelo painel, não tem mais nada a fazer pelo backend.
