ALTER TABLE public.whatsapp_labels
  ADD CONSTRAINT whatsapp_labels_broker_id_fkey
  FOREIGN KEY (broker_id) REFERENCES public.brokers(id) ON DELETE CASCADE;

ALTER TABLE public.lead_whatsapp_labels
  ADD CONSTRAINT lead_whatsapp_labels_lead_id_fkey
  FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE,
  ADD CONSTRAINT lead_whatsapp_labels_label_id_fkey
  FOREIGN KEY (label_id) REFERENCES public.whatsapp_labels(id) ON DELETE CASCADE,
  ADD CONSTRAINT lead_whatsapp_labels_broker_id_fkey
  FOREIGN KEY (broker_id) REFERENCES public.brokers(id) ON DELETE CASCADE;