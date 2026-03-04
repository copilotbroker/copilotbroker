
-- Add followup columns to copilot_configs
ALTER TABLE public.copilot_configs 
  ADD COLUMN followup_max_attempts integer NOT NULL DEFAULT 7,
  ADD COLUMN followup_period_days integer NOT NULL DEFAULT 10,
  ADD COLUMN followup_enabled boolean NOT NULL DEFAULT true;

-- Create autopilot_followups table
CREATE TABLE public.autopilot_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  broker_id uuid NOT NULL,
  attempt_number integer NOT NULL DEFAULT 1,
  sent_at timestamptz NOT NULL DEFAULT now(),
  message_preview text,
  UNIQUE(conversation_id, attempt_number)
);

-- Enable RLS
ALTER TABLE public.autopilot_followups ENABLE ROW LEVEL SECURITY;

-- RLS: Service role / system can insert
CREATE POLICY "Sistema pode inserir followups" ON public.autopilot_followups
  FOR INSERT WITH CHECK (true);

-- RLS: Brokers can see their own followups
CREATE POLICY "Corretores veem seus followups" ON public.autopilot_followups
  FOR SELECT USING (
    broker_id = (SELECT id FROM public.brokers WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- RLS: Admins can delete
CREATE POLICY "Admins podem deletar followups" ON public.autopilot_followups
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
