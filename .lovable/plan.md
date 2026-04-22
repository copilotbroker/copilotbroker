

## Diagnóstico: prompt customizado e follow-up automático do Copiloto

Investiguei o copiloto do **Gabriel Witt** (config ativa, modo `autonomo`, 7 tentativas em 10 dias, prompt de 4.256 caracteres salvo) e encontrei **dois bugs** que impedem o sistema de funcionar como configurado.

### Problema 1 — Follow-up automático ignora o prompt customizado

A edge function `autopilot-followup/index.ts` (que roda a cada 30 min e dispara as mensagens de reengajamento) **não carrega** o campo `custom_system_prompt` do `copilot_configs`. Ela monta um prompt próprio e mínimo (`personality + emoji_rule + mode_instruction + contexto_reengajamento`), descartando todas as instruções de treinamento que o Gabriel salvou no wizard.

Já a `copilot-ai/index.ts` (sugestões manuais na Inbox) usa o `custom_system_prompt` corretamente via `buildSystemPrompt()`. Ou seja: o prompt funciona quando o corretor pede sugestão dentro da Inbox, mas é ignorado em todos os follow-ups automáticos.

### Problema 2 — Follow-up automático não está disparando para o Gabriel

Estado atual no banco:
- `copilot_configs.is_active = true`, `followup_enabled = true`, `followup_max_attempts = 7`, `followup_period_days = 10`.
- 4 conversas em `ai_mode = 'ai_active'`, sendo a mais antiga sem resposta há **7 dias**.
- Tabela `autopilot_followups` para o Gabriel: **0 registros**. Nenhum follow-up foi disparado.

Causas prováveis (a serem confirmadas durante a correção):
1. **Filtro `followup_enabled` na query** (`autopilot-followup` linha 101) descarta a config se a flag estiver desativada — mas o Gabriel está com ela ativa, então não é esse caso.
2. **Filtro `instance.status = 'connected'`** (linha 110): se a instância dele não estiver `connected` no momento do cron, todas as conversas são puladas. Vou validar o status da instância no momento da correção.
3. **`isWithinWorkingHours`** (UTC-3 09:00–21:00 por padrão): o cron pode estar caindo fora da janela.
4. **Possível ausência do agendamento cron**: não tenho permissão para ler `cron.job`, mas vou checar via dashboard de Supabase ao implementar — se não existir, criamos via migration `cron.schedule`.

### O que será corrigido

**1. `autopilot-followup/index.ts` — usar prompt customizado**

Quando o `copilot_configs.custom_system_prompt` existir, ele será o **núcleo** do system prompt enviado para o Gemini (mesma lógica do `copilot-ai`). Apenas adicionamos um bloco extra **CONTEXTO DE REENGAJAMENTO** com:
- Tentativa N de M e dias sem resposta.
- Lista de mensagens já enviadas pelo bot (para não repetir).
- Sugestões de tom por tentativa (1-2 leve, 3-4 informativa, etc.).
- Contexto do empreendimento (já existe).

Os placeholders `{personalidade}`, `{regra_emojis}`, `{nome_corretor}`, `{contexto_lead}`, `{contexto_empreendimento}` serão substituídos exatamente como em `copilot-ai`, garantindo paridade total entre sugestões manuais e follow-ups automáticos.

**2. `autopilot-followup/index.ts` — diagnóstico do disparo**

- Adicionar logs explícitos por conversa explicando o motivo de pular (sem instância, fora de horário, optout, delay não atingido, max attempts atingido).
- Confirmar/criar agendamento cron de 30 em 30 min via migration `cron.schedule('autopilot-followup', '*/30 * * * *', ...)`.
- Garantir que a função respeita o `working_hours_start/end` do broker (já respeita) e que o `attemptsDone` é contabilizado corretamente.

**3. Validação prática para o Gabriel**

Após o deploy:
- Verificar logs da edge function rodando manualmente uma vez.
- Conferir se `autopilot_followups` recebe novos registros para a conversa de 15/04.
- Confirmar que o texto enviado reflete o tom do prompt customizado (vendas consultivas ENOVE, primeira pessoa como "Gabriel").

### Arquivos afetados

**Backend**
- `supabase/functions/autopilot-followup/index.ts` — refatorar `systemPrompt` para usar `custom_system_prompt` + bloco de reengajamento; adicionar logs diagnósticos; carregar broker name + lead context completo.
- 1 migração SQL para garantir o cron `*/30 * * * *` chamando `autopilot-followup` (apenas se ainda não existir).

**Sem mudanças**
- `copilot-ai/index.ts` — já está correto, será apenas usado como referência.
- Frontend — nenhuma mudança visual necessária; o wizard de configuração já salva tudo corretamente.

### Observação importante

A flag `followup_auto` (separada de `followup_enabled`) está como `false` para o Gabriel. Hoje o `autopilot-followup` **não verifica** essa flag — ele só checa `followup_enabled`. Vou manter esse comportamento (a flag `followup_auto` parece ser legada/redundante). Se você preferir que `followup_auto = false` desative os disparos, me avise para inverter a lógica.

