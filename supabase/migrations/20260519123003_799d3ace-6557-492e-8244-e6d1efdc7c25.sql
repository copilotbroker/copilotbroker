ALTER TABLE public.conversation_messages
  ADD COLUMN IF NOT EXISTS client_message_id text;

CREATE UNIQUE INDEX IF NOT EXISTS ux_conv_messages_client_id
  ON public.conversation_messages (conversation_id, client_message_id)
  WHERE client_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_conv_messages_uazapi_id
  ON public.conversation_messages (uazapi_message_id)
  WHERE uazapi_message_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversation_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages';
  END IF;
END $$;

ALTER TABLE public.conversation_messages REPLICA IDENTITY FULL;