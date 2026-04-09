

## Substituir aba "Equipe" por seletor de corretor na aba "Atendimento"

### Problema
1. Líderes na Inbox pessoal estão vendo conversas de **todos** os corretores na aba Equipe, quando deveriam ver apenas os da sua equipe (RLS filtra, mas a UI não restringe corretamente a lista de opções)
2. A aba "Equipe" separada adiciona complexidade desnecessária — o mesmo objetivo pode ser atingido com um seletor de corretor dentro da aba "Atendimento"

### Solução
Remover a aba "Equipe" e adicionar um **seletor de corretor** dentro da aba "Atendimento" para admin e líder. O seletor vem pré-selecionado no próprio usuário. Ao mudar, busca conversas pessoais daquele corretor (com lead_id).

### Mudanças

**1. `src/hooks/use-conversations.ts`**
- Remover `"equipe"` do tipo `BrokerInboxTab` (volta a ser `"novos" | "atendimento" | "arquivados"`)
- Remover lógica de `teamMode` — substituir por: quando `brokerId` for passado (qualquer corretor), buscar conversas daquele corretor normalmente (RLS já garante acesso)
- Manter o parâmetro `teamBrokerFilter` renomeado para algo como `overrideBrokerId` ou simplesmente usar o `brokerId` existente

**2. `src/pages/AdminInbox.tsx`**
- Remover estado `isEquipe`, a segunda chamada de `useConversations` com `teamMode`, e a aba "equipe"
- Adicionar estado `selectedBrokerId` (default: `myBrokerId`)
- Passar `selectedBrokerId` como `brokerId` na chamada principal de `useConversations`
- Passar lista de corretores + seletor para `ConversationList`
- Na aba "Atendimento": mostrar seletor com "Todos os corretores" + lista de corretores

**3. `src/pages/BrokerInbox.tsx`**
- Remover lógica de `isEquipe` e segunda chamada de `useConversations` com `teamMode`
- Para líderes (`isLeader`): adicionar `selectedBrokerId` (default: próprio `brokerId`)
- Na aba "Atendimento": mostrar seletor apenas para líderes, com opções limitadas aos membros da equipe (RLS já garante isso no backend)

**4. `src/components/inbox/ConversationList.tsx`**
- Remover aba "Equipe" e props relacionadas (`showEquipeTab`, `brokerEquipeCount`)
- Mover o seletor de corretor para dentro da aba "Atendimento" — visível apenas quando `brokerInboxTab === "atendimento"` e o seletor de corretores estiver disponível
- Renomear/simplificar props: `teamBrokerFilter` → `brokerFilter`, `teamBrokerOptions` → `brokerOptions`
- O badge de corretor nas conversas continua aparecendo quando o corretor selecionado não é o próprio usuário

### Fluxo resultante
- Admin abre Inbox pessoal → aba "Atendimento" pré-selecionada com ele mesmo → vê suas conversas → pode trocar o seletor para qualquer corretor
- Líder abre Inbox pessoal → aba "Atendimento" pré-selecionada com ele mesmo → pode trocar para corretores da sua equipe
- Corretor normal → sem seletor, vê apenas as próprias conversas (comportamento atual)

### O que NÃO muda
- RLS policies (já cobrem admin e líder)
- Tipo `BrokerInboxTab` simplifica removendo `"equipe"`
- Aba "Novos" e "Arquivados" continuam iguais

