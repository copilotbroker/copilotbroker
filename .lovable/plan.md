# Reorganizar WhatsApp: remover aba Campanhas e estruturar Follow-up

## Objetivo

Eliminar a aba **Campanhas** das páginas do admin/líder e do corretor. A criação de campanhas continua existindo, porém apenas via botão **Nova Cadência** (dentro de Follow-up), e o conteúdo passa a ser apresentado em 4 seções bem separadas dentro da aba Follow-up.

## Mudanças

### 1. Remover aba "Campanhas"

Em todas as páginas que ainda têm a aba `campaigns`:

- `src/pages/AdminCopilotConfig.tsx` — remover item `{ id: "campaigns", label: "Campanhas", icon: Megaphone }` da lista de tabs e o `<TabsContent value="campaigns">` que renderiza `<CampaignsTab />`.
- `src/pages/BrokerCopilotConfig.tsx` — remover `<TabsTrigger value="campaigns">` e `<TabsContent value="campaigns">`.
- `src/pages/BrokerWhatsApp.tsx` — remover `<TabsTrigger value="campaigns">` e `<TabsContent value="campaigns">`.
- Remover imports do `CampaignsTab` nas 3 páginas.
- Manter o componente `CampaignsTab.tsx` no repositório por enquanto (não excluir arquivo) — fica órfão e pode ser apagado depois sem risco.

### 2. Reestruturar `AutoCadenciaSection.tsx`

Hoje o componente mistura tudo numa lista única. Reorganizar em 4 blocos colapsáveis/visuais, cada um com cabeçalho próprio (ícone + título + contador):

```text
┌─ Follow-up ──────────────────────────────────┐
│ [⚡] Cadências Automáticas        (n)        │
│     Lista das rules cadence_type='automatic' │
│     com Switch ligar/desligar (já existe)    │
│                                              │
│ [📋] Cadências Cadastradas        (n)        │
│     Lista das rules cadence_type='manual'    │
│     (aplicadas manualmente na página do lead)│
│     Sem switch — só editar/excluir           │
│                                              │
│ [📣] Campanhas Ativas             (n)        │
│     bulkCampaigns com status ≠ completed/    │
│     cancelled — usa CampaignCard             │
│                                              │
│ [🗄] Histórico de Campanhas       (n)        │
│     Collapsible (default fechado) com        │
│     campanhas completed + cancelled          │
└──────────────────────────────────────────────┘
```

Detalhes:

- O botão **Nova Cadência** continua no topo (já abre o `AutoCadenciaRuleEditor`, que permite escolher tipo automático/manual e também criar campanhas em lote — fluxo já existente).
- Filtrar `rules` por `cadence_type === "automatic"` e `=== "manual"` para popular as duas primeiras seções.
- Reaproveitar a lógica atual de `bulkCampaigns / activeCampaigns / archivedCampaigns` para as duas últimas seções.
- Cada seção mostra empty state curto ("Nenhuma cadência automática", etc.) quando vazia, em vez do empty state global atual.
- Manter o badge "⚡ Auto" / "📋 Manual" nos cards individuais por consistência.
- Substituir o título "Cadências de Follow-up" do header pelo mesmo, mas o subtítulo passa a ser "Automáticas, manuais e campanhas em lote".

### 3. Sem mudanças em backend / banco

Nenhuma alteração de schema, RLS ou edge function. A separação é puramente de UI; os dados (`broker_auto_cadencia_rules.cadence_type` e `whatsapp_campaigns.status`) já existem.

## Arquivos a editar

- `src/pages/AdminCopilotConfig.tsx`
- `src/pages/BrokerCopilotConfig.tsx`
- `src/pages/BrokerWhatsApp.tsx`
- `src/components/whatsapp/AutoCadenciaSection.tsx`

## Validação

- Admin/líder: aba Campanhas some; aba Follow-up mostra as 4 seções.
- Corretor: idem.
- Botão "Nova Cadência" continua criando rules e campanhas normalmente.
- Cadências manuais existentes (criadas via página do lead) aparecem em "Cadências Cadastradas".
