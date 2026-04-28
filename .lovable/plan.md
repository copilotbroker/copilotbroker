## Contexto

Hoje em `src/pages/Auth.tsx` (linhas 100‑107), qualquer usuário com role `super_admin` que **não tenha** outro papel operacional (`admin`/`broker`/`leader`) é deslogado e redirecionado para `/master/login`.

O caso `maicon.enove@gmail.com` é especial: ele é **super_admin E owner/admin da Enove Imobiliária** (via `organization_members`). Pela memória `super-admin-bootstrap`, esses dois usuários são promovidos a super_admin + owner Enove Select por trigger.

Mas o check atual usa apenas `user_roles` — não considera membership ativo em organização. Como ele provavelmente **não tem** linha em `user_roles` com role `admin` (apenas `super_admin`), cai no bloqueio e é jogado para `/master/login`.

## O que mudar

**Arquivo único:** `src/pages/Auth.tsx`, função `checkUserRoleAndRedirect`.

### 1. Considerar membership de organização como "papel operacional"

Antes do bloqueio super_admin (linha 100), verificar se existe membership ativo:

```text
hasOrgMembership = lista de memberships já carregada acima tem
                   alguma com approval_status='approved'
                   AND is_active=true
                   AND organization.status='active'
```

(Esse cálculo já existe na linha 50 como `hasUsable` — basta reutilizar.)

### 2. Ajustar a condição de bloqueio

Trocar:
```text
if (super_admin AND !hasOperationalRole) → força /master/login
```
por:
```text
if (super_admin AND !hasOperationalRole AND !hasOrgMembership) → força /master/login
```

### 3. Decidir destino quando super_admin tem org

Se super_admin + membership de org (sem role admin/broker/leader explícita em `user_roles`):
- Tratar como **admin da imobiliária** → redirecionar para `/admin/dashboard`
- Continua podendo acessar `/master/*` manualmente quando quiser (login Master é separado)

### Resultado

| Usuário | Login em /auth |
|---|---|
| Só super_admin (ex: pablo) | Bloqueado, vai para /master/login |
| super_admin + owner de org (maicon) | **Entra como admin da imobiliária** em /admin/dashboard |
| Admin/broker/leader normal | Inalterado |

O acesso ao painel Master continua exclusivo via `/master/login` (não muda nada lá).

## Detalhes técnicos

- Arquivo: `src/pages/Auth.tsx` apenas
- Sem migração de banco
- Sem alteração em edge functions
- Memória `super-admin-portal-isolation` será atualizada para refletir a nova exceção (super_admin com membership pode usar /auth)
