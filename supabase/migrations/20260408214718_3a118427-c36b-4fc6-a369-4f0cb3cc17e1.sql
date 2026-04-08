
-- Add timeout control columns to conversations
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS reserva_expira_em timestamptz,
ADD COLUMN IF NOT EXISTS atribuido_em timestamptz;

-- Create index for timeout queries
CREATE INDEX IF NOT EXISTS idx_conversations_reserva_expira
ON public.conversations (reserva_expira_em)
WHERE source_instance = 'global' AND attendance_started = false AND reserva_expira_em IS NOT NULL;

-- Trigger to clear reserva_expira_em when attendance starts
CREATE OR REPLACE FUNCTION public.clear_reserva_on_attendance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.attendance_started = true AND OLD.attendance_started = false THEN
    NEW.reserva_expira_em = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_clear_reserva_on_attendance
BEFORE UPDATE ON public.conversations
FOR EACH ROW
WHEN (NEW.attendance_started IS DISTINCT FROM OLD.attendance_started)
EXECUTE FUNCTION public.clear_reserva_on_attendance();
