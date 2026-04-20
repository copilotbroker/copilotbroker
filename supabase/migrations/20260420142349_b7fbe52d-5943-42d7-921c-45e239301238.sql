ALTER TABLE public.whatsapp_message_queue
ADD COLUMN IF NOT EXISTS pause_reason text;

CREATE INDEX IF NOT EXISTS idx_wa_queue_paused_disconnect
ON public.whatsapp_message_queue (broker_id, status, pause_reason)
WHERE status = 'paused_by_system' AND pause_reason = 'whatsapp_disconnected';