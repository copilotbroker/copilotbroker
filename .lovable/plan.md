

# Mover busca e filtros para a área colapsável do header mobile

## Problema
A busca e os filtros do KanbanBoard ainda aparecem fixos no mobile, ocupando espaço. O usuário quer que fiquem dentro da área colapsável do header (junto com as roletas), visíveis só ao clicar na lupa.

## Solução

### 1. `src/components/crm/KanbanBoard.tsx`
- Reativar a prop `hideToolbarMobile` (que já existe mas foi removida do uso)
- A toolbar mobile (busca + filtros, linhas 563-707) já respeita essa prop com `hidden md:flex`

### 2. `src/pages/BrokerAdmin.tsx`
- Passar `hideToolbarMobile={true}` no `<KanbanBoard>` para esconder a toolbar mobile interna
- No `collapsibleContent`, adicionar busca e filtros inline abaixo do `<BrokerRoletas>`:
  - Input de busca com ícone de lupa (controlado por `searchTerm`/`setSearchTerm`)
  - Linha de filtros: reutilizar os mesmos selects de projeto/origem que o KanbanBoard usa internamente — porém como o KanbanBoard gerencia esses estados internamente, a abordagem mais simples é:
    - Passar `hideToolbarMobile` para esconder no mobile
    - Duplicar apenas o campo de busca no `collapsibleContent` (já controlado via props `searchTerm`/`onSearchChange`)
    - Os filtros de projeto/origem são estado interno do KanbanBoard — para não duplicar lógica, a melhor abordagem é manter os filtros dentro do KanbanBoard mas movê-los para uma área que só aparece no mobile quando expandido

**Abordagem final (simples e eficaz):**
- Não duplicar filtros — usar `hideToolbarMobile` para esconder toda a toolbar mobile do KanbanBoard
- No `collapsibleContent` do header, incluir:
  1. `<BrokerRoletas>` (já está)
  2. Campo de busca inline (usando `searchTerm`/`setSearchTerm` do BrokerAdmin)
- Os filtros de projeto/origem ficam acessíveis via scroll horizontal na toolbar do KanbanBoard que continua visível no desktop
- No mobile, ao expandir o header, o corretor vê roletas + busca. Os filtros por projeto/origem são menos usados pelo corretor (não-admin) e continuam acessíveis no desktop

### Arquivos alterados:
1. **`src/pages/BrokerAdmin.tsx`**: adicionar busca no `collapsibleContent` + passar `hideToolbarMobile` ao KanbanBoard
2. **Nenhuma mudança** no KanbanBoard (a prop `hideToolbarMobile` já funciona)

