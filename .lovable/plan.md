## Objetivo

1. Permitir filtrar leads por **Etiqueta do WhatsApp** ao criar uma Campanha.
2. Transformar o ponto de entrada da aba "Follow-up" num **Wizard** claro com 3 caminhos: Follow-up Automático, Follow-up Manual e Campanha.

---

## Parte 1 — Filtro por Etiqueta nas Campanhas

Hoje, ao criar Campanha, o usuário só pode filtrar leads por Status, Empreendimento, Origem e Corretor (admin). Vamos adicionar **Etiqueta** como filtro adicional, com a mesma UX dos outros (multi-select via Popover + ScrollArea).

### Onde aparece
- `src/components/whatsapp/NewCampaignSheet.tsx` — seção "Filtros de leads".
- `src/components/whatsapp/AutoCadenciaRuleEditor.tsx` (`renderCampaignFilters`) — seção "Filtros de leads".

### Comportamento
- Multi-seleção. Se nenhuma etiqueta marcada → não filtra.
- Se 1+ marcadas → o lead deve ter **pelo menos uma** das etiquetas selecionadas (OR).
- Etiquetas listadas: as do corretor logado (`whatsapp_labels` por `broker_id`); para admin com filtro de corretor ativo, etiquetas do corretor selecionado; sem filtro → admin não vê o filtro de etiqueta (ou exibe vazio com aviso "selecione um corretor").

### Backend (sem migration)
Em `src/hooks/use-whatsapp-campaigns.ts` → `fetchLeadsByStatus`, aceitar novo parâmetro `labelIds?: string[]`. Quando informado:
- buscar `lead_whatsapp_labels` (`select lead_id`) onde `label_id in (labelIds)`,
- restringir o `query` por `.in('id', leadIdsComEtiqueta)`.

Propagar `labelIds` em `createCampaign` (passando para `fetchLeadsByStatus` na hora de montar a fila). Não precisa persistir na campanha (mesma lógica que `origins`, que já não persiste).

---

## Parte 2 — Wizard de criação de Follow-up

Hoje a aba mostra direto a lista (Automáticas / Manuais / Campanhas) e o botão "Nova Cadência" abre um Sheet que internamente tem o seletor de 3 tipos. Vamos elevar essa escolha para um **passo dedicado** com layout de cards grandes — padrão já usado em `WizardMethodSelector`.

### Mudanças

**`AutoCadenciaSection.tsx`**
- Botão "Nova Cadência" passa a abrir um novo modal/sheet `NewFollowUpWizard` (ver abaixo) — não mais o editor diretamente.
- Mantém a listagem das três seções (Automáticas, Manuais, Campanhas) intacta.

**Novo componente `src/components/whatsapp/NewFollowUpWizard.tsx`**
- Sheet com 3 cards estilo "method selector":
  - ⚡ **Follow-up Automático** — dispara sozinho ao receber novo lead. Cor âmbar.
  - 📋 **Follow-up Manual** — template salvo, aplicado sob demanda na página do lead. Cor azul.
  - 📣 **Campanha** — disparo em massa para leads filtrados (status, empreendimento, origem, **etiqueta**). Cor roxa.
- Ao clicar num card: fecha o wizard e abre `AutoCadenciaRuleEditor` já no passo 2, com `wizardType` pré-definido (passar via prop `initialWizardType`).

**`AutoCadenciaRuleEditor.tsx`**
- Aceitar prop `initialWizardType?: WizardType`. Quando presente, pular o `renderStep1TypeSelector` e iniciar direto no passo 2.
- Manter o passo 1 disponível como fallback (caso seja aberto sem `initialWizardType`, comportamento atual).

### UX detalhada do Wizard
- Header: "Como deseja criar seu follow-up?" + subtítulo "Escolha o tipo abaixo para começar."
- Cards exibem: ícone, título, 1 frase de descrição, e um exemplo curto ("Ex.: dispara mensagem 5 min após o lead entrar").
- Em mobile (1 coluna) e desktop (1 coluna larga, mesmo layout do Sheet atual lateral).

---

## Resumo técnico

```text
NewFollowUpWizard (novo)
   │  escolha do tipo
   ▼
AutoCadenciaRuleEditor (com initialWizardType)
   │  passo 2: nome + (config Auto OU filtros de Campanha incl. Etiqueta)
   │  passo 3: etapas/mensagens
   ▼
useWhatsAppCampaigns.createCampaign({ ..., labelIds })
   │
   ▼
fetchLeadsByStatus → JOIN com lead_whatsapp_labels quando labelIds presente
```

Sem migrations. Sem mudanças em RLS. Apenas frontend + leitura adicional em `lead_whatsapp_labels` (já tem RLS).

---

## Fora de escopo
- Salvar a etiqueta como filtro persistente na campanha (não é necessário; a fila já é materializada na criação).
- Re-design das listas existentes (Automáticas / Manuais / Campanhas) — permanecem como estão.
