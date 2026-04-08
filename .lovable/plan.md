

## Redesenhar os botões Chat e WhatsApp na página do Lead

### Problema
Os dois botões "Chat" e "WhatsApp" na página do Lead são confusos — ambos usam o ícone `MessageCircle` e não fica claro o que cada um faz.

### Solução
Transformar os dois botões em funções distintas e claras:

**Botão 1 — "Chat" → Abre a conversa dentro da plataforma**
- Identifica se a conversa vinculada (`linkedConversation`) é da instância global ou pessoal
- Se `source_instance = 'global'`: navega para a rota do Plantão com o `conversationId`
  - Admin: `/admin/plantao?conversationId={id}`
  - Broker: `/corretor/plantao?conversationId={id}`
- Se `source_instance = 'personal'` (ou null): navega para o Inbox pessoal
  - Admin: `/admin/inbox?conversationId={id}`
  - Broker: `/corretor/inbox?conversationId={id}`
- Cor: verde se global, roxo se pessoal (mantém a semântica visual existente)
- Ícone: `MessageCircle`
- Se não houver conversa vinculada, o botão não aparece (comportamento atual)

**Botão 2 — "WhatsApp" → Abre link externo wa.me**
- Sempre visível
- Abre `https://wa.me/55{phone}` em nova aba (link externo)
- Ícone: `ExternalLink` (já importado)
- Cor: verde WhatsApp neutra
- Não faz nenhuma lógica de iniciar atendimento ou scroll — apenas link externo

### Arquivo
- `src/pages/LeadPage.tsx` — linhas ~480-518: substituir a lógica dos dois botões

### Detalhes
- O botão "WhatsApp" atual (que faz scroll para o formulário de mensagem inline) será substituído pelo link externo
- A funcionalidade de enviar mensagem inline continua disponível na seção de mensagem mais abaixo na página
- O role do usuário (`role` já disponível no componente) determina o prefixo da rota (`/admin/` vs `/corretor/`)

