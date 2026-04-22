

## Correção: cadência respeita a janela comercial mesmo quando lead chega de madrugada

### Problema atual

Hoje, quando um lead chega às 02:00 da madrugada e tem uma cadência com etapas em 0min / 1h / 3h / 24h, o sistema calcula `firstMessageTime = 02:00` e marca:

| Etapa | Desejado | Após "ajuste" atual | Real (após cron) |
|---|---|---|---|
| 1 | 02:00 | 09:00 | 09:00 |
| 2 (+1h) | 03:00 | **09:00** | 09:01 |
| 3 (+3h) | 05:00 | **09:00** | 09:02 |
| 4 (+24h) | 02:00 dia seguinte | 09:00 dia seguinte | 09:00 dia seguinte |

Resultado: o lead recebe 3 mensagens em 2 minutos no horário de abertura, em vez de espaçadas conforme a cadência.

### Causa raiz

Em **5 lugares** do código, ao agendar etapas com horário fora da janela:
1. O `firstMessageTime` é fixado no instante atual (madrugada), e
2. Cada etapa é "ajustada" individualmente para o início da próxima janela (09:00),
3. Sem reaplicar o delay relativo à etapa 1 já reagendada.

### Correção proposta

**Nova regra unificada:** ao agendar uma cadência, calcular o "ponto de partida efetivo" (`effectiveStart`) **uma única vez** = `adjustToWorkingHours(now)`. Todas as etapas seguintes são calculadas como `effectiveStart + delay_cumulativo` e cada uma passa novamente pelo ajuste de janela (para casos onde o delay grande joga uma etapa para fora do dia).

| Etapa | Desejado | Corrigido |
|---|---|---|
| 1 | 02:00 → ajustado | **09:00** |
| 2 (+1h da etapa 1) | 09:00 + 1h | **10:00** |
| 3 (+3h da etapa 1) | 09:00 + 3h | **12:00** |
| 4 (+24h da etapa 1) | 09:00 +24h = 09:00 dia seguinte | **09:00 dia seguinte** |

### Arquivos a editar

**Backend (edge functions)**
- `supabase/functions/auto-cadencia-10d/index.ts` — substituir bloco linhas 305-336 pela nova lógica `effectiveStart`.

**Frontend (3 entry points de criação manual)**
- `src/hooks/use-whatsapp-campaigns.ts` (campanhas em massa) — bloco ~linhas 246-260: adicionar ajuste de janela com `effectiveStart` (hoje não aplica nenhum ajuste).
- `src/components/crm/FollowUpSheet.tsx` (follow-up manual de 1 lead) — bloco linhas 93-113: idem.
- `src/components/crm/CadenciaSheet.tsx` (cadência manual de 1 lead) — bloco linhas 71-115: substituir o ajuste encadeado atual pela mesma regra `effectiveStart + delay_cumulativo`.

**Helper compartilhado**
- Em `src/hooks/use-whatsapp-campaigns.ts`, `FollowUpSheet.tsx` e `CadenciaSheet.tsx`, extrair a função `adjustToWorkingHours` para um util único em `src/lib/whatsapp-scheduling.ts` (já existe a versão JS/TS espalhada em 3 lugares). Edge functions mantêm sua própria cópia (Deno não importa de `src/`).

### Detalhes técnicos

**Algoritmo em pseudo-código:**
```text
effectiveStart = adjustToWorkingHours(now + jitter)
for each step i:
  desired = effectiveStart + (step[i].delayMinutes * 60s) + smallJitter
  scheduled[i] = adjustToWorkingHours(desired)   // ainda necessário: se delay grande estourar a janela do dia
```

**Para campanhas em massa** (`use-whatsapp-campaigns.ts`): a função `createCampaignMutation` precisa **carregar `working_hours_start/end` da instância do corretor** antes do loop de leads (hoje só usa `getRandomInterval`). Adicionar uma query a `broker_whatsapp_instances` no início do `mutationFn`.

**Logging:** registrar em `lead_interactions` (tipo `note_added`) sempre que pelo menos uma etapa for reagendada por cair fora da janela, listando "Etapa N: previsto HH:MM → ajustado para HH:MM". Já é o padrão do `auto-cadencia-10d`; replicar nos outros 3 entry points.

**Sem migração de banco** — apenas mudança de lógica de agendamento.

**Mensagens já em fila (legado):** as mensagens já agendadas erroneamente para "todas no mesmo 09:00" continuarão como estão. Como são minoria de casos passados e o anti-spam do `/process` já garante 1 por minuto, optamos por **não fazer backfill** automático — o efeito ruim para leads existentes vai se diluir. Posso adicionar um script SQL one-shot opcional se preferir.

**Edge cases cobertos:**
- Lead chega dentro da janela (ex.: 14:00) → `effectiveStart = 14:00`, comportamento atual mantido.
- Lead chega após o fechamento (ex.: 22:00) → `effectiveStart = 09:00 do dia seguinte`, demais etapas somadas a partir daí.
- Etapas com delays muito grandes (24h+) que naturalmente caem em outro dia → `adjustToWorkingHours` em cada etapa garante que mesmo essas continuem dentro da janela.

