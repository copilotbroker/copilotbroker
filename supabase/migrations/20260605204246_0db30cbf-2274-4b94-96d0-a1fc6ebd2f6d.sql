ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_slug_key;
DROP INDEX IF EXISTS public.projects_slug_key;