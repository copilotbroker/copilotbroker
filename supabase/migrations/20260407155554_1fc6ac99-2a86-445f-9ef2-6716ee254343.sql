
ALTER TABLE public.brokers 
  ADD COLUMN IF NOT EXISTS show_name_on_global boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS global_display_name text;
