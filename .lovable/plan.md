
Objetivo

Restaurar somente as cores de ontem, sem reverter lógica nem estrutura: docs do Design System, tokens globais e aparência visual do Kanban/CRM.

O que identifiquei

- O `src/index.css` hoje contém uma paleta extra de CRM:
  - `--crm-success`, `--crm-info`, `--crm-warning`, `--crm-accent`, `--crm-neutral`
- O `src/components/ui/button.tsx` ganhou variantes semânticas novas:
  - `success`, `warning`, `info`, `accent`, `neutral`
- O `src/components/crm/KanbanCard.tsx` passou a depender dessas variantes para colorir ações do Kanban.
- O `src/pages/DesignSystem.tsx` ainda documenta o sistema antigo de forma parcial/genérica e hoje está desalinhado com a intenção de “voltar as cores de ontem”.

Plano de implementação

1. Restaurar os tokens globais do tema
- Ajustar `src/index.css` para remover a paleta CRM adicionada depois, ou voltar esses tokens para o padrão anterior se ainda forem necessários por compatibilidade.
- Garantir que o sistema volte a se apoiar na paleta base do tema:
  - `primary`, `accent`, `secondary`, `muted`, `destructive`, `border`, `background`, `foreground`
- Preservar tipografia, animações, sombras e demais estilos que não sejam cor.

2. Reverter o design system visual para a versão de ontem
- Atualizar `src/pages/DesignSystem.tsx` para documentar novamente a paleta padrão anterior, sem a camada de cores semânticas novas do CRM.
- Alinhar a documentação com o que realmente estará implementado no tema, para evitar inconsistência futura.

3. Restaurar os botões do Kanban para a lógica visual anterior
- Revisar `src/components/crm/KanbanCard.tsx` para trocar variantes semânticas novas por variantes já existentes no design original.
- Manter diferenciação visual entre ações, mas usando a linguagem anterior do sistema em vez da paleta CRM recém-introduzida.
- Preservar toda a lógica dos botões, modais e fluxos.

4. Simplificar novamente o componente base de botão
- Revisar `src/components/ui/button.tsx` e remover/neutralizar variantes adicionadas só para essa mudança de cor, se elas não existiam ontem.
- Deixar o botão base coerente com o design system restaurado, evitando que a mudança continue vazando para outras telas.

5. Validar consistência visual no CRM
- Conferir se a restauração de cor não quebra:
  - contraste dos botões
  - estados hover/focus
  - badges e contornos do Kanban
- Se algum elemento ainda depender dos tokens removidos, ajustar só a camada visual para o tema anterior, sem tocar na lógica.

Arquivos a alterar

- `src/index.css`
- `src/pages/DesignSystem.tsx`
- `src/components/ui/button.tsx`
- `src/components/crm/KanbanCard.tsx`

Resultado esperado

- As cores voltam ao padrão de ontem.
- O Design System e a interface real ficam sincronizados.
- O Kanban deixa de usar a paleta semântica nova, mas continua funcional.
- Nenhuma regra de negócio, automação ou fluxo do CRM é revertido junto.
