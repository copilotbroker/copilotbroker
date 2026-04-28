-- 1) Bootstrap super_admin + ownership na Enove Select para Maicon e Pablo
DO $$
DECLARE
  _maicon_id uuid;
  _pablo_id uuid;
  _org_id uuid := '088e6667-b1d8-4544-8100-beca431e2c75'; -- Enove Select
BEGIN
  SELECT id INTO _maicon_id FROM auth.users WHERE email = 'maicon.enove@gmail.com' LIMIT 1;
  SELECT id INTO _pablo_id  FROM auth.users WHERE email = 'pablo.enove@gmail.com'  LIMIT 1;

  IF _maicon_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_maicon_id, 'super_admin'::app_role) ON CONFLICT DO NOTHING;
    INSERT INTO public.organization_members (user_id, organization_id, role, is_active, joined_at)
    VALUES (_maicon_id, _org_id, 'owner', true, now())
    ON CONFLICT (user_id, organization_id) DO UPDATE SET role = 'owner', is_active = true;
  END IF;

  IF _pablo_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_pablo_id, 'super_admin'::app_role) ON CONFLICT DO NOTHING;
    INSERT INTO public.organization_members (user_id, organization_id, role, is_active, joined_at)
    VALUES (_pablo_id, _org_id, 'owner', true, now())
    ON CONFLICT (user_id, organization_id) DO UPDATE SET role = 'owner', is_active = true;
  END IF;
END $$;

-- 2) Helper: manager == admin no contexto da organização
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role IN ('owner','admin','manager')
      AND is_active = true
  )
$$;