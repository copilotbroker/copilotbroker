

## Nova Seção: "Desempenho da Cadência"

Adicionar bloco analítico no Dashboard do Corretor (`/corretor/dashboard`) entre o Funil e o Performance Individual, focado exclusivamente nas cadências automáticas de 7 toques.

### Lógica de cálculo (regra de negócio)

Cada cadência é uma linha em `whatsapp_campaigns` (com `lead_id` preenchido = cadência individual de lead, em oposição a campanhas em massa). Filtro:
- `broker_id = brokerId atual`
- `lead_id IS NOT NULL` (descarta campanhas em massa)
- `created_at` dentro do período selecionado
- opcional `project_id`

Para cada cadência, classificamos o lead em **uma única categoria final**:
- Olhamos os steps em `whatsapp_message_queue` (mesmo `campaign_id`).
- Se a cadência tem `reply_count > 0`: a tentativa de resposta = **maior `step_number` com `status='sent'`** (steps posteriores ficam `cancelled` quando o lead responde).
- Se `reply_count = 0` E todos os 7 steps estão `sent`: **"Finalizada sem resposta"**.
- Se ainda em andamento (status `running` e nem todos sent): **excluído** das categorias finais (mostrado separado como "em andamento").

### Componentes visuais

**1. Cards principais (topo)** — 5 KPIs no padrão `KpiCard` existente:
- Leads na cadência (total)
- Leads que responderam
- Taxa geral de resposta (%)
- Finalizadas sem resposta
- Tempo médio até resposta (calculado via `last_interaction_at - started_at` dos que responderam)

**2. Gráfico de barras (Recharts)** — 8 barras: 1ª, 2ª, 3ª, 4ª, 5ª, 6ª, 7ª tentativa + "Sem resposta". Usa `BarChart` do Recharts (já disponível via `@/components/ui/chart`). Cores: gradiente verde→amarelo→vermelho para indicar eficiência decrescente; barra de "sem resposta" em cinza/vermelho. Tooltip explicando "Respondeu na Xª tentativa = lead respondeu após receber o toque X e antes do toque X+1".

**3. Tabela analítica** — usando `@/components/ui/table`:
| Tentativa | Leads que receberam | Responderam | Taxa de resposta | Taxa acumulada |
|---|---|---|---|---|
| 1 | n leads (todos) | x | x/n % | x/n % |
| 2 | n − resp_1 | y | y/(n−resp_1) % | (resp_1+y)/n % |
| ... | ... | ... | ... | ... |

"Leads que receberam tentativa N" = total − soma de respondidos em tentativas anteriores.

**4. Bloco de eficiência acumulada** — gráfico de linha (Recharts `LineChart`) sobreposto ao bar chart OU bloco horizontal mostrando: "até T1: X% | até T2: Y% | ... até T7: Z%" como mini-barras de progresso. Sugestão moderna: **gráfico combinado (ComposedChart)** com barras (respostas por tentativa) + linha (taxa acumulada) — dá clareza dupla num único visual. Vamos por essa abordagem.

**5. Insights automáticos** — gerados no hook, padrão dos `DashboardInsight` existentes:
- Tentativa com maior taxa: "A 3ª tentativa teve a melhor taxa (32%) — sua copy aqui está convertendo."
- Tentativa de baixo desempenho: "A 5ª tentativa converte só 4% — considere reescrever a copy."
- Alta taxa de "sem resposta" (>50%): "Mais da metade das cadências terminam sem resposta — repense a abordagem."
- Recuperação tardia: "Você recuperou X leads na 6ª/7ª tentativa — insistir compensa."

### Arquivos a criar/editar

**Novo:** `src/hooks/use-cadence-performance.ts`
- `useCadencePerformance({ brokerId, projectId, periodStart, periodEnd })`
- Query única: `whatsapp_campaigns` (filtrado) + join/segunda query `whatsapp_message_queue` agrupado por campanha/step.
- Retorna: `{ totalCadences, replied, responseRate, finishedNoReply, avgHoursToReply, byAttempt: [{attempt, received, replied, replyRate, cumulativeRate}], inProgress, insights }`.

**Novo:** `src/components/broker/CadencePerformanceSection.tsx`
- Recebe os dados do hook + estado de loading.
- Renderiza: 5 KpiCards → ComposedChart (barras + linha acumulada) → Tabela → Insights internos da seção.
- Estado vazio: "Nenhuma cadência ativada neste período."

**Editar:** `src/pages/BrokerDashboard.tsx`
- Importa o novo componente e o renderiza após `<FunnelVisualization />` e antes de `<BrokerIndividualPerformance />`.
- Passa `brokerId`, `projectId`, `periodStart`, `periodEnd`.

### Detalhes técnicos

- Considera apenas cadências automáticas individuais (`whatsapp_campaigns.lead_id IS NOT NULL`). Campanhas em massa ficam fora.
- "Tempo até resposta" = `(updated_at do step com status='sent' mais recente) − started_at`, em horas. Mediana é mais robusta que média; usar mediana e rotular como "Tempo médio".
- Recharts já está no projeto (visto em `BrokerIndividualPerformance` e `PerformanceDashboard`).
- Tooltip de explicação da regra: ícone `Info` ao lado do título da seção com `Tooltip` do shadcn.
- Estilo visual: segue o `Dark Professional` (`bg-[#1e1e22]`, `border-[#2a2a2e]`, acento `#FFFF00`).

