CREATE OR REPLACE FUNCTION public.bootstrap_enove_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid := '088e6667-b1d8-4544-8100-beca431e2c75';
BEGIN
  IF NEW.email IN ('maicon.enove@gmail.com', 'pablo.enove@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin'::app_role)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.organization_members (user_id, organization_id, role, is_active, joined_at)
    VALUES (NEW.id, _org_id, 'owner', true, now())
    ON CONFLICT (user_id, organization_id) DO UPDATE SET role = 'owner', is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bootstrap_enove_super_admin_trg ON auth.users;
CREATE TRIGGER bootstrap_enove_super_admin_trg
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.bootstrap_enove_super_admin();

-- Reaplicar caso já existam (idempotente)
DO $$
DECLARE
  _u record;
  _org_id uuid := '088e6667-b1d8-4544-8100-beca431e2c75';
BEGIN
  FOR _u IN SELECT id, email FROM auth.users WHERE email IN ('maicon.enove@gmail.com','pablo.enove@gmail.com') LOOP
    INSERT INTO public.user_roles (user_id, role) VALUES (_u.id, 'super_admin'::app_role) ON CONFLICT DO NOTHING;
    INSERT INTO public.organization_members (user_id, organization_id, role, is_active, joined_at)
    VALUES (_u.id, _org_id, 'owner', true, now())
    ON CONFLICT (user_id, organization_id) DO UPDATE SET role = 'owner', is_active = true;
  END LOOP;
END $$;