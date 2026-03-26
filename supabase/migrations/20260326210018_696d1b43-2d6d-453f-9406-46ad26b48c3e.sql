
-- Allow brokers in active whatsapp_global roletas to see unassigned global conversations
CREATE POLICY "Corretores veem conversas globais nao atribuidas"
ON public.conversations FOR SELECT TO authenticated
USING (
  source_instance = 'global' 
  AND broker_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM public.roletas_membros rm
    JOIN public.roletas r ON r.id = rm.roleta_id
    WHERE rm.corretor_id = public.get_my_broker_id()
      AND rm.ativo = true
      AND r.ativa = true
      AND r.tipo_origem = 'whatsapp_global'
  )
);

-- Allow brokers to claim (update) unassigned global conversations
CREATE POLICY "Corretores podem assumir conversas globais"
ON public.conversations FOR UPDATE TO authenticated
USING (
  source_instance = 'global'
  AND broker_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.roletas_membros rm
    JOIN public.roletas r ON r.id = rm.roleta_id
    WHERE rm.corretor_id = public.get_my_broker_id()
      AND rm.ativo = true
      AND r.ativa = true
      AND r.tipo_origem = 'whatsapp_global'
  )
);

-- Allow leaders to see conversations of their team members
CREATE POLICY "Lideres veem conversas da equipe"
ON public.conversations FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'leader'::app_role)
  AND broker_id IN (
    SELECT id FROM public.brokers WHERE lider_id = public.get_my_broker_id()
  )
);
