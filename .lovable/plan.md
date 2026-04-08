

## Estilo visual Purple para mensagens do WhatsApp Pessoal

### Resumo
Aplicar tons de roxo (purple) nas mensagens enviadas pelo WhatsApp Pessoal, espelhando o tratamento visual verde usado para mensagens do Plantão. Isso inclui: balões de mensagem, badges de instância, divisores de troca de instância e avatares na lista de conversas.

### Alterações

**1. ConversationThread.tsx - Balões e badges de mensagem**

- **Balão outbound pessoal** (linha ~616): trocar `border-border bg-muted` por `border-purple-500/30 bg-purple-900/20`
- **Badge "Pessoal"** (linha ~628): trocar `text-blue-400` por `text-purple-400`
- **Divisor de instância pessoal** (linhas ~576-593): usar `border-purple-500/30 bg-purple-500/10 text-purple-400` em vez do amarelo primary genérico, mantendo verde para global com `border-emerald-500/30 bg-emerald-500/10 text-emerald-400`

**2. ConversationList.tsx - Avatar e badges na lista**

- **Avatar pessoal** (linhas ~479-484): trocar `bg-muted` por `bg-purple-900/60 text-purple-400` para conversas pessoais (non-global), espelhando o tratamento `bg-emerald-900/60 text-emerald-400` do global
- Manter o avatar de iniciais com a cor roxa para instâncias pessoais

### Detalhes Técnicos

Todas as alterações são puramente visuais (classes CSS Tailwind), sem impacto funcional. As cores usadas:
- `purple-900/20` - fundo do balão
- `purple-500/30` - borda do balão e divisores
- `purple-400` - texto de badges e labels
- `purple-900/60` - fundo do avatar na lista

