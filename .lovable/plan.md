
Objetivo
- Fazer o horário da última mensagem aparecer de forma consistente ao lado do nome na lista do Inbox.
- Remover a “origem”/identificação secundária atual que polui o card.
- Manter apenas o status útil de vínculo com o Kanban: vinculado ou não vinculado.

Diagnóstico
- O horário já existe no `ConversationList.tsx`, mas pelo preview ele não está aparecendo visualmente no card.
- A lista hoje ainda mostra badges de identificação como `WhatsApp direto` e `Nome identificado`, que funcionam como “origem” e deixam o card mais carregado.
- A ordenação por mais recente já está correta no hook e também no sort local.

O que vou ajustar
1. Garantir exibição do horário
- Revisar o header do card em `src/components/inbox/ConversationList.tsx`.
- Ajustar largura, truncamento e alinhamento para que:
  - nome fique à esquerda
  - horário fique sempre visível à direita
- Se necessário, reduzir a largura útil do nome e reservar espaço fixo para o horário.

2. Simplificar os badges do card
- Remover badges de origem/identificação:
  - `WhatsApp direto`
  - `Nome identificado`
- Substituir por um status binário e mais claro:
  - `Lead vinculado` quando houver `lead_id`
  - `Sem card no Kanban` quando não houver vínculo

3. Preservar o restante do card
- Manter preview da última mensagem
- Manter unread count
- Manter sinais operacionais relevantes como:
  - mídia
  - risco
  - piloto automático
  - quente
  - tempo parado
- Sem mexer na lógica de identificação persistente do contato

Arquivos a revisar
- `src/components/inbox/ConversationList.tsx`

Abordagem técnica
- Reestruturar o bloco superior do item com `flex` para o horário ter espaço reservado.
- Usar `truncate` apenas no nome, não no container inteiro.
- Trocar a lógica visual dos badges para exibir somente o estado de vínculo com Kanban.
- Não alterar backend nem hooks, porque os dados necessários já existem.

Resultado esperado
- O horário passa a aparecer claramente ao lado do nome.
- O card fica mais clean.
- O usuário entende rapidamente se a conversa está vinculada ao Kanban ou não.
