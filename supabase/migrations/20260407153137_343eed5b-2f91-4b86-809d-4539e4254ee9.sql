
-- 1. Update trigger to auto-set attendance_started on outbound global messages
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
    attendance_started = CASE
      WHEN NEW.direction = 'outbound' AND source_instance = 'global' THEN true
      ELSE attendance_started
    END,
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

-- 2. Fix existing stale data
UPDATE conversations SET attendance_started = true
WHERE source_instance = 'global' AND attendance_started = false
AND (
  lead_id IS NOT NULL
  OR id IN (
    SELECT DISTINCT conversation_id FROM conversation_messages WHERE direction = 'outbound'
  )
);
