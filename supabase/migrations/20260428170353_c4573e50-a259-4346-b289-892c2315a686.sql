-- Corrige o trigger de bootstrap: a UNIQUE é (organization_id, user_id, role), não (user_id, organization_id).
CREATE OR REPLACE FUNCTION public.bootstrap_enove_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _org_id uuid := '088e6667-b1d8-4544-8100-beca431e2c75';
BEGIN
  IF NEW.email IN ('maicon.enove@gmail.com', 'pablo.enove@gmail.com') THEN
    -- Promove a super_admin (idempotente)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin'::app_role)
    ON CONFLICT DO NOTHING;

    -- Vincula como owner da Enove Select (idempotente). Usa a UNIQUE real.
    INSERT INTO public.organization_members (user_id, organization_id, role, is_active, joined_at)
    VALUES (NEW.id, _org_id, 'owner', true, now())
    ON CONFLICT (organization_id, user_id, role) DO UPDATE
      SET is_active = true;
  END IF;
  RETURN NEW;
EXCEPTION WHEN others THEN
  -- Nunca bloqueia o signup por causa do bootstrap
  RAISE WARNING 'bootstrap_enove_super_admin failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;