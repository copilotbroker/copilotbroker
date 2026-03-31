

## Unificação Visual: Campanhas + Fila + Demais Abas WhatsApp

### Diagnóstico

As duas abas usam tokens de cor ligeiramente diferentes e estruturas de layout distintas:

| Aspecto | Campanhas | Fila |
|---------|-----------|------|
| Background cards | `#111114` | `#1a1a1d` |
| Border | `#1e1e22` | `#2a2a2e` |
| Header | Ícone em box + título + subtítulo | Título inline sem ícone em box |
| Stats | Cards inline compactos (icon + número) | Cards centrados grandes (número + label) |
| Collapsibles | Trigger com dot colorido + badge | Trigger com ícone + badge |
| Empty state | Card elegante com steps | Card simples |

O Campanhas está mais alinhado ao design system "Dark Professional" (`#111114` / `#1e1e22`), enquanto a Fila usa tons mais claros (`#1a1a1d` / `#2a2a2e`). A sugestão é **padronizar ambas no estilo do Campanhas**, que você preferiu, e adaptar os tokens para usar as CSS variables do tema (`bg-card`, `border-border`) para que "conversem" com o resto da plataforma.

### Plano

#### 1. Padronizar tokens de cor na QueueTab
- Trocar `bg-[#1a1a1d]` → `bg-[#111114]` e `border-[#2a2a2e]` → `border-[#1e1e22]` em todo o arquivo
- Aplicar o mesmo nos sub-componentes `PendingMessageCard`, `HistoryMessageCard`, `QueueStats`

#### 2. Redesign do Header da Fila (espelhar Campanhas)
- Adicionar ícone em box (`Send` dentro de div com `bg-primary/10 rounded-lg`)
- Título + subtítulo empilhados, igual ao Campanhas
- Mover seletor de corretor para o lado direito
- Mover o "Próximo envio" para um badge inline no header (não uma linha separada)

#### 3. Unificar Stats Cards (estilo Campanhas)
- Substituir os 5 cards centrados grandes por cards inline compactos: ícone + número + label, no mesmo grid `grid-cols-2 sm:grid-cols-5`
- Usar a mesma estrutura: `flex items-center gap-3 p-3 rounded-xl bg-[#111114] border border-[#1e1e22]`

#### 4. Unificar Collapsible Triggers
- Adotar o padrão do Campanhas: `ChevronRight` que rotaciona 90°, dot colorido, label, badge à direita
- Substituir o `ChevronDown` + rotate-180 atual da Fila

#### 5. Refinar Empty State da Fila
- Espelhar o padrão do Campanhas: ícone em box arredondado com `bg-primary/10`, texto mais refinado

#### 6. Message Cards (PendingMessageCard / HistoryMessageCard)
- Ajustar backgrounds para `bg-[#111114]` e borders para `border-[#1e1e22]`
- Manter a estrutura funcional intacta (expandir, cancelar, retry)

### Arquivos alterados
- `src/components/whatsapp/QueueTab.tsx` — redesign visual completo (tokens, header, stats, collapsibles, empty state, message cards)

### O que NÃO muda
- Toda a lógica funcional (hooks, mutations, paginação, filtros)
- CampaignsTab permanece como está
- CampaignCard permanece como está

