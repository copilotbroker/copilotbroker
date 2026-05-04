
-- 1) Add explicit flag to leads (conversations já tem roleta_vazia_flag)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS liberado_lideres boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_leads_liberado_lideres ON public.leads (liberado_lideres) WHERE liberado_lideres = true;

-- 2) RLS: Líderes/gerentes podem ver leads liberados (mesma org)
DROP POLICY IF EXISTS "Lideres veem leads liberados pela roleta" ON public.leads;
CREATE POLICY "Lideres veem leads liberados pela roleta"
ON public.leads
FOR SELECT
TO authenticated
USING (
  liberado_lideres = true
  AND broker_id IS NULL
  AND has_role_or_leader(auth.uid())
  AND (
    organization_id IS NULL
    OR organization_id IN (SELECT public.get_user_organization_ids(auth.uid()))
  )
);

-- 3) RLS: Líderes/gerentes podem assumir esses leads
DROP POLICY IF EXISTS "Lideres podem assumir leads liberados" ON public.leads;
CREATE POLICY "Lideres podem assumir leads liberados"
ON public.leads
FOR UPDATE
TO authenticated
USING (
  liberado_lideres = true
  AND broker_id IS NULL
  AND has_role_or_leader(auth.uid())
);

-- 4) RLS: Líderes/gerentes veem conversas com roleta_vazia_flag (mesma org)
DROP POLICY IF EXISTS "Lideres veem conversas liberadas pela roleta" ON public.conversations;
CREATE POLICY "Lideres veem conversas liberadas pela roleta"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  roleta_vazia_flag = true
  AND source_instance = 'global'
  AND attendance_started = false
  AND has_role_or_leader(auth.uid())
  AND (
    organization_id IS NULL
    OR organization_id IN (SELECT public.get_user_organization_ids(auth.uid()))
  )
);

-- 5) RLS: Líderes/gerentes podem assumir conversas liberadas
DROP POLICY IF EXISTS "Lideres podem assumir conversas liberadas" ON public.conversations;
CREATE POLICY "Lideres podem assumir conversas liberadas"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  roleta_vazia_flag = true
  AND source_instance = 'global'
  AND attendance_started = false
  AND has_role_or_leader(auth.uid())
);

-- 6) Sobrescrever política antiga genérica que permitia líder/admin ver QUALQUER conversa
DROP POLICY IF EXISTS "Corretores veem suas conversas" ON public.conversations;
CREATE POLICY "Corretores veem suas conversas"
ON public.conversations
FOR SELECT
USING (
  broker_id = get_my_broker_id() OR has_role(auth.uid(), 'admin'::app_role)
);

-- 7) Backfill: marcar leads atualmente em em_disputa sem broker como liberados
UPDATE public.leads
SET liberado_lideres = true
WHERE status_distribuicao = 'em_disputa'::distribution_status
  AND broker_id IS NULL
  AND liberado_lideres = false;
