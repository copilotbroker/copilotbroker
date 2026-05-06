-- Allow managers to update members in their organization (in addition to owner/admin)
CREATE POLICY "Managers atualizam membros"
ON public.organization_members
FOR UPDATE
TO authenticated
USING (has_org_role(auth.uid(), organization_id, 'manager'::app_role))
WITH CHECK (has_org_role(auth.uid(), organization_id, 'manager'::app_role));