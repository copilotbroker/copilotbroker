

## Plano: Follow-up Automático por Inatividade do Lead (Piloto Automático)

### Conceito
Criar uma Edge Function agendada via pg_cron que detecta leads com Piloto Automático ativo (`ai_mode = 'ai_active'`) que não responderam após um período configurável, e envia automaticamente uma mensagem de reengajamento gerada por IA. O sistema fará até 7 tentativas em 10 dias, com intervalos crescentes.

### Campos novos na tabela `copilot_configs`
```sql
ALTER TABLE public.copilot_configs 
  ADD COLUMN followup_max_attempts integer NOT NULL DEFAULT 7,
  ADD COLUMN followup_period_days integer NOT NULL DEFAULT 10,
  ADD COLUMN followup_enabled boolean NOT NULL DEFAULT true;
```

Estes campos serão editáveis no Wizard do Copiloto (Passo 4 — Estratégia Comercial), substituindo o switch `followup_auto` atual (cosmético) por um controle real com inputs de quantidade e período.

### Nova tabela: `autopilot_followups`
Rastreia tentativas de reengajamento por conversa para evitar spam:
```sql
CREATE TABLE public.autopilot_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  broker_id uuid NOT NULL,
  attempt_number integer NOT NULL DEFAULT 1,
  sent_at timestamptz NOT NULL DEFAULT now(),
  message_preview text,
  UNIQUE(conversation_id, attempt_number)
);
```

### Nova Edge Function: `autopilot-followup`
Lógica executada via cron (a cada 30 minutos):

1. Busca todas as conversas com `ai_mode = 'ai_active'` onde a última mensagem é `outbound` (IA/corretor já mandou) e o lead não respondeu
2. Para cada conversa, verifica o `copilot_config` do broker (se `followup_enabled`)
3. Calcula o intervalo esperado com base no schedule crescente:
   - Tentativas 1-2: ~1 dia após última mensagem
   - Tentativas 3-4: ~2 dias
   - Tentativas 5-6: ~3 dias  
   - Tentativa 7: ~4 dias (total ≈ 10 dias)
4. Verifica quantas tentativas já foram feitas (`autopilot_followups`)
5. Se ainda não atingiu `followup_max_attempts` e o intervalo correto passou:
   - Gera mensagem via IA (Gemini) com contexto de reengajamento
   - Envia via UAZAPI
   - Registra em `autopilot_followups`
6. Respeita: working hours, opt-out, rate limits

### Prompt de reengajamento
A IA receberá instrução adicional no system prompt:
```
CONTEXTO: O lead não respondeu sua última mensagem há X dias. 
Esta é a tentativa Y de Z de reengajamento.
Envie uma mensagem curta, natural e não invasiva para retomar o contato.
Varie a abordagem a cada tentativa (pergunta, novidade, lembrete sutil).
NÃO repita mensagens anteriores.
```

### UI — Wizard Passo 4 (Estratégia Comercial)
Substituir o switch cosmético `followup_auto` por:
- **Switch "Follow-up por inatividade"** (ativa/desativa)
- Quando ativo, mostra:
  - Input: "Quantidade de tentativas" (default: 7, min: 1, max: 15)
  - Input: "Período em dias" (default: 10, min: 3, max: 30)
  - Microcopy: "O Copiloto vai tentar reengajar leads que não respondem, enviando até X mensagens em Y dias com intervalos crescentes."

### Cron Job
```sql
SELECT cron.schedule('autopilot-followup-check', '*/30 * * * *', $$
  SELECT net.http_post(
    url:='https://nckzxwxxtyeydolmdijn.supabase.co/functions/v1/autopilot-followup',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer ..."}'::jsonb,
    body:='{}'::jsonb
  );
$$);
```

### Arquivos a alterar/criar

1. **Migration SQL** — Adicionar colunas em `copilot_configs` + criar tabela `autopilot_followups`
2. **`supabase/functions/autopilot-followup/index.ts`** — Nova Edge Function
3. **`supabase/config.toml`** — Registrar nova function
4. **`src/components/inbox/CopilotConfigPage.tsx`** — Atualizar Passo 4 com controles reais
5. **`src/hooks/use-copilot.ts`** — Adicionar novos campos ao tipo
6. **Cron SQL** — Agendar execução a cada 30 min

