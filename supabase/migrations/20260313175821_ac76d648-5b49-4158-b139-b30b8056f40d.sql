
-- Allow brokers to upload to project-media
CREATE POLICY "Brokers can upload project media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-media'
  AND public.has_role(auth.uid(), 'broker'::public.app_role)
);

-- Allow brokers to delete their own uploads from project-media
CREATE POLICY "Brokers can delete project media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-media'
  AND public.has_role(auth.uid(), 'broker'::public.app_role)
);

-- Allow leaders to upload to project-media
CREATE POLICY "Leaders can upload project media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-media'
  AND public.has_role(auth.uid(), 'leader'::public.app_role)
);

-- Allow leaders to delete their own uploads from project-media
CREATE POLICY "Leaders can delete project media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-media'
  AND public.has_role(auth.uid(), 'leader'::public.app_role)
);
