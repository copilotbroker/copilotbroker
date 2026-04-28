-- ============================================================
-- Multi-tenant guard: auto-fill organization_id on INSERT
-- ============================================================
-- These BEFORE INSERT triggers copy organization_id from the
-- parent entity (broker / lead / project / conversation) when
-- the field is left null by an existing edge function or trigger.
-- This makes tenant isolation reliable without rewriting every
-- edge function call site.

-- ── Helper: from broker_id ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.fill_org_from_broker()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.broker_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.brokers WHERE id = NEW.broker_id;
  END IF;
  RETURN NEW;
END;
$$;

-- ── Helper: from lead_id (fallback to broker via lead) ─────
CREATE OR REPLACE FUNCTION public.fill_org_from_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.lead_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.leads WHERE id = NEW.lead_id;
  END IF;
  RETURN NEW;
END;
$$;

-- ── Helper: leads (broker first, project fallback) ─────────
CREATE OR REPLACE FUNCTION public.fill_org_for_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    IF NEW.broker_id IS NOT NULL THEN
      SELECT organization_id INTO NEW.organization_id
      FROM public.brokers WHERE id = NEW.broker_id;
    END IF;
    IF NEW.organization_id IS NULL AND NEW.project_id IS NOT NULL THEN
      SELECT organization_id INTO NEW.organization_id
      FROM public.projects WHERE id = NEW.project_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ── Helper: campaign_id (whatsapp_message_queue uses it) ───
CREATE OR REPLACE FUNCTION public.fill_org_from_campaign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    IF NEW.broker_id IS NOT NULL THEN
      SELECT organization_id INTO NEW.organization_id
      FROM public.brokers WHERE id = NEW.broker_id;
    END IF;
    IF NEW.organization_id IS NULL AND NEW.lead_id IS NOT NULL THEN
      SELECT organization_id INTO NEW.organization_id
      FROM public.leads WHERE id = NEW.lead_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- Attach triggers (idempotent: drop first)
-- ============================================================

-- conversations: from broker
DROP TRIGGER IF EXISTS fill_org_conversations ON public.conversations;
CREATE TRIGGER fill_org_conversations
  BEFORE INSERT ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.fill_org_from_broker();

-- leads: from broker or project
DROP TRIGGER IF EXISTS fill_org_leads ON public.leads;
CREATE TRIGGER fill_org_leads
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.fill_org_for_lead();

-- lead_interactions: from lead (or broker if present)
DROP TRIGGER IF EXISTS fill_org_lead_interactions ON public.lead_interactions;
CREATE TRIGGER fill_org_lead_interactions
  BEFORE INSERT ON public.lead_interactions
  FOR EACH ROW EXECUTE FUNCTION public.fill_org_from_lead();

-- lead_documents
DROP TRIGGER IF EXISTS fill_org_lead_documents ON public.lead_documents;
CREATE TRIGGER fill_org_lead_documents
  BEFORE INSERT ON public.lead_documents
  FOR EACH ROW EXECUTE FUNCTION public.fill_org_from_lead();

-- lead_attribution
DROP TRIGGER IF EXISTS fill_org_lead_attribution ON public.lead_attribution;
CREATE TRIGGER fill_org_lead_attribution
  BEFORE INSERT ON public.lead_attribution
  FOR EACH ROW EXECUTE FUNCTION public.fill_org_from_lead();

-- propostas
DROP TRIGGER IF EXISTS fill_org_propostas ON public.propostas;
CREATE TRIGGER fill_org_propostas
  BEFORE INSERT ON public.propostas
  FOR EACH ROW EXECUTE FUNCTION public.fill_org_from_lead();

-- calendar_events: from broker
DROP TRIGGER IF EXISTS fill_org_calendar_events ON public.calendar_events;
CREATE TRIGGER fill_org_calendar_events
  BEFORE INSERT ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.fill_org_from_broker();

-- copilot_configs: from broker
DROP TRIGGER IF EXISTS fill_org_copilot_configs ON public.copilot_configs;
CREATE TRIGGER fill_org_copilot_configs
  BEFORE INSERT ON public.copilot_configs
  FOR EACH ROW EXECUTE FUNCTION public.fill_org_from_broker();

-- broker_whatsapp_instances: from broker
DROP TRIGGER IF EXISTS fill_org_broker_wa_instances ON public.broker_whatsapp_instances;
CREATE TRIGGER fill_org_broker_wa_instances
  BEFORE INSERT ON public.broker_whatsapp_instances
  FOR EACH ROW EXECUTE FUNCTION public.fill_org_from_broker();

-- whatsapp_campaigns: from broker
DROP TRIGGER IF EXISTS fill_org_whatsapp_campaigns ON public.whatsapp_campaigns;
CREATE TRIGGER fill_org_whatsapp_campaigns
  BEFORE INSERT ON public.whatsapp_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.fill_org_from_broker();

-- whatsapp_message_queue: from broker or lead
DROP TRIGGER IF EXISTS fill_org_whatsapp_queue ON public.whatsapp_message_queue;
CREATE TRIGGER fill_org_whatsapp_queue
  BEFORE INSERT ON public.whatsapp_message_queue
  FOR EACH ROW EXECUTE FUNCTION public.fill_org_from_campaign();

-- whatsapp_message_templates: from broker
DROP TRIGGER IF EXISTS fill_org_whatsapp_templates ON public.whatsapp_message_templates;
CREATE TRIGGER fill_org_whatsapp_templates
  BEFORE INSERT ON public.whatsapp_message_templates
  FOR EACH ROW EXECUTE FUNCTION public.fill_org_from_broker();

-- whatsapp_labels: from broker
DROP TRIGGER IF EXISTS fill_org_whatsapp_labels ON public.whatsapp_labels;
CREATE TRIGGER fill_org_whatsapp_labels
  BEFORE INSERT ON public.whatsapp_labels
  FOR EACH ROW EXECUTE FUNCTION public.fill_org_from_broker();