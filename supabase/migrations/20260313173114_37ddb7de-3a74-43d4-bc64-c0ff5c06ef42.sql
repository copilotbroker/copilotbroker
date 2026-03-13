
-- Add type and created_by_broker_id columns to projects
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'empreendimento',
  ADD COLUMN IF NOT EXISTS created_by_broker_id uuid REFERENCES public.brokers(id) ON DELETE SET NULL;

-- RLS: Brokers can INSERT projects they own
CREATE POLICY "Corretores podem criar seus projetos"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'broker'::app_role) 
  AND created_by_broker_id = get_my_broker_id()
);

-- RLS: Brokers can UPDATE projects they created
CREATE POLICY "Corretores podem atualizar seus projetos"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'broker'::app_role) 
  AND created_by_broker_id = get_my_broker_id()
)
WITH CHECK (
  has_role(auth.uid(), 'broker'::app_role) 
  AND created_by_broker_id = get_my_broker_id()
);

-- RLS: Brokers can SELECT projects they created (in addition to existing public select)
CREATE POLICY "Corretores podem ver seus projetos"
ON public.projects
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'broker'::app_role) 
  AND created_by_broker_id = get_my_broker_id()
);
