-- 1. Add whatsapp + full_name columns to organization_members
ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS full_name text;

-- 2. Update sync_broker_from_member to also propagate whatsapp/name when broker exists
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
  IF NEW.approval_status <> 'approved' OR NEW.is_active = false THEN
    RETURN NEW;
  END IF;

  IF NEW.role NOT IN ('manager', 'leader', 'broker') THEN
    RETURN NEW;
  END IF;

  SELECT id INTO _existing_broker_id
  FROM public.brokers
  WHERE user_id = NEW.user_id AND organization_id = NEW.organization_id
  LIMIT 1;

  -- If broker already exists, propagate whatsapp/name updates
  IF _existing_broker_id IS NOT NULL THEN
    UPDATE public.brokers
    SET
      whatsapp = COALESCE(NEW.whatsapp, whatsapp),
      name     = COALESCE(NULLIF(NEW.full_name, ''), name),
      updated_at = now()
    WHERE id = _existing_broker_id;
    RETURN NEW;
  END IF;

  SELECT
    u.email::text,
    COALESCE(NULLIF(NEW.full_name, ''), u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email::text, '@', 1))
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
    user_id, name, email, slug, organization_id, whatsapp,
    is_active, inbox_enabled, copilot_enabled
  )
  VALUES (
    NEW.user_id, _name, _email, _slug, NEW.organization_id, NULLIF(NEW.whatsapp, ''),
    true, true, true
  );

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

-- 3. Ensure trigger fires also on UPDATE (not only INSERT) so whatsapp edits propagate
DROP TRIGGER IF EXISTS sync_broker_from_member_trigger ON public.organization_members;
CREATE TRIGGER sync_broker_from_member_trigger
  AFTER INSERT OR UPDATE OF whatsapp, full_name, approval_status, is_active, role
  ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_broker_from_member();

-- 4. Backfill organization_members.full_name from existing broker.name (best effort)
UPDATE public.organization_members om
SET full_name = b.name,
    whatsapp = COALESCE(om.whatsapp, b.whatsapp)
FROM public.brokers b
WHERE b.user_id = om.user_id
  AND b.organization_id = om.organization_id
  AND (om.full_name IS NULL OR om.full_name = '');

-- 5. Update RPC get_organization_members_with_users to expose whatsapp/full_name
DO $$
DECLARE
  _exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_organization_members_with_users'
  ) INTO _exists;
  IF _exists THEN
    DROP FUNCTION IF EXISTS public.get_organization_members_with_users(uuid);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_organization_members_with_users(_org_id uuid)
RETURNS TABLE (
  id uuid,
  organization_id uuid,
  user_id uuid,
  role text,
  is_active boolean,
  approval_status text,
  joined_at timestamptz,
  email text,
  full_name text,
  whatsapp text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    om.id,
    om.organization_id,
    om.user_id,
    om.role::text,
    om.is_active,
    om.approval_status,
    om.joined_at,
    u.email::text,
    COALESCE(NULLIF(om.full_name, ''), u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email::text, '@', 1)) AS full_name,
    COALESCE(om.whatsapp, b.whatsapp) AS whatsapp
  FROM public.organization_members om
  LEFT JOIN auth.users u ON u.id = om.user_id
  LEFT JOIN public.brokers b ON b.user_id = om.user_id AND b.organization_id = om.organization_id
  WHERE om.organization_id = _org_id
    AND (
      public.is_super_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.organization_members me
        WHERE me.organization_id = _org_id
          AND me.user_id = auth.uid()
          AND me.is_active = true
          AND me.role IN ('owner','admin','manager','leader','broker')
      )
    )
  ORDER BY om.created_at DESC;
$$;