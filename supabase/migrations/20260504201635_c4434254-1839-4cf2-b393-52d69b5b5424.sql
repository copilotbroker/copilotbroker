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
  _is_leader boolean;
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
  _is_admin  := has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid());
  _is_leader := has_role(auth.uid(), 'leader'::app_role);

  SELECT id, organization_id INTO _caller_broker_id, _caller_org
  FROM brokers WHERE user_id = auth.uid() LIMIT 1;

  SELECT broker_id, whatsapp, name, organization_id
  INTO _old_broker_id, _lead_phone, _lead_name, _lead_org
  FROM leads WHERE id = _lead_id;

  SELECT organization_id INTO _new_broker_org
  FROM brokers WHERE id = _new_broker_id;

  -- Permission: admin/super_admin always allowed.
  -- Otherwise caller must be an active broker in the same org as both the lead and the destination broker.
  IF NOT _is_admin THEN
    IF _caller_broker_id IS NULL THEN
      RAISE EXCEPTION 'Sem permissao para transferir este lead';
    END IF;
    IF _caller_org IS NOT NULL
       AND _lead_org IS NOT NULL
       AND _caller_org IS DISTINCT FROM _lead_org THEN
      RAISE EXCEPTION 'Sem permissao para transferir este lead';
    END IF;
    IF _caller_org IS NOT NULL
       AND _new_broker_org IS NOT NULL
       AND _caller_org IS DISTINCT FROM _new_broker_org THEN
      RAISE EXCEPTION 'Sem permissao para transferir para corretor de outra organizacao';
    END IF;
  END IF;

  _phone_normalized := regexp_replace(COALESCE(_lead_phone,''), '[^0-9]', '', 'g');
  IF length(_phone_normalized) <= 11 THEN
    _phone_normalized := '55' || _phone_normalized;
  END IF;

  UPDATE leads SET
    broker_id = _new_broker_id,
    updated_at = now(),
    status_distribuicao = NULL,
    reserva_expira_em = NULL
  WHERE id = _lead_id;

  SELECT id INTO _source_conv_id
  FROM conversations
  WHERE lead_id = _lead_id
  ORDER BY last_message_at DESC NULLS LAST
  LIMIT 1;

  IF _source_conv_id IS NULL AND _old_broker_id IS NOT NULL THEN
    SELECT id INTO _source_conv_id
    FROM conversations
    WHERE broker_id = _old_broker_id
      AND phone_normalized = _phone_normalized
    ORDER BY last_message_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  SELECT id INTO _existing_conv_id
  FROM conversations
  WHERE broker_id = _new_broker_id
    AND phone_normalized = _phone_normalized
  LIMIT 1;

  IF _existing_conv_id IS NOT NULL AND _source_conv_id IS NOT NULL AND _existing_conv_id != _source_conv_id THEN
    UPDATE conversation_messages
    SET conversation_id = _existing_conv_id
    WHERE conversation_id = _source_conv_id;

    UPDATE conversations
    SET lead_id = _lead_id,
        display_name = COALESCE(display_name, _lead_name),
        display_name_source = CASE WHEN display_name IS NULL OR display_name_source = 'phone' THEN 'lead' ELSE display_name_source END,
        reserva_expira_em = NULL,
        updated_at = now()
    WHERE id = _existing_conv_id;

    SELECT created_at, content, direction, message_type INTO _last_msg
    FROM conversation_messages
    WHERE conversation_id = _existing_conv_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF _last_msg IS NOT NULL THEN
      UPDATE conversations SET
        last_message_at = _last_msg.created_at,
        last_message_preview = LEFT(_last_msg.content, 100),
        last_message_direction = _last_msg.direction,
        last_message_type = COALESCE(_last_msg.message_type, 'text'),
        unread_count = (SELECT count(*) FROM conversation_messages WHERE conversation_id = _existing_conv_id AND direction = 'inbound' AND status = 'delivered')
      WHERE id = _existing_conv_id;
    END IF;

    DELETE FROM conversations WHERE id = _source_conv_id;

  ELSIF _source_conv_id IS NOT NULL THEN
    UPDATE conversations SET
      broker_id = _new_broker_id,
      reserva_expira_em = NULL,
      updated_at = now()
    WHERE id = _source_conv_id;
  END IF;

  INSERT INTO lead_interactions (lead_id, interaction_type, notes, created_by)
  VALUES (
    _lead_id,
    'roleta_transferencia',
    'Lead transferido manualmente de corretor ' ||
      COALESCE((SELECT name FROM brokers WHERE id = _old_broker_id), 'Enove') ||
      ' para ' ||
      (SELECT name FROM brokers WHERE id = _new_broker_id),
    auth.uid()
  );
END;
$function$;