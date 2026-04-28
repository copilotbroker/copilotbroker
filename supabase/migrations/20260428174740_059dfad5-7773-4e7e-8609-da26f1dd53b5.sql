-- 1) Permitir status pending_approval e rejected em organizations
ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_status_check;
ALTER TABLE public.organizations ADD CONSTRAINT organizations_status_check 
  CHECK (status = ANY (ARRAY['active','trial','suspended','canceled','pending_approval','rejected']::text[]));

-- 2) Campos extras de cadastro pendente
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS requested_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid;

-- 3) Permitir status pending_approval em organization_members (corretor aguardando aprovação do admin da imobiliária)
ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid;

ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS org_members_approval_status_check;
ALTER TABLE public.organization_members ADD CONSTRAINT org_members_approval_status_check
  CHECK (approval_status IN ('approved','pending','rejected'));

-- 4) Garantir plano Starter
INSERT INTO public.plans (code, name, is_active)
VALUES ('starter', 'Starter', true)
ON CONFLICT (code) DO NOTHING;

-- 5) Política pública para SELECT mínimo de organizations ativas (para validar slug no signup público de corretor)
DROP POLICY IF EXISTS "Public can view active org slug info" ON public.organizations;
CREATE POLICY "Public can view active org slug info"
  ON public.organizations FOR SELECT
  TO anon, authenticated
  USING (status = 'active');