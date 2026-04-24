-- 1. Drop the existing CHECK constraint to allow new value
ALTER TABLE public.roletas
  DROP CONSTRAINT IF EXISTS roletas_escopo_empreendimentos_check;

-- 2. Re-add CHECK constraint with the new value
ALTER TABLE public.roletas
  ADD CONSTRAINT roletas_escopo_empreendimentos_check
  CHECK (escopo_empreendimentos IN ('especifico', 'todas_landing_pages', 'todas_landing_pages_e_plantao'));

-- 3. Drop the old partial unique index
DROP INDEX IF EXISTS public.idx_unique_roleta_todas_lps_ativa;

-- 4. Create new partial unique index covering both catch-all values
CREATE UNIQUE INDEX idx_unique_roleta_catchall_ativa
  ON public.roletas ((true))
  WHERE ativa = true
    AND escopo_empreendimentos IN ('todas_landing_pages', 'todas_landing_pages_e_plantao');

-- 5. Update trigger_roleta_distribuir to also trigger for institutional projects when catch-all e_plantao roleta exists
CREATE OR REPLACE FUNCTION public.trigger_roleta_distribuir()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _has_roleta boolean;
  _is_institutional boolean;
  _has_catchall boolean;
BEGIN
  IF NEW.broker_id IS NULL AND NEW.project_id IS NOT NULL THEN
    -- Check explicit project linkage
    SELECT EXISTS (
      SELECT 1 FROM public.roletas_empreendimentos re
      JOIN public.roletas r ON r.id = re.roleta_id
      WHERE re.empreendimento_id = NEW.project_id
        AND re.ativo = true
        AND r.ativa = true
    ) INTO _has_roleta;

    IF NOT _has_roleta THEN
      SELECT (created_by_broker_id IS NULL) INTO _is_institutional
      FROM public.projects WHERE id = NEW.project_id;

      IF _is_institutional THEN
        SELECT EXISTS (
          SELECT 1 FROM public.roletas
          WHERE ativa = true
            AND escopo_empreendimentos IN ('todas_landing_pages', 'todas_landing_pages_e_plantao')
            AND tipo_origem = 'landing_page'
        ) INTO _has_catchall;

        _has_roleta := _has_catchall;
      END IF;
    END IF;

    IF _has_roleta THEN
      PERFORM net.http_post(
        url := 'https://nckzxwxxtyeydolmdijn.supabase.co/functions/v1/roleta-distribuir',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ja3p4d3h4dHlleWRvbG1kaWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjU4NDksImV4cCI6MjA4MzA0MTg0OX0.fjECugk1tkmhBNrR-030CJo6kB-_t8BLPYzhKCzTf1E"}'::jsonb,
        body := jsonb_build_object('lead_id', NEW.id, 'project_id', NEW.project_id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;