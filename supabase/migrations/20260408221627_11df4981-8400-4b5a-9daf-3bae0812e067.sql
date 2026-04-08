
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
  _lead_phone text;
  _phone_normalized text;
  _source_conv_id uuid;
  _existing_conv_id uuid;
  _lead_name text;
  _last_msg RECORD;
BEGIN
  _is_admin := has_role(auth.uid(), 'admin'::app_role);
  
  SELECT id INTO _caller_broker_id 
  FROM brokers WHERE user_id = auth.uid() LIMIT 1;
  
  SELECT broker_id, whatsapp, name INTO _old_broker_id, _lead_phone, _lead_name
  FROM leads WHERE id = _lead_id;
  
  IF NOT _is_admin 
     AND _caller_broker_id IS DISTINCT FROM _old_broker_id
     AND NOT EXISTS (
       SELECT 1 FROM brokers 
       WHERE id = _old_broker_id AND lider_id = _caller_broker_id
     )
  THEN
    RAISE EXCEPTION 'Sem permissao para transferir este lead';
  END IF;

  -- Normalize phone
  _phone_normalized := regexp_replace(_lead_phone, '[^0-9]', '', 'g');
  IF length(_phone_normalized) <= 11 THEN
    _phone_normalized := '55' || _phone_normalized;
  END IF;
  
  -- Update lead
  UPDATE leads SET 
    broker_id = _new_broker_id,
    updated_at = now(),
    status_distribuicao = NULL,
    reserva_expira_em = NULL
  WHERE id = _lead_id;
  
  -- Find source conversation (old broker's conversation linked to this lead)
  SELECT id INTO _source_conv_id
  FROM conversations
  WHERE lead_id = _lead_id
  ORDER BY last_message_at DESC NULLS LAST
  LIMIT 1;

  -- If no conversation linked by lead_id, try by old broker + phone
  IF _source_conv_id IS NULL AND _old_broker_id IS NOT NULL THEN
    SELECT id INTO _source_conv_id
    FROM conversations
    WHERE broker_id = _old_broker_id
      AND phone_normalized = _phone_normalized
    ORDER BY last_message_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  -- Find existing conversation of new broker with same phone
  SELECT id INTO _existing_conv_id
  FROM conversations
  WHERE broker_id = _new_broker_id
    AND phone_normalized = _phone_normalized
  LIMIT 1;

  IF _existing_conv_id IS NOT NULL AND _source_conv_id IS NOT NULL AND _existing_conv_id != _source_conv_id THEN
    -- Merge: migrate messages from source to existing
    UPDATE conversation_messages 
    SET conversation_id = _existing_conv_id
    WHERE conversation_id = _source_conv_id;

    -- Link lead to existing conversation
    UPDATE conversations 
    SET lead_id = _lead_id,
        display_name = COALESCE(display_name, _lead_name),
        display_name_source = CASE WHEN display_name IS NULL OR display_name_source = 'phone' THEN 'lead' ELSE display_name_source END,
        reserva_expira_em = NULL,
        updated_at = now()
    WHERE id = _existing_conv_id;

    -- Update last_message fields on merged conversation
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

    -- Delete orphan source conversation
    DELETE FROM conversations WHERE id = _source_conv_id;

  ELSIF _source_conv_id IS NOT NULL THEN
    -- No existing conv on new broker: move source conversation
    UPDATE conversations SET 
      broker_id = _new_broker_id,
      reserva_expira_em = NULL,
      updated_at = now()
    WHERE id = _source_conv_id;
  END IF;
  
  -- Log interaction
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
