-- 1. Make roleta leader optional
ALTER TABLE public.roletas ALTER COLUMN lider_id DROP NOT NULL;

-- 2. Allow conversations without an assigned broker
ALTER TABLE public.conversations ALTER COLUMN broker_id DROP NOT NULL;

-- 3. Extend has_role_or_leader to include 'manager'
CREATE OR REPLACE FUNCTION public.has_role_or_leader(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'leader', 'manager')
  )
$function$;

-- 4. Cleanup: free up conversations & leads stuck on Vinicius as placeholder
-- (only those never actually attended)
UPDATE public.conversations
SET broker_id = NULL,
    attendance_started = false
WHERE source_instance = 'global'
  AND attendance_started = false
  AND broker_id = 'f0d8bde6-70a7-4081-9906-f1b017766fd4';

UPDATE public.leads
SET broker_id = NULL,
    corretor_atribuido_id = NULL,
    status_distribuicao = 'em_disputa',
    motivo_atribuicao = 'Liberado para líderes/gerentes/admins (correção de placeholder)'
WHERE atendimento_iniciado_em IS NULL
  AND broker_id = 'f0d8bde6-70a7-4081-9906-f1b017766fd4'
  AND status_distribuicao IN ('fallback_lider', 'em_disputa', 'atribuicao_inicial');