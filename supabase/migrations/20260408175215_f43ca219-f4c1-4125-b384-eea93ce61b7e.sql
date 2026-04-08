
CREATE OR REPLACE FUNCTION public.auto_create_conversation_for_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _phone_clean text;
  _phone_normalized text;
  _existing_conv_id uuid;
BEGIN
  -- Only act when lead has both broker and whatsapp
  IF NEW.broker_id IS NULL OR NEW.whatsapp IS NULL OR NEW.whatsapp = '' THEN
    RETURN NEW;
  END IF;

  -- Normalize phone
  _phone_clean := regexp_replace(NEW.whatsapp, '[^0-9]', '', 'g');
  
  -- Add country code if missing
  IF length(_phone_clean) <= 11 THEN
    _phone_normalized := '55' || _phone_clean;
  ELSE
    _phone_normalized := _phone_clean;
  END IF;

  -- Check if a conversation already exists for this broker + phone (personal instance)
  SELECT id INTO _existing_conv_id
  FROM public.conversations
  WHERE broker_id = NEW.broker_id
    AND phone_normalized = _phone_normalized
    AND (source_instance IS NULL OR source_instance != 'global')
  LIMIT 1;

  IF _existing_conv_id IS NOT NULL THEN
    -- Link existing conversation to this lead if not already linked
    UPDATE public.conversations
    SET lead_id = NEW.id,
        display_name = COALESCE(display_name, NEW.name),
        display_name_source = CASE 
          WHEN display_name IS NULL OR display_name_source = 'phone' THEN 'lead'
          ELSE display_name_source
        END,
        updated_at = now()
    WHERE id = _existing_conv_id
      AND (lead_id IS NULL);
  ELSE
    -- Create a new conversation for the inbox
    INSERT INTO public.conversations (
      broker_id,
      phone,
      phone_normalized,
      lead_id,
      display_name,
      display_name_source,
      source_instance,
      status,
      ai_mode,
      attendance_started,
      last_message_preview,
      last_message_at
    ) VALUES (
      NEW.broker_id,
      '+' || _phone_normalized,
      _phone_normalized,
      NEW.id,
      NEW.name,
      'lead',
      'personal',
      'idle',
      'copilot',
      false,
      'Lead recebido via ' || COALESCE(NEW.lead_origin, NEW.source),
      NEW.created_at
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on leads table (AFTER INSERT to ensure lead ID is available)
CREATE TRIGGER trg_auto_create_conversation_for_lead
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_conversation_for_lead();
