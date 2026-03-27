

# Separar Inbox do Corretor do Inbox do Plantão de Vendas

## Conceito

Criar duas páginas de inbox separadas na área do corretor:

1. **Inbox** (`/corretor/inbox`) — Conversas pessoais do corretor (instância WhatsApp individual). Sem abas Novos/Outros. Apenas as conversas onde `source_instance != 'global'` (ou é null).

2. **Plantão** (`/corretor/plantao`) — Exclusivo para conversas da instância global. Com as 3 abas: Novos (pendentes de claim), Meus (já iniciou atendimento), Outros (supervisão para líderes/admins).

## Mudanças

### 1. Nova rota e navegação
- **`brokerNavigation.ts`**: Adicionar tab `plantao` com path `/corretor/plantao`, ícone `Users` ou `Headset`, label "Plantão"
- **`App.tsx`**: Adicionar `<Route path="/corretor/plantao" element={<BrokerPlantao />} />`

### 2. Simplificar `BrokerInbox.tsx`
- Remover as abas Novos/Meus/Outros — fica apenas a lista de conversas do corretor
- Remover lógica de `handleStartAttendance`
- Filtrar apenas conversas onde `source_instance` não é `'global'` (conversas da instância pessoal)
- Manter funcionalidades: busca, filtro de status, thread, lead panel, transfer, create lead

### 3. Criar `src/pages/BrokerPlantao.tsx`
- Nova página dedicada ao plantão de vendas (instância global)
- Conter as 3 abas: Novos / Meus / Outros
- Lógica de "Iniciar Atendimento" (claim) vive aqui
- Filtrar conversas onde `source_instance = 'global'`
- Reutilizar `ConversationList`, `ConversationThread`, `LeadContextPanel`

### 4. Atualizar `use-conversations.ts`
- Adicionar parâmetro opcional `sourceInstance?: 'global' | 'personal'` para filtrar por tipo de instância
- `'global'`: `query.eq("source_instance", "global")`
- `'personal'`: `query.or("source_instance.is.null,source_instance.neq.global")`

### 5. Sidebar e Bottom Nav
- Atualizar `BrokerSidebar` e `BrokerBottomNav` para mostrar o novo tab "Plantão" (gated por pertencer a uma roleta whatsapp_global, ou simplesmente sempre visível)

### 6. Admin Inbox
- `AdminInbox.tsx` mantém todas as abas como está (admin vê tudo)

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/components/broker/brokerNavigation.ts` | Novo tab `plantao` |
| `src/App.tsx` | Nova rota `/corretor/plantao` |
| `src/pages/BrokerInbox.tsx` | Remover abas, filtrar só instância pessoal |
| `src/pages/BrokerPlantao.tsx` | **Novo** — página do plantão com abas Novos/Meus/Outros |
| `src/hooks/use-conversations.ts` | Parâmetro `sourceInstance` para filtrar |
| `src/components/broker/BrokerSidebar.tsx` | Exibir tab Plantão |
| `src/components/broker/BrokerBottomNav.tsx` | Exibir tab Plantão no mobile |

