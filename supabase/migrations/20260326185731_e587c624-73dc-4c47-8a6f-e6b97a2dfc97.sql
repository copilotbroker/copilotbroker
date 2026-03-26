
ALTER TABLE public.roletas ADD COLUMN IF NOT EXISTS tipo_origem text NOT NULL DEFAULT 'landing_page';

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS source_instance text DEFAULT NULL;
