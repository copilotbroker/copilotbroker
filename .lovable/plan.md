

# Aplicar fix de virtualização no BrokerLayout

## Problema
O `BrokerLayout` ainda usa `min-h-screen` e `<main>` sem `min-h-0`, exatamente o mesmo problema que foi corrigido no `AdminLayout`. O Kanban dos corretores renderiza todos os cards de uma vez.

## Correção

### `src/components/broker/BrokerLayout.tsx`

**Linha 93** — wrapper de conteúdo:
```
// DE:
<div className="lg:ml-16 min-h-screen flex flex-col pb-20 lg:pb-0 overflow-x-hidden">

// PARA:
<div className="lg:ml-16 h-screen flex flex-col pb-20 lg:pb-0 overflow-hidden">
```

**Linha 100** — main:
```
// DE:
<main className="flex-1 flex flex-col p-3 lg:p-6">

// PARA:
<main className="flex-1 flex flex-col min-h-0 p-3 lg:p-6">
```

Mesma correção aplicada no AdminLayout, garantindo que a cadeia de alturas propague até o scroll container do Kanban.

