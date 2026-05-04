# Plano: Logout no Master + acesso do maicon à Enove Imobiliária

## Diagnóstico

### 1. Logout do Master Panel
O componente `src/components/master/MasterLayout.tsx` não possui nenhum botão/menu de logout. O header só tem `SidebarTrigger` e o título; a sidebar só lista as 4 seções. Por isso é impossível sair pela UI — o super_admin fica preso no `/master/*`.

### 2. Maicon na Enove Imobiliária
Consultando o banco, o estado **atual** é:

| Email | Org | Role org | app_role | Ativo | Aprovado |
|---|---|---|---|---|---|
| maicon.enove@gmail.com | Enove Select | owner | super_admin + admin | ✅ | ✅ |
| maicon.enove@gmail.com | **Enove Imobiliária** | **owner** | super_admin + admin | ✅ | ✅ |
| pablo.enove@gmail.com | Enove Select | owner | super_admin + admin | ✅ | ✅ |

Ou seja, **maicon JÁ está vinculado como owner/admin/manager-equivalente à Enove Imobiliária** no banco. O que provavelmente está acontecendo na percepção do usuário:

- Ele entra no painel admin operacional (`/admin/*`) mas o `OrgSwitcher` mostra "Enove Select" como ativa por causa do `localStorage` (bug discutido recentemente — fix do `setActiveOrg` síncrono).
- Ao tentar trocar para Enove Imobiliária e abrir a tela "Equipe / Admins" (`AdminOrganizationTeam`), ele não aparece listado lá — provavelmente porque a query `get_organization_members_with_users` lista membros, mas o usuário corrente (ele mesmo) pode estar sendo escondido, ou a tela filtra apenas roles ≠ owner.
- Outra hipótese: o `useUserRole` global está cacheando role baseada na **primeira** membership e não na org ativa, então em Enove Imobiliária ele não se vê como "admin".

Preciso confirmar 2 coisas com pequena inspeção de código durante a implementação:
- Se `AdminOrganizationTeam` filtra/oculta o owner ou o próprio usuário.
- Se `useUserRole` e telas dependem de `activeOrgId` para resolver membership.

## Mudanças

### A. Adicionar logout no Master Panel
Editar `src/components/master/MasterLayout.tsx`:
- No `<header>`, adicionar à direita um menu com avatar + email do super_admin.
- Item "Sair" usando o hook centralizado `useLogout()` (limpa React Query, faz `signOut`, redireciona).
- Após sair de `/master/*`, redirecionar para `/master/login` (não `/auth`) — para isso, criar variante leve do logout ou navegar manualmente após o `signOut`.

Ajuste mínimo: usar o hook + `navigate("/master/login", { replace: true })` no clique.

### B. Garantir que maicon enxergue Enove Imobiliária e seja reconhecido como admin lá

1. **Confirmar visualmente na tela `AdminOrganizationTeam`** que o maicon aparece na lista. Se a UI esconde owners ou o próprio usuário, ajustar para sempre mostrar.

2. **Revisar `useUserRole`** (`src/hooks/use-user-role.ts`):
   - Hoje resolve role olhando para *qualquer* membership aprovada/ativa do usuário, sem considerar `activeOrgId`.
   - Como ele tem owner em ambas as orgs, isso está funcionando — mas vale validar que ao trocar org, queries scoped (`organization_id`) refazem fetch (já garantido pelo `OrganizationProvider.setActiveOrg` que invalida queries não-`organization-context`).

3. **Validar OrgSwitcher**: garantir que liste as duas orgs em que ele é membro. Se só lista uma, corrigir a query do `useOrganization` para retornar todas as memberships ativas/aprovadas (não só a primeira).

4. **Pablo**: ele NÃO está em Enove Imobiliária. Não vou adicioná-lo automaticamente — se for desejado, perguntar depois.

### C. Sem mudanças de banco
Não é necessária migration. Maicon já está como owner ativo aprovado em ambas as orgs.

## Arquivos a editar
- `src/components/master/MasterLayout.tsx` — adicionar header com avatar + logout para `/master/login`.
- `src/hooks/use-organization.ts` — verificar que `memberships` retorna todas as orgs ativas do usuário (provavelmente já faz; ajustar se necessário).
- `src/components/OrgSwitcher.tsx` — garantir que Enove Imobiliária apareça na lista de troca.
- `src/pages/admin-org/AdminOrganizationTeam.tsx` — garantir que maicon (owner) apareça na listagem de membros da Enove Imobiliária.

## Como validar
1. Logar em `/master/login` com maicon → clicar avatar → "Sair" → cair em `/master/login` limpo.
2. Logar como maicon em `/auth` → `OrgSwitcher` deve listar **Enove Select** e **Enove Imobiliária** → trocar para Enove Imobiliária → abrir Equipe → ver maicon listado como owner/admin → conseguir adicionar plantão global.
