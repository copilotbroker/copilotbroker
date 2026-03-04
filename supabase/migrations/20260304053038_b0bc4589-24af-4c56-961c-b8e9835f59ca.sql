
ALTER TABLE public.copilot_configs ADD COLUMN IF NOT EXISTS custom_system_prompt text DEFAULT NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS ai_prompt text DEFAULT NULL;
