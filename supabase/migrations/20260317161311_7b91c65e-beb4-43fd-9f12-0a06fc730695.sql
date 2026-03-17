ALTER TABLE public.broker_auto_cadencia_rules
ADD COLUMN IF NOT EXISTS name text;

UPDATE public.broker_auto_cadencia_rules
SET name = COALESCE(
  name,
  CASE
    WHEN project_id IS NULL THEN 'Cadência 10D'
    ELSE 'Cadência 10D - ' || COALESCE((SELECT p.name FROM public.projects p WHERE p.id = broker_auto_cadencia_rules.project_id), 'Empreendimento')
  END
)
WHERE name IS NULL;

ALTER TABLE public.broker_auto_cadencia_rules
ALTER COLUMN name SET DEFAULT 'Cadência 10D';

UPDATE public.broker_auto_cadencia_rules
SET name = 'Cadência 10D'
WHERE name IS NULL;

ALTER TABLE public.broker_auto_cadencia_rules
ALTER COLUMN name SET NOT NULL;