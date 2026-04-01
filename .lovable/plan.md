

## Fix: Conversas do Plantão aparecem e somem ao abrir

### Causa raiz

Quando o `AdminPlantao` monta, o estado `myBrokerId` começa como `null`. A query de "novos" usa `brokerId: myBrokerId || undefined` — com `undefined`, o filtro de broker não é aplicado, então **todas** as conversas globais pendentes aparecem. Quando o `useEffect` de inicialização termina e seta o `myBrokerId` real, a query re-executa com o filtro correto, e as conversas que não são daquele broker desaparecem.

### Solução

Impedir que a query de "novos" execute até que `myBrokerId` esteja carregado. O hook `useConversations` já suporta `enabled: false` — basta usá-lo.

### Arquivo: `src/pages/AdminPlantao.tsx`

1. Criar um flag `isInitialized` (começa `false`, vira `true` ao final do `init`)
2. Na segunda chamada de `useConversations` (novos, linha 93-105), passar `enabled: isInitialized` para que não busque dados antes de saber quem é o admin
3. Na primeira chamada (linha 80-91), o `effectiveBrokerId === "__skip__"` já passa um UUID fake — mas também adicionar `enabled: selectedBrokerId !== "_loading"` para evitar fetch desnecessário

### O que NÃO muda
- Hook `use-conversations.ts`
- Lógica de filtro, realtime, tabs
- Toda a UI de renderização

