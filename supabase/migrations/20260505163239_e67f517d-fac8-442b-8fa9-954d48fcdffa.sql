ALTER TABLE public.broker_auto_cadencia_rules
  ADD COLUMN IF NOT EXISTS trigger_lead_source TEXT NOT NULL DEFAULT 'landing_page';

ALTER TABLE public.broker_auto_cadencia_rules
  DROP CONSTRAINT IF EXISTS broker_auto_cadencia_rules_trigger_lead_source_check;

ALTER TABLE public.broker_auto_cadencia_rules
  ADD CONSTRAINT broker_auto_cadencia_rules_trigger_lead_source_check
  CHECK (trigger_lead_source IN ('landing_page','whatsapp','both'));

-- Drop old uniqueness (broker + project) if it exists, replace with (broker + project + trigger_lead_source)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.broker_auto_cadencia_rules'::regclass
      AND contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE public.broker_auto_cadencia_rules DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

DROP INDEX IF EXISTS public.broker_auto_cadencia_rules_broker_project_unique;
DROP INDEX IF EXISTS public.broker_auto_cadencia_rules_broker_project_idx;

CREATE UNIQUE INDEX IF NOT EXISTS broker_auto_cadencia_rules_unique_source
  ON public.broker_auto_cadencia_rules (broker_id, COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid), trigger_lead_source);
