

## Unificação Visual: Conexão, Copiloto, Segurança e Follow-up

### Resumo
Aplicar o mesmo padrão "Dark Professional" das abas Campanhas e Fila (tokens `#111114` / `#1e1e22`, headers com ícone em box, stats inline, collapsibles padronizados) nas 4 abas restantes: **Conexão**, **Copiloto (Summary)**, **Segurança** e **Follow-up**. As mudanças se aplicam tanto ao contexto do corretor quanto ao admin/líder (os componentes são compartilhados).

### Arquivos a alterar

#### 1. `src/components/whatsapp/ConnectionTab.tsx`
- Trocar todos `bg-[#1a1a1d]` → `bg-[#111114]` e `border-[#2a2a2e]` → `border-[#1e1e22]`
- Adicionar header com ícone em box (`Wifi` dentro de `bg-green-500/10 rounded-lg`) + título + subtítulo
- Init card (sem instância): atualizar tokens de cor
- Action buttons: atualizar borders para `border-[#1e1e22]` e hovers para `hover:bg-[#1e1e22]`
- AlertDialog: atualizar tokens

#### 2. `src/components/whatsapp/HealthScoreCard.tsx`
- Trocar `bg-[#1a1a1d]` → `bg-[#111114]`, `border-[#2a2a2e]` → `border-[#1e1e22]`
- Progress bars bg: `bg-[#2a2a2e]` → `bg-[#1e1e22]`
- Score circle gradient: atualizar tons

#### 3. `src/components/whatsapp/ConnectionStatusCard.tsx`
- Atualizar tokens de border/background se aplicável

#### 4. `src/components/whatsapp/SecurityTab.tsx`
- Trocar todos `bg-[#1a1a1d]` → `bg-[#111114]` e `border-[#2a2a2e]` → `border-[#1e1e22]`
- Adicionar header padronizado com ícone em box (`Shield` dentro de `bg-blue-500/10 rounded-lg`) + título + subtítulo, antes do grid de limites
- Input bg: `bg-[#0d0d0f]` pode permanecer (é mais escuro, funciona)
- Kill Switch card: atualizar tokens para o estado não-pausado
- Warmup card e Anti-Spam card: atualizar tokens

#### 5. `src/components/whatsapp/AutoCadenciaSection.tsx` (Follow-up)
- Trocar `bg-[#1a1a1d]` → `bg-[#111114]` e `border-[#2a2a2e]` → `border-[#1e1e22]`
- Cadence rule cards: `bg-[#141417]` → `bg-[#111114]`
- AlertDialog: atualizar tokens
- Empty state: atualizar tokens para o padrão refinado (ícone em box arredondado)

#### 6. `src/components/whatsapp/GlobalConnectionTab.tsx` (Admin)
- Mesmas substituições de tokens: `bg-[#1a1a1d]` → `bg-[#111114]`, `border-[#2a2a2e]` → `border-[#1e1e22]`
- Init card e action buttons: atualizar

#### 7. `src/components/inbox/CopilotConfigPage.tsx`
- Na `CopilotSummary`: verificar e atualizar tokens para `#111114` / `#1e1e22` nos cards de configuração (se usar `#1a1a1d`)

### O que NÃO muda
- Toda a lógica funcional (hooks, mutations, queries)
- CampaignsTab e QueueTab (já unificadas)
- CopilotConfigPage wizard steps (já usam variáveis semânticas do tema)
- Estrutura de tabs no AdminCopilotConfig e BrokerCopilotConfig

### Token de referência (padrão Campanhas/Fila)
```text
Surface:     bg-[#111114]
Border:      border-[#1e1e22]
Input bg:    bg-[#0d0d0f]
Hover:       hover:bg-[#1e1e22]
Header:      Ícone em box (bg-{color}-500/10 rounded-lg) + título + subtítulo
```

