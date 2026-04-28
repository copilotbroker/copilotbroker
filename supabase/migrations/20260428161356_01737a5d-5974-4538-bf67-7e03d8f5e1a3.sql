
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS secondary_color text,
  ADD COLUMN IF NOT EXISTS favicon_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('org-branding', 'org-branding', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Branding files are publicly readable" ON storage.objects;
CREATE POLICY "Branding files are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'org-branding');

DROP POLICY IF EXISTS "Org admins can upload branding" ON storage.objects;
CREATE POLICY "Org admins can upload branding"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'org-branding'
  AND (
    public.is_super_admin(auth.uid())
    OR public.has_org_role(auth.uid(), (storage.foldername(name))[1]::uuid, 'owner'::app_role)
    OR public.has_org_role(auth.uid(), (storage.foldername(name))[1]::uuid, 'admin'::app_role)
  )
);

DROP POLICY IF EXISTS "Org admins can update branding" ON storage.objects;
CREATE POLICY "Org admins can update branding"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'org-branding'
  AND (
    public.is_super_admin(auth.uid())
    OR public.has_org_role(auth.uid(), (storage.foldername(name))[1]::uuid, 'owner'::app_role)
    OR public.has_org_role(auth.uid(), (storage.foldername(name))[1]::uuid, 'admin'::app_role)
  )
);

DROP POLICY IF EXISTS "Org admins can delete branding" ON storage.objects;
CREATE POLICY "Org admins can delete branding"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'org-branding'
  AND (
    public.is_super_admin(auth.uid())
    OR public.has_org_role(auth.uid(), (storage.foldername(name))[1]::uuid, 'owner'::app_role)
    OR public.has_org_role(auth.uid(), (storage.foldername(name))[1]::uuid, 'admin'::app_role)
  )
);
