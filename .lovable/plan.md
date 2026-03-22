

# Bug: Transferência para Roleta sobrescreve o empreendimento original do lead

## Causa raiz

No `TransferLeadDialog`, ao transferir para uma roleta, o código busca o **primeiro** `empreendimento_id` vinculado à roleta (linha 77-82) e **sobrescreve** o `project_id` do lead com esse valor (linha 98).

Se a roleta tem múltiplos empreendimentos (ex: Mauricio Cardoso e NAU), o primeiro retornado pelo banco substitui o empreendimento real do lead. No caso da Mari Prediger, o lead veio do NAU, mas o Mauricio Cardoso foi retornado primeiro na query, sobrescrevendo o `project_id`.

## Correção

### `src/components/crm/TransferLeadDialog.tsx`

**Não sobrescrever o `project_id` do lead.** O lead já possui o `project_id` correto (NAU). A transferência para roleta deve:

1. Manter o `project_id` original do lead
2. Buscar o `project_id` atual do lead para passar ao `roleta-distribuir`
3. Só usar o empreendimento da roleta como fallback se o lead não tiver `project_id`

Mudanças:
- Antes de limpar os campos, buscar o `project_id` atual do lead
- Usar esse `project_id` para invocar `roleta-distribuir`
- Somente se o lead não tiver `project_id`, usar o primeiro empreendimento da roleta como fallback
- **Nunca sobrescrever** o `project_id` do lead com o empreendimento da roleta

```text
// Fluxo corrigido:
1. Buscar lead.project_id atual
2. Se lead.project_id existir → usar esse para roleta-distribuir (não alterar)
3. Se lead.project_id for null → buscar primeiro empreendimento da roleta como fallback
4. Limpar broker_id, status_distribuicao, etc. (sem mexer no project_id, exceto no fallback)
5. Invocar roleta-distribuir com o project_id correto
```

### Nenhuma mudança na edge function `roleta-distribuir`
A edge function já funciona corretamente — ela recebe `project_id` e distribui. O problema era exclusivamente no frontend que passava o `project_id` errado.

