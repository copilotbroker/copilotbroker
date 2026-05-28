
-- Re-apply unify_lead (same as before)
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
  _new_instance text;
  _old_instance text;
  _found_match boolean := false;
BEGIN
  SELECT * INTO _new_lead FROM leads WHERE id = _new_lead_id;
  IF NOT FOUND THEN RETURN _new_lead_id; END IF;

  SELECT COALESCE(source_instance, 'personal') INTO _new_instance
  FROM conversations WHERE lead_id = _new_lead_id
  ORDER BY created_at ASC LIMIT 1;
  _new_instance := COALESCE(_new_instance, 'personal');

  FOR _old_lead IN
    SELECT l.* FROM leads l
    WHERE l.whatsapp = _new_lead.whatsapp
      AND l.broker_id IS NOT DISTINCT FROM _new_lead.broker_id
      AND l.project_id IS NOT DISTINCT FROM _new_lead.project_id
      AND l.id != _new_lead_id
    ORDER BY l.created_at ASC
  LOOP
    SELECT COALESCE(source_instance, 'personal') INTO _old_instance
    FROM conversations WHERE lead_id = _old_lead.id
    ORDER BY created_at ASC LIMIT 1;
    _old_instance := COALESCE(_old_instance, 'personal');

    IF _old_instance = _new_instance THEN
      _found_match := true;
      EXIT;
    END IF;
  END LOOP;

  IF NOT _found_match THEN RETURN _new_lead_id; END IF;

  SELECT EXISTS (
    SELECT 1 FROM whatsapp_campaigns
    WHERE lead_id IN (_old_lead.id, _new_lead_id) AND status = 'running'
  ) INTO _has_active_cadence;

  _final_status := CASE WHEN _has_active_cadence THEN 'awaiting_docs' ELSE 'new' END;

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
    'Lead duplicado unificado (mesma instância+imóvel). Removido: ' || _new_lead_id::text ||
    CASE WHEN _has_active_cadence THEN ' (cadência ativa mantida)' ELSE '' END);

  DELETE FROM leads WHERE id = _new_lead_id;
  RETURN _old_lead.id;
END;
$function$;

-- Re-apply create_manual_lead_with_conversation (same as before)
CREATE OR REPLACE FUNCTION public.create_manual_lead_with_conversation(
  _name text,
  _whatsapp text,
  _project_id uuid,
  _instance text,
  _broker_id uuid DEFAULT NULL,
  _origin text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller_broker_id uuid;
  _phone_clean text;
  _phone_normalized text;
  _existing_conv RECORD;
  _lead_id uuid;
  _conv_id uuid;
  _is_admin boolean;
  _final_broker_id uuid;
  _org_id uuid;
BEGIN
  IF _instance NOT IN ('global','personal') THEN
    RAISE EXCEPTION 'Instância inválida: %', _instance;
  END IF;

  _caller_broker_id := public.get_my_broker_id();
  _is_admin := public.has_role(auth.uid(), 'admin'::app_role) OR public.is_super_admin(auth.uid());

  IF _instance = 'personal' AND _caller_broker_id IS NULL AND _broker_id IS NULL THEN
    RAISE EXCEPTION 'Sem corretor associado para instância pessoal';
  END IF;

  _final_broker_id := CASE
    WHEN _instance = 'personal' THEN COALESCE(_broker_id, _caller_broker_id)
    ELSE _broker_id
  END;

  _phone_clean := regexp_replace(COALESCE(_whatsapp,''), '[^0-9]', '', 'g');
  IF length(_phone_clean) = 0 THEN
    RAISE EXCEPTION 'Telefone inválido';
  END IF;
  _phone_normalized := CASE WHEN length(_phone_clean) <= 11 THEN '55' || _phone_clean ELSE _phone_clean END;

  IF _project_id IS NOT NULL THEN
    SELECT organization_id INTO _org_id FROM projects WHERE id = _project_id;
  END IF;
  IF _org_id IS NULL AND _caller_broker_id IS NOT NULL THEN
    SELECT organization_id INTO _org_id FROM brokers WHERE id = _caller_broker_id;
  END IF;

  IF _instance = 'global' THEN
    SELECT c.id, c.broker_id, c.attendance_started, c.lead_id, b.name AS bname
      INTO _existing_conv
    FROM conversations c
    LEFT JOIN brokers b ON b.id = c.broker_id
    WHERE c.source_instance = 'global'
      AND c.phone_normalized = _phone_normalized
      AND (_org_id IS NULL OR c.organization_id IS NULL OR c.organization_id = _org_id)
    ORDER BY c.created_at ASC LIMIT 1;

    IF FOUND THEN
      IF _existing_conv.broker_id IS NOT NULL
         AND _caller_broker_id IS NOT NULL
         AND _existing_conv.broker_id = _caller_broker_id THEN
        RETURN jsonb_build_object('action','opened_existing','conversation_id',_existing_conv.id,'lead_id',_existing_conv.lead_id,'source_instance','global');
      END IF;
      IF _existing_conv.broker_id IS NOT NULL
         AND _existing_conv.broker_id IS DISTINCT FROM _caller_broker_id
         AND COALESCE(_existing_conv.attendance_started, false) = true THEN
        RETURN jsonb_build_object('action','blocked_global','existing_broker_name',_existing_conv.bname,'source_instance','global');
      END IF;
      RETURN jsonb_build_object('action','opened_existing','conversation_id',_existing_conv.id,'lead_id',_existing_conv.lead_id,'source_instance','global');
    END IF;
  END IF;

  IF _instance = 'personal' THEN
    SELECT c.id, c.lead_id INTO _existing_conv
    FROM conversations c
    WHERE c.source_instance = 'personal'
      AND c.broker_id = _final_broker_id
      AND c.phone_normalized = _phone_normalized
    ORDER BY c.created_at ASC LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object('action','opened_existing','conversation_id',_existing_conv.id,'lead_id',_existing_conv.lead_id,'source_instance','personal');
    END IF;
  END IF;

  _lead_id := gen_random_uuid();
  _conv_id := gen_random_uuid();

  INSERT INTO leads (id, name, whatsapp, source, status, lead_origin, project_id, broker_id, organization_id)
  VALUES (_lead_id, _name, _whatsapp, 'manual', 'new'::lead_status,
          COALESCE(_origin,'Cadastrado manualmente'), _project_id, _final_broker_id, _org_id);

  BEGIN
    INSERT INTO lead_attribution (lead_id, project_id, landing_page, organization_id)
    VALUES (_lead_id, _project_id, 'manual_' || _instance, _org_id);
  EXCEPTION WHEN others THEN NULL; END;

  INSERT INTO conversations (
    id, broker_id, lead_id, phone, phone_normalized,
    source_instance, status, ai_mode, attendance_started,
    display_name, display_name_source,
    last_message_preview, last_message_at, organization_id
  ) VALUES (
    _conv_id, _final_broker_id, _lead_id,
    '+' || _phone_normalized, _phone_normalized,
    _instance, 'unread', 'copilot', false,
    _name, 'lead',
    'Lead adicionado manualmente', now(), _org_id
  );

  RETURN jsonb_build_object('action','created','conversation_id',_conv_id,'lead_id',_lead_id,'source_instance',_instance);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_manual_lead_with_conversation(text, text, uuid, text, uuid, text) TO authenticated;

-- Trigger
CREATE OR REPLACE FUNCTION public.mark_lead_attendance_on_queue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.lead_id IS NULL THEN RETURN NEW; END IF;
  UPDATE public.leads
     SET status_distribuicao = 'atendimento_iniciado'::distribution_status,
         atendimento_iniciado_em = COALESCE(atendimento_iniciado_em, now()),
         updated_at = now()
   WHERE id = NEW.lead_id
     AND COALESCE(status_distribuicao::text, '') <> 'atendimento_iniciado';
  UPDATE public.conversations
     SET attendance_started = true, reserva_expira_em = NULL, updated_at = now()
   WHERE lead_id = NEW.lead_id AND attendance_started = false;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_attendance_on_queue ON public.whatsapp_message_queue;
CREATE TRIGGER trg_mark_attendance_on_queue
AFTER INSERT ON public.whatsapp_message_queue
FOR EACH ROW EXECUTE FUNCTION public.mark_lead_attendance_on_queue();

-- Backfill safe: link first, only insert when none exists
DO $$
DECLARE
  _lead RECORD;
  _phone_clean text;
  _phone_normalized text;
  _existing_id uuid;
BEGIN
  FOR _lead IN
    SELECT l.id, l.broker_id, l.whatsapp, l.name, l.created_at, l.organization_id
    FROM public.leads l
    WHERE l.whatsapp IS NOT NULL AND l.whatsapp <> ''
      AND l.broker_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.conversations c WHERE c.lead_id = l.id)
    LIMIT 5000
  LOOP
    _phone_clean := regexp_replace(_lead.whatsapp, '[^0-9]', '', 'g');
    IF length(_phone_clean) = 0 THEN CONTINUE; END IF;
    _phone_normalized := CASE WHEN length(_phone_clean) <= 11 THEN '55' || _phone_clean ELSE _phone_clean END;

    -- Try to link any existing personal conversation for this broker+phone
    SELECT id INTO _existing_id FROM public.conversations
     WHERE broker_id = _lead.broker_id
       AND phone_normalized = _phone_normalized
       AND COALESCE(source_instance,'personal') = 'personal'
     ORDER BY created_at ASC LIMIT 1;

    IF _existing_id IS NOT NULL THEN
      UPDATE public.conversations
         SET lead_id = COALESCE(lead_id, _lead.id), updated_at = now()
       WHERE id = _existing_id;
      CONTINUE;
    END IF;

    -- Insert placeholder
    BEGIN
      INSERT INTO public.conversations (
        broker_id, lead_id, phone, phone_normalized,
        source_instance, status, ai_mode, attendance_started,
        display_name, display_name_source,
        last_message_preview, last_message_at, organization_id
      ) VALUES (
        _lead.broker_id, _lead.id, '+' || _phone_normalized, _phone_normalized,
        'personal', 'unread', 'copilot', false,
        _lead.name, 'lead',
        'Lead adicionado manualmente (backfill)', _lead.created_at, _lead.organization_id
      );
    EXCEPTION WHEN unique_violation THEN
      -- Race or stale: just skip
      NULL;
    END;
  END LOOP;
END $$;
