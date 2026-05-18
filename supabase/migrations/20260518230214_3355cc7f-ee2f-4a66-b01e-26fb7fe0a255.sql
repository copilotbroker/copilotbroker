
-- Tabela principal do cadastro completo
CREATE OR REPLACE FUNCTION public.update_lead_cadastro_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE IF NOT EXISTS public.lead_cadastro_completo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL UNIQUE,
  organization_id uuid,
  nome_completo text, nacionalidade text, cpf text, rg text, orgao_expedidor text,
  data_nascimento date, nome_mae text, nome_pai text, profissao text,
  estado_civil text, regime_bens text, email text, telefone text, observacoes text,
  endereco_cep text, endereco_logradouro text, endereco_numero text, endereco_complemento text,
  endereco_bairro text, endereco_cidade text, endereco_estado text, endereco_titular text,
  conjuge_nome_completo text, conjuge_nacionalidade text, conjuge_cpf text, conjuge_rg text,
  conjuge_orgao_expedidor text, conjuge_data_nascimento date, conjuge_nome_mae text,
  conjuge_nome_pai text, conjuge_profissao text, conjuge_email text, conjuge_telefone text,
  conjuge_observacoes text, data_casamento_ou_uniao date,
  pj_ativo boolean NOT NULL DEFAULT false,
  pj_razao_social text, pj_nome_fantasia text, pj_cnpj text, pj_inscricao_estadual text,
  pj_endereco_sede text, pj_representante_nome text, pj_representante_cpf text,
  pj_representante_rg text, pj_representante_cargo text, pj_email text, pj_telefone text,
  pj_observacoes text, pj_tem_consolidacao boolean DEFAULT false,
  ai_filled_fields text[] NOT NULL DEFAULT '{}',
  ai_raw_responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_cadastro_completo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam cadastro completo" ON public.lead_cadastro_completo
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Corretores veem cadastro do seu lead" ON public.lead_cadastro_completo
FOR SELECT USING (lead_id IN (SELECT id FROM public.leads WHERE broker_id = get_my_broker_id()));

CREATE POLICY "Corretores inserem cadastro do seu lead" ON public.lead_cadastro_completo
FOR INSERT WITH CHECK (lead_id IN (SELECT id FROM public.leads WHERE broker_id = get_my_broker_id()));

CREATE POLICY "Corretores atualizam cadastro do seu lead" ON public.lead_cadastro_completo
FOR UPDATE USING (lead_id IN (SELECT id FROM public.leads WHERE broker_id = get_my_broker_id()))
WITH CHECK (lead_id IN (SELECT id FROM public.leads WHERE broker_id = get_my_broker_id()));

CREATE POLICY "Lideres veem cadastro da equipe" ON public.lead_cadastro_completo
FOR SELECT USING (
  lead_id IN (SELECT id FROM public.leads WHERE broker_id IN (SELECT id FROM public.brokers WHERE lider_id = get_my_broker_id()))
);

CREATE POLICY "Lideres atualizam cadastro da equipe" ON public.lead_cadastro_completo
FOR UPDATE USING (
  lead_id IN (SELECT id FROM public.leads WHERE broker_id IN (SELECT id FROM public.brokers WHERE lider_id = get_my_broker_id()))
);

CREATE TRIGGER trg_lead_cadastro_completo_updated_at
BEFORE UPDATE ON public.lead_cadastro_completo
FOR EACH ROW EXECUTE FUNCTION public.update_lead_cadastro_updated_at();

CREATE TRIGGER trg_lead_cadastro_completo_fill_org
BEFORE INSERT ON public.lead_cadastro_completo
FOR EACH ROW EXECUTE FUNCTION public.fill_org_from_lead();

CREATE INDEX IF NOT EXISTS idx_lead_cadastro_completo_lead_id ON public.lead_cadastro_completo(lead_id);

-- Extensão da tabela lead_documents para armazenar arquivos
ALTER TABLE public.lead_documents
  ADD COLUMN IF NOT EXISTS file_path text,
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS file_size integer,
  ADD COLUMN IF NOT EXISTS uploaded_by uuid,
  ADD COLUMN IF NOT EXISTS ai_extracted jsonb,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Storage bucket privado
INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-documents', 'lead-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Corretores leem documentos do lead"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lead-documents' AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (storage.foldername(name))[1]::uuid IN (SELECT id FROM public.leads WHERE broker_id = get_my_broker_id())
    OR (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM public.leads WHERE broker_id IN (SELECT id FROM public.brokers WHERE lider_id = get_my_broker_id())
    )
  )
);

CREATE POLICY "Corretores enviam documentos do lead"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lead-documents' AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (storage.foldername(name))[1]::uuid IN (SELECT id FROM public.leads WHERE broker_id = get_my_broker_id())
  )
);

CREATE POLICY "Corretores atualizam documentos do lead"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lead-documents' AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (storage.foldername(name))[1]::uuid IN (SELECT id FROM public.leads WHERE broker_id = get_my_broker_id())
  )
);

CREATE POLICY "Admins deletam documentos do lead"
ON storage.objects FOR DELETE
USING (bucket_id = 'lead-documents' AND has_role(auth.uid(), 'admin'::app_role));
