## Diagnóstico

Os 523 leads importados estão **corretamente vinculados** à organização Enove Imobiliária (`organization_id = 7714ef82...`) e distribuídos entre os 13 corretores. Verificado:

- 523 leads com `organization_id` correto
- 523 leads com `broker_id` válido (13 corretores Enove)
- Cada corretor vê apenas seus próprios leads via RLS (`broker_id = get_my_broker_id()`)

**A causa real:** o owner **Maicon** (`maicon.enove@gmail.com`) tem apenas a role global `super_admin` em `user_roles`. As RLS policies da tabela `leads` (e `lead_interactions`, `lead_documents`, `lead_attribution`, `conversations`, etc.) verificam `has_role(auth.uid(), 'admin')` — e `super_admin` **não satisfaz** essa checagem. Resultado: ao entrar no `/admin/crm`, o Maicon não recebe acesso amplo e o Kanban aparece vazio (ele também não tem `broker_id` próprio para cair no filtro de corretor).

O mesmo vale para o Pablo Yague.

## Solução

Adicionar a role `admin` (mantendo `super_admin`) para os owners da Enove Imobiliária, via migration de `INSERT` em `user_roles`:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE u.email IN ('maicon.enove@gmail.com', 'pablo.enove@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;
```

## Validação esperada após o fix

- Maicon e Pablo logam em `/admin/crm` e veem os 523 leads no Kanban
- Cada corretor (ex.: Pedro Rocha com 94 leads) continua vendo apenas seus próprios leads — sem mudança
- Nenhuma alteração em RLS, schema ou código de aplicação

## Observação

Não é necessário mexer em `organization_members` (Maicon já é `owner`) nem alterar policies. É um ajuste pontual de role global.
