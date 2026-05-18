import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CadastroCompleto = {
  id?: string;
  lead_id: string;
  nome_completo?: string | null;
  nacionalidade?: string | null;
  cpf?: string | null;
  rg?: string | null;
  orgao_expedidor?: string | null;
  data_nascimento?: string | null;
  nome_mae?: string | null;
  nome_pai?: string | null;
  profissao?: string | null;
  estado_civil?: string | null;
  regime_bens?: string | null;
  email?: string | null;
  telefone?: string | null;
  observacoes?: string | null;
  endereco_cep?: string | null;
  endereco_logradouro?: string | null;
  endereco_numero?: string | null;
  endereco_complemento?: string | null;
  endereco_bairro?: string | null;
  endereco_cidade?: string | null;
  endereco_estado?: string | null;
  endereco_titular?: string | null;
  conjuge_nome_completo?: string | null;
  conjuge_nacionalidade?: string | null;
  conjuge_cpf?: string | null;
  conjuge_rg?: string | null;
  conjuge_orgao_expedidor?: string | null;
  conjuge_data_nascimento?: string | null;
  conjuge_nome_mae?: string | null;
  conjuge_nome_pai?: string | null;
  conjuge_profissao?: string | null;
  conjuge_email?: string | null;
  conjuge_telefone?: string | null;
  conjuge_observacoes?: string | null;
  data_casamento_ou_uniao?: string | null;
  pj_ativo?: boolean | null;
  pj_razao_social?: string | null;
  pj_nome_fantasia?: string | null;
  pj_cnpj?: string | null;
  pj_inscricao_estadual?: string | null;
  pj_endereco_sede?: string | null;
  pj_representante_nome?: string | null;
  pj_representante_cpf?: string | null;
  pj_representante_rg?: string | null;
  pj_representante_cargo?: string | null;
  pj_email?: string | null;
  pj_telefone?: string | null;
  pj_observacoes?: string | null;
  pj_tem_consolidacao?: boolean | null;
  ai_filled_fields?: string[] | null;
};

export type CadastroDocument = {
  id: string;
  lead_id: string;
  document_type: string;
  file_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  ai_extracted: any;
  is_active: boolean;
  is_received: boolean;
  created_at: string;
  updated_at: string | null;
};

export const CADASTRO_DOC_TYPES = [
  "documento_comprador",
  "comprovante_estado_civil",
  "documento_conjuge",
  "comprovante_residencia",
  "cartao_cnpj",
  "contrato_social",
  "alteracao_contratual",
  "consolidacao_contratual",
  "outro",
] as const;

export function useLeadCadastro(leadId: string | null) {
  const [data, setData] = useState<CadastroCompleto | null>(null);
  const [docs, setDocs] = useState<CadastroDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const [{ data: cad }, { data: ds }] = await Promise.all([
        supabase.from("lead_cadastro_completo").select("*").eq("lead_id", leadId).maybeSingle(),
        supabase.from("lead_documents").select("*").eq("lead_id", leadId)
          .in("document_type", CADASTRO_DOC_TYPES as unknown as string[])
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
      ]);
      setData((cad as any) ?? { lead_id: leadId });
      setDocs(((ds as any) ?? []) as CadastroDocument[]);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const save = useCallback(async (patch: Partial<CadastroCompleto>, opts?: { silent?: boolean }) => {
    if (!leadId) return false;
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("lead_cadastro_completo").select("id").eq("lead_id", leadId).maybeSingle();
      const payload = { ...patch, lead_id: leadId };
      if (existing?.id) {
        const { error } = await supabase.from("lead_cadastro_completo")
          .update(payload as any).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lead_cadastro_completo").insert(payload as any);
        if (error) throw error;
      }
      await fetchAll();
      if (!opts?.silent) toast.success("Dados salvos");
      return true;
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao salvar: " + (e?.message ?? "desconhecido"));
      return false;
    } finally {
      setSaving(false);
    }
  }, [leadId, fetchAll]);

  const uploadDocument = useCallback(async (file: File, documentType: string): Promise<CadastroDocument | null> => {
    if (!leadId) return null;
    const MAX_BYTES = 8 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      toast.error(`Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Limite: 8 MB. Comprima o PDF antes de enviar.`);
      return null;
    }
    try {
      const ts = Date.now();
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${leadId}/${documentType}/${ts}-${safeName}`;

      const { error: upErr } = await supabase.storage.from("lead-documents")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const user = (await supabase.auth.getUser()).data.user;
      const { data: inserted, error: insErr } = await supabase.from("lead_documents")
        .insert({
          lead_id: leadId,
          document_type: documentType,
          file_path: path,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          uploaded_by: user?.id ?? null,
          is_received: true,
          received_at: new Date().toISOString(),
          received_by: user?.id ?? null,
          is_active: true,
        })
        .select().single();
      if (insErr) throw insErr;
      await fetchAll();
      return inserted as any;
    } catch (e: any) {
      console.error(e);
      toast.error("Erro no upload: " + (e?.message ?? "desconhecido"));
      return null;
    }
  }, [leadId, fetchAll]);

  const extractWithAI = useCallback(async (documentId: string, documentType: string) => {
    if (!leadId) return null;
    const { data: res, error } = await supabase.functions.invoke("lead-document-extract", {
      body: { lead_id: leadId, document_id: documentId, document_type: documentType },
    });
    if (error) {
      toast.error("IA: " + (error.message ?? "falha"));
      return null;
    }
    return (res as any)?.data ?? null;
  }, [leadId]);

  const getSignedUrl = useCallback(async (path: string) => {
    const { data, error } = await supabase.storage.from("lead-documents").createSignedUrl(path, 60 * 10);
    if (error) { toast.error("Não foi possível gerar link"); return null; }
    return data.signedUrl;
  }, []);

  const removeDocument = useCallback(async (doc: CadastroDocument) => {
    try {
      await supabase.from("lead_documents").update({ is_active: false }).eq("id", doc.id);
      await fetchAll();
    } catch (e: any) {
      toast.error("Erro ao remover: " + (e?.message ?? ""));
    }
  }, [fetchAll]);

  return { data, docs, loading, saving, save, uploadDocument, extractWithAI, getSignedUrl, removeDocument, refetch: fetchAll };
}
