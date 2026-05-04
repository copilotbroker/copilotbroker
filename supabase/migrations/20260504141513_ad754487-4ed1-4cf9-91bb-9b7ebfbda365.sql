
-- 1) Estender sync_broker_from_member para incluir 'manager' (Gerente também atende leads).
--    A função permanece SECURITY DEFINER e idempotente.
CREATE OR REPLACE FUNCTION public.sync_broker_from_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _email text;
  _name text;
  _slug text;
  _existing_broker_id uuid;
BEGIN
  -- Só materializa quando estiver aprovado/ativo
  IF NEW.approval_status <> 'approved' OR NEW.is_active = false THEN
    RETURN NEW;
  END IF;

  -- Aceita os 3 papéis operacionais; owner permanece apenas administrativo
  IF NEW.role NOT IN ('manager', 'leader', 'broker') THEN
    RETURN NEW;
  END IF;

  SELECT id INTO _existing_broker_id
  FROM public.brokers
  WHERE user_id = NEW.user_id AND organization_id = NEW.organization_id
  LIMIT 1;

  IF _existing_broker_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT
    u.email::text,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email::text, '@', 1))
  INTO _email, _name
  FROM auth.users u
  WHERE u.id = NEW.user_id;

  IF _email IS NULL THEN
    RETURN NEW;
  END IF;

  _slug := regexp_replace(lower(split_part(_email, '@', 1)), '[^a-z0-9]+', '-', 'g');
  IF EXISTS (SELECT 1 FROM public.brokers WHERE slug = _slug) THEN
    _slug := _slug || '-' || substr(NEW.user_id::text, 1, 6);
  END IF;

  INSERT INTO public.brokers (
    user_id, name, email, slug, organization_id,
    is_active, inbox_enabled, copilot_enabled
  )
  VALUES (
    NEW.user_id, _name, _email, _slug, NEW.organization_id,
    true, true, true
  );

  -- Garantir o app_role 'broker' (base) para todos os 3 perfis;
  -- 'leader' e 'admin' adicionais são geridos pela aplicação.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'broker'::app_role)
  ON CONFLICT DO NOTHING;

  IF NEW.role = 'leader' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'leader'::app_role)
    ON CONFLICT DO NOTHING;
  END IF;

  IF NEW.role = 'manager' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin'::app_role)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE WARNING 'sync_broker_from_member failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- 2) Garantir o trigger AFTER INSERT/UPDATE no organization_members (idempotente)
DROP TRIGGER IF EXISTS trg_sync_broker_from_member ON public.organization_members;
CREATE TRIGGER trg_sync_broker_from_member
AFTER INSERT OR UPDATE OF role, approval_status, is_active
ON public.organization_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_broker_from_member();

-- 3) Backfill global: para qualquer membro aprovado/ativo de TODAS as imobiliárias,
--    materializa o broker correspondente se ainda não existir.
INSERT INTO public.brokers (user_id, name, email, slug, organization_id, is_active, inbox_enabled, copilot_enabled)
SELECT DISTINCT ON (om.user_id, om.organization_id)
  om.user_id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email::text, '@', 1)) AS name,
  u.email::text AS email,
  regexp_replace(lower(split_part(u.email::text, '@', 1)), '[^a-z0-9]+', '-', 'g')
    || '-' || substr(om.user_id::text, 1, 6) AS slug,
  om.organization_id,
  true, true, true
FROM public.organization_members om
JOIN auth.users u ON u.id = om.user_id
WHERE om.is_active = true
  AND om.approval_status = 'approved'
  AND om.role IN ('manager', 'leader', 'broker')
  AND NOT EXISTS (
    SELECT 1 FROM public.brokers b
    WHERE b.user_id = om.user_id
      AND b.organization_id = om.organization_id
  );

-- Backfill de user_roles para managers/leaders existentes
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT om.user_id, 'admin'::app_role
FROM public.organization_members om
WHERE om.role = 'manager' AND om.is_active = true AND om.approval_status = 'approved'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT om.user_id, 'leader'::app_role
FROM public.organization_members om
WHERE om.role = 'leader' AND om.is_active = true AND om.approval_status = 'approved'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT om.user_id, 'broker'::app_role
FROM public.organization_members om
WHERE om.role IN ('manager', 'leader', 'broker')
  AND om.is_active = true AND om.approval_status = 'approved'
ON CONFLICT DO NOTHING;
