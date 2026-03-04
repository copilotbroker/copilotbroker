ALTER TABLE public.brokers 
  ADD COLUMN inbox_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN copilot_enabled boolean NOT NULL DEFAULT false;