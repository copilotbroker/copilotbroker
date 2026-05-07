CREATE OR REPLACE FUNCTION public.pull_global_conversation_to_personal(_conversation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller_broker_id uuid;
  _src RECORD;
  _existing_personal_id uuid;
  _last_msg RECORD;
  _unread int;
BEGIN
  _caller_broker_id := public.get_my_broker_id();
  IF _caller_broker_id IS NULL THEN
    RAISE EXCEPTION 'Corretor não encontrado para o usuário atual';
  END IF;

  SELECT * INTO _src FROM public.conversations WHERE id = _conversation_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversa não encontrada';
  END IF;

  IF COALESCE(_src.source_instance,'personal') <> 'global' THEN
    RAISE EXCEPTION 'Conversa não está na instância global';
  END IF;

  SELECT id INTO _existing_personal_id
  FROM public.conversations
  WHERE broker_id = _caller_broker_id
    AND phone_normalized = _src.phone_normalized
    AND COALESCE(source_instance,'personal') = 'personal'
  LIMIT 1;

  IF _existing_personal_id IS NOT NULL AND _existing_personal_id <> _src.id THEN
    -- Move messages from global to existing personal
    UPDATE public.conversation_messages
       SET conversation_id = _existing_personal_id
     WHERE conversation_id = _src.id;

    SELECT created_at, content, direction, message_type
      INTO _last_msg
      FROM public.conversation_messages
     WHERE conversation_id = _existing_personal_id
     ORDER BY created_at DESC
     LIMIT 1;

    SELECT count(*) INTO _unread
      FROM public.conversation_messages
     WHERE conversation_id = _existing_personal_id
       AND direction = 'inbound'
       AND status = 'delivered';

    UPDATE public.conversations
       SET lead_id = COALESCE(lead_id, _src.lead_id),
           display_name = COALESCE(display_name, _src.display_name),
           display_name_source = COALESCE(display_name_source, _src.display_name_source),
           attendance_started = true,
           reserva_expira_em = NULL,
           last_message_at = COALESCE(_last_msg.created_at, last_message_at),
           last_message_preview = COALESCE(LEFT(_last_msg.content, 100), last_message_preview),
           last_message_direction = COALESCE(_last_msg.direction, last_message_direction),
           last_message_type = COALESCE(_last_msg.message_type, last_message_type, 'text'),
           unread_count = COALESCE(_unread, unread_count),
           updated_at = now()
     WHERE id = _existing_personal_id;

    IF _src.lead_id IS NOT NULL THEN
      UPDATE public.leads
         SET broker_id = _caller_broker_id,
             corretor_atribuido_id = _caller_broker_id,
             status_distribuicao = 'atendimento_iniciado'::distribution_status,
             atendimento_iniciado_em = COALESCE(atendimento_iniciado_em, now()),
             atribuido_em = COALESCE(atribuido_em, now()),
             reserva_expira_em = NULL,
             updated_at = now()
       WHERE id = _src.lead_id;

      INSERT INTO public.lead_interactions (lead_id, interaction_type, notes, broker_id, channel)
      VALUES (_src.lead_id, 'note', 'Conversa do WhatsApp Plantão unificada na instância pessoal do corretor', _caller_broker_id, 'whatsapp');
    END IF;

    DELETE FROM public.conversations WHERE id = _src.id;

    RETURN jsonb_build_object('success', true, 'conversation_id', _existing_personal_id, 'merged', true);
  END IF;

  -- No existing personal: simply convert
  UPDATE public.conversations
     SET source_instance = 'personal',
         broker_id = _caller_broker_id,
         attendance_started = true,
         updated_at = now()
   WHERE id = _src.id;

  IF _src.lead_id IS NOT NULL THEN
    UPDATE public.leads
       SET broker_id = _caller_broker_id,
           corretor_atribuido_id = _caller_broker_id,
           status_distribuicao = 'atendimento_iniciado'::distribution_status,
           atendimento_iniciado_em = COALESCE(atendimento_iniciado_em, now()),
           atribuido_em = COALESCE(atribuido_em, now()),
           reserva_expira_em = NULL,
           updated_at = now()
     WHERE id = _src.lead_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'conversation_id', _src.id, 'merged', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.pull_global_conversation_to_personal(uuid) TO authenticated;