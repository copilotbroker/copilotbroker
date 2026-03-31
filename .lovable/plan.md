

## Acelerar Carregamento das Cadências Salvas

### Diagnóstico

O hook `useUserRole()` usa `useState` + `useEffect` com auth listener — cada componente que o chama inicia com `brokerId: null` e `isLoading: true`. Isso atrasa o início da query de cadências porque ela tem `enabled: !!brokerId`.

A sequência atual é:
1. Componente monta → `brokerId = null` (query desabilitada)
2. Auth listener dispara → busca role + broker no Supabase (~200-500ms)
3. `brokerId` resolve → query de cadências inicia → busca regras + contagem de steps (~300-500ms)
4. Total: ~500ms-1s de spinner antes dos dados aparecerem

### Solução

Migrar `useUserRole` para React Query, tornando o `brokerId` disponível instantaneamente (via cache) em qualquer componente após a primeira resolução.

### Arquivo: `src/hooks/use-user-role.ts`

1. Substituir `useState` + `useEffect` + auth listener por `useQuery` com:
   - `queryKey: ["user-role"]`
   - `staleTime: 5 * 60 * 1000` (5 min — role raramente muda)
   - `queryFn` que faz `supabase.auth.getUser()` e depois busca roles + broker em paralelo (mesma lógica atual)
2. Manter o auth listener apenas para invalidar o cache em `SIGNED_IN` / `SIGNED_OUT` (não para refetch completo)
3. Retornar a mesma interface `{ role, isLoading, brokerId, isLeader }`

### Resultado esperado
- Na primeira visita: comportamento igual ao atual
- Em visitas subsequentes (troca de aba e volta): `brokerId` disponível instantaneamente do cache → query de cadências dispara imediatamente com dados cacheados → **zero spinner**

### Arquivos alterados
- `src/hooks/use-user-role.ts` — migrar para React Query

### O que NÃO muda
- Interface pública do hook (mesmos campos retornados)
- Todos os componentes consumidores continuam funcionando sem alteração
- Lógica de roles e permissões

