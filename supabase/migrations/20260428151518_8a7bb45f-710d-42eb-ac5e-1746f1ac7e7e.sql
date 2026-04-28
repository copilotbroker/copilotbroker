-- RPC: check_organization_limit(_org_id, _feature_key)
-- Returns jsonb { allowed: bool, limit: int, current: int, feature_key: text }
-- For numeric limits only. Boolean/text features return allowed=true.
CREATE OR REPLACE FUNCTION public.check_organization_limit(_org_id uuid, _feature_key text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plan_id uuid;
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

  IF _plan_id IS NULL THEN
    RETURN jsonb_build_object('allowed', true, 'limit', null, 'current', 0, 'feature_key', _feature_key, 'reason', 'no_plan');
  END IF;

  SELECT value_int INTO _limit
  FROM public.plan_features
  WHERE plan_id = _plan_id AND feature_key = _feature_key
  LIMIT 1;

  IF _limit IS NULL THEN
    RETURN jsonb_build_object('allowed', true, 'limit', null, 'current', 0, 'feature_key', _feature_key, 'reason', 'unlimited_or_unknown');
  END IF;

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
$$;