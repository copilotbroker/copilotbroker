

# Wizard de Criação de Follow-up Unificado

## Resumo

Unificar a criação de Cadências (Manual e Automática) e Campanhas em um único Wizard multi-etapas. Remover a aba "Campanhas" separada dos 3 locais onde existe (BrokerCopilotConfig, BrokerWhatsApp, AdminCopilotConfig). Substituir o seletor de intervalos pré-definidos por inputs livres (número + unidade).

## Etapas do Wizard

```text
┌─────────────────────────────────────────────┐
│ Etapa 1: Tipo                               │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │ ⚡ Auto  │ │ 📋 Manual│ │ 📣 Camp.│        │
│ └─────────┘ └─────────┘ └─────────┘        │
├─────────────────────────────────────────────┤
│ Etapa 2: Configuração                       │
│  - Auto: Nome + Empreendimento              │
│  - Manual: Nome apenas                      │
│  - Campanha: Nome + Filtros de leads        │
│    (status kanban, empreendimento,          │
│     etiquetas) + lista de leads             │
├─────────────────────────────────────────────┤
│ Etapa 3: Sequência de mensagens             │
│  - Intervalo livre (número + unidade)       │
│  - Etapas com mensagem + reply behavior     │
├─────────────────────────────────────────────┤
│ Etapa 4 (só Auto): Ativar automaticamente?  │
└─────────────────────────────────────────────┘
```

## Intervalo livre

Substituir os `DELAY_PRESETS` + `<Select>` por dois inputs inline:
- Input numérico (ex: 2)
- Select de unidade: minutos / horas / dias / semanas / meses

Isso permite criar intervalos como "45 dias", "3 meses", "1 semana", sem limite.

## Arquivos alterados

### 1. `src/components/whatsapp/AutoCadenciaRuleEditor.tsx` (reescrever)
- Transformar em Wizard com 3-4 etapas
- Etapa 1: Seletor de tipo (automática / manual / campanha) com cards visuais
- Etapa 2: Configuração conforme tipo
  - Automática: nome + empreendimento
  - Manual: nome
  - Campanha: nome + filtros (status kanban, empreendimento, etiquetas, corretor admin) + lista de leads com busca e seleção
- Etapa 3: Sequência de mensagens com intervalo livre (número + unidade em vez de presets)
- Etapa 4 (só automática): Dialog de ativação automática
- Para campanha, o submit chama `createCampaign` do hook `use-whatsapp-campaigns`

### 2. `src/components/whatsapp/AutoCadenciaSection.tsx`
- Remover botão separado "Nova Cadência" — agora o wizard unificado cobre tudo
- Exibir tanto cadências (auto/manual) quanto campanhas existentes na mesma lista
- Importar e usar campanhas do hook `use-whatsapp-campaigns`
- Manter badges de tipo (⚡ Auto / 📋 Manual / 📣 Campanha)

### 3. Remover aba "Campanhas" de 3 páginas:
- **`src/pages/BrokerCopilotConfig.tsx`**: remover TabsTrigger + TabsContent de "campaigns", remover import CampaignsTab
- **`src/pages/BrokerWhatsApp.tsx`**: idem
- **`src/pages/AdminCopilotConfig.tsx`**: remover do TAB_GROUPS + TabsContent, remover import

### 4. `src/components/whatsapp/AutoMessageTab.tsx`
- Sem mudança (já renderiza AutoCadenciaSection)

### 5. `src/components/crm/CadenciaPickerSheet.tsx`
- Atualizar para usar o novo formato de intervalo livre (se necessário)

### 6. `src/components/crm/CadenciaSheet.tsx` e `FollowUpSheet.tsx`
- Atualizar para usar intervalo livre em vez de DELAY_PRESETS

## Componente de Intervalo Livre

Novo componente inline reutilizável:
```tsx
// Inline: [  2  ] [ dias ▾ ]
// Converte para minutos internamente
// Unidades: minutos, horas, dias, semanas, meses (1 mês = 43200 min)
```

## Fluxo detalhado — Campanha

1. Wizard Etapa 1: usuário escolhe "📣 Campanha"
2. Etapa 2: nome + filtros de leads (status kanban checkboxes, empreendimento select, etiquetas multi-select, corretor se admin) + lista de leads com busca/seleção
3. Etapa 3: define sequência de mensagens com intervalos livres
4. Submit: chama `createCampaign` do hook existente `use-whatsapp-campaigns`

## O que NÃO muda

- `CampaignsTab.tsx` continua existindo (lista de campanhas existentes será integrada no AutoCadenciaSection)
- `CampaignCard.tsx`, `CampaignDetailSheet.tsx` — mantidos para visualização
- Hooks `use-whatsapp-campaigns` e `use-auto-cadencia-rules` — mantidos, apenas consumidos pelo wizard
- Lógica de backend (edge functions, message-sender) — intacta

