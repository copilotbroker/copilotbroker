
Objetivo

Adicionar cor aos botões do card do Kanban, restaurando a hierarquia visual “premium” sem quebrar a lógica atual.

O que encontrei

- O `KanbanCard.tsx` já usa variantes semânticas nos botões principais:
  - `success` para “Iniciar Atendimento” e “Confirmar Venda”
  - `warning` para proposta/reagendamento
  - `neutral` para agendamento, WhatsApp e ligação
- O componente `Button` já suporta variantes coloridas (`success`, `warning`, `info`, `accent`, `neutral`).
- O problema é que hoje só parte dos botões usa essa paleta; ações secundárias e de risco continuam neutras ou `ghost`, o que deixa o card visualmente mais apagado do que antes.

Plano de implementação

1. Reforçar a paleta dos botões principais no `KanbanCard`
- Manter:
  - verde para “Iniciar Atendimento”
  - verde para “Confirmar Venda”
  - amarelo para “Fazer Proposta” / “Reagendar”
- Ajustar os neutros para continuarem elegantes sem parecer “sem cor”.

2. Colorir os botões secundários do card
- WhatsApp:
  - botão de abrir compositor com variante colorida, alinhada ao fluxo de conversa
  - botão de enviar agora com destaque forte
  - botão de agendar mensagem com cor distinta do envio imediato
- Ligação:
  - usar variante própria mais visível que o neutro atual
- Isso devolve leitura rápida por tipo de ação.

3. Dar tratamento visual às ações de risco
- “Inativar lead” e “Excluir lead” hoje estão em `ghost`.
- Vou aplicar cor de risco no hover e/ou variante destrutiva mais elegante, sem deixar o card pesado.
- A ideia é manter segurança visual: ações destrutivas ficam claramente identificadas.

4. Se necessário, expandir o `Button` com uma ou duas variantes extras
- Se as variantes existentes não forem suficientes para separar bem WhatsApp, agendamento e ligação, vou planejar:
  - `info` para comunicação
  - `accent` para ações auxiliares
- Assim a cor fica padronizada no design system, e não hardcoded no card.

5. Garantir consistência com o tema do CRM
- Usar apenas tokens semânticos já existentes (`crm-success`, `crm-warning`, `crm-info`, `crm-accent`, `crm-neutral`, `destructive`).
- Evitar hex solto e evitar voltar ao problema de “preto, branco e amarelo”.
- Preservar contraste, glow e legibilidade em dark mode.

Arquivos a alterar

- `src/components/crm/KanbanCard.tsx`
- possivelmente `src/components/ui/button.tsx` se eu precisar de uma variante extra para separar melhor os tipos de ação

Resultado esperado

- Todos os botões do Kanban ficam coloridos com função clara.
- O card volta a ter leitura visual rica, não monocromática.
- Ações principais, comunicação e risco ficam fáceis de distinguir num olhar.
- A lógica atual do Kanban continua intacta.
