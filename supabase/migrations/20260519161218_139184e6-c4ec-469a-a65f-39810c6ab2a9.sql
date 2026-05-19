-- 1. Trigger preventivo: sincroniza leads.broker_id quando a conversa é assumida
CREATE OR REPLACE FUNCTION public.sync_lead_broker_from_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL
     AND NEW.broker_id IS NOT NULL
     AND (
       NEW.broker_id IS DISTINCT FROM OLD.broker_id
       OR (NEW.attendance_started = true AND COALESCE(OLD.attendance_started, false) = false)
     )
  THEN
    UPDATE public.leads
       SET broker_id = NEW.broker_id,
           updated_at = now()
     WHERE id = NEW.lead_id
       AND broker_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_lead_broker_from_conversation ON public.conversations;
CREATE TRIGGER trg_sync_lead_broker_from_conversation
AFTER UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.sync_lead_broker_from_conversation();

-- 2. Backfill: corrige leads órfãos cuja conversa já tem broker_id + attendance_started
UPDATE public.leads l
   SET broker_id = c.broker_id,
       updated_at = now()
  FROM public.conversations c
 WHERE c.lead_id = l.id
   AND l.broker_id IS NULL
   AND c.broker_id IS NOT NULL
   AND c.attendance_started = true;