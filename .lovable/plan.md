

## Problema

O `reply_count` na tabela `whatsapp_daily_stats` incrementa a cada mensagem recebida do lead, não por lead único. Se um lead envia 5 mensagens, o contador sobe 5. Isso infla a taxa de resposta.

A tabela `whatsapp_lead_replies` já faz deduplicação correta (upsert por `phone + campaign_id`), mas o contador `reply_count` no `whatsapp_daily_stats` não usa essa lógica.

## Correção em 2 partes

### 1. Webhook -- só incrementar reply_count para replies novas

No `supabase/functions/whatsapp-webhook/index.ts`, na seção que atualiza `whatsapp_daily_stats.reply_count` (~linha 269-287):

- Antes de incrementar, verificar se o upsert em `whatsapp_lead_replies` realmente inseriu um registro novo (não apenas atualizou um existente)
- Usar o retorno do upsert para decidir se incrementa o contador
- Mesma lógica para `whatsapp_campaigns.reply_count`: só incrementar se for reply nova daquele phone

### 2. Frontend -- usar `whatsapp_lead_replies` para contagem precisa

No `useWhatsAppGlobalStats` (ou criar query dedicada no `AdminCopilotConfig`):

- Consultar `whatsapp_lead_replies` com `count` para obter o número real de leads únicos que responderam
- Usar esse valor como `replies` no `globalTotals` passado ao `WhatsAppOverviewTab`
- Isso corrige imediatamente a taxa de resposta sem depender de dados históricos do `reply_count`

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/whatsapp-webhook/index.ts` | Checar se reply é nova antes de incrementar contadores |
| `src/hooks/use-whatsapp-stats.ts` | Na função `useWhatsAppGlobalStats`, consultar `whatsapp_lead_replies` para contagem real de replies únicas |

