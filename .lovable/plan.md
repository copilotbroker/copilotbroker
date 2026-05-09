## Objetivo

1. Garantir que ao entrar na plataforma a primeira tela seja o **Kanban**, não a Dashboard, para qualquer papel.
2. Auditar e ajustar a visibilidade dos dados conforme a regra:
   - **Admin / Gerente (manager)**: vê os próprios dados primeiro, mas tem acesso a todos os corretores da imobiliária.
   - **Líder**: vê os próprios dados primeiro, e pode alternar para ver o time.
   - **Corretor**: vê apenas os próprios dados.

---

## Parte 1 — Kanban como página inicial

Hoje as rotas `/admin` e `/corretor/admin` já redirecionam para `/admin/crm` e `/corretor/crm`. O problema percebido vem da ordem na sidebar (Dashboard aparece primeiro) e do fato de o login não forçar o destino para o CRM em todos os caminhos.

Mudanças:

1. **Reordenar as sidebars** para listar Kanban antes de Dashboard:
   - `src/components/admin/adminNavigation.ts`: mover `crm` para o topo de `ADMIN_ROUTE_TABS` (antes de `dashboard`).
   - `src/components/broker/brokerNavigation.ts`: mover `crm` (Kanban) para o topo, antes de `dashboard`.
2. **Login (`src/pages/Auth.tsx`)**: garantir que o redirect pós-login do admin vá para `/admin/crm` e do corretor para `/corretor/crm` (hoje vai para `/admin` e `/corretor/admin`, que redirecionam — mantém-se o comportamento mas explicitando o destino).
3. **Páginas que redirecionam para `/corretor/dashboard`** (`AdminOrganization.tsx`, `AdminOrganizationBranding.tsx`, `AdminOrganizationTeam.tsx`): trocar para `/corretor/crm` quando o usuário não tem permissão de admin-org, para que o fallback caia no Kanban.

---

## Parte 2 — Auditoria de visibilidade por papel

### 2.1 Kanban (`KanbanBoard` em `src/components/crm/KanbanBoard.tsx`)

Estado atual:
- Em `BrokerAdmin` (corretor/líder): `isAdmin={isLeader}` + `brokerId` do próprio. Líder cai com `selectedBroker = brokerId` (próprio) por padrão. ✅
- Em `Admin` (admin/gerente): `isAdmin={true}` **sem `brokerId`**, então `selectedBroker` inicia como `"all"`. ❌ — usuário pediu "vê os próprios dados primeiro".

Mudanças:
- `Admin.tsx`: passar o `brokerId` do próprio admin (via `useUserRole().brokerId`) para `<KanbanBoard>` para que o filtro inicial seja o próprio admin, mantendo a opção de trocar para "Todos" no seletor de corretor.
- `KanbanBoard`: confirmar que, quando `isAdmin && brokerId`, o seletor "Todos / Enove / lista" continua disponível (já está) e que o `selectedBroker` inicial é o próprio.

### 2.2 Dashboard

- `BrokerDashboard` (`src/pages/BrokerDashboard.tsx`): hoje sempre mostra `brokerId` próprio. Para **líder**, deveria iniciar com os próprios números e oferecer alternância "Meus / Time".
- `Admin → DashboardOverview / PerformanceDashboard / IntelligenceDashboard`: hoje agregam todos os corretores. Adicionar seletor "Meus dados / Imobiliária toda" com default = "Meus dados" (próprio admin) quando o admin tem `brokerId` (admins que também são corretores).

### 2.3 Inbox

- `BrokerInbox` (`src/pages/BrokerInbox.tsx`): líder já tem seletor `teamMembers` com `selectedBrokerId` default = próprio brokerId. ✅
- `AdminInbox`: validar que admin/gerente abre primeiro com seu próprio inbox (se tiver `brokerId`) e pode alternar para qualquer corretor. Ajustar o seletor de corretor no header se necessário.

### 2.4 Plantão

- `BrokerPlantao`: admin e líder têm `canSelectBroker`. Default já é o próprio (`selectedBrokerId || brokerId`). ✅
- Confirmar que o admin/gerente também tem default = próprio, não "all".

### 2.5 Agenda

- `BrokerAgenda` / `AdminAgenda`: validar filtros. RLS já permite líder ver eventos do time (`Lideres podem ver eventos da equipe`) e admin ver tudo. UI deve abrir com "Minha agenda" por padrão e oferecer "Time" (líder) ou "Imobiliária" (admin/gerente).

### 2.6 Leads / Lista

- `BrokerAdmin` (modo lista): hoje filtra por `broker_id = brokerId` próprio. Para líder e admin a lista deveria oferecer toggle "Meus / Time / Todos" com default no próprio.

### 2.7 Roletas, Empreendimentos, Copiloto

- Páginas administrativas: continuam visíveis somente para admin/gerente; sem mudança de escopo necessária.

---

## Resumo das alterações de código

| Arquivo | Mudança |
|---|---|
| `src/components/admin/adminNavigation.ts` | Mover `crm` para antes de `dashboard` |
| `src/components/broker/brokerNavigation.ts` | Mover `crm` (Kanban) para antes de `dashboard` |
| `src/pages/Auth.tsx` | Redirect pós-login → `/admin/crm` e `/corretor/crm` explícitos |
| `src/pages/admin-org/AdminOrganization.tsx`, `AdminOrganizationBranding.tsx`, `AdminOrganizationTeam.tsx` | Fallback `/corretor/crm` no lugar de `/corretor/dashboard` |
| `src/pages/Admin.tsx` | Passar `brokerId` próprio ao `<KanbanBoard>` para default = "meus leads" |
| `src/pages/BrokerDashboard.tsx` | Líder: seletor "Meus / Time", default próprio |
| `src/components/admin/DashboardOverview.tsx`, `PerformanceDashboard.tsx`, `IntelligenceDashboard.tsx` | Admin/gerente: seletor "Meus / Imobiliária", default próprio quando admin é corretor |
| `src/pages/AdminInbox.tsx` | Default no próprio brokerId; seletor para todos os corretores |
| `src/pages/BrokerAgenda.tsx`, `AdminAgenda.tsx` | Default "Minha agenda"; toggle Time / Imobiliária |
| `src/pages/BrokerAdmin.tsx` (modo lista) | Para líder/admin: toggle Meus / Time / Todos |

---

## Pontos a confirmar antes de implementar

1. **Admin/gerente sem perfil de corretor**: alguns admins podem não ter registro em `brokers` (sem `brokerId`). Nesse caso o default "meus dados" não se aplica — sugiro cair em "Imobiliária toda". Confirmar.
2. **Gerente (manager)**: hoje `useUserRole` trata `manager` como `admin`. Manter essa equivalência.
3. **Sidebar**: manter o item "Dashboard" visível (apenas reordenar), ou remover do menu principal? Sugiro **manter visível** e apenas reordenar.
