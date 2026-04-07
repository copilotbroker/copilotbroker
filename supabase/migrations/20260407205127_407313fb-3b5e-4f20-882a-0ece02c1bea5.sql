
-- Backfill display_name for global conversations from linked leads
UPDATE conversations c
SET display_name = l.name, display_name_source = 'lead'
FROM leads l
WHERE c.lead_id = l.id
  AND c.source_instance = 'global'
  AND (c.display_name IS NULL OR c.display_name = '')
  AND l.name IS NOT NULL
  AND l.name != ''
  AND l.name !~ '^\+?[0-9 ()-]+$';

-- Backfill display_name from sender_name in conversation_messages for conversations still without a name
UPDATE conversations c
SET display_name = sub.sender_name, display_name_source = 'sender_name'
FROM (
  SELECT DISTINCT ON (cm.conversation_id) cm.conversation_id, cm.sender_name
  FROM conversation_messages cm
  WHERE cm.direction = 'inbound'
    AND cm.sender_name IS NOT NULL
    AND cm.sender_name != ''
  ORDER BY cm.conversation_id, cm.created_at DESC
) sub
WHERE c.id = sub.conversation_id
  AND (c.display_name IS NULL OR c.display_name = '');
