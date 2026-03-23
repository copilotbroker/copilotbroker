

# Trocar botão "+" por lupa no header mobile

## Mudança

No `src/components/broker/BrokerHeader.tsx`, o botão quadrado `+` (linhas 42-50) será substituído por um botão de lupa (`Search`) que, ao ser clicado, expande o conteúdo colapsável (roletas + busca + filtros) — o mesmo comportamento do chevron.

### `src/components/broker/BrokerHeader.tsx`

1. Remover o bloco do botão `+` com `onAddLead` (linhas 42-50)
2. Adicionar um botão com ícone `Search` no mesmo local, que ao clicar faz `setIsExpanded(!isExpanded)` — abrindo/fechando o painel colapsável com busca e filtros
3. O botão terá estilo ghost/sutil para combinar com o header

O chevron ao lado do título permanece como indicador visual do estado expandido/colapsado.

