-- 1. Add source_instance column to whatsapp_message_queue
ALTER TABLE public.whatsapp_message_queue
  ADD COLUMN IF NOT EXISTS source_instance text NOT NULL DEFAULT 'personal';

-- Optional sanity check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'whatsapp_message_queue_source_instance_check'
  ) THEN
    ALTER TABLE public.whatsapp_message_queue
      ADD CONSTRAINT whatsapp_message_queue_source_instance_check
      CHECK (source_instance IN ('personal','global'));
  END IF;
END$$;

-- 2. Function: migrate pending queue items + rewrite broker first name on broker change
CREATE OR REPLACE FUNCTION public.migrate_queue_on_broker_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

    INSERT INTO public.lead_interactions (lead_id, interaction_type, notes, created_by)
    VALUES (NEW.id, 'roleta_transferencia',
      'Fila de cadência migrada: ' || COALESCE(OLD.broker_id::text,'∅') || ' → ' || NEW.broker_id::text,
      auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Trigger
DROP TRIGGER IF EXISTS trg_migrate_queue_on_broker_change ON public.leads;
CREATE TRIGGER trg_migrate_queue_on_broker_change
BEFORE UPDATE OF broker_id ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.migrate_queue_on_broker_change();