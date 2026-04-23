
## Restringir aba "Novos" para outros corretores em "Meu WhatsApp"

Atualmente, na página **Meu WhatsApp** (`/admin/inbox` para admin e `/corretor/inbox` para corretores/líderes), quando um administrador ou líder seleciona outro corretor no filtro, ele consegue ver tanto a aba **Novos** quanto a aba **Atendimento** desse corretor. A aba "Novos" representa conversas WhatsApp pessoais ainda não vinculadas a um lead — informação privada do corretor.

A regra correta é:
- **Aba Atendimento**: admin pode ver de qualquer corretor; líder pode ver dos corretores da sua equipe (mantém comportamento atual).
- **Aba Novos**: apenas o próprio corretor visualiza suas conversas novas. Admin/líder só veem suas próprias conversas novas (quando eles mesmos atuam como corretor).

A página **WhatsApp do Plantão** (`/admin/plantao` e `/corretor/plantao`) permanece **inalterada**.

### Mudanças

**1. `src/pages/AdminInbox.tsx`**
- Quando `selectedBrokerId !== myBrokerId` (admin está olhando outro corretor) e `activeTab === "novos"`:
  - Forçar a lista de conversas exibidas a ser vazia (`activeConversations = []`).
  - Esconder a contagem da aba "Novos" para esse corretor (passar `brokerNovosCount={0}`).
- Em `handleBrokerFilterChange`: se o admin selecionar outro corretor enquanto está na aba "Novos", redirecionar automaticamente para a aba "Atendimento" (já existe a lógica reversa em `handleTabChange`; complementar com a inversa).

**2. `src/pages/BrokerInbox.tsx`**
- Aplicar a mesma regra para líderes: quando `isLeader && selectedBrokerId !== brokerId` e `activeTab === "novos"`:
  - `activeConversations = []`
  - `brokerNovosCount={0}`
- Em `handleBrokerFilterChange` (criar função análoga): se o líder selecionar um membro da equipe enquanto está em "Novos", forçar mudança para "Atendimento".
- Manter o comportamento atual quando o usuário (admin/líder) está vendo a si mesmo: a aba "Novos" funciona normalmente.

### Observação técnica
Não é necessária mudança em RLS, pois a restrição é apenas de UX/visibilidade na interface. Os dados continuam acessíveis ao admin/líder pelo banco (necessário para a aba Atendimento), apenas a aba "Novos" filtra na camada do front-end quando o corretor selecionado não é o próprio usuário.
