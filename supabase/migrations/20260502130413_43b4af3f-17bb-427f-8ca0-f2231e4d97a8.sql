ALTER TABLE public.roletas
  ADD COLUMN IF NOT EXISTS auto_checkout_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_checkout_horario time NOT NULL DEFAULT '21:00:00';