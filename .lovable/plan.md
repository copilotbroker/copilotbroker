
Objetivo
- Reverter apenas a parte visual de cores da Inbox para a paleta anterior, preservando as melhorias funcionais já implementadas em nomes, mídia, status e produtividade.

O que identifiquei
- A mudança principal de paleta veio do uso mais agressivo dos tokens globais atuais:
  - `bg-accent`, `text-primary`, `bg-primary/15`, `bg-muted/30`, `border-primary/30`
- Na Inbox isso fez o amarelo ganhar muito destaque em áreas que antes eram mais neutras/dark.
- O problema não parece ser estrutural do tema global, e sim como `ConversationList.tsx` e `ConversationThread.tsx` passaram a consumir esses tokens.

Plano de reversão
1. Restaurar a hierarquia visual anterior da Inbox
- Voltar a lista e a thread para base escura/neutra.
- Deixar o amarelo somente como cor de destaque pontual:
  - conversa selecionada
  - botão principal
  - badges realmente prioritários
  - ícones/estados estratégicos

2. Reverter os pontos mais sensíveis na lista de conversas
- Reduzir o uso de amarelo em:
  - avatar
  - cards KPI
  - filtros ativos
  - item selecionado
  - contadores e ícones
- Retornar para cards em tons de `card`, `muted`, `border` e usar highlight mais contido.

3. Reverter os pontos mais sensíveis na thread
- Ajustar:
  - header da conversa
  - avatar superior
  - badges de status/tipo
  - fundo das bolhas
  - estados de mídia/documento
- Manter leitura clean, com contraste bom e visual mais sóbrio, no padrão dark do CRM.

4. Preservar as melhorias recentes
- Não mexer na lógica de:
  - `display_name`
  - `sender_name`
  - mídia
  - realtime/status
  - criação de lead
- A mudança será visual, não funcional.

Arquivos a ajustar
- `src/components/inbox/ConversationList.tsx`
- `src/components/inbox/ConversationThread.tsx`

Abordagem técnica
- Trocar classes que hoje puxam muito `primary/accent` por combinações mais neutras:
  - `bg-card`
  - `bg-muted/40`
  - `hover:bg-muted/60`
  - `border-border`
  - `text-foreground`
  - `text-muted-foreground`
- Reservar `primary` para poucos pontos de ação e feedback.
- Evitar mexer no `src/index.css` global, a menos que eu encontre algum ajuste realmente necessário e isolado da Inbox.

Resultado esperado
- A Inbox volta a ter a sensação visual anterior: mais dark, elegante e discreta.
- As funcionalidades novas permanecem intactas.
- O amarelo deixa de “dominar” a tela e passa a atuar só como cor de destaque.

Validação após implementação
- Conferir visual em `/corretor/inbox` no desktop atual.
- Verificar especialmente:
  - item selecionado da lista
  - KPIs
  - filtros
  - header da conversa
  - bolhas e badges
  - composer/anexos
