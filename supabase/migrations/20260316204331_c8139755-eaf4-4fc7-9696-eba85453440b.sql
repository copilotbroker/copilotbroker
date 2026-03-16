ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS display_name_source text,
ADD COLUMN IF NOT EXISTS last_message_type text NOT NULL DEFAULT 'text';

UPDATE public.conversations c
SET
  display_name = COALESCE(
    l.name,
    c.display_name,
    (
      SELECT NULLIF(cm.sender_name, '')
      FROM public.conversation_messages cm
      WHERE cm.conversation_id = c.id
        AND cm.direction = 'inbound'
        AND cm.sender_name IS NOT NULL
      ORDER BY cm.created_at DESC
      LIMIT 1
    ),
    c.phone
  ),
  display_name_source = CASE
    WHEN l.name IS NOT NULL THEN 'lead'
    WHEN c.display_name IS NOT NULL THEN COALESCE(c.display_name_source, 'conversation')
    WHEN EXISTS (
      SELECT 1
      FROM public.conversation_messages cm
      WHERE cm.conversation_id = c.id
        AND cm.direction = 'inbound'
        AND cm.sender_name IS NOT NULL
    ) THEN 'sender_name'
    ELSE 'phone'
  END,
  last_message_type = COALESCE(
    (
      SELECT NULLIF(cm.message_type, '')
      FROM public.conversation_messages cm
      WHERE cm.conversation_id = c.id
      ORDER BY cm.created_at DESC
      LIMIT 1
    ),
    c.last_message_type,
    'text'
  )
FROM public.leads l
WHERE c.lead_id = l.id;

UPDATE public.conversations c
SET
  display_name = COALESCE(
    c.display_name,
    (
      SELECT NULLIF(cm.sender_name, '')
      FROM public.conversation_messages cm
      WHERE cm.conversation_id = c.id
        AND cm.direction = 'inbound'
        AND cm.sender_name IS NOT NULL
      ORDER BY cm.created_at DESC
      LIMIT 1
    ),
    c.phone
  ),
  display_name_source = COALESCE(
    c.display_name_source,
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM public.conversation_messages cm
        WHERE cm.conversation_id = c.id
          AND cm.direction = 'inbound'
          AND cm.sender_name IS NOT NULL
      ) THEN 'sender_name'
      ELSE 'phone'
    END
  ),
  last_message_type = COALESCE(
    c.last_message_type,
    (
      SELECT NULLIF(cm.message_type, '')
      FROM public.conversation_messages cm
      WHERE cm.conversation_id = c.id
      ORDER BY cm.created_at DESC
      LIMIT 1
    ),
    'text'
  )
WHERE c.display_name IS NULL
   OR c.display_name_source IS NULL
   OR c.last_message_type IS NULL;

CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _preview text;
  _message_type text;
BEGIN
  _message_type := COALESCE(NULLIF(NEW.message_type, ''), 'text');

  _preview := CASE _message_type
    WHEN 'image' THEN COALESCE(NULLIF(NEW.content, ''), 'Foto')
    WHEN 'audio' THEN COALESCE(NULLIF(NEW.content, ''), 'Áudio')
    WHEN 'video' THEN COALESCE(NULLIF(NEW.content, ''), 'Vídeo')
    WHEN 'document' THEN COALESCE(NULLIF((NEW.metadata->>'file_name'), ''), NULLIF(NEW.content, ''), 'Documento')
    ELSE LEFT(COALESCE(NEW.content, ''), 100)
  END;

  UPDATE public.conversations SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(_preview, 100),
    last_message_direction = NEW.direction,
    last_message_type = _message_type,
    unread_count = CASE WHEN NEW.direction = 'inbound' THEN unread_count + 1 ELSE unread_count END,
    status = CASE WHEN NEW.direction = 'inbound' THEN 'unread' ELSE status END,
    display_name = CASE
      WHEN NEW.direction = 'inbound' AND COALESCE(NULLIF(NEW.sender_name, ''), '') <> '' AND (display_name IS NULL OR display_name_source IN ('phone', 'sender_name'))
        THEN NEW.sender_name
      ELSE display_name
    END,
    display_name_source = CASE
      WHEN NEW.direction = 'inbound' AND COALESCE(NULLIF(NEW.sender_name, ''), '') <> '' AND (display_name IS NULL OR display_name_source IN ('phone', 'sender_name'))
        THEN 'sender_name'
      ELSE display_name_source
    END,
    updated_at = now()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$function$;