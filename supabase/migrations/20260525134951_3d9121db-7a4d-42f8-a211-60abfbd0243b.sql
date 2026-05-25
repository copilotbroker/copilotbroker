
-- 1. autopilot_followups: restrict insert to service_role
DROP POLICY IF EXISTS "Sistema pode inserir followups" ON public.autopilot_followups;
CREATE POLICY "Service role pode inserir followups"
  ON public.autopilot_followups
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 2. roletas_log: restrict insert to service_role
DROP POLICY IF EXISTS "Sistema pode inserir logs de roleta" ON public.roletas_log;
CREATE POLICY "Service role pode inserir logs de roleta"
  ON public.roletas_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 3. whatsapp_daily_stats: restrict write to service_role
DROP POLICY IF EXISTS "Sistema pode inserir estatísticas" ON public.whatsapp_daily_stats;
DROP POLICY IF EXISTS "Sistema pode atualizar estatísticas" ON public.whatsapp_daily_stats;
CREATE POLICY "Service role pode inserir estatisticas"
  ON public.whatsapp_daily_stats
  FOR INSERT
  TO service_role
  WITH CHECK (true);
CREATE POLICY "Service role pode atualizar estatisticas"
  ON public.whatsapp_daily_stats
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. whatsapp_optouts: restrict insert to service_role
DROP POLICY IF EXISTS "Sistema pode inserir optouts" ON public.whatsapp_optouts;
CREATE POLICY "Service role pode inserir optouts"
  ON public.whatsapp_optouts
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 5. google_calendar_connections: remove admin-wide SELECT of OAuth tokens
DROP POLICY IF EXISTS "Admins podem ver todas as conexoes" ON public.google_calendar_connections;

-- 6. broker_whatsapp_instances: prevent brokers from changing instance_token themselves
-- Replace any permissive broker UPDATE policy with one that forbids changing instance_token.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'public.broker_whatsapp_instances'::regclass
      AND polcmd = 'w' -- UPDATE
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.broker_whatsapp_instances', pol.polname);
  END LOOP;
END$$;

-- Brokers can update only their own instance, and cannot change instance_token
CREATE POLICY "Brokers podem atualizar propria instancia exceto token"
  ON public.broker_whatsapp_instances
  FOR UPDATE
  TO authenticated
  USING (broker_id = public.get_my_broker_id())
  WITH CHECK (
    broker_id = public.get_my_broker_id()
    AND instance_token IS NOT DISTINCT FROM (
      SELECT instance_token FROM public.broker_whatsapp_instances WHERE id = broker_whatsapp_instances.id
    )
  );

-- Service role / admins can still manage tokens
CREATE POLICY "Service role pode atualizar instancias"
  ON public.broker_whatsapp_instances
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins podem atualizar instancias"
  ON public.broker_whatsapp_instances
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_super_admin(auth.uid()));
