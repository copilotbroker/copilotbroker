
Objetivo

Restaurar o visual anterior do card do Kanban, mantendo a lógica nova de “Copiloto Ativo” como está.

O que houve

O problema não parece estar na coluna nem na reconciliação dos leads, e sim no próprio `KanbanCard.tsx`.
Pelo código atual, o card foi bastante redesenhado:
- trocou a hierarquia visual;
- mudou cores-base para `#1e1e22`, `slate-*`, badges novas e barra de progresso;
- passou a condicionar alguns elementos a novas regras;
- manteve props antigas (`hasCadenciaAtiva`) mas a coluna só envia `hasAutomacaoAtiva`, o que também afeta textos/indicadores.

Ou seja: a lógica nova de automação entrou junto com um redesign visual do card. O efeito percebido de “mudaram as cores e sumiram coisas” bate exatamente com isso.

Plano de correção

1. Restaurar o layout visual do card no `KanbanCard.tsx`
- Reverter a estrutura visual para o padrão anterior do CRM:
  - cores,
  - espaçamentos,
  - badges,
  - tipografia,
  - ordem das informações,
  - estados visuais de hover/stale/novo.
- Manter apenas a nova fonte de verdade de automação (`hasAutomacaoAtiva`) por baixo.

2. Preservar a lógica nova sem manter o redesign
- Continuar usando:
  - `hasAutomacaoAtiva` para destacar lead com fluxo ativo,
  - botão “Parar”,
  - exclusão do lead das outras colunas.
- Ajustar o texto/tooltip para não depender de `hasCadenciaAtiva`, já que hoje essa prop não está sendo alimentada pela coluna.

3. Recolocar os elementos que sumiram
Vou comparar o card atual com o que o CRM esperava visualmente e recolocar:
- badges/contextos importantes;
- informações secundárias que antes apareciam;
- tratamento visual de stale/new;
- footer com broker/origem/tempo no padrão anterior.
Se algum item tiver sido removido de propósito pela lógica nova, eu mantenho a função e restauro só a apresentação.

4. Revisar consistência com o Design System do CRM
O próprio `DesignSystem.tsx` descreve o padrão esperado:
- card com `text-foreground`, `text-muted-foreground`;
- stale com perda visual mais sutil;
- novo lead com glow;
- ações contextuais consistentes.
Vou alinhar o `KanbanCard` de volta a esse padrão, em vez do visual que hoje está mais “experimental”.

5. Validar o acoplamento entre coluna e card
- Conferir `KanbanColumn.tsx` para garantir que o card continue recebendo tudo que precisa.
- Se necessário, acrescentar uma forma explícita de distinguir:
  - “fluxo ativo”,
  - “cadência ativa”,
  - “mensagem futura ativa”,
sem quebrar o visual restaurado.

Arquivos a revisar/alterar

- `src/components/crm/KanbanCard.tsx`
- `src/components/crm/KanbanColumn.tsx`
- possivelmente `src/pages/DesignSystem.tsx` apenas como referência visual, não como mudança funcional

Resultado esperado

- O card volta a ter a aparência anterior do CRM.
- As cores deixam de parecer “lavadas” ou diferentes do restante do Kanban.
- Os elementos visuais que sumiram reaparecem.
- A lógica nova de “Copiloto Ativo” continua funcionando sem duplicidade de estado.
