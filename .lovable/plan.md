## Causa-raiz

A RPC `public.transfer_lead` valida a existência do corretor destino pelo valor de `organization_id`:

```sql
SELECT organization_id INTO _new_broker_org
FROM public.brokers
WHERE id = _new_broker_id AND is_active = true;

IF _new_broker_org IS NULL THEN
  RAISE EXCEPTION 'Corretor destino nao encontrado ou inativo';
END IF;
```

A Kely Monique (`04a17428-6796-45df-8801-5c98bd0910af`) está **ativa**, mas seu `organization_id` está **NULL** (corretora legada, anterior ao multi-tenant). Resultado: `_new_broker_org` vem NULL mesmo o corretor existindo e ativo, e a função aborta com "Corretor destino nao encontrado ou inativo".

O mesmo problema afeta qualquer corretor sem organização preenchida (ex.: Maicon Enove também está nessa situação na verdade tem org, mas Kely não).

## Correção

Em `supabase/functions` migration (RPC SQL): separar a checagem de existência da leitura da organização.

```sql
-- 1) Confirma existência/ativo independentemente da org
IF NOT EXISTS (
  SELECT 1 FROM public.brokers
  WHERE id = _new_broker_id AND is_active = true
) THEN
  RAISE EXCEPTION 'Corretor destino nao encontrado ou inativo';
END IF;

-- 2) Lê a org (pode ser NULL)
SELECT organization_id INTO _new_broker_org
FROM public.brokers
WHERE id = _new_broker_id;
```

As verificações posteriores de organização já estão protegidas com `IS NOT NULL` (`_caller_org IS NOT NULL AND _new_broker_org IS NOT NULL ...`), então corretores legados sem org continuarão transferíveis dentro do mesmo escopo.

## Escopo

- 1 migration SQL recriando `public.transfer_lead(uuid, uuid)` com a checagem corrigida. Nenhuma alteração de frontend.

## Validação

- Logada como Kely, transferir o lead Maicon Enove para ela mesma (ou outro corretor) deve concluir com sucesso.
- Transferências entre corretores com `organization_id` preenchido continuam funcionando e respeitando o isolamento de organização.
