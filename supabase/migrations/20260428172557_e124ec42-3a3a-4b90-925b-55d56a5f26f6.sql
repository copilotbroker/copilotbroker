CREATE OR REPLACE FUNCTION public.get_users_emails(_user_ids uuid[])
RETURNS TABLE(user_id uuid, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.email::text
  FROM auth.users u
  WHERE u.id = ANY(_user_ids)
    AND public.is_super_admin(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.get_users_emails(uuid[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_users_emails(uuid[]) TO authenticated;