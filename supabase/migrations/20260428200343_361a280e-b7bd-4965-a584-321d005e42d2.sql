-- 1) Defaults sensatos para novos brokers (igual ao projeto de referência)
ALTER TABLE public.brokers ALTER COLUMN inbox_enabled SET DEFAULT true;
ALTER TABLE public.brokers ALTER COLUMN copilot_enabled SET DEFAULT true;

-- 2) Função que materializa um broker a partir de um membro aprovado
CREATE OR REPLACE FUNCTION public.sync_broker_from_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
  _name text;
  _slug text;
  _existing_broker_id uuid;
BEGIN
  -- Só materializa quando estiver aprovado/ativo e for um papel de campo
  IF NEW.approval_status <> 'approved' OR NEW.is_active = false THEN
    RETURN NEW;
  END IF;

  IF NEW.role NOT IN ('broker', 'leader') THEN
    RETURN NEW;
  END IF;

  -- Já existe broker desse user na mesma org? Nada a fazer
  SELECT id INTO _existing_broker_id
  FROM public.brokers
  WHERE user_id = NEW.user_id AND organization_id = NEW.organization_id
  LIMIT 1;

  IF _existing_broker_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar email + nome do auth.users
  SELECT
    u.email::text,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email::text, '@', 1))
  INTO _email, _name
  FROM auth.users u
  WHERE u.id = NEW.user_id;

  IF _email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Slug único: base no email + sufixo curto se já existir
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

  -- Garante o role 'broker' no user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'broker'::app_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE WARNING 'sync_broker_from_member failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 3) Trigger AFTER INSERT/UPDATE em organization_members
DROP TRIGGER IF EXISTS trg_sync_broker_from_member_ins ON public.organization_members;
CREATE TRIGGER trg_sync_broker_from_member_ins
AFTER INSERT ON public.organization_members
FOR EACH ROW EXECUTE FUNCTION public.sync_broker_from_member();

DROP TRIGGER IF EXISTS trg_sync_broker_from_member_upd ON public.organization_members;
CREATE TRIGGER trg_sync_broker_from_member_upd
AFTER UPDATE OF approval_status, is_active, role ON public.organization_members
FOR EACH ROW EXECUTE FUNCTION public.sync_broker_from_member();

-- 4) Backfill: cria brokers para membros já aprovados sem registro
DO $$
DECLARE
  _row record;
  _email text;
  _name text;
  _slug text;
BEGIN
  FOR _row IN
    SELECT om.user_id, om.organization_id
    FROM public.organization_members om
    LEFT JOIN public.brokers b
      ON b.user_id = om.user_id AND b.organization_id = om.organization_id
    WHERE om.role IN ('broker','leader')
      AND om.approval_status = 'approved'
      AND om.is_active = true
      AND b.id IS NULL
  LOOP
    SELECT
      u.email::text,
      COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email::text, '@', 1))
    INTO _email, _name
    FROM auth.users u WHERE u.id = _row.user_id;

    IF _email IS NULL THEN CONTINUE; END IF;

    _slug := regexp_replace(lower(split_part(_email, '@', 1)), '[^a-z0-9]+', '-', 'g');
    IF EXISTS (SELECT 1 FROM public.brokers WHERE slug = _slug) THEN
      _slug := _slug || '-' || substr(_row.user_id::text, 1, 6);
    END IF;

    INSERT INTO public.brokers (
      user_id, name, email, slug, organization_id,
      is_active, inbox_enabled, copilot_enabled
    )
    VALUES (
      _row.user_id, _name, _email, _slug, _row.organization_id,
      true, true, true
    );

    INSERT INTO public.user_roles (user_id, role)
    VALUES (_row.user_id, 'broker'::app_role)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 5) Garantir que brokers existentes (se houver) tenham os flags ligados
UPDATE public.brokers
SET inbox_enabled = true, copilot_enabled = true
WHERE inbox_enabled = false OR copilot_enabled = false;