// Extracts structured data from a lead document using Lovable AI (Gemini).
// Reads the uploaded file from the private "lead-documents" bucket,
// asks Gemini for a JSON answer following a per-type schema, persists the
// raw response on lead_documents.ai_extracted and returns the normalized
// JSON to the caller. The Lovable API key never leaves the function.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

type DocumentType =
  | "documento_comprador"
  | "documento_conjuge"
  | "comprovante_estado_civil"
  | "comprovante_residencia"
  | "cartao_cnpj"
  | "contrato_social"
  | "alteracao_contratual"
  | "consolidacao_contratual"
  | "outro";

const PROMPTS: Record<string, string> = {
  documento_pessoa: `Você é um extrator de dados. Leia o documento de identificação (CNH, RG ou equivalente) anexado e retorne APENAS um JSON válido (sem markdown, sem comentários) com as chaves:
{"nome_completo":"","nacionalidade":"","cpf":"","rg":"","orgao_expedidor":"","data_nascimento":"","nome_mae":"","nome_pai":"","campos_nao_encontrados":[],"observacoes_ia":""}
Regras: não invente nada. Datas em formato YYYY-MM-DD. CPF apenas dígitos. Liste em "campos_nao_encontrados" as chaves que ficaram vazias.`,

  comprovante_estado_civil: `Você é um extrator de dados. Leia o documento de estado civil (certidão de casamento, nascimento, união estável) anexado e retorne APENAS um JSON válido (sem markdown):
{"estado_civil":"","regime_bens":"","nome_conjuge":"","data_casamento_ou_uniao":"","campos_nao_encontrados":[],"observacoes_ia":""}
estado_civil ∈ {"solteiro","casado","divorciado","viuvo","uniao_estavel","separado","outro"}. regime_bens ∈ {"comunhao_parcial","comunhao_universal","separacao_total","separacao_obrigatoria","outro",""}. Datas em YYYY-MM-DD.`,

  comprovante_residencia: `Você é um extrator de dados. Leia o comprovante de residência anexado e retorne APENAS um JSON válido (sem markdown):
{"cep":"","logradouro":"","numero":"","complemento":"","bairro":"","cidade":"","estado":"","titular_comprovante":"","campos_nao_encontrados":[],"observacoes_ia":""}
CEP apenas dígitos. Estado em sigla UF.`,

  pessoa_juridica: `Você é um extrator de dados. Leia o documento de pessoa jurídica (cartão CNPJ, contrato social, alteração contratual) anexado e retorne APENAS um JSON válido (sem markdown):
{"razao_social":"","nome_fantasia":"","cnpj":"","inscricao_estadual":"","endereco_sede":"","representantes_legais":[{"nome":"","cpf":"","rg":"","cargo":""}],"campos_nao_encontrados":[],"observacoes_ia":""}
CNPJ apenas dígitos.`,
};

function promptForType(t: DocumentType): string {
  switch (t) {
    case "documento_comprador":
    case "documento_conjuge":
      return PROMPTS.documento_pessoa;
    case "comprovante_estado_civil":
      return PROMPTS.comprovante_estado_civil;
    case "comprovante_residencia":
      return PROMPTS.comprovante_residencia;
    case "cartao_cnpj":
    case "contrato_social":
    case "alteracao_contratual":
    case "consolidacao_contratual":
      return PROMPTS.pessoa_juridica;
    default:
      return `Extraia quaisquer dados relevantes do documento e retorne um JSON com {"observacoes_ia":"...","campos_nao_encontrados":[]}`;
  }
}

function stripJsonFence(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userRes.user.id;

    const body = await req.json().catch(() => ({}));
    const { lead_id, document_id, document_type } = body as {
      lead_id?: string; document_id?: string; document_type?: DocumentType;
    };
    if (!lead_id || !document_id || !document_type) {
      return new Response(JSON.stringify({ error: "Missing lead_id, document_id or document_type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Permission check: caller must be admin OR broker of the lead OR leader of that broker
    const [{ data: roles }, { data: brokerRow }, { data: leadRow }] = await Promise.all([
      admin.from("user_roles").select("role").eq("user_id", userId),
      admin.from("brokers").select("id, lider_id").eq("user_id", userId).maybeSingle(),
      admin.from("leads").select("id, broker_id").eq("id", lead_id).maybeSingle(),
    ]);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
    if (!leadRow) {
      return new Response(JSON.stringify({ error: "Lead not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    let allowed = isAdmin;
    if (!allowed && brokerRow?.id) {
      if (brokerRow.id === leadRow.broker_id) allowed = true;
      else {
        const { data: teamBroker } = await admin
          .from("brokers").select("id").eq("id", leadRow.broker_id).eq("lider_id", brokerRow.id).maybeSingle();
        if (teamBroker) allowed = true;
      }
    }
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch document row
    const { data: doc, error: docErr } = await admin
      .from("lead_documents")
      .select("id, lead_id, file_path, mime_type, file_name")
      .eq("id", document_id).maybeSingle();
    if (docErr || !doc || doc.lead_id !== lead_id || !doc.file_path) {
      return new Response(JSON.stringify({ error: "Document not found or missing file" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Guard: file size limit (Lovable AI inline ~ keep well under worker memory budget)
    const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
    const { data: fileBlob, error: dlErr } = await admin.storage.from("lead-documents").download(doc.file_path);
    if (dlErr || !fileBlob) {
      return new Response(JSON.stringify({ error: "Failed to download file" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (fileBlob.size > MAX_BYTES) {
      return new Response(JSON.stringify({
        error: "file_too_large",
        message: `Arquivo muito grande para leitura por IA (${(fileBlob.size / 1024 / 1024).toFixed(1)} MB). Envie um arquivo de até 8 MB ou comprima o PDF.`,
      }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const buffer = new Uint8Array(await fileBlob.arrayBuffer());
    const b64 = encodeBase64(buffer);




    const mime = doc.mime_type || fileBlob.type || "application/octet-stream";
    const prompt = promptForType(document_type);

    // Call Lovable AI Gateway (OpenAI-compatible chat completions) with inline file
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI gateway error", aiResp.status, txt);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limited", message: "Limite de uso da IA atingido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "credits_exhausted", message: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "ai_error", message: "Falha ao processar o documento com IA." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "";
    let parsed: unknown = null;
    try { parsed = JSON.parse(stripJsonFence(String(raw))); }
    catch (_e) { parsed = { observacoes_ia: String(raw).slice(0, 500), campos_nao_encontrados: [] }; }

    // Persist raw response on the document
    await admin.from("lead_documents")
      .update({ ai_extracted: parsed as any, updated_at: new Date().toISOString() })
      .eq("id", document_id);

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("lead-document-extract error", e);
    return new Response(JSON.stringify({ error: "internal_error", message: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
