CREATE OR REPLACE FUNCTION public.migrate_queue_on_broker_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_old_first_name text;
  v_new_first_name text;
BEGIN
  IF NEW.broker_id IS DISTINCT FROM OLD.broker_id AND NEW.broker_id IS NOT NULL THEN
    SELECT split_part(name, ' ', 1) INTO v_old_first_name FROM public.brokers WHERE id = OLD.broker_id;
    SELECT split_part(name, ' ', 1) INTO v_new_first_name FROM public.brokers WHERE id = NEW.broker_id;

    UPDATE public.whatsapp_message_queue
       SET broker_id  = NEW.broker_id,
           message    = CASE
                          WHEN v_old_first_name IS NOT NULL AND v_new_first_name IS NOT NULL
                          THEN regexp_replace(message, '\m' || v_old_first_name || '\M', v_new_first_name, 'g')
                          ELSE message
                        END,
           updated_at = now()
     WHERE lead_id = NEW.id
       AND status IN ('scheduled','queued');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.transfer_lead(_lead_id uuid, _new_broker_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _old_broker_id uuid;
  _caller_broker_id uuid;
  _is_admin boolean;
  _lead_org uuid;
  _caller_org uuid;
  _new_broker_org uuid;
  _lead_phone text;
  _phone_normalized text;
  _source_conv_id uuid;
  _existing_conv_id uuid;
  _lead_name text;
  _last_msg RECORD;
BEGIN
  _is_admin := public.has_role(auth.uid(), 'admin'::app_role) OR public.is_super_admin(auth.uid());

  SELECT id, organization_id INTO _caller_broker_id, _caller_org
  FROM public.brokers
  WHERE user_id = auth.uid()
    AND is_active = true
  LIMIT 1;

  SELECT broker_id, whatsapp, name, organization_id
  INTO _old_broker_id, _lead_phone, _lead_name, _lead_org
  FROM public.leads
  WHERE id = _lead_id;

  IF _lead_name IS NULL THEN
    RAISE EXCEPTION 'Lead nao encontrado';
  END IF;

  SELECT organization_id INTO _new_broker_org
  FROM public.brokers
  WHERE id = _new_broker_id
    AND is_active = true;

  IF _new_broker_org IS NULL THEN
    RAISE EXCEPTION 'Corretor destino nao encontrado ou inativo';
  END IF;

  IF NOT _is_admin THEN
    IF _caller_broker_id IS NULL THEN
      RAISE EXCEPTION 'Sem permissao para transferir este lead';
    END IF;

    IF _caller_org IS NOT NULL
       AND _new_broker_org IS NOT NULL
       AND _caller_org IS DISTINCT FROM _new_broker_org THEN
      RAISE EXCEPTION 'Sem permissao para transferir para corretor de outra organizacao';
    END IF;

    IF _lead_org IS NOT NULL
       AND _new_broker_org IS NOT NULL
       AND _lead_org IS DISTINCT FROM _new_broker_org THEN
      RAISE EXCEPTION 'Sem permissao para transferir lead de outra organizacao';
    END IF;
  END IF;

  _phone_normalized := regexp_replace(COALESCE(_lead_phone,''), '[^0-9]', '', 'g');
  IF length(_phone_normalized) > 0 AND length(_phone_normalized) <= 11 THEN
    _phone_normalized := '55' || _phone_normalized;
  END IF;

  UPDATE public.leads SET
    broker_id = _new_broker_id,
    corretor_atribuido_id = _new_broker_id,
    updated_at = now(),
    status_distribuicao = 'atendimento_iniciado'::distribution_status,
    reserva_expira_em = NULL,
    atribuido_em = now(),
    atendimento_iniciado_em = COALESCE(atendimento_iniciado_em, now()),
    motivo_atribuicao = 'Transferência manual'
  WHERE id = _lead_id;

  SELECT id INTO _source_conv_id
  FROM public.conversations
  WHERE lead_id = _lead_id
  ORDER BY last_message_at DESC NULLS LAST
  LIMIT 1;

  IF _source_conv_id IS NULL AND _old_broker_id IS NOT NULL AND _phone_normalized <> '' THEN
    SELECT id INTO _source_conv_id
    FROM public.conversations
    WHERE broker_id = _old_broker_id
      AND phone_normalized = _phone_normalized
    ORDER BY last_message_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF _phone_normalized <> '' THEN
    SELECT id INTO _existing_conv_id
    FROM public.conversations
    WHERE broker_id = _new_broker_id
      AND phone_normalized = _phone_normalized
    LIMIT 1;
  END IF;

  IF _existing_conv_id IS NOT NULL AND _source_conv_id IS NOT NULL AND _existing_conv_id != _source_conv_id THEN
    UPDATE public.conversation_messages
    SET conversation_id = _existing_conv_id
    WHERE conversation_id = _source_conv_id;

    SELECT created_at, content, direction, message_type INTO _last_msg
    FROM public.conversation_messages
    WHERE conversation_id = _existing_conv_id
    ORDER BY created_at DESC
    LIMIT 1;

    UPDATE public.conversations
    SET lead_id = _lead_id,
        display_name = COALESCE(display_name, _lead_name),
        display_name_source = CASE WHEN display_name IS NULL OR display_name_source = 'phone' THEN 'lead' ELSE display_name_source END,
        attendance_started = true,
        reserva_expira_em = NULL,
        last_message_at = COALESCE(_last_msg.created_at, last_message_at),
        last_message_preview = COALESCE(LEFT(_last_msg.content, 100), last_message_preview),
        last_message_direction = COALESCE(_last_msg.direction, last_message_direction),
        last_message_type = COALESCE(_last_msg.message_type, last_message_type, 'text'),
        unread_count = (SELECT count(*) FROM public.conversation_messages WHERE conversation_id = _existing_conv_id AND direction = 'inbound' AND status = 'delivered'),
        updated_at = now()
    WHERE id = _existing_conv_id;

    DELETE FROM public.conversations WHERE id = _source_conv_id;

  ELSIF _source_conv_id IS NOT NULL THEN
    UPDATE public.conversations SET
      broker_id = _new_broker_id,
      lead_id = _lead_id,
      attendance_started = true,
      reserva_expira_em = NULL,
      updated_at = now()
    WHERE id = _source_conv_id;
  END IF;

  INSERT INTO public.lead_interactions (lead_id, interaction_type, notes, created_by)
  VALUES (
    _lead_id,
    'roleta_transferencia',
    'Lead transferido manualmente de corretor ' ||
      COALESCE((SELECT name FROM public.brokers WHERE id = _old_broker_id), 'Enove') ||
      ' para ' ||
      (SELECT name FROM public.brokers WHERE id = _new_broker_id),
    auth.uid()
  );
END;
$function$;