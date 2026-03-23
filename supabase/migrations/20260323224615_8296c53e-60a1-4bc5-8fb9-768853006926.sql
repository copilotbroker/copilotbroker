
-- Tabela de eventos do calendário
CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  event_type text NOT NULL DEFAULT 'task',
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  all_day boolean DEFAULT false,
  location text,
  google_event_id text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de conexões Google Calendar
CREATE TABLE public.google_calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE UNIQUE,
  google_email text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  last_sync_at timestamptz,
  sync_enabled boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS para calendar_events
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver todos os eventos"
ON public.calendar_events FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem gerenciar todos os eventos"
ON public.calendar_events FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Corretores podem ver seus eventos"
ON public.calendar_events FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'broker'::app_role) AND broker_id = get_my_broker_id());

CREATE POLICY "Corretores podem inserir seus eventos"
ON public.calendar_events FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'broker'::app_role) AND broker_id = get_my_broker_id());

CREATE POLICY "Corretores podem atualizar seus eventos"
ON public.calendar_events FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'broker'::app_role) AND broker_id = get_my_broker_id());

CREATE POLICY "Corretores podem deletar seus eventos"
ON public.calendar_events FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'broker'::app_role) AND broker_id = get_my_broker_id());

CREATE POLICY "Lideres podem ver eventos da equipe"
ON public.calendar_events FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'leader'::app_role) AND broker_id IN (
  SELECT id FROM public.brokers WHERE lider_id = get_my_broker_id()
));

-- RLS para google_calendar_connections
ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver todas as conexoes"
ON public.google_calendar_connections FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Corretores podem gerenciar sua conexao"
ON public.google_calendar_connections FOR ALL TO authenticated
USING (broker_id = get_my_broker_id());

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_calendar_events_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW EXECUTE FUNCTION update_calendar_events_updated_at();

CREATE TRIGGER update_google_calendar_connections_updated_at
BEFORE UPDATE ON public.google_calendar_connections
FOR EACH ROW EXECUTE FUNCTION update_calendar_events_updated_at();

-- Publicar para realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
