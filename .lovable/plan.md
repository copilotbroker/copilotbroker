

## Remoção da flag legada `followup_auto`

Vou eliminar de uma vez a coluna duplicada `followup_auto` da tabela `copilot_configs`, mantendo apenas a `followup_enabled` (que é a única realmente usada pelo motor de follow-up automático).

### O que será feito

**1. Migração SQL (schema)**
- `ALTER TABLE public.copilot_configs DROP COLUMN followup_auto;`

**2. Wizard de configuração (`src/components/inbox/CopilotConfigPage.tsx`)**
- Remover a linha `update("followup_auto", v); // keep legacy field in sync` (linha 523).
- Remover `followup_auto: false` do objeto de defaults (linha 643).

**3. Tipo do hook (`src/hooks/use-copilot.ts`)**
- Remover a propriedade `followup_auto: boolean;` da interface `CopilotConfig` (linha 20).

**4. Tipos gerados do Supabase (`src/integrations/supabase/types.ts`)**
- Esse arquivo é regenerado automaticamente após a migração rodar. Não precisa editar manualmente.

### Por que é seguro

- O backend (`autopilot-followup/index.ts`) **não lê** essa coluna em lugar nenhum — só usa `followup_enabled`.
- Confirmei via busca global no projeto: a flag aparece apenas no wizard (sincronização cosmética) e nos tipos.
- Não há nenhum admin/relatório/dashboard que exiba ou filtre por `followup_auto`.
- Brokers que tinham `followup_auto = false` e `followup_enabled = true` (caso do Gabriel) continuam funcionando exatamente igual — a flag legada simplesmente deixa de existir.

### Risco e rollback

Como é `DROP COLUMN`, é **destrutivo** (não dá para reverter automaticamente os valores). Mas como a flag não estava sendo usada em decisões reais, os valores históricos não têm utilidade. Se algum dia for necessária uma flag separada para "follow-up automático" diferente de "follow-up habilitado", podemos recriar com nome mais claro (`followup_send_automatically`, por exemplo).

### Arquivos afetados

- 1 migração SQL nova (DROP COLUMN).
- `src/components/inbox/CopilotConfigPage.tsx` — 2 linhas removidas.
- `src/hooks/use-copilot.ts` — 1 linha removida.
- `src/integrations/supabase/types.ts` — atualizado automaticamente pelo Supabase.

