-- 1. Fix broker_whatsapp_instances token protection policy
DROP POLICY IF EXISTS "Brokers podem atualizar propria instancia exceto token" ON public.broker_whatsapp_instances;

CREATE POLICY "Brokers podem atualizar propria instancia exceto token"
  ON public.broker_whatsapp_instances
  FOR UPDATE
  USING (broker_id = public.get_my_broker_id())
  WITH CHECK (
    broker_id = public.get_my_broker_id()
    AND instance_token IS NOT DISTINCT FROM (
      SELECT existing.instance_token
      FROM public.broker_whatsapp_instances AS existing
      WHERE existing.id = broker_whatsapp_instances.id
    )
  );

-- 2. Notifications: only service_role can insert
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 3. Brokers: restrict anon to safe public columns only
REVOKE SELECT ON public.brokers FROM anon;

GRANT SELECT (
  id, name, slug, whatsapp, is_active,
  organization_id, lider_id, nome_equipe,
  show_name_on_global, global_display_name
) ON public.brokers TO anon;

-- 4. Organizations: restrict anon to safe branding columns only
DROP POLICY IF EXISTS "Public can view active org slug info" ON public.organizations;

CREATE POLICY "Anon can view active org branding"
  ON public.organizations
  FOR SELECT
  TO anon
  USING (status = 'active');

REVOKE SELECT ON public.organizations FROM anon;

GRANT SELECT (
  id, name, slug, status,
  display_name, logo_url, favicon_url,
  primary_color, secondary_color
) ON public.organizations TO anon;