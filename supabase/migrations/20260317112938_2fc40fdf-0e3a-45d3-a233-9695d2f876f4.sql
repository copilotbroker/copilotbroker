CREATE TABLE IF NOT EXISTS public.whatsapp_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL,
  external_id TEXT,
  name TEXT NOT NULL,
  color TEXT,
  source TEXT NOT NULL DEFAULT 'whatsapp',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_labels_broker_name_unique UNIQUE (broker_id, name),
  CONSTRAINT whatsapp_labels_broker_external_unique UNIQUE NULLS NOT DISTINCT (broker_id, external_id)
);

CREATE TABLE IF NOT EXISTS public.lead_whatsapp_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  label_id UUID NOT NULL,
  broker_id UUID NOT NULL,
  applied_via TEXT NOT NULL DEFAULT 'crm',
  external_chat_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT lead_whatsapp_labels_unique UNIQUE (lead_id, label_id)
);

ALTER TABLE public.whatsapp_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_whatsapp_labels ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_whatsapp_labels_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_whatsapp_labels_updated_at ON public.whatsapp_labels;
CREATE TRIGGER update_whatsapp_labels_updated_at
BEFORE UPDATE ON public.whatsapp_labels
FOR EACH ROW
EXECUTE FUNCTION public.update_whatsapp_labels_updated_at();

DROP TRIGGER IF EXISTS update_lead_whatsapp_labels_updated_at ON public.lead_whatsapp_labels;
CREATE TRIGGER update_lead_whatsapp_labels_updated_at
BEFORE UPDATE ON public.lead_whatsapp_labels
FOR EACH ROW
EXECUTE FUNCTION public.update_whatsapp_labels_updated_at();

CREATE POLICY "Admins can manage whatsapp labels"
ON public.whatsapp_labels
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Brokers can view own whatsapp labels"
ON public.whatsapp_labels
FOR SELECT
USING (broker_id = public.get_my_broker_id());

CREATE POLICY "Brokers can insert own whatsapp labels"
ON public.whatsapp_labels
FOR INSERT
WITH CHECK (broker_id = public.get_my_broker_id());

CREATE POLICY "Brokers can update own whatsapp labels"
ON public.whatsapp_labels
FOR UPDATE
USING (broker_id = public.get_my_broker_id())
WITH CHECK (broker_id = public.get_my_broker_id());

CREATE POLICY "Brokers can delete own whatsapp labels"
ON public.whatsapp_labels
FOR DELETE
USING (broker_id = public.get_my_broker_id());

CREATE POLICY "Leaders can view team whatsapp labels"
ON public.whatsapp_labels
FOR SELECT
USING (
  broker_id IN (
    SELECT id FROM public.brokers WHERE lider_id = public.get_my_broker_id()
  )
);

CREATE POLICY "Admins can manage lead whatsapp labels"
ON public.lead_whatsapp_labels
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Brokers can view own lead whatsapp labels"
ON public.lead_whatsapp_labels
FOR SELECT
USING (
  lead_id IN (
    SELECT id FROM public.leads WHERE broker_id = public.get_my_broker_id()
  )
);

CREATE POLICY "Brokers can insert own lead whatsapp labels"
ON public.lead_whatsapp_labels
FOR INSERT
WITH CHECK (
  broker_id = public.get_my_broker_id()
  AND lead_id IN (
    SELECT id FROM public.leads WHERE broker_id = public.get_my_broker_id()
  )
  AND label_id IN (
    SELECT id FROM public.whatsapp_labels WHERE broker_id = public.get_my_broker_id()
  )
);

CREATE POLICY "Brokers can update own lead whatsapp labels"
ON public.lead_whatsapp_labels
FOR UPDATE
USING (
  lead_id IN (
    SELECT id FROM public.leads WHERE broker_id = public.get_my_broker_id()
  )
)
WITH CHECK (
  broker_id = public.get_my_broker_id()
  AND lead_id IN (
    SELECT id FROM public.leads WHERE broker_id = public.get_my_broker_id()
  )
  AND label_id IN (
    SELECT id FROM public.whatsapp_labels WHERE broker_id = public.get_my_broker_id()
  )
);

CREATE POLICY "Brokers can delete own lead whatsapp labels"
ON public.lead_whatsapp_labels
FOR DELETE
USING (
  lead_id IN (
    SELECT id FROM public.leads WHERE broker_id = public.get_my_broker_id()
  )
);

CREATE POLICY "Leaders can view team lead whatsapp labels"
ON public.lead_whatsapp_labels
FOR SELECT
USING (
  lead_id IN (
    SELECT id FROM public.leads
    WHERE broker_id IN (
      SELECT id FROM public.brokers WHERE lider_id = public.get_my_broker_id()
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_labels_broker_id ON public.whatsapp_labels (broker_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_labels_external_id ON public.whatsapp_labels (external_id);
CREATE INDEX IF NOT EXISTS idx_lead_whatsapp_labels_lead_id ON public.lead_whatsapp_labels (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_whatsapp_labels_label_id ON public.lead_whatsapp_labels (label_id);
CREATE INDEX IF NOT EXISTS idx_lead_whatsapp_labels_broker_id ON public.lead_whatsapp_labels (broker_id);