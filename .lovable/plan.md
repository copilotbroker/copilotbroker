
## Adicionar botões de filtro rápido abaixo da busca

### Resumo
Adicionar uma linha de botões-filtro "Não lidas | Etiquetas | Mais antigas" logo abaixo do campo de busca no `ConversationList`. Esses botões funcionam como toggles: ao clicar, filtram/ordenam a lista; ao clicar novamente, desativam o filtro.

### Alterações

**Arquivo: `src/components/inbox/ConversationList.tsx`**

1. Adicionar estado local `quickFilter` com valores `null | "unread" | "labels" | "oldest"`
2. Abaixo do `<Input>` de busca (após linha 251), renderizar 3 botões compactos em linha:
   - **Não lidas** (ícone `Eye`) — filtra para exibir apenas conversas com `unread_count > 0`
   - **Etiquetas** (ícone `Tag`) — filtra para exibir apenas conversas cujo `lead_id` possui etiquetas vinculadas (via consulta em `lead_whatsapp_labels`)
   - **Mais antigas** (ícone `Clock`) — inverte a ordenação para mostrar mensagens mais antigas primeiro
3. Aplicar o filtro no `sortedConversations` (useMemo):
   - `"unread"`: filtrar `conv.unread_count > 0`
   - `"labels"`: filtrar `conv.lead_id` presente em set de leads com etiquetas (fetch similar ao `cadenciaLeadIds`)
   - `"oldest"`: inverter sort para `aTime - bTime`
4. Estilo dos botões: `variant="outline"` compacto, com destaque (bg-primary) quando ativo

### Detalhes Técnicos
- Busca de leads com etiquetas via `useEffect` consultando `lead_whatsapp_labels` (similar ao padrão de `cadenciaLeadIds`)
- Componente compartilhado por todos os perfis (admin, líder, corretor) e ambas as telas (Meu WhatsApp e WhatsApp do Plantão)
- Reset do `quickFilter` para `null` quando a aba muda (para evitar filtros cruzados)
