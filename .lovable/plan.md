

## Redesign da Página Copiloto

### Objetivo
Aplicar o padrão "Dark Professional" (`#111114` / `#1e1e22`) na `CopilotConfigPage`, harmonizando com Campanhas e Fila, e elevando a experiência visual tanto no **Summary** quanto no **Wizard**.

### Arquivo: `src/components/inbox/CopilotConfigPage.tsx`

#### A. CopilotSummary (tela principal quando já configurado)

1. **Header padronizado**: Adicionar header com ícone em box (`Sparkles` dentro de `bg-primary/10 rounded-lg`) + título "Copiloto IA" + subtítulo, antes do hero card — alinhando com as demais abas
2. **Hero card**: Trocar `bg-card border-border` → `bg-[#111114] border-[#1e1e22]`; manter gradient overlay e status dot
3. **Capability cards (2x2)**: Trocar para `bg-[#111114] border-[#1e1e22]`
4. **Calibragem do Copiloto (dials)**: Mesmos tokens; progress bars bg `bg-[#1e1e22]`
5. **Recursos Ativos**: Card com tokens unificados; pills mantêm estilo atual
6. **Botões de ação**: "Editar" mantém `bg-primary`; botão "Excluir" → `border-[#1e1e22]`; AlertDialog → `bg-[#111114] border-[#1e1e22]`

#### B. Wizard (criação/edição — 5 steps)

7. **Header do wizard**: Ícone box com gradient mantém; fundo geral já usa `bg-background` (ok)
8. **Progress bar**: Trocar `Progress` bg para `h-1 bg-[#1e1e22]` com indicador `bg-primary`; step labels com dot indicators em vez de apenas cor
9. **SelectionCard**: Trocar `bg-card` → `bg-[#111114]`, `border-border` → `border-[#1e1e22]`, selected state mantém `border-primary bg-primary/10`
10. **Inputs e Selects**: `bg-background` já funciona (mais escuro); borders → `border-[#1e1e22]`
11. **Follow-up card (StepStrategy)**: `bg-card` → `bg-[#111114] border-[#1e1e22]`
12. **StepAdvanced textarea**: Border → `border-[#1e1e22]`
13. **Bottom nav bar**: `bg-background/95 border-border` → `bg-[#0d0d0f]/95 border-[#1e1e22]`

#### C. AdminCopilotOverview

14. **Arquivo**: `src/components/admin/AdminCopilotOverview.tsx`
15. **StatCards**: `bg-card border-border` → `bg-[#111114] border-[#1e1e22]`
16. **BrokerCopilotCard**: Mesma substituição + hover `hover:border-primary/30`
17. **BrokerEmptyCard**: Border dashed → `border-[#1e1e22]`, bg → `bg-[#111114]/50`
18. **MiniStat**: `bg-background` → `bg-[#0d0d0f]`

### O que NÃO muda
- Toda a lógica funcional (save, delete, toggle, steps, navigation)
- Hooks (`useCopilotConfig`, `useCopilotSuggestion`)
- Estrutura de tabs nos pages (`BrokerCopilotConfig`, `AdminCopilotConfig`)

### Arquivos alterados
- `src/components/inbox/CopilotConfigPage.tsx`
- `src/components/admin/AdminCopilotOverview.tsx`

