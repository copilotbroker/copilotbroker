
Objetivo
- Fazer a data/hora da última interação aparecer de forma confiável em todos os cards da lista do Inbox.
- Aplicar a regra de exibição:
  - mesmo dia: `HH:mm`
  - ontem: `Ontem`
  - mais de 1 dia: `DD/MM`
- Considerar concluído só quando o valor estiver realmente visível no card ao lado do nome.

Diagnóstico provável
- O layout atual já tenta renderizar `last_message_at`, então o problema parece ser um destes:
  1. o campo está chegando `null`/inconsistente em parte dos registros
  2. o card não está reservando espaço visual suficiente para o timestamp
  3. a lista está usando só `conversations.last_message_at`, mas há casos em que a interação mais recente existe apenas em `conversation_messages`
- Pelo screenshot, o horário não está aparecendo em nenhum card, então preciso tratar tanto a fonte do dado quanto a renderização.

O que vou revisar
1. Fonte do timestamp
- Auditar `use-conversations.ts` para confirmar como `last_message_at` chega e como a deduplicação por telefone preserva esse campo.
- Se necessário, adotar fallback consistente, nesta ordem:
  - `last_message_at`
  - `updated_at`
  - timestamp da mensagem mais recente, se já houver disponível/viável no fluxo atual

2. Formatação da exibição
- Criar uma função local de formatação no `ConversationList.tsx`:
  - hoje => `HH:mm`
  - ontem => `Ontem`
  - anterior => `DD/MM`
- Garantir comparação correta por dia local, evitando erro em virada de data.

3. Layout do cabeçalho do card
- Reestruturar a linha superior para reservar espaço fixo ao timestamp.
- Nome com `truncate` apenas na área esquerda.
- Timestamp com largura mínima fixa, `shrink-0`, alinhado à direita e sempre visível.

4. Preservar limpeza visual
- Manter removida a segunda linha de telefone.
- Manter badge binário do Kanban:
  - `Lead vinculado`
  - `Sem card no Kanban`
- Não reintroduzir “origem” do lead.

Arquivos a ajustar
- `src/hooks/use-conversations.ts`
- `src/components/inbox/ConversationList.tsx`

Abordagem técnica
- Validar se a query já ordena por `last_message_at desc` e se a deduplicação mantém o timestamp mais recente.
- Se houver buracos no dado, complementar a resolução do timestamp no hook antes de entregar `conversations` para a UI.
- No componente, substituir o `format(..., "HH:mm")` atual por uma função de exibição contextual.
- Ajustar o container do nome/tempo para impedir que o horário suma por truncamento.

Validação após implementação
- Conferir na rota atual `/corretor/inbox`.
- Verificar visualmente que cada card mostra um dos 3 formatos:
  - `14:35`
  - `Ontem`
  - `08/03`
- Validar que o timestamp aparece ao lado do nome, não abaixo nem oculto.
- Confirmar que a ordenação continua por interação mais recente primeiro.
