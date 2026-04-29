CREATE OR REPLACE FUNCTION public.unify_lead(_new_lead_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _new_lead RECORD;
  _old_lead RECORD;
  _has_active_cadence boolean;
  _final_status text;
BEGIN
  SELECT * INTO _new_lead FROM leads WHERE id = _new_lead_id;
  IF NOT FOUND THEN RETURN _new_lead_id; END IF;

  -- Só unifica leads do MESMO whatsapp + MESMO broker + MESMO project.
  -- Se o lead se cadastrou em outro imóvel (project_id diferente), tratamos como lead novo.
  SELECT * INTO _old_lead FROM leads
  WHERE whatsapp = _new_lead.whatsapp
    AND broker_id IS NOT DISTINCT FROM _new_lead.broker_id
    AND project_id IS NOT DISTINCT FROM _new_lead.project_id
    AND id != _new_lead_id
  ORDER BY created_at ASC LIMIT 1;

  IF NOT FOUND THEN RETURN _new_lead_id; END IF;

  SELECT EXISTS (
    SELECT 1 FROM whatsapp_campaigns
    WHERE lead_id IN (_old_lead.id, _new_lead_id)
      AND status = 'running'
  ) INTO _has_active_cadence;

  IF _has_active_cadence THEN
    _final_status := 'awaiting_docs';
  ELSE
    _final_status := 'new';
  END IF;

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
    status = _final_status::lead_status,
    updated_at = now()
  WHERE id = _old_lead.id;

  UPDATE lead_interactions SET lead_id = _old_lead.id WHERE lead_id = _new_lead_id;
  UPDATE lead_documents SET lead_id = _old_lead.id WHERE lead_id = _new_lead_id;
  UPDATE lead_attribution SET lead_id = _old_lead.id WHERE lead_id = _new_lead_id;
  UPDATE propostas SET lead_id = _old_lead.id WHERE lead_id = _new_lead_id;
  UPDATE conversations SET lead_id = _old_lead.id WHERE lead_id = _new_lead_id;
  UPDATE whatsapp_message_queue SET lead_id = _old_lead.id WHERE lead_id = _new_lead_id;
  UPDATE whatsapp_campaigns SET lead_id = _old_lead.id WHERE lead_id = _new_lead_id;
  UPDATE notifications SET lead_id = _old_lead.id WHERE lead_id = _new_lead_id;

  INSERT INTO lead_interactions (lead_id, interaction_type, notes)
  VALUES (_old_lead.id, 'lead_unificado',
    'Lead duplicado unificado automaticamente (mesmo imóvel). Registro removido: ' || _new_lead_id::text ||
    CASE WHEN _has_active_cadence THEN ' (cadência ativa mantida)' ELSE '' END);

  DELETE FROM leads WHERE id = _new_lead_id;

  RETURN _old_lead.id;
END;
$function$;