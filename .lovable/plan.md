# Corrigir códigos de país faltando nos WhatsApps dos corretores

## Diagnóstico

Confirmei via consulta no banco. Os 14 números recuperados foram salvos sem o código do país (`55`):

- `51998172927` (Guilherme Graeff) — deveria ser `5551998172927`
- `51999030199` (Jean Costa) — deveria ser `5551999030199`
- ...e assim por diante para os 14 corretores

Apenas 2 registros já estão corretos (`5551993329525` Pedro Rocha, `5551981953266` Kely Monique).

**Causa raiz:** A recuperação na conversa anterior pegou os números do `admin_audit_logs` exatamente como o usuário digitou no formulário antigo (sem máscara), que aceitava só DDD+número. Como o WhatsAppInput agora exige código do país, esses números ficam sendo interpretados como Canadá (+1 51...) ou inválidos.

## Etapa 1 — Migração de dados (UPDATE)

Rodar UPDATE direcionado, prefixando `55` apenas em registros brasileiros sem código do país:

```sql
-- Tabela brokers
UPDATE public.brokers
SET whatsapp = '55' || whatsapp,
    updated_at = now()
WHERE whatsapp IS NOT NULL
  AND length(regexp_replace(whatsapp, '[^0-9]', '', 'g')) IN (10, 11)
  AND whatsapp !~ '^55';

-- Tabela organization_members (mesmo critério)
UPDATE public.organization_members
SET whatsapp = '55' || whatsapp
WHERE whatsapp IS NOT NULL
  AND length(regexp_replace(whatsapp, '[^0-9]', '', 'g')) IN (10, 11)
  AND whatsapp !~ '^55';
```

Critério: número limpo com 10 ou 11 dígitos (formato BR sem país) e que não comece com `55`. Não toca em números já corretos (ex.: `5551...`) nem em números internacionais válidos.

## Etapa 2 — Validação pós-correção

Após o UPDATE, rodo um SELECT para confirmar que todos os 14 corretores agora têm `5551...` (13 dígitos) e que nenhum número internacional legítimo foi alterado por engano.

## Etapa 3 — Garantir que não acontece de novo

A causa raiz da gravação sem código do país já foi corrigida na conversa anterior:
- `MemberFormDialog.tsx` agora usa `WhatsAppInput` (sempre concatena código do país)
- `OrgBrokerPublicSignup.tsx` idem
- `org-broker-public-signup/index.ts` persiste o número limpo nas duas tabelas

Não é necessária nenhuma alteração de código adicional — apenas a migração de dados.

## Resultado esperado

Os 14 corretores passam a aparecer corretamente no cadastro com a bandeira do Brasil 🇧🇷 e o número formatado `+55 (51) 9XXXX-XXXX`.
