
-- 1. Adiciona coluna ad_referral
ALTER TABLE public.lead_attribution
ADD COLUMN IF NOT EXISTS ad_referral jsonb;

-- 2. Backfill: para cada lead, pega o ad_referral da primeira mensagem inbound que o contenha
WITH first_referrals AS (
  SELECT DISTINCT ON (c.lead_id)
    c.lead_id,
    (cm.metadata->'ad_referral') AS ad_referral
  FROM public.conversation_messages cm
  JOIN public.conversations c ON c.id = cm.conversation_id
  WHERE cm.direction = 'inbound'
    AND cm.metadata ? 'ad_referral'
    AND cm.metadata->'ad_referral' IS NOT NULL
    AND c.lead_id IS NOT NULL
  ORDER BY c.lead_id, cm.created_at ASC
)
UPDATE public.lead_attribution la
SET ad_referral = fr.ad_referral
FROM first_referrals fr
WHERE la.lead_id = fr.lead_id
  AND la.ad_referral IS NULL;

-- 3. Para leads que têm ad_referral em mensagem mas ainda não têm linha em lead_attribution
INSERT INTO public.lead_attribution (lead_id, ad_referral, utm_source, utm_medium, utm_campaign, utm_content, landing_page)
SELECT
  fr.lead_id,
  fr.ad_referral,
  'whatsapp',
  'plantao',
  fr.ad_referral->>'campaign',
  fr.ad_referral->>'headline',
  fr.ad_referral->>'source_url'
FROM (
  SELECT DISTINCT ON (c.lead_id)
    c.lead_id,
    (cm.metadata->'ad_referral') AS ad_referral
  FROM public.conversation_messages cm
  JOIN public.conversations c ON c.id = cm.conversation_id
  WHERE cm.direction = 'inbound'
    AND cm.metadata ? 'ad_referral'
    AND cm.metadata->'ad_referral' IS NOT NULL
    AND c.lead_id IS NOT NULL
  ORDER BY c.lead_id, cm.created_at ASC
) fr
WHERE NOT EXISTS (
  SELECT 1 FROM public.lead_attribution la WHERE la.lead_id = fr.lead_id
);
