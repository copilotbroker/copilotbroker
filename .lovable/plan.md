
## Causa raiz

O e-mail `kely.enove@gmail.com` **já existia** em `auth.users` (cadastro anterior com senha `Enove123!`). Quando você criou a Kely de novo na Enove Imobiliária com `enove123`, a edge function `org-create-member-direct` fez o seguinte:

1. Tentou `admin.auth.admin.createUser({ email, password: "enove123" })` → falhou com "user already registered".
2. Caiu no branch de fallback (linhas 95–105): **localizou o usuário existente pelo e-mail e apenas vinculou à org, ignorando silenciosamente a senha nova**.
3. Resultado: o vínculo foi criado, mas a senha continuou sendo a antiga (`Enove123!`).

Por isso só funcionou com `Enove123!`. Não há duplicidade de conta nem bug de auth — é a edge function que silenciosamente reaproveita o usuário sem avisar e sem atualizar a senha.

## Decisão de design

**Não** atualizar a senha automaticamente quando o usuário já existe. Isso seria uma falha de segurança: um gerente da Imobiliária A poderia sobrescrever a senha de um usuário que pertence à Imobiliária B só por adivinhar o e-mail.

Em vez disso:
- Detectar o caso "usuário já existe" **antes** de tentar criar.
- Retornar um erro claro com uma ação sugerida.
- Na UI, mostrar um diálogo: *"Esse e-mail já tem conta no Copilot Broker. Quer apenas vinculá-lo a esta imobiliária (ele usará a senha que já tem) ou enviar um convite por e-mail?"*

## Mudanças

### 1. `supabase/functions/org-create-member-direct/index.ts`
- Antes de chamar `createUser`, fazer um lookup pelo e-mail (via `admin.auth.admin.listUsers` ou query em `auth.users`).
- Se já existir e o body **não** trouxer `link_existing: true`, retornar `409 { error: "user_already_exists", existing_user_id }`.
- Se vier `link_existing: true`, pular a criação, **não** mexer na senha, apenas fazer o upsert em `organization_members`.
- Manter o fluxo atual (criar com a senha informada) só quando o usuário realmente não existe.

### 2. `src/components/admin-org/MemberFormDialog.tsx`
- Tratar a resposta `409 user_already_exists`: abrir um sub-diálogo de confirmação com 2 opções:
  - **"Vincular conta existente"** → reenvia a request com `link_existing: true`. Mostra aviso: *"O usuário fará login com a senha atual dele. Se ele esqueceu, peça para usar 'Esqueci minha senha' em /auth."*
  - **"Cancelar e enviar convite"** → fecha o modal de criação direta e abre o `InviteMemberDialog` já preenchido.
- Toast de sucesso pós-vínculo: *"Conta existente vinculada à imobiliária. Senha atual preservada."*

### 3. Limpeza do estado da Kely (one-off)
- A senha dela hoje é `Enove123!`. Se você quiser resetar para `enove123` agora, eu posso rodar uma migração/admin call dedicada **uma vez** para esse `user_id`. Confirme se quer essa ação ou se prefere que ela mesma use "Esqueci a senha".

## Detalhes técnicos

- O lookup por e-mail via `listUsers({ perPage: 200 })` não escala. Trocar por `admin.from("auth.users" as any).select("id,email").eq("email", emailNorm).maybeSingle()` (service role tem acesso ao schema `auth`).
- Manter a auditoria em `admin_audit_logs` com `action: "member.link_existing"` quando for vínculo (em vez de `member.create_direct`).
- Validação de autorização (super_admin OR owner/admin/manager da org) permanece inalterada.
- Schema/RLS não muda.
