-- Backfill orphan WhatsApp Plantão leads created during the disputa bug window.
DO $$
DECLARE
  v_roleta_id uuid := '08b396a6-153d-4720-bde6-f459d4beada5';
  v_lider_id uuid := 'f0d8bde6-70a7-4081-9906-f1b017766fd4';
  r RECORD;
  v_conv_id uuid;
BEGIN
  FOR r IN
    SELECT l.id, l.name, l.whatsapp, l.created_at
    FROM public.leads l
    WHERE l.status = 'new'
      AND l.lead_origin = 'whatsapp_plantao'
      AND NOT EXISTS (SELECT 1 FROM public.conversations c WHERE c.lead_id = l.id)
  LOOP
    UPDATE public.leads
    SET roleta_id = v_roleta_id,
        broker_id = NULL,
        corretor_atribuido_id = NULL,
        atribuido_em = COALESCE(atribuido_em, r.created_at),
        status_distribuicao = 'em_disputa',
        motivo_atribuicao = COALESCE(motivo_atribuicao, 'Disputa - backfill')
    WHERE id = r.id;

    INSERT INTO public.conversations (
      broker_id, lead_id, phone, phone_normalized, source_instance,
      attendance_started, ai_mode, status, roleta_modo,
      display_name, display_name_source, last_message_at, created_at, updated_at
    ) VALUES (
      v_lider_id, r.id, r.whatsapp, regexp_replace(r.whatsapp, '\D', '', 'g'),
      'global', false, 'copilot', 'unread', 'disputa',
      r.name, 'lead', r.created_at, r.created_at, now()
    )
    RETURNING id INTO v_conv_id;
  END LOOP;
END $$;