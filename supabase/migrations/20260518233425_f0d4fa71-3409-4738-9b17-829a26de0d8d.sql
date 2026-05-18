ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
CHECK (type = ANY (ARRAY['new_lead','stale_lead','status_change','roleta_lead','roleta_timeout','roleta_loop_breaker','roleta_fallback']));