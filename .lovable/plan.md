

## Melhorar Percepção de Carregamento das Abas Copiloto

### Diagnóstico

As abas **Campanhas** e **Fila** usam React Query (`useQuery`), que mantém os dados em cache. Ao trocar de aba e voltar, os dados aparecem instantaneamente (cache) enquanto revalida em background — experiência "já carregada".

As abas **Conexão**, **Copiloto**, **Segurança** e **Follow-up** usam hooks manuais (`useState` + `useEffect` + fetch), que:
- Resetam o estado toda vez que o componente monta
- Mostram spinner de loading do zero a cada visita
- Não possuem cache

### Solução

Migrar os 3 hooks problemáticos para React Query, ganhando cache automático + `staleTime` + revalidação em background.

#### 1. Refatorar `use-whatsapp-instance.ts`
- Extrair o fetch de status para um `useQuery` com `queryKey: ["whatsapp-instance"]` e `staleTime: 30_000` (30s)
- As mutations (init, logout, restart, delete, togglePause, updateSettings) continuam como funções que invalidam o cache via `queryClient.invalidateQueries(["whatsapp-instance"])`
- O QR code e pairing code permanecem em `useState` local (são efêmeros)
- Resultado: aba Conexão e Segurança carregam instantaneamente na segunda visita

#### 2. Refatorar `use-copilot.ts` (`useCopilotConfig`)
- Trocar `useState` + `useEffect` + `fetchConfig()` por `useQuery({ queryKey: ["copilot-config", brokerId], staleTime: 60_000 })`
- `saveConfig` e `deleteConfig` invalidam `["copilot-config", brokerId]`
- Resultado: aba Copiloto carrega instantaneamente na segunda visita

#### 3. Refatorar `use-auto-cadencia-rules.ts`
- Trocar `useState` + `useEffect` + `fetchRules()` por `useQuery({ queryKey: ["auto-cadencia-rules", brokerId], staleTime: 30_000 })`
- Mutations (toggle, delete, create, update) invalidam o cache
- Resultado: aba Follow-up carrega instantaneamente na segunda visita

### Arquivos alterados
- `src/hooks/use-whatsapp-instance.ts` — migrar fetch de status para React Query
- `src/hooks/use-copilot.ts` — migrar para React Query
- `src/hooks/use-auto-cadencia-rules.ts` — migrar para React Query
- `src/components/whatsapp/ConnectionTab.tsx` — ajustar referência ao loading (minor)
- `src/components/whatsapp/SecurityTab.tsx` — remover query redundante de broker (já vem do hook)

### O que NÃO muda
- Toda a lógica funcional e UI existente
- As abas Campanhas e Fila (já otimizadas)
- A estrutura de tabs nos pages

