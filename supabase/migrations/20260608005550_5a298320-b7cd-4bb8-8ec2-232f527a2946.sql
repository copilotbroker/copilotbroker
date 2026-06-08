
-- Phase 1: Public-safe views and RPCs (parallel infrastructure, no policy changes yet)

-- 1) organizations_public
CREATE OR REPLACE VIEW public.organizations_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT id, name, slug, status, display_name, logo_url, favicon_url, primary_color, secondary_color
FROM public.organizations
WHERE status = 'active';

GRANT SELECT ON public.organizations_public TO anon, authenticated;

-- 2) brokers_public (no email, no user_id)
CREATE OR REPLACE VIEW public.brokers_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT id, name, slug, whatsapp, is_active, organization_id, lider_id, nome_equipe, show_name_on_global, global_display_name
FROM public.brokers
WHERE is_active = true;

GRANT SELECT ON public.brokers_public TO anon, authenticated;

-- 3) projects_public (no ai_prompt, no webhook_url, no landing_content, no created_by_broker_id)
CREATE OR REPLACE VIEW public.projects_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT id, name, slug, city, city_slug, description, status, is_active,
       hero_title, hero_subtitle, features, type, organization_id, created_at, updated_at
FROM public.projects
WHERE is_active = true;

GRANT SELECT ON public.projects_public TO anon, authenticated;

-- 4) RPC: landing content (safe, excludes ai_prompt & webhook_url)
CREATE OR REPLACE FUNCTION public.get_project_landing_content(_slug text, _city_slug text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  city text,
  city_slug text,
  description text,
  hero_title text,
  hero_subtitle text,
  features jsonb,
  landing_content jsonb,
  type text,
  organization_id uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.slug, p.city, p.city_slug, p.description,
         p.hero_title, p.hero_subtitle, p.features, p.landing_content, p.type, p.organization_id
  FROM public.projects p
  WHERE p.is_active = true
    AND p.slug = _slug
    AND (_city_slug IS NULL OR p.city_slug = _city_slug)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_project_landing_content(text, text) TO anon, authenticated;

-- 5) RPC: brokers associados a um project ativo
CREATE OR REPLACE FUNCTION public.get_project_brokers(_project_id uuid)
RETURNS TABLE (
  broker_id uuid,
  name text,
  slug text,
  whatsapp text,
  global_display_name text,
  show_name_on_global boolean,
  organization_id uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.name, b.slug, b.whatsapp, b.global_display_name, b.show_name_on_global, b.organization_id
  FROM public.broker_projects bp
  JOIN public.brokers b ON b.id = bp.broker_id
  JOIN public.projects p ON p.id = bp.project_id
  WHERE bp.project_id = _project_id
    AND bp.is_active = true
    AND b.is_active = true
    AND p.is_active = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_project_brokers(uuid) TO anon, authenticated;
