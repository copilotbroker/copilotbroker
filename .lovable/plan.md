
Objetivo

Adicionar um sistema de etiquetas de WhatsApp com sincronização bidirecional usando as etiquetas já existentes da instância do próprio corretor, começando pelo card do Kanban e preparado para depois aparecer também no Inbox e na página do lead.

O que encontrei no projeto

- Já existe infraestrutura forte de WhatsApp por corretor, com instâncias isoladas em `broker_whatsapp_instances`.
- O envio e recebimento passam por funções backend já integradas ao provedor atual.
- Hoje não existe estrutura de “etiquetas/tags” no frontend nem no banco para leads/conversas.
- Também não encontrei nenhum endpoint já implementado para listar/aplicar/remover etiquetas do provedor.
- Portanto, o ponto crítico é validar se a API do provedor atual realmente expõe operações de etiquetas por chat/contato.

Decisão validada

- Fonte das etiquetas: WhatsApp
- Comportamento: bidirecional
- Escopo inicial: Kanban

Plano de implementação

1. Fazer uma etapa de compatibilidade com o provedor
- Inspecionar a documentação/endpoints reais do provedor de WhatsApp usado pela instância.
- Confirmar 3 operações mínimas:
  - listar etiquetas disponíveis da instância,
  - listar etiquetas aplicadas a um contato/chat,
  - aplicar/remover etiqueta em um contato/chat.
- Se a API não suportar isso, eu mudaria para um plano B: etiquetas internas no CRM, sem prometer sincronização nativa.

2. Criar modelo local de espelhamento das etiquetas
- Adicionar tabelas para:
  - catálogo de etiquetas por corretor/instância,
  - vínculo de etiquetas com leads,
  - vínculo de etiquetas com conversas.
- Manter isso sincronizado com o WhatsApp para a UI ser rápida e consistente.
- Como lead e conversa podem existir separadamente, vou espelhar em ambos para evitar desencontro visual entre Kanban e Inbox.

3. Implementar funções backend de sincronização
- Criar funções para:
  - buscar etiquetas disponíveis da instância,
  - buscar etiquetas de um chat/telefone,
  - aplicar etiqueta,
  - remover etiqueta,
  - reconciliar estado local com o estado externo.
- Essas funções usarão a instância do corretor correta, respeitando o isolamento multi-tenant já existente.

4. Adicionar UI no card do Kanban
- Transformar o ponto de etiqueta em um seletor leve no card:
  - abrir popover,
  - listar etiquetas existentes,
  - permitir marcar/desmarcar,
  - mostrar chips visíveis no card.
- A ação no card atualiza o WhatsApp e depois reflete no CRM.
- Também vou prever estados de loading/erro por etiqueta para não travar o card inteiro.

5. Propagar para Lead Page e Inbox
- Reaproveitar o mesmo seletor de etiquetas depois no cabeçalho da conversa e no topo da página do lead.
- As três telas lerão da mesma fonte local sincronizada para manter consistência visual.

6. Sincronização e consistência
- Ao abrir Kanban/Inbox/Lead, carregar etiquetas locais.
- Ao etiquetar manualmente no CRM, enviar ao WhatsApp e atualizar localmente.
- Ao receber eventos ou em refresh manual/polling leve, reconciliar mudanças feitas fora do CRM.
- Se o provedor não enviar webhook para etiquetas, usarei refresh sob demanda e sincronização ao abrir a entidade.

7. Segurança e permissões
- Corretores só podem ver/editar etiquetas das suas próprias conversas/leads.
- Admin pode visualizar conforme a lógica já existente do projeto.
- Toda ação vai respeitar o `broker_id` da instância do corretor.

Arquivos que eu provavelmente alteraria

- `src/components/crm/KanbanCard.tsx`
- `src/components/inbox/ConversationThread.tsx`
- `src/pages/LeadPage.tsx`
- `src/hooks/use-conversations.ts`
- novos hooks/components reutilizáveis para seletor de etiquetas
- novas funções backend para integração com o provedor

Mudanças de banco esperadas

- Sim, aqui eu recomendo estrutura própria, porque hoje não existe modelo para etiquetas.
- Prováveis tabelas:
  - catálogo de etiquetas por corretor,
  - relação lead-etiqueta,
  - relação conversa-etiqueta,
  - opcionalmente log/sync state para reconciliação.

Detalhes técnicos importantes

- O maior risco não é UI; é a capacidade real do provedor atual de manipular etiquetas de WhatsApp via API.
- Como você pediu sincronização bidirecional com etiquetas já existentes no WhatsApp do usuário, eu só implementaria isso se a API suportar de fato leitura + escrita de etiquetas.
- Se suportar apenas leitura, o plano muda para “importação + exibição”.
- Se não suportar etiquetas nativas, o plano B mais seguro é criar etiquetas internas do CRM com aparência semelhante, mas deixando claro que não são as etiquetas nativas do WhatsApp.

Resultado esperado

- No Kanban, o usuário abre um seletor de etiquetas no card.
- Vê as etiquetas já existentes do seu WhatsApp.
- Pode aplicar/remover do lead/conversa sem sair do CRM.
- As etiquetas aparecem como chips no card e ficam prontas para também aparecer no Inbox e na página do lead.
- O estado local permanece sincronizado com o estado real do WhatsApp do corretor, desde que a API do provedor suporte isso.

Se eu implementar, minha primeira entrega recomendada seria:
1. compatibilidade com o provedor + estrutura backend,
2. UI no Kanban,
3. depois expandir para Inbox e Lead Page.

Seção técnica
- Não encontrei integração pronta de etiquetas no código atual.
- Não encontrei evidência de endpoints de etiquetas nas funções backend já existentes.
- Portanto, a primeira etapa obrigatória do trabalho é uma validação técnica do provedor antes de prometer sincronização nativa.
- Se essa validação for positiva, a solução é viável e encaixa bem na arquitetura atual.
