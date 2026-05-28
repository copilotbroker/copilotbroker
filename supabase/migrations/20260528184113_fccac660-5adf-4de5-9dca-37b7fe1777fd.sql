-- 1. Realtime: garantir conversations no publication + REPLICA IDENTITY FULL
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  WHEN others THEN NULL;
  END;
END $$;

-- 2. Função reutilizável: marca lead como em atendimento (idempotente)
CREATE OR REPLACE FUNCTION public.mark_lead_attendance_generic(_lead_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _lead_id IS NULL THEN RETURN; END IF;

  UPDATE public.leads
     SET status = CASE
                    WHEN status IN ('new'::lead_status, 'contacted'::lead_status)
                    THEN 'info_sent'::lead_status
                    ELSE status
                  END,
         status_distribuicao = 'atendimento_iniciado'::distribution_status,
         atendimento_iniciado_em = COALESCE(atendimento_iniciado_em, now()),
         reserva_expira_em = NULL,
         updated_at = now()
   WHERE id = _lead_id
     AND (
       status IN ('new'::lead_status, 'contacted'::lead_status)
       OR COALESCE(status_distribuicao::text, '') <> 'atendimento_iniciado'
     );

  UPDATE public.conversations
     SET attendance_started = true,
         reserva_expira_em = NULL,
         updated_at = now()
   WHERE lead_id = _lead_id
     AND attendance_started = false;
END;
$$;

-- 3. Trigger: criar agendamento/tarefa marca atendimento
CREATE OR REPLACE FUNCTION public.tg_calendar_event_marks_attendance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL THEN
    PERFORM public.mark_lead_attendance_generic(NEW.lead_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS calendar_event_marks_attendance ON public.calendar_events;
CREATE TRIGGER calendar_event_marks_attendance
AFTER INSERT ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.tg_calendar_event_marks_attendance();

-- 4. Trigger: registrar nota também marca atendimento
CREATE OR REPLACE FUNCTION public.tg_note_marks_attendance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL AND NEW.interaction_type::text IN ('note', 'note_added') THEN
    PERFORM public.mark_lead_attendance_generic(NEW.lead_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS note_marks_attendance ON public.lead_interactions;
CREATE TRIGGER note_marks_attendance
AFTER INSERT ON public.lead_interactions
FOR EACH ROW
EXECUTE FUNCTION public.tg_note_marks_attendance();