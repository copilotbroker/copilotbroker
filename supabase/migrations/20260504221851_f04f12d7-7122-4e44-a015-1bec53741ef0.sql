CREATE POLICY "Corretores veem mensagens de plantao pendentes"
ON public.conversation_messages FOR SELECT
TO authenticated
USING (
  conversation_id IN (
    SELECT c.id FROM public.conversations c
    WHERE c.source_instance = 'global'
      AND c.attendance_started = false
      AND EXISTS (
        SELECT 1 FROM public.roletas_membros rm
        JOIN public.roletas r ON r.id = rm.roleta_id
        WHERE rm.corretor_id = public.get_my_broker_id()
          AND rm.ativo = true
          AND r.ativa = true
          AND (r.tipo_origem = 'whatsapp_global'
               OR r.escopo_empreendimentos = 'todas_landing_pages_e_plantao')
      )
  )
);

CREATE POLICY "Lideres role veem mensagens da equipe"
ON public.conversation_messages FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'leader'::app_role)
  AND conversation_id IN (
    SELECT c.id FROM public.conversations c
    JOIN public.brokers b ON b.id = c.broker_id
    WHERE b.lider_id = public.get_my_broker_id()
  )
);