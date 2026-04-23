-- Add escopo_empreendimentos column to roletas
ALTER TABLE public.roletas
ADD COLUMN IF NOT EXISTS escopo_empreendimentos text NOT NULL DEFAULT 'especifico'
CHECK (escopo_empreendimentos IN ('especifico', 'todas_landing_pages'));

-- Partial unique index: only one active roleta with 'todas_landing_pages' scope at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_roleta_todas_lps_ativa
ON public.roletas ((true))
WHERE escopo_empreendimentos = 'todas_landing_pages' AND ativa = true;