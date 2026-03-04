INSERT INTO storage.buckets (id, name, public)
VALUES ('project-media', 'project-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload project media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-media' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Public can view project media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-media');

CREATE POLICY "Admins can delete project media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-media' AND
  public.has_role(auth.uid(), 'admin')
);