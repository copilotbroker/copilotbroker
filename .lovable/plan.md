

# Fix: Auth ficando preso em "Verificando autenticação"

## Problema

A página `/auth` usa **apenas** `onAuthStateChange` para detectar se o usuário já está logado. O problema é que esse listener nem sempre dispara o evento `INITIAL_SESSION` de forma confiável — especialmente quando o usuário navega para `/auth` repetidamente ou quando o token está em processo de refresh. Resultado: `isCheckingAuth` fica `true` para sempre, mostrando o spinner infinito.

A página `/admin` não tem esse problema porque usa o hook `useUserRole`, que tem lógica própria de fallback.

## Diferença entre `/auth` e `/admin`

- `/auth` = tela de login. Verifica se já há sessão para redirecionar automaticamente
- `/admin` = painel administrativo. Usa `useUserRole()` que já tem proteção contra loading infinito

## Solução

Adicionar uma chamada explícita a `supabase.auth.getSession()` **antes** do listener, seguindo o padrão recomendado:

1. No `useEffect`, chamar `getSession()` primeiro para resolver o estado inicial
2. Manter o `onAuthStateChange` para mudanças subsequentes (login/logout)
3. Adicionar um timeout de segurança (3s) para evitar spinner infinito caso algo falhe
4. Ignorar evento `INITIAL_SESSION` no listener já que `getSession()` cobre esse caso

## Arquivo alterado

| Arquivo | Alteração |
|---|---|
| `src/pages/Auth.tsx` | Adicionar `getSession()` antes do listener + timeout de segurança |

