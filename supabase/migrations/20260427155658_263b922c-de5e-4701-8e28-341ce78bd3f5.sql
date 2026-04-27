-- Reconciliação: cancelar etapas pendentes de cadências para leads que JÁ responderam
-- (regra: apenas etapas com send_if_replied = false e step_number > 1).
-- Fonte de verdade: conversation_messages.direction = 'inbound' depois da criação da campanha.

WITH inbound_per_lead AS (
  SELECT
    conv.broker_id,
    conv.lead_id,
    conv.phone_normalized,
    MIN(m.created_at) AS first_inbound_at
  FROM public.conversation_messages m
  JOIN public.conversations conv ON conv.id = m.conversation_id
  WHERE m.direction = 'inbound'
  GROUP BY conv.broker_id, conv.lead_id, conv.phone_normalized
),
pending_to_cancel AS (
  SELECT q.id
  FROM public.whatsapp_message_queue q
  JOIN public.whatsapp_campaigns c ON c.id = q.campaign_id
  JOIN public.campaign_steps cs
    ON cs.campaign_id = q.campaign_id AND cs.step_order = q.step_number
  JOIN inbound_per_lead i
    ON i.broker_id = q.broker_id
   AND (
        (q.lead_id IS NOT NULL AND i.lead_id = q.lead_id)
     OR i.phone_normalized = regexp_replace(q.phone, '[^0-9]', '', 'g')
   )
  WHERE q.status IN ('scheduled','queued','paused_by_system')
    AND q.step_number > 1
    AND cs.send_if_replied = false
    AND i.first_inbound_at >= c.created_at
)
UPDATE public.whatsapp_message_queue q
SET status = 'cancelled',
    error_message = 'Lead respondeu - follow-up cancelado (reconciliação retroativa)',
    updated_at = now()
WHERE q.id IN (SELECT id FROM pending_to_cancel);