# Abrir conversa do lead ao clicar em "Chat"

## Problema

Na página do Lead (`LeadPage.tsx`), o botão **Chat** navega para `/corretor/inbox` (ou `/plantao`, e equivalentes admin) passando `?conversationId=<id>`. As páginas de Inbox/Plantão até tentam pré‑selecionar essa conversa, mas só procuram dentro da **aba ativa** (`activeConversations`). Se a conversa pertencer a outra aba (ex.: lead já em "Atendimento" enquanto a aba padrão é "Novos", ou conversa arquivada), o `find` falha, a URL é limpa e o usuário fica vendo apenas a lista — exatamente o comportamento reportado.

## Solução

Ao detectar o `conversationId` na URL, procurar a conversa em **todas as listas disponíveis**, identificar a aba correta, trocar de aba se necessário e então selecionar a conversa. Vale para corretor e admin, tanto em Inbox (instância pessoal) quanto em Plantão (instância global).

## Mudanças

Somente frontend, no `useEffect` que lê `conversationId` em cada página:

1. **`src/pages/BrokerInbox.tsx`** e **`src/pages/AdminInbox.tsx`**
   - Buscar o alvo em `allPersonalConversations` (lista completa, já inclui arquivados quando `isArchived`).
   - Determinar a aba pelo status da conversa:
     - `isWaitingPersonalAttendance(target)` → `"novos"`
     - `target.status === "archived"` → `"arquivados"`
     - caso contrário → `"atendimento"`
   - Se a aba detectada ≠ `activeTab`, chamar `setActiveTab(...)` e aguardar próximo render (não limpar a URL ainda). Quando `activeConversations` já contiver o alvo, selecionar e limpar `searchParams`.
   - Se a conversa não estiver carregada por estar arquivada (lista de arquivados só carrega quando a aba está ativa), trocar para `"arquivados"` primeiro; o próprio refetch da aba traz a conversa e o effect dispara de novo para selecionar.

2. **`src/pages/BrokerPlantao.tsx`** e **`src/pages/AdminPlantao.tsx`**
   - Procurar o alvo em `novosConversations` **e** em `conversations`.
   - Se estiver em `novosConversations`, setar `inboxTab = "novos"`; senão setar para a aba "atendimento" equivalente (mesmo valor já usado quando não é "novos").
   - Selecionar e limpar a URL após a aba estar correta e o alvo presente em `activeConversations`.

3. **Robustez do effect**
   - Remover a condição `!selectedConversation` para o caso especial de chegada via URL (apenas no primeiro disparo com `convId`), evitando que uma seleção residual impeça a troca para o lead recém‑aberto.
   - Manter o `setSearchParams({}, { replace: true })` apenas após selecionar com sucesso, para que trocas de aba assíncronas não percam o parâmetro.

4. **Botão Chat (`LeadPage.tsx`)** — sem alteração de rota necessária; o parâmetro `conversationId` já é suficiente assim que as páginas de destino passarem a respeitar abas diferentes.

## Fora de escopo

- Nenhuma mudança em RLS, edge functions, hooks de dados ou rotas.
- Sem alteração visual nas páginas de Inbox/Plantão.
