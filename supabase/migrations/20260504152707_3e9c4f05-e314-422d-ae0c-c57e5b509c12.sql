-- RLS: roleta members can SELECT leads em_disputa from their roletas
DROP POLICY IF EXISTS "Membros veem leads em disputa da roleta" ON public.leads;
CREATE POLICY "Membros veem leads em disputa da roleta"
ON public.leads FOR SELECT
TO authenticated
USING (
  status_distribuicao = 'em_disputa'::distribution_status
  AND roleta_id IN (
    SELECT roleta_id FROM public.roletas_membros
    WHERE corretor_id = public.get_my_broker_id()
      AND ativo = true
      AND status_checkin = true
  )
);

-- Atomic claim RPC
CREATE OR REPLACE FUNCTION public.claim_disputed_lead(_lead_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _broker_id uuid;
  _lead RECORD;
  _updated_count int;
  _conv_id uuid;
  _phone_clean text;
  _phone_normalized text;
BEGIN
  _broker_id := public.get_my_broker_id();
  IF _broker_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_broker');
  END IF;

  SELECT * INTO _lead FROM public.leads WHERE id = _lead_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'lead_not_found');
  END IF;

  IF _lead.status_distribuicao IS DISTINCT FROM 'em_disputa'::distribution_status THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_claimed', 'broker_id', _lead.broker_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.roletas_membros
    WHERE roleta_id = _lead.roleta_id
      AND corretor_id = _broker_id
      AND ativo = true
      AND status_checkin = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_eligible');
  END IF;

  UPDATE public.leads SET
    broker_id = _broker_id,
    corretor_atribuido_id = _broker_id,
    status_distribuicao = 'atendimento_iniciado'::distribution_status,
    status = CASE WHEN status = 'new'::lead_status THEN 'info_sent'::lead_status ELSE status END,
    atendimento_iniciado_em = now(),
    atribuido_em = now(),
    motivo_atribuicao = 'Disputa - reivindicado pelo corretor',
    reserva_expira_em = NULL,
    updated_at = now()
  WHERE id = _lead_id
    AND status_distribuicao = 'em_disputa'::distribution_status;

  GET DIAGNOSTICS _updated_count = ROW_COUNT;
  IF _updated_count = 0 THEN
    SELECT broker_id INTO _broker_id FROM public.leads WHERE id = _lead_id;
    RETURN jsonb_build_object('success', false, 'error', 'race_lost', 'broker_id', _broker_id);
  END IF;

  _phone_clean := regexp_replace(COALESCE(_lead.whatsapp,''), '[^0-9]', '', 'g');
  IF length(_phone_clean) <= 11 THEN
    _phone_normalized := '55' || _phone_clean;
  ELSE
    _phone_normalized := _phone_clean;
  END IF;

  SELECT id INTO _conv_id
  FROM public.conversations
  WHERE lead_id = _lead_id
  ORDER BY last_message_at DESC NULLS LAST
  LIMIT 1;

  IF _conv_id IS NULL AND _phone_normalized <> '' THEN
    SELECT id INTO _conv_id
    FROM public.conversations
    WHERE phone_normalized = _phone_normalized
    ORDER BY last_message_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF _conv_id IS NOT NULL THEN
    UPDATE public.conversations SET
      broker_id = _broker_id,
      lead_id = _lead_id,
      attendance_started = true,
      reserva_expira_em = NULL,
      updated_at = now()
    WHERE id = _conv_id;
  END IF;

  INSERT INTO public.lead_interactions (lead_id, interaction_type, notes, broker_id, channel, new_status)
  VALUES (_lead_id, 'atendimento_iniciado', 'Lead reivindicado em disputa', _broker_id, 'whatsapp', 'info_sent');

  INSERT INTO public.roletas_log (roleta_id, lead_id, acao, para_corretor_id, motivo)
  VALUES (_lead.roleta_id, _lead_id, 'atribuicao_inicial', _broker_id, 'Disputa - reivindicado');

  RETURN jsonb_build_object('success', true, 'conversation_id', _conv_id, 'broker_id', _broker_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_disputed_lead(uuid) TO authenticated;