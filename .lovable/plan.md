

## Acelerar Carregamento dos Botões da Sidebar (Inbox, Copiloto)

### Diagnóstico

O hook `useBrokerFeatures` usa `useState` + `useEffect` manual. Cada vez que um componente monta, ele começa com `inboxEnabled=false` e `copilotEnabled=false`, fazendo os botões de Inbox e Copiloto ficarem invisíveis até a query completar (~300-500ms). Isso causa o "atraso" visível na aparição desses botões.

O mesmo problema afeta `useInboxUnread` — também usa `useState` + `useEffect` sem cache.

### Solução

Migrar ambos os hooks para React Query, garantindo que os dados fiquem em cache entre navegações.

### Arquivo 1: `src/hooks/use-broker-features.ts`
- Substituir `useState`/`useEffect` por `useQuery` com `queryKey: ["broker-features", brokerId]`
- `staleTime: 5 * 60 * 1000` (features raramente mudam)
- `enabled: !!brokerId`
- Valores default enquanto carrega: `inboxEnabled: false, copilotEnabled: false`

### Arquivo 2: `src/hooks/use-inbox-unread.ts`
- Substituir `useState`/`useEffect` por `useQuery` com `queryKey: ["inbox-unread"]`
- `staleTime: 30_000` (30s)
- `refetchInterval: 30_000` (substitui o realtime channel por polling leve)
- Manter o realtime channel apenas para invalidar o cache (não para fetch manual)

### Resultado esperado
- Primeira visita: comportamento igual ao atual
- Navegações subsequentes: botões Inbox e Copiloto aparecem instantaneamente do cache, sem flicker

### Arquivos alterados
- `src/hooks/use-broker-features.ts`
- `src/hooks/use-inbox-unread.ts`

### O que NÃO muda
- Interface pública dos hooks
- Componentes consumidores (BrokerBottomNav, BrokerSidebar, BrokerLayout)
- Lógica de realtime para notificações

