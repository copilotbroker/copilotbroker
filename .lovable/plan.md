

# Corrigir layout mobile dos botões de visualização da Agenda

## Problema

As alterações de cores e largura dos botões **estão no código** e funcionam tanto para Admin quanto Corretor (ambos usam o mesmo `AgendaModule`). Porém, o layout mobile não está funcionando como esperado porque:

1. O `Tabs` está dentro de um `div` com `flex items-center gap-2 flex-wrap` — nesse contexto, `w-full` no `TabsList` não expande porque o **pai `Tabs`** não tem `w-full`
2. Filtros (tipo de evento, busca) e tabs estão todos no mesmo container flex, competindo por espaço

## Solução

### Arquivo: `src/components/agenda/AgendaModule.tsx`

Reorganizar a seção de controles no mobile:

1. **Mover os Tabs para fora** do container de filtros, em uma linha própria no mobile
2. Adicionar `w-full sm:w-auto` no **componente `Tabs`** (não só no `TabsList`)
3. No mobile, tabs ocupam a largura toda da tela em linha separada; no desktop, ficam inline com os filtros

Estrutura resultante no mobile:
```text
[◀] [Hoje] [▶] março 2026

[Tipo de evento ▼] [🔍 Buscar...]

[  Dia  |  Semana  |  Mês  |  Lista  ]  ← linha própria, full width

Calendário...
```

### Detalhes técnicos

- Separar o bloco `<Tabs>` do `div` de filtros
- Envolver filtros e tabs em containers separados dentro do `flex-col`
- Adicionar `className="w-full sm:w-auto"` no elemento `<Tabs>`
- Manter as classes `flex-1 sm:flex-none` nos `TabsTrigger`

Apenas 1 arquivo alterado: `AgendaModule.tsx`

