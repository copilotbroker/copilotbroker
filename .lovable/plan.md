

## Plano: Unificação Automática de Leads Duplicados

### Problema

Quando um lead é cadastrado manualmente ou importado via CSV com um telefone que já existe no escopo do mesmo corretor, o sistema cria um registro duplicado. O esperado é que o lead existente (mais antigo) seja preservado e atualizado com os novos dados, sem perder histórico.

### Estratégia

Criar uma **database function** `unify_lead` que centraliza toda a lógica de unificação. Tanto o `AddLeadModal` quanto o `CsvImportModal` chamarão essa função ao detectar duplicata, em vez de inserir um novo registro.

### Mudanças

#### 1. Migration: adicionar `lead_unificado` ao enum `interaction_type` e criar função `unify_lead`

A função `unify_lead` recebe o ID do lead novo (recém-inserido) e faz:
- Busca lead existente com mesmo `whatsapp` e `broker_id` (o mais antigo)
- Se não encontrar duplicata, retorna sem fazer nada
- Transfere dados preenchidos do novo para o antigo (nome, email, CPF, notas, project_id, lead_origin) sem sobrescrever campos já preenchidos no antigo
- Transfere registros vinculados: `lead_interactions`, `lead_documents`, `lead_attribution`, `propostas`, `conversations`, `whatsapp_message_queue`
- Reseta o lead antigo para status `new` (Pré-Atendimento)
- Registra interação `lead_unificado` no lead principal
- Deleta o lead duplicado
- Retorna o ID do lead principal

#### 2. `AddLeadModal.tsx` — verificar duplicata antes de inserir

Após inserir o lead, chamar `supabase.rpc('unify_lead', { new_lead_id: leadId })`. Se a função retornar um ID diferente, significa que houve unificação. Mostrar toast informativo: "Lead unificado com registro existente".

#### 3. `CsvImportModal.tsx` — unificar em vez de ignorar duplicatas

Remover a lógica atual de "ignorar duplicatas" (que apenas descarta). Em vez disso:
- Inserir todos os leads normalmente
- Após cada batch, chamar `unify_lead` para cada lead inserido
- Contar unificações separadamente no resultado final

### Detalhes técnicos

**Função SQL `unify_lead`** (SECURITY DEFINER):

```sql
CREATE OR REPLACE FUNCTION public.unify_lead(_new_lead_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _new_lead RECORD;
  _old_lead RECORD;
BEGIN
  SELECT * INTO _new_lead FROM leads WHERE id = _new_lead_id;
  IF NOT FOUND THEN RETURN _new_lead_id; END IF;

  -- Find oldest lead with same phone + broker
  SELECT * INTO _old_lead FROM leads
  WHERE whatsapp = _new_lead.whatsapp
    AND broker_id IS NOT DISTINCT FROM _new_lead.broker_id
    AND id != _new_lead_id
  ORDER BY created_at ASC LIMIT 1;

  IF NOT FOUND THEN RETURN _new_lead_id; END IF;

  -- Merge fields (new overwrites old only if old is null)
  UPDATE leads SET
    name = COALESCE(_old_lead.name, _new_lead.name),
    email = COALESCE(_old_lead.email, _new_lead.email),
    cpf = COALESCE(_old_lead.cpf, _new_lead.cpf),
    notes = CASE 
      WHEN _old_lead.notes IS NOT NULL AND _new_lead.notes IS NOT NULL 
      THEN _old_lead.notes || E'\n---\n' || _new_lead.notes
      ELSE COALESCE(_old_lead.notes, _new_lead.notes) END,
    project_id = COALESCE(_new_lead.project_id, _old_lead.project_id),
    lead_origin = COALESCE(_new_lead.lead_origin, _old_lead.lead_origin),
    status = 'new',
    updated_at = now()
  WHERE id = _old_lead.id;

  -- Transfer related records
  UPDATE lead_interactions SET lead_id = _old_lead.id WHERE lead_id = _new_lead_id;
  UPDATE lead_documents SET lead_id = _old_lead.id WHERE lead_id = _new_lead_id;
  UPDATE lead_attribution SET lead_id = _old_lead.id WHERE lead_id = _new_lead_id;
  UPDATE propostas SET lead_id = _old_lead.id WHERE lead_id = _new_lead_id;
  UPDATE conversations SET lead_id = _old_lead.id WHERE lead_id = _new_lead_id;
  UPDATE whatsapp_message_queue SET lead_id = _old_lead.id WHERE lead_id = _new_lead_id;

  -- Log unification
  INSERT INTO lead_interactions (lead_id, interaction_type, notes)
  VALUES (_old_lead.id, 'lead_unificado',
    'Lead duplicado unificado. Registro removido: ' || _new_lead_id);

  -- Delete duplicate
  DELETE FROM leads WHERE id = _new_lead_id;

  RETURN _old_lead.id;
END;
$$;
```

**Enum update**: `ALTER TYPE interaction_type ADD VALUE 'lead_unificado';`

**AddLeadModal** — após o insert com sucesso, adicionar:
```typescript
const { data: unifiedId } = await supabase.rpc('unify_lead', { _new_lead_id: leadId });
if (unifiedId && unifiedId !== leadId) {
  toast.info("Lead unificado com registro existente");
}
```

**CsvImportModal** — após cada batch insert, iterar e chamar `unify_lead` para cada lead, contando unificações. Remover a lógica de pré-filtragem por `existingPhones`.

### Arquivos a editar

| Ação | Arquivo |
|------|---------|
| Migration | Adicionar `lead_unificado` ao enum + criar função `unify_lead` |
| Editar | `src/components/admin/AddLeadModal.tsx` — chamar `unify_lead` pós-insert |
| Editar | `src/components/admin/CsvImportModal.tsx` — substituir lógica de duplicatas por `unify_lead` |

