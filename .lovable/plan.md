

## Separar Origem (Canal) de Campanha no CRM

### Diagnóstico
O campo `lead_origin` mistura dois conceitos diferentes:
- **Canal de entrada** (de onde veio o lead): Landing Page, WhatsApp Direto, Indicação, Plantão, Oferta Ativa
- **Campanha de mídia** (qual campanha trouxe): Meta ADS + dados UTM, Google Ads + dados UTM

O lead Guilherme veio de uma landing page (`source = 'broker_landing'`, `landing_page = 'landing_page'` na atribuição), mas como não tinha parâmetros UTM, o `lead_origin` ficou NULL → "Não identificada". Na verdade, a **origem** (canal) dele é conhecida: Landing Page do Corretor.

### Solução proposta

Em vez de criar novas colunas no banco, aproveitar os campos que já existem:

**1. Derivar o canal automaticamente a partir de `source` + `lead_attribution`**

O campo `leads.source` já identifica o canal de entrada com precisão:
- `landing_page`, `broker_landing` → "Landing Page"
- `whatsapp`, `whatsapp_global` → "WhatsApp"
- `manual` → "Manual / CRM"
- Slug de corretor → "Broker Landing"

**2. Separar visualmente no CRM: Canal vs. Campanha**

- **Canal** (badge principal no card): derivado de `source` — sempre preenchido, nunca "Não identificada"
- **Campanha** (badge secundário): derivado de `lead_origin` + `lead_origin_detail` — só aparece quando há dados UTM

**3. Manter `lead_origin` para campanhas de mídia**

O `lead_origin` continua servindo para registrar a campanha/mídia (Meta ADS, Google Ads, etc.), mas não é mais a "origem" principal exibida no card.

### Mudanças

**`src/types/crm.ts`**
- Adicionar função `getSourceDisplayLabel(source: string): string` que mapeia os valores de `source` para labels legíveis
- Adicionar função `getSourceType(source: string)` para estilização por tipo de canal

**`src/components/crm/KanbanCard.tsx`**
- Exibir badge de **Canal** (derivado de `lead.source`) como informação principal
- Exibir badge de **Campanha** (derivado de `lead.lead_origin`) como informação secundária, só quando existir

**`src/components/crm/LeadDetailSheet.tsx`**
- Separar visualmente "Canal de entrada" e "Campanha/Mídia" na ficha do lead

**`src/components/crm/LeadTimeline.tsx`**
- Atualizar o card de origem para mostrar Canal + Campanha separados

**`src/pages/LeadPage.tsx`**
- Atualizar a exibição de origem para mostrar o canal derivado do `source`

### Mapeamento de `source` → Canal

```text
source                → Label
─────────────────────────────────
landing_page          → Landing Page
broker_landing        → Landing Page (Corretor)
whatsapp              → WhatsApp Pessoal
whatsapp_global       → WhatsApp Plantão
manual                → Cadastro Manual
broker                → Cadastro Corretor
{slug-corretor}       → Landing Page (Corretor)
```

### O que NÃO muda
- Nenhuma alteração no banco de dados
- O fluxo de captura de leads continua igual
- Os filtros por origem (campanha) continuam funcionando
- A `OriginCombobox` e `OriginQuickPicker` continuam editando `lead_origin` (campanha)

