
Objetivo
- Limpar visualmente os cards da lista do Inbox sem mexer na lógica da conversa:
  - remover a segunda linha com telefone
  - manter o horário da última mensagem alinhado à direita
  - garantir ordenação padrão por interação mais recente primeiro

O que vou ajustar
1. Lista de conversas
- Remover do card a linha secundária que hoje mostra `conv.phone`.
- Manter no topo apenas:
  - nome resolvido do contato
  - horário da última mensagem, alinhado à direita
- Preservar abaixo apenas o preview da última mensagem e os badges úteis.

2. Horário da última mensagem
- Trocar a exibição relativa (“há X tempo”) por horário objetivo da última interação no card, para leitura mais limpa.
- Usar o campo já existente `last_message_at`, exibindo só hora/minuto no mesmo bloco do nome.

3. Ordenação padrão
- Confirmar e preservar `recent` como modo inicial da lista.
- Garantir que o sort “Mais recentes” continue usando `last_message_at` em ordem decrescente, para deixar explícito e consistente com o comportamento esperado.

Arquivos a revisar
- `src/components/inbox/ConversationList.tsx`
- `src/hooks/use-conversations.ts`

Abordagem técnica
- Em `ConversationList.tsx`:
  - remover o `<span>` da segunda linha com telefone
  - ajustar o header do item para ficar com `leadName` à esquerda e horário fixo à direita
  - substituir `formatDistanceToNow(...)` por formatação de hora curta
  - explicitar a ordenação do caso `"recent"` para `last_message_at` decrescente
- Em `use-conversations.ts`:
  - validar que a query principal já traz as conversas em `last_message_at desc` e manter isso como base

Resultado esperado
- Cards mais compactos e clean
- Nome ganha mais destaque
- Horário fica mais escaneável
- Lista abre naturalmente nas conversas mais recentes, sem ruído visual
