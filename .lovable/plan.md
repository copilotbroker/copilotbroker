## Plano: corrigir leads do Plantão que ficam invisíveis

### Diagnóstico confirmado
O lead "Diego" (`+5551982252189`, criado às 20:58) ficou órfão: lead criado, mas sem `roleta_id`, sem `broker_id`, sem `lead_attribution`, sem `roletas_log` e **sem `conversation`**. Por isso não apareceu na aba "Novos" do Plantão. O webhook `handleGlobalInstanceMessage` abortou silenciosamente após criar o lead — provavelmente uma exceção não tratada em `lead_attribution.insert` / `unify_lead` / `fetch(roleta-distribuir)`.

---

### 1. Recuperar o lead "Diego" agora (one-shot)

Via insert tool:
- Inserir `lead_attribution` com `landing_page=whatsapp_global`, `utm_source=whatsapp`, `utm_medium=plantao`.
- Chamar `roleta-distribuir` (via curl_edge_functions) com `lead_id=5c16ca81-32ca-4795-a51b-bd9c16882e3b` e `source=whatsapp_global` para entrar em disputa na roleta "Plantão".
- Inserir uma `conversation` com `source_instance=global`, `attendance_started=false`, `broker_id=lider_id` (Vinicius), `phone=+5551982252189`, `lead_id=5c16ca81...`, `display_name='Diego'`, `last_message_preview='(mensagem original perdida — verificar no WhatsApp do Plantão)'`, `last_message_at=2026-05-04 20:58:11`.

Resultado: o lead aparece na aba "Novos" do Plantão para todos os corretores online (Jussara, Kely, Leonardo).

---

### 2. Endurecer `handleGlobalInstanceMessage` no webhook

**Arquivo:** `supabase/functions/whatsapp-webhook/index.ts` (linhas ~1797-1913).

Refatorar para que a criação da `conversation` aconteça **sempre** após criar o lead, mesmo se etapas auxiliares falharem:

1. Criar lead (try/catch — se falhar, abortar com log).
2. Inserir `lead_attribution` em try/catch isolado (warn em erro, não aborta).
3. Tentar `unify_lead` em try/catch isolado (warn em erro, não aborta).
4. **Criar a `conversation` ANTES de chamar `roleta-distribuir`**, com `broker_id` placeholder (líder da roleta resolvido localmente via query simples). Garante que o lead aparece em "Novos" mesmo que a distribuição falhe.
5. Chamar `roleta-distribuir` em try/catch isolado. Se sucesso, atualizar a conversation com `roleta_modo`, `atribuido_em`, `reserva_expira_em` e o `broker_id` real (caso fila/round-robin) ou manter o líder (caso disputa).
6. Adicionar `console.error("[plantao-orphan]", lead_id, step, err)` em cada catch para diagnóstico futuro.

Isso elimina a classe inteira de bugs onde uma falha em qualquer chamada acessória esconde o lead da UI.

---

### 3. Job de reconciliação preventivo (cron)

**Nova edge function:** `supabase/functions/reconcile-orphan-plantao-leads/index.ts`

Lógica:
```
SELECT id, name, whatsapp, created_at
FROM leads
WHERE source = 'whatsapp_global'
  AND created_at > now() - interval '2 hours'
  AND id NOT IN (SELECT lead_id FROM conversations WHERE lead_id IS NOT NULL)
LIMIT 50;
```

Para cada lead órfão:
- Inserir `lead_attribution` se não existir.
- Chamar `roleta-distribuir` com `source=whatsapp_global`.
- Criar a `conversation` global (broker_id = líder ou broker atribuído).
- Logar reconciliação em `lead_interactions` com tipo `roleta_atribuicao` e nota "Lead recuperado por reconciliação automática".

**Agendamento:** via insert tool, criar cron job `pg_cron` rodando a cada 5 minutos chamando essa função (usando `net.http_post` + anon key, conforme padrão Supabase).

---

### Arquivos afetados
- `supabase/functions/whatsapp-webhook/index.ts` — refatorar `handleGlobalInstanceMessage`.
- `supabase/functions/reconcile-orphan-plantao-leads/index.ts` — nova função.
- One-shot via insert tool: recuperar lead Diego (attribution + conversation) + agendar cron.
- One curl_edge_functions: chamar `roleta-distribuir` para o lead Diego.

### Risco
Baixo. Refatoração é defensiva (apenas adiciona try/catch e reordena). Job de reconciliação é idempotente (skip se conversation já existe). Recuperação manual do Diego é localizada.