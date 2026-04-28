-- Fix check_organization_limit to use the actual columns and respect organization_feature_overrides
CREATE OR REPLACE FUNCTION public.check_organization_limit(_org_id uuid, _feature_key text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _plan_id uuid;
  _limit_text text;
  _override_text text;
  _limit int;
  _current int := 0;
BEGIN
  -- Resolve active plan
  SELECT plan_id INTO _plan_id
  FROM public.organization_subscriptions
  WHERE organization_id = _org_id
    AND status IN ('active','trial','past_due')
  ORDER BY started_at DESC
  LIMIT 1;

  IF _plan_id IS NOT NULL THEN
    SELECT feature_value INTO _limit_text
    FROM public.plan_features
    WHERE plan_id = _plan_id AND feature_key = _feature_key
    LIMIT 1;
  END IF;

  -- Apply override if present and not expired
  SELECT feature_value INTO _override_text
  FROM public.organization_feature_overrides
  WHERE organization_id = _org_id
    AND feature_key = _feature_key
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at DESC
  LIMIT 1;

  IF _override_text IS NOT NULL THEN
    _limit_text := _override_text;
  END IF;

  IF _limit_text IS NULL THEN
    RETURN jsonb_build_object('allowed', true, 'limit', null, 'current', 0, 'feature_key', _feature_key, 'reason', 'unlimited_or_unknown');
  END IF;

  BEGIN
    _limit := _limit_text::int;
  EXCEPTION WHEN others THEN
    -- Boolean / non-numeric feature: treat 'true' as allowed, 'false' as blocked
    IF lower(_limit_text) = 'true' THEN
      RETURN jsonb_build_object('allowed', true, 'limit', null, 'current', 0, 'feature_key', _feature_key, 'reason', 'boolean_true');
    ELSE
      RETURN jsonb_build_object('allowed', false, 'limit', null, 'current', 0, 'feature_key', _feature_key, 'reason', 'boolean_false');
    END IF;
  END;

  IF _feature_key = 'max_brokers' THEN
    SELECT COUNT(*) INTO _current FROM public.brokers WHERE organization_id = _org_id AND is_active = true;
  ELSIF _feature_key = 'max_whatsapp_instances' THEN
    SELECT COUNT(*) INTO _current FROM public.broker_whatsapp_instances WHERE organization_id = _org_id;
  ELSIF _feature_key = 'max_landing_pages' THEN
    SELECT COUNT(*) INTO _current FROM public.projects WHERE organization_id = _org_id;
  ELSE
    RETURN jsonb_build_object('allowed', true, 'limit', _limit, 'current', 0, 'feature_key', _feature_key, 'reason', 'no_counter');
  END IF;

  RETURN jsonb_build_object(
    'allowed', _current < _limit,
    'limit', _limit,
    'current', _current,
    'feature_key', _feature_key
  );
END;
$function$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_plan_features_plan_key ON public.plan_features(plan_id, feature_key);
CREATE INDEX IF NOT EXISTS idx_org_feature_overrides_org_key ON public.organization_feature_overrides(organization_id, feature_key);