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
  full_name text
)
LANGUAGE sql
STABLE
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
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', b.name)::text AS full_name
  FROM public.organization_members om
  LEFT JOIN auth.users u ON u.id = om.user_id
  LEFT JOIN public.brokers b ON b.user_id = om.user_id
  WHERE om.organization_id = _org_id
    AND (
      public.is_super_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.organization_members me
        WHERE me.organization_id = _org_id
          AND me.user_id = auth.uid()
          AND me.is_active = true
          AND me.approval_status = 'approved'
          AND me.role IN ('owner','admin','manager')
      )
    )
  ORDER BY om.joined_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_organization_members_with_users(uuid) TO authenticated;