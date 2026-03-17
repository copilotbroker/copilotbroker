
Objetivo

Garantir que qualquer lead com fluxo futuro ativo vá para a coluna “Copiloto ativo” e exiba sempre o botão “Parar”, cobrindo:
- cadência,
- follow-up,
- mensagem avulsa programada.

O que encontrei no código

- O destaque visual de automação já considera duas fontes:
  - `whatsapp_campaigns.status = running`
  - `whatsapp_message_queue.status in ("queued","scheduled","sending","paused_by_system")`
- Porém o botão “Parar” no card hoje depende apenas de `hasCadenciaAtiva`, que vem só de `whatsapp_campaigns`. Resultado:
  - leads com mensagens futuras sem campanha não mostram “Parar”
  - follow-ups/mensagens programadas podem estar ativos sem refletir corretamente no botão
- O movimento para “Copiloto ativo” está inconsistente entre fluxos:
  - Inbox agendado move o lead para `awaiting_docs`
  - `CadenciaSheet` também move
  - `FollowUpSheet` não está preservando nem atualizando status do lead para `awaiting_docs`
- O cancelamento do card também está incompleto:
  - `handleCancelCadencia` chama apenas `cancelCadenciaForLead`
  - isso não cancela mensagens avulsas futuras nem follow-ups fora dessa lógica
- Há risco de UI ficar atrasada até o realtime/refetch concluir, então faz sentido aplicar atualização otimista com rollback, como no padrão sugerido.

Plano de implementação

1. Unificar a regra de “fluxo ativo”
- Criar um conceito único de fluxo ativo no Kanban:
  - `hasActiveFlow = campanha rodando OU fila futura ativa`
- Usar essa mesma regra para:
  - mover o card visualmente para “Copiloto ativo”
  - exibir o botão “Parar”
  - aplicar destaque visual no card

2. Corrigir criação de follow-up
- Atualizar `FollowUpSheet` para, ao criar follow-up:
  - salvar `lead_id` e `lead_previous_status` na campanha
  - mover o lead para `awaiting_docs`
  - registrar interação com status anterior preservado
- Isso elimina os casos em que o follow-up existe mas o lead continua em “Atendimento”.

3. Substituir o cancelamento por “Parar tudo”
- Trocar a ação atual do card por um cancelamento unificado:
  - cancelar campanhas `running`
  - cancelar itens futuros da `whatsapp_message_queue`
  - restaurar o lead para o status anterior correto quando não restar nenhum fluxo ativo
- Como você confirmou “Tudo”, o botão deve parar qualquer automação/agendamento do lead.

4. Aplicar atualização otimista no Kanban
- Ao ativar cadência, follow-up ou agendar mensagem:
  - atualizar imediatamente os caches do Kanban para mostrar o lead em “Copiloto ativo”
  - ligar o estado visual do botão “Parar”
- Em erro:
  - rollback para a coluna/estado anterior
- Em sucesso:
  - invalidar queries do Kanban para reconciliar com o backend

5. Padronizar a restauração do status
- Reaproveitar a lógica já existente de recuperação do `previousStatus` e garantir que:
  - o lead só volte quando não houver mais campanha nem mensagem futura
  - follow-up use a mesma convenção de preservação de status
- Isso evita leads “presos” em coluna errada ou retornando cedo demais.

Arquivos que eu alteraria

- `src/components/crm/KanbanBoard.tsx`
- `src/components/crm/KanbanCard.tsx`
- `src/components/crm/FollowUpSheet.tsx`
- `src/components/crm/CadenciaSheet.tsx`
- `src/hooks/use-conversations.ts`
- `src/hooks/use-kanban-leads.ts`
- possivelmente `supabase/functions/whatsapp-message-sender/index.ts` para consolidar a restauração final do status

Detalhes técnicos

- Hoje `activeAutomationLeadIds` já detecta campanhas + fila, mas `cadenciaLeadIds` é usado sozinho para mostrar o botão “Parar”.
- A principal correção estrutural é parar de depender só de `whatsapp_campaigns` para o botão.
- O maior bug funcional encontrado é o `FollowUpSheet`, que agenda mensagens mas não move o lead para `awaiting_docs` com a mesma robustez dos outros fluxos.
- A solução mais segura é centralizar:
  - detecção de fluxo ativo
  - cancelamento total
  - preservação/restauração de status
  - atualização otimista de cache
