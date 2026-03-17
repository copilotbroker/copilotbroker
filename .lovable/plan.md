

## Análise de Consumo de Memória — KanbanCard

Identifiquei **6 problemas concretos** que explicam o consumo excessivo de RAM ao rolar o Kanban. Nenhuma mudança de lógica é necessária — são otimizações puramente estruturais.

---

### Problemas Encontrados

**1. LeadLabelsPicker dispara 2 queries por card visível**
Cada card monta um `useLeadWhatsAppLabels` que faz 2 chamadas ao banco: uma para labels do broker e outra para labels do lead. Com 6 colunas × ~5 cards visíveis (overscan incluso) = ~60 queries ativas simultâneas, cada uma mantendo dados em cache do React Query.

**2. Cada card instancia um Calendar completo (date-fns)**
O componente `Calendar` do scheduler de WhatsApp é montado dentro de um Popover para **todos** os cards, mesmo sem o usuário abrir o compositor. O `Calendar` importa date-fns e cria centenas de objetos Date internamente.

**3. Estado do compositor inicializado eagerly**
Linhas 116-117: `new Date()`, `format(new Date(...))` são chamados no mount de **cada card**, mesmo que o compositor nunca seja aberto. Isso gera objetos desnecessários.

**4. KanbanCard não usa React.memo**
O componente re-renderiza toda vez que o parent (virtualizer) recalcula, mesmo que as props não tenham mudado. Cada re-render recria closures e objetos internos.

**5. Múltiplas instâncias de TooltipProvider por card**
Cada card cria 2-3 `TooltipProvider` independentes (copiloto ativo, origem, etc). O Radix TooltipProvider mantém listeners e timers globais — multiplicados por dezenas de cards.

**6. AlertDialog (excluir) montado em todos os cards**
O `AlertDialogContent` com overlay/animação é montado no DOM para cada card que tem `onDelete`, mesmo sem interação.

---

### Plano de Otimização

**Arquivo: `src/components/crm/KanbanCard.tsx`**

1. **Envolver com `React.memo`** — comparação shallow das props evita re-renders desnecessários quando o virtualizer recalcula posições.

2. **Lazy-load do compositor de WhatsApp** — extrair todo o bloco do Popover (compositor + Calendar + scheduler) para um componente separado que só monta quando `composerOpen === true`. Isso elimina o Calendar e os estados de scheduling de cards fechados.

3. **Defer estado do compositor** — mover `scheduleDate` e `scheduleTime` para dentro do componente lazy, removendo `new Date()` e `format()` do mount inicial.

4. **Lazy-load do AlertDialog de exclusão** — renderizar o conteúdo do AlertDialog apenas quando o trigger é clicado (padrão controlled), evitando overlays pré-montados.

5. **Remover TooltipProvider por card** — usar um único `TooltipProvider` no nível da coluna (`KanbanColumn.tsx`) e remover as instâncias individuais dos cards.

**Arquivo: `src/components/crm/KanbanColumn.tsx`**

6. **Envolver a coluna com um único `TooltipProvider`** — substitui os múltiplos providers dos cards.

**Arquivo: `src/components/crm/LeadLabelsPicker.tsx`**

7. **Lazy-load das queries** — no modo `compact` (usado no Kanban), não disparar as queries de labels até que o Popover seja aberto. Usar `enabled: open` no `useQuery` para que os dados só sejam buscados sob demanda.

---

### Impacto Estimado

| Otimização | Economia por card | Com 30 cards visíveis |
|---|---|---|
| Memo (evita re-render) | ~50% menos GC pressure | Significativo ao rolar |
| Lazy Calendar | ~200KB de objetos Date | ~6MB por coluna |
| Lazy AlertDialog | ~10KB DOM nodes | ~300KB |
| Lazy Labels queries | 2 queries eliminadas | 60 queries a menos |
| TooltipProvider único | ~5KB listeners | ~150KB |

**Resultado**: Redução substancial de memória sem qualquer mudança de funcionalidade. Os componentes pesados só são instanciados quando o usuário interage com o card específico.

---

### Arquivos a alterar

- `src/components/crm/KanbanCard.tsx` — memo, lazy compositor, lazy alert, remover TooltipProviders
- `src/components/crm/KanbanColumn.tsx` — adicionar TooltipProvider wrapper
- `src/components/crm/LeadLabelsPicker.tsx` — lazy queries no modo compact

