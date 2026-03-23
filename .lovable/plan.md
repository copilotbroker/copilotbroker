

# Redesign: Toolbar colapsável no mobile do corretor

## Situação atual (mobile ~844px)
No mobile, antes do Kanban temos ~3 linhas ocupando ~130px+:
1. **Header** "Meus Leads" (~48px)
2. **BrokerRoletas** compactas (~50px)
3. **Busca + filtros** do KanbanBoard (~40px)

## Proposta
Transformar o header mobile em uma linha com "Meus Leads" + botão chevron que expande/colapsa roletas, busca e filtros. Por default, colapsado → Kanban ocupa quase toda a tela.

```text
Colapsado (default):
┌─────────────────────────┐
│ Meus Leads         ▼  + │  ← header ~44px
├─────────────────────────┤
│ ██ KANBAN COLUMNS ████  │  ← resto da tela
└─────────────────────────┘

Expandido:
┌─────────────────────────┐
│ Meus Leads         ▲  + │
│ [Roleta A ●] [Roleta B] │  ← roletas
│ 🔍 Buscar...             │  ← search
│ [Empreend.] [Origens]    │  ← filtros
├─────────────────────────┤
│ ██ KANBAN COLUMNS ████  │
└─────────────────────────┘
```

## Implementação (3 arquivos)

### 1. `src/components/broker/BrokerHeader.tsx`
- Adicionar prop `collapsibleContent` (ReactNode) e `onAddLead`
- No mobile: renderizar botão ChevronDown/Up ao lado do título
- Estado local `isExpanded` (default `false`)
- Quando expandido, mostrar o `collapsibleContent` abaixo do título com animação
- Botão "+" para adicionar lead ao lado do chevron

### 2. `src/pages/BrokerAdmin.tsx`
- Mover `<BrokerRoletas>` para dentro do header como conteúdo colapsável
- Passar como prop `collapsibleContent` para o `BrokerLayout`/`BrokerHeader`

### 3. `src/components/crm/KanbanBoard.tsx`
- Extrair a toolbar mobile (busca + filtros, linhas 562-706) em um bloco que pode ser renderizado externamente
- Adicionar prop `renderToolbarOutside?: boolean` — quando true, não renderiza a toolbar interna no mobile
- Ou: adicionar prop `mobileToolbarCollapsed?: boolean` que esconde a toolbar mobile via `hidden`
- Abordagem mais simples: adicionar prop `externalMobileToolbar?: ReactNode` que substitui a toolbar mobile interna

**Abordagem escolhida** (mais simples): O KanbanBoard já aceita `searchTerm` e `onSearchChange` como props. Vamos:
1. No `BrokerHeader`, quando expandido no mobile, renderizar o `collapsibleContent` passado pelo pai
2. No `BrokerAdmin`, montar o conteúdo colapsável com `<BrokerRoletas>` + busca + filtros inline
3. No `KanbanBoard`, adicionar prop `hideToolbarMobile?: boolean` — quando true, esconde o bloco de toolbar mobile (linhas 562-706), já que está sendo renderizado fora

## Resultado
- Ganho de ~130px de espaço vertical no mobile
- Roletas/busca/filtros acessíveis com 1 tap
- Desktop não muda (toolbar permanece inline)

