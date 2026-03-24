

# Kanban do Líder: default para leads próprios

## Análise atual

- `BrokerAdmin.tsx` passa `isAdmin={isLeader}` ao `KanbanBoard`
- Quando `isAdmin=true`, o filtro de `broker_id` é removido na query (linha 35 de `use-kanban-column.ts`)
- `selectedBroker` começa como `"all"`, então o líder vê todos os leads do time + próprios (via RLS)
- A segurança está correta via RLS: líderes só veem leads do time + próprios. Não veem da organização inteira.

**O que precisa mudar:** o valor inicial de `selectedBroker` deve ser o `brokerId` do líder (não `"all"`), para que por padrão ele veja apenas seus próprios leads. Ele pode mudar o filtro para ver o time.

## Alterações

### 1. `src/components/crm/KanbanBoard.tsx`

- Alterar o `useState` de `selectedBroker` para iniciar com o `brokerId` do líder quando `isAdmin` é true e `brokerId` existe
- Especificamente: `useState<string>(isAdmin && brokerId ? brokerId : "all")`
- Isso faz o Kanban abrir filtrado nos leads do próprio líder por padrão
- O seletor de corretor continua disponível para ele navegar entre "Todos", "Sem corretor", ou membros individuais

### 2. Verificação de segurança (RLS)

A RLS já está correta:
- Líderes veem leads onde `broker_id IN (SELECT id FROM brokers WHERE lider_id = get_my_broker_id())` — time
- Líderes também veem seus próprios leads via política de broker
- Não há acesso à organização inteira

Nenhuma mudança de RLS necessária.

