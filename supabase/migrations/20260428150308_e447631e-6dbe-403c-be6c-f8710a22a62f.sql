
-- ============================================================
-- ENTREGA 1 — Fundação SaaS multi-tenant (parte 2: tabelas, funções, RLS, seed)
-- ============================================================

-- ===== TABELAS =====
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  legal_name text,
  cnpj text,
  logo_url text,
  primary_color text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','trial','suspended','canceled')),
  trial_ends_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_organizations_status ON public.organizations(status);

CREATE TABLE public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  billing_period text NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly','yearly','custom')),
  is_public boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.plan_features (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  feature_value text NOT NULL,
  feature_type text NOT NULL DEFAULT 'limit' CHECK (feature_type IN ('limit','boolean','enum','number')),
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plan_id, feature_key)
);
CREATE INDEX idx_plan_features_plan ON public.plan_features(plan_id);

CREATE TABLE public.organization_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('trial','active','past_due','canceled','suspended')),
  started_at timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  canceled_at timestamptz,
  external_subscription_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_org_subscriptions_org ON public.organization_subscriptions(organization_id);
CREATE INDEX idx_org_subscriptions_status ON public.organization_subscriptions(status);
CREATE UNIQUE INDEX idx_org_subscriptions_active_unique
  ON public.organization_subscriptions(organization_id)
  WHERE status IN ('trial','active','past_due');

CREATE TABLE public.organization_feature_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  feature_value text NOT NULL,
  reason text,
  expires_at timestamptz,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_org_feature_overrides_org ON public.organization_feature_overrides(organization_id);

CREATE TABLE public.organization_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'broker',
  is_active boolean NOT NULL DEFAULT true,
  invited_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id, role)
);
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);

CREATE TABLE public.organization_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'broker',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by uuid,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_org_invites_org ON public.organization_invites(organization_id);
CREATE INDEX idx_org_invites_email ON public.organization_invites(email);

CREATE TABLE public.admin_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_user_id uuid,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_audit_org ON public.admin_audit_logs(organization_id);
CREATE INDEX idx_admin_audit_created ON public.admin_audit_logs(created_at DESC);

-- ===== FUNÇÕES =====
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'::app_role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_organization_ids(_user_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT organization_id
  FROM public.organization_members
  WHERE user_id = _user_id AND is_active = true
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(_user_id uuid, _org_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
      AND role = _role AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_org_subscriptions_updated BEFORE UPDATE ON public.organization_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_org_members_updated BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== RLS =====
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_feature_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin gerencia organizations" ON public.organizations
  FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "Membros veem sua organização" ON public.organizations
  FOR SELECT TO authenticated USING (id IN (SELECT get_user_organization_ids(auth.uid())));
CREATE POLICY "Owner/admin atualizam org" ON public.organizations
  FOR UPDATE TO authenticated USING (
    has_org_role(auth.uid(), id, 'owner'::app_role)
    OR has_org_role(auth.uid(), id, 'admin'::app_role)
  );

CREATE POLICY "Super admin gerencia plans" ON public.plans
  FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "Autenticados leem plans" ON public.plans
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Super admin gerencia plan_features" ON public.plan_features
  FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "Autenticados leem plan_features" ON public.plan_features
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admin gerencia subscriptions" ON public.organization_subscriptions
  FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "Membros veem subscription" ON public.organization_subscriptions
  FOR SELECT TO authenticated USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Super admin gerencia overrides" ON public.organization_feature_overrides
  FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "Membros veem overrides" ON public.organization_feature_overrides
  FOR SELECT TO authenticated USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Super admin gerencia members" ON public.organization_members
  FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "Usuário vê seus vínculos" ON public.organization_members
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Membros veem outros da org" ON public.organization_members
  FOR SELECT TO authenticated USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));
CREATE POLICY "Owner/admin gerenciam membros" ON public.organization_members
  FOR ALL TO authenticated USING (
    has_org_role(auth.uid(), organization_id, 'owner'::app_role)
    OR has_org_role(auth.uid(), organization_id, 'admin'::app_role)
  ) WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'owner'::app_role)
    OR has_org_role(auth.uid(), organization_id, 'admin'::app_role)
  );

CREATE POLICY "Super admin gerencia invites" ON public.organization_invites
  FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "Owner/admin gerenciam invites" ON public.organization_invites
  FOR ALL TO authenticated USING (
    has_org_role(auth.uid(), organization_id, 'owner'::app_role)
    OR has_org_role(auth.uid(), organization_id, 'admin'::app_role)
  ) WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'owner'::app_role)
    OR has_org_role(auth.uid(), organization_id, 'admin'::app_role)
  );

CREATE POLICY "Super admin lê auditoria" ON public.admin_audit_logs
  FOR SELECT TO authenticated USING (is_super_admin(auth.uid()));
CREATE POLICY "Sistema registra auditoria" ON public.admin_audit_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- ===== RETROFIT: organization_id nas tabelas operacionais =====
ALTER TABLE public.brokers ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.roletas ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.copilot_configs ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.broker_whatsapp_instances ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.global_whatsapp_config ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.whatsapp_campaigns ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.whatsapp_message_queue ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.whatsapp_message_templates ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.whatsapp_labels ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.lead_attribution ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.lead_documents ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.lead_interactions ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.propostas ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_brokers_org ON public.brokers(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_org ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_org ON public.conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_roletas_org ON public.roletas(organization_id);

-- ===== SEED INICIAL: Enove Select =====
DO $$
DECLARE
  _enove_org_id uuid;
  _legacy_plan_id uuid;
  _first_admin uuid;
BEGIN
  INSERT INTO public.organizations (name, slug, status, metadata)
  VALUES ('Enove Select', 'enove-select', 'active', '{"is_initial_tenant": true}'::jsonb)
  RETURNING id INTO _enove_org_id;

  INSERT INTO public.plans (code, name, description, price_cents, billing_period, is_public, is_active, sort_order)
  VALUES ('enterprise_legacy', 'Enterprise Legacy', 'Plano interno do tenant inicial — limites elevados', 0, 'custom', false, true, 999)
  RETURNING id INTO _legacy_plan_id;

  INSERT INTO public.plan_features (plan_id, feature_key, feature_value, feature_type, description) VALUES
    (_legacy_plan_id, 'max_brokers', '999', 'limit', 'Limite máximo de corretores'),
    (_legacy_plan_id, 'max_whatsapp_instances', '999', 'limit', 'Instâncias de WhatsApp'),
    (_legacy_plan_id, 'max_landing_pages', '999', 'limit', 'Landing pages ativas'),
    (_legacy_plan_id, 'feature.dashboards_advanced', 'true', 'boolean', 'Dashboards avançadas'),
    (_legacy_plan_id, 'feature.automations', 'true', 'boolean', 'Automações de cadência e copilot'),
    (_legacy_plan_id, 'feature.whatsapp_global', 'true', 'boolean', 'Instância WhatsApp global / plantão'),
    (_legacy_plan_id, 'feature.copilot_ai', 'true', 'boolean', 'Copilot AI');

  INSERT INTO public.organization_subscriptions (organization_id, plan_id, status, started_at)
  VALUES (_enove_org_id, _legacy_plan_id, 'active', now());

  -- Backfill organization_id em todas as tabelas operacionais
  UPDATE public.brokers SET organization_id = _enove_org_id WHERE organization_id IS NULL;
  UPDATE public.projects SET organization_id = _enove_org_id WHERE organization_id IS NULL;
  UPDATE public.leads SET organization_id = _enove_org_id WHERE organization_id IS NULL;
  UPDATE public.conversations SET organization_id = _enove_org_id WHERE organization_id IS NULL;
  UPDATE public.roletas SET organization_id = _enove_org_id WHERE organization_id IS NULL;
  UPDATE public.calendar_events SET organization_id = _enove_org_id WHERE organization_id IS NULL;
  UPDATE public.copilot_configs SET organization_id = _enove_org_id WHERE organization_id IS NULL;
  UPDATE public.broker_whatsapp_instances SET organization_id = _enove_org_id WHERE organization_id IS NULL;
  UPDATE public.global_whatsapp_config SET organization_id = _enove_org_id WHERE organization_id IS NULL;
  UPDATE public.whatsapp_campaigns SET organization_id = _enove_org_id WHERE organization_id IS NULL;
  UPDATE public.whatsapp_message_queue SET organization_id = _enove_org_id WHERE organization_id IS NULL;
  UPDATE public.whatsapp_message_templates SET organization_id = _enove_org_id WHERE organization_id IS NULL;
  UPDATE public.whatsapp_labels SET organization_id = _enove_org_id WHERE organization_id IS NULL;
  UPDATE public.lead_attribution SET organization_id = _enove_org_id WHERE organization_id IS NULL;
  UPDATE public.lead_documents SET organization_id = _enove_org_id WHERE organization_id IS NULL;
  UPDATE public.lead_interactions SET organization_id = _enove_org_id WHERE organization_id IS NULL;
  UPDATE public.propostas SET organization_id = _enove_org_id WHERE organization_id IS NULL;

  -- Vincular usuários atuais à Enove Select preservando o papel
  INSERT INTO public.organization_members (organization_id, user_id, role, is_active, joined_at)
  SELECT _enove_org_id, ur.user_id, ur.role, true, now()
  FROM public.user_roles ur
  WHERE ur.role IN ('admin'::app_role, 'leader'::app_role, 'broker'::app_role)
  ON CONFLICT (organization_id, user_id, role) DO NOTHING;

  -- Definir o admin mais antigo como owner
  SELECT user_id INTO _first_admin
  FROM public.user_roles
  WHERE role = 'admin'::app_role
  ORDER BY (SELECT created_at FROM auth.users WHERE id = user_id) ASC NULLS LAST
  LIMIT 1;

  IF _first_admin IS NOT NULL THEN
    INSERT INTO public.organization_members (organization_id, user_id, role, is_active, joined_at)
    VALUES (_enove_org_id, _first_admin, 'owner'::app_role, true, now())
    ON CONFLICT (organization_id, user_id, role) DO NOTHING;
  END IF;

  -- Promover todos os admins atuais a super_admin (time interno do Copilot Broker)
  INSERT INTO public.user_roles (user_id, role)
  SELECT DISTINCT user_id, 'super_admin'::app_role
  FROM public.user_roles
  WHERE role = 'admin'::app_role
  ON CONFLICT DO NOTHING;

  INSERT INTO public.admin_audit_logs (actor_user_id, organization_id, action, entity, entity_id, metadata)
  VALUES (
    _first_admin, _enove_org_id, 'bootstrap_initial_tenant', 'organization', _enove_org_id,
    jsonb_build_object('plan', 'enterprise_legacy', 'note', 'Migração inicial flat → multi-tenant')
  );
END $$;
