-- Broaden Plantão pending-conversation visibility/claim to include unified catch-all roletas.
DROP POLICY IF EXISTS "Corretores veem conversas globais pendentes" ON public.conversations;
DROP POLICY IF EXISTS "Corretores podem assumir conversas globais" ON public.conversations;

CREATE POLICY "Corretores veem conversas globais pendentes"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  source_instance = 'global'
  AND attendance_started = false
  AND EXISTS (
    SELECT 1
    FROM public.roletas_membros rm
    JOIN public.roletas r ON r.id = rm.roleta_id
    WHERE rm.corretor_id = get_my_broker_id()
      AND rm.ativo = true
      AND r.ativa = true
      AND (
        r.tipo_origem = 'whatsapp_global'
        OR r.escopo_empreendimentos = 'todas_landing_pages_e_plantao'
      )
  )
);

CREATE POLICY "Corretores podem assumir conversas globais"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  source_instance = 'global'
  AND attendance_started = false
  AND EXISTS (
    SELECT 1
    FROM public.roletas_membros rm
    JOIN public.roletas r ON r.id = rm.roleta_id
    WHERE rm.corretor_id = get_my_broker_id()
      AND rm.ativo = true
      AND r.ativa = true
      AND (
        r.tipo_origem = 'whatsapp_global'
        OR r.escopo_empreendimentos = 'todas_landing_pages_e_plantao'
      )
  )
);