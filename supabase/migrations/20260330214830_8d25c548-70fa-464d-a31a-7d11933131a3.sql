
-- Add distribution mode to roletas
ALTER TABLE public.roletas ADD COLUMN IF NOT EXISTS modo_distribuicao text NOT NULL DEFAULT 'fila';

-- Add roleta_modo to conversations to track how the conversation was distributed
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS roleta_modo text;
