-- Backfill: promover todos os managers/admins da organização ao app_role 'admin',
-- e leaders ao app_role 'leader'. Idempotente.
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT om.user_id, 'admin'::app_role
FROM public.organization_members om
WHERE om.is_active = true
  AND om.approval_status = 'approved'
  AND om.role IN ('owner','admin','manager')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT om.user_id, 'leader'::app_role
FROM public.organization_members om
WHERE om.is_active = true
  AND om.approval_status = 'approved'
  AND om.role = 'leader'
ON CONFLICT DO NOTHING;

-- Garantir que todo membro operacional tenha pelo menos 'broker'
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT om.user_id, 'broker'::app_role
FROM public.organization_members om
WHERE om.is_active = true
  AND om.approval_status = 'approved'
  AND om.role IN ('manager','leader','broker')
ON CONFLICT DO NOTHING;