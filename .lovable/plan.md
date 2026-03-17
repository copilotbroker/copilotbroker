
Objetivo

Fechar de vez a inconsistência: qualquer lead com campanha rodando ou mensagem futura pendente deve aparecer somente em “Copiloto Ativo”, com botão “Parar”, em todo o CRM.

O que encontrei agora

- A reconciliação do Kanban existe em `use-kanban-column.ts` e está funcionando parcialmente.
- O card mostra “Parar” via `hasAutomacaoAtiva`, mas esse estado vem de um fetch separado em `KanbanBoard.tsx`.
- Hoje há duas fontes de verdade paralelas:
  1. `useKanbanColumn()` decide em qual coluna o lead entra.
  2. `KanbanBoard` mantém `activeAutomationLeadIds` / `cadenciaLeadIds` para destaque e botão.
- Isso abre espaço para dessincronia visual.
- No banco, existem leads com fila ativa e status ainda `info_sent`, então a UI depende mesmo da reconciliação para escondê-los das outras colunas.
- Também há campanhas `running` sem itens pendentes na fila; então a regra precisa continuar cobrindo campanha e fila.
- O request do preview mostra listas gigantes em `id.not.in(...)`; isso sugere que a lógica atual está “esticando” a query no cliente e pode ficar frágil conforme o volume cresce.

Plano de correção

1. Unificar a fonte de verdade do “fluxo ativo”
- Extrair a lógica de fluxo ativo para um ponto único reutilizável.
- O Kanban inteiro deve consumir o mesmo mapa de leads ativos para:
  - decidir coluna,
  - mostrar borda verde,
  - mostrar botão “Parar”,
  - exibir tooltip correto.
- Remover a dependência de estados locais paralelos em `KanbanBoard`.

2. Levar a reconciliação para nível mais estrutural
- Em vez de cada coluna montar sua própria exclusão/inclusão via listas de IDs, criar uma camada central para “effective status”.
- Preferência de implementação:
  - hook compartilhado que retorna `activeFlowLeadIds` + `isLeadInActiveFlow`
  - ou, idealmente, uma função/RPC no backend que já devolva o status efetivo do lead
- Assim o Kanban deixa de depender de filtros fragmentados e listas enormes no URL.

3. Garantir consistência em todos os pontos que criam fluxo
- Revisar e padronizar:
  - `CadenciaSheet`
  - `FollowUpSheet`
  - agendamento manual em `KanbanBoard`
  - qualquer criação de campanha em `NewCampaignSheet`
- Todos devem:
  - salvar `lead_previous_status`,
  - mover para `awaiting_docs`,
  - registrar interação,
  - invalidar a mesma chave central de fluxo ativo.

4. Garantir consistência em todos os pontos que encerram fluxo
- Centralizar “Parar tudo” e também a restauração do status.
- A restauração só deve ocorrer quando não existir:
  - campanha `running`
  - nem fila futura ativa
- Aplicar a mesma rotina para cancelamento manual, término natural e envio/resposta.

5. Expandir a mesma regra para outras telas
- Aplicar a mesma leitura de “fluxo ativo” onde o lead aparece fora do Kanban:
  - `LeadPage`
  - Inbox/contexto do lead
  - qualquer lista/tabela CRM relevante
- Isso evita o cenário “no card está em Copiloto Ativo, mas em outra tela ainda parece Atendimento”.

Arquivos que eu revisaria/alteraria na implementação

- `src/hooks/use-kanban-column.ts`
- `src/components/crm/KanbanBoard.tsx`
- `src/components/crm/KanbanColumn.tsx`
- `src/components/crm/KanbanCard.tsx`
- `src/components/crm/FollowUpSheet.tsx`
- `src/components/crm/CadenciaSheet.tsx`
- `src/hooks/use-cadencia-ativa.ts`
- `src/components/whatsapp/NewCampaignSheet.tsx`
- possivelmente uma função backend para status efetivo / fluxo ativo

Resultado esperado

- Lead com cadência ativa: só em “Copiloto Ativo”.
- Lead com follow-up ativo: só em “Copiloto Ativo”.
- Lead com mensagem futura avulsa: só em “Copiloto Ativo”.
- Todos eles exibem o botão “Parar”.
- Ao cancelar tudo, o lead volta apenas uma vez, para o status correto.
- A mesma lógica passa a valer de forma consistente em todo o CRM.

Detalhe técnico mais importante

Hoje o problema não parece ser só “faltou mudar status no banco”; o problema principal é arquitetura duplicada de estado no frontend. Enquanto coluna, destaque visual e botão dependerem de fontes diferentes, esses desencontros vão continuar aparecendo. Minha implementação focaria primeiro em eliminar essa duplicação e transformar “fluxo ativo” em uma única verdade compartilhada.
