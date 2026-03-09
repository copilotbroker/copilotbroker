
-- Add lead_unificado to interaction_type enum
ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'lead_unificado';

-- Create unify_lead function
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

  -- Find oldest lead with same normalized phone + same broker
  SELECT * INTO _old_lead FROM leads
  WHERE whatsapp = _new_lead.whatsapp
    AND broker_id IS NOT DISTINCT FROM _new_lead.broker_id
    AND id != _new_lead_id
  ORDER BY created_at ASC LIMIT 1;

  IF NOT FOUND THEN RETURN _new_lead_id; END IF;

  -- Merge fields: preserve old values, fill nulls from new
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

  -- Transfer all related records to old (primary) lead
  UPDATE lead_interactions SET lead_id = _old_lead.id WHERE lead_id = _new_lead_id;
  UPDATE lead_documents SET lead_id = _old_lead.id WHERE lead_id = _new_lead_id;
  UPDATE lead_attribution SET lead_id = _old_lead.id WHERE lead_id = _new_lead_id;
  UPDATE propostas SET lead_id = _old_lead.id WHERE lead_id = _new_lead_id;
  UPDATE conversations SET lead_id = _old_lead.id WHERE lead_id = _new_lead_id;
  UPDATE whatsapp_message_queue SET lead_id = _old_lead.id WHERE lead_id = _new_lead_id;
  UPDATE notifications SET lead_id = _old_lead.id WHERE lead_id = _new_lead_id;

  -- Log unification
  INSERT INTO lead_interactions (lead_id, interaction_type, notes)
  VALUES (_old_lead.id, 'lead_unificado',
    'Lead duplicado unificado automaticamente. Registro removido: ' || _new_lead_id::text);

  -- Delete duplicate
  DELETE FROM leads WHERE id = _new_lead_id;

  RETURN _old_lead.id;
END;
$$;
