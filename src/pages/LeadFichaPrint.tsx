import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logoEnove from "@/assets/logo-enove.png";
import { STATUS_CONFIG, type LeadStatus } from "@/types/crm";
import { ArrowLeft, Printer, Sparkles } from "lucide-react";

// ───────────────────────── Helpers ─────────────────────────
const formatDateBR = (v?: string | null) => {
  if (!v) return "";
  const d = new Date(v.length === 10 ? `${v}T00:00:00` : v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString("pt-BR");
};
const formatDateTimeBR = (v?: string | null) => {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};
const onlyDigits = (s?: string | null) => (s || "").replace(/\D/g, "");
const formatCPF = (v?: string | null) => {
  const d = onlyDigits(v);
  if (d.length !== 11) return v || "";
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};
const formatCNPJ = (v?: string | null) => {
  const d = onlyDigits(v);
  if (d.length !== 14) return v || "";
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};
const formatCEP = (v?: string | null) => {
  const d = onlyDigits(v);
  if (d.length !== 8) return v || "";
  return `${d.slice(0, 5)}-${d.slice(5)}`;
};
const formatPhoneBR = (v?: string | null) => {
  let d = onlyDigits(v);
  if (!d) return "";
  if (d.startsWith("55") && d.length > 11) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return v || "";
};

const ESTADO_CIVIL_LABELS: Record<string, string> = {
  solteiro: "Solteiro(a)",
  casado: "Casado(a)",
  uniao_estavel: "União estável",
  divorciado: "Divorciado(a)",
  viuvo: "Viúvo(a)",
  separado: "Separado(a)",
};
const REGIME_BENS_LABELS: Record<string, string> = {
  comunhao_parcial: "Comunhão parcial de bens",
  comunhao_universal: "Comunhão universal de bens",
  separacao_total: "Separação total de bens",
  separacao_obrigatoria: "Separação obrigatória de bens",
  participacao_final_aquestos: "Participação final nos aquestos",
};

// ───────────────────────── Components ─────────────────────────
const Field = ({ label, value, ai }: { label: string; value?: string | null; ai?: boolean }) => {
  if (!value) return null;
  return (
    <div className="py-1.5">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-[0.12em] text-neutral-500 font-semibold">
        {label}
        {ai && (
          <span title="Preenchido por IA" className="inline-flex items-center gap-0.5 text-[9px] text-neutral-400 normal-case tracking-normal font-normal">
            <Sparkles className="h-2.5 w-2.5" /> IA
          </span>
        )}
      </div>
      <div className="text-[13px] text-neutral-900 font-medium break-words mt-0.5 leading-snug">{value}</div>
    </div>
  );
};

const Section = ({
  number,
  title,
  children,
  show = true,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
  show?: boolean;
}) => {
  if (!show) return null;
  const num = String(number).padStart(2, "0");
  return (
    <section className="mb-7 break-inside-avoid">
      <div className="flex items-center gap-3 mb-3">
        <div className="bg-black text-white text-[10px] font-bold tracking-widest px-2 py-1 leading-none">
          {num}
        </div>
        <h2 className="font-serif text-[15px] font-semibold text-neutral-900 uppercase tracking-[0.08em]">
          {title}
        </h2>
        <div className="flex-1 h-px bg-neutral-300" />
      </div>
      <div className="pl-1">{children}</div>
    </section>
  );
};

// ───────────────────────── Page ─────────────────────────
export default function LeadFichaPrint() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<any>(null);
  const [cad, setCad] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!leadId) return;
      const [{ data: l, error: lErr }, { data: c }, { data: d }] = await Promise.all([
        supabase
          .from("leads")
          .select(
            "*, broker:brokers!leads_broker_id_fkey(id,name), project:projects!leads_project_id_fkey(id,name,city)",
          )
          .eq("id", leadId)
          .maybeSingle(),
        supabase.from("lead_cadastro_completo").select("*").eq("lead_id", leadId).maybeSingle(),
        supabase
          .from("lead_documents")
          .select("document_type,file_name,is_received,received_at,created_at")
          .eq("lead_id", leadId)
          .eq("is_active", true)
          .order("created_at", { ascending: true }),
      ]);
      if (lErr) console.error("[LeadFichaPrint] erro ao buscar lead:", lErr);

      setLead(l);
      setCad(c);
      setDocs(d ?? []);
      setLoading(false);
    })();
  }, [leadId]);

  const aiFields = useMemo<Set<string>>(() => new Set(cad?.ai_filled_fields || []), [cad]);
  const isAi = (k: string) => aiFields.has(k);

  if (loading) return <div className="p-10 text-neutral-700">Carregando ficha...</div>;
  if (!lead) return <div className="p-10 text-neutral-700">Lead não encontrado.</div>;

  const nome = cad?.nome_completo || lead?.name || "—";
  const cpf = formatCPF(cad?.cpf || lead?.cpf);
  const isCasado = cad?.estado_civil === "casado" || cad?.estado_civil === "uniao_estavel";
  const statusCfg = STATUS_CONFIG[lead.status as LeadStatus];

  const hasDadosPessoais = !!(
    cad?.nome_completo || cad?.cpf || cad?.rg || cad?.data_nascimento ||
    cad?.nacionalidade || cad?.profissao || cad?.nome_mae || cad?.nome_pai ||
    cad?.email || cad?.telefone || lead?.name || lead?.email || lead?.whatsapp
  );
  const hasEstadoCivil = !!(cad?.estado_civil || cad?.regime_bens || cad?.data_casamento_ou_uniao);
  const hasEndereco = !!(cad?.endereco_cep || cad?.endereco_logradouro || cad?.endereco_cidade || cad?.endereco_estado);
  const hasObservacoes = !!(cad?.observacoes || cad?.conjuge_observacoes || cad?.pj_observacoes);

  let sectionNum = 0;
  const n = () => ++sectionNum;

  return (
    <div className="min-h-screen bg-neutral-200 print:bg-white text-neutral-900 py-6 print:py-0">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .page { box-shadow: none !important; margin: 0 !important; }
          @page { size: A4; margin: 0; }
        }
        .page { background: white; }
        .print-exact { -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
      `}</style>

      {/* Action bar */}
      <div className="no-print max-w-[210mm] mx-auto mb-4 px-6 flex items-center justify-between">
        <button
          onClick={() => navigate(`/corretor/lead/${leadId}`)}
          className="inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao lead
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-neutral-800"
        >
          <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
        </button>
      </div>

      <div className="page max-w-[210mm] mx-auto shadow-md print:shadow-none relative">
        {/* TARJA PRETA SUPERIOR — sangria total */}
        <div className="print-exact bg-black text-white px-10 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logoEnove} alt="Enove" className="h-10 w-auto" />
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-400">Documento interno</p>
            <p className="font-serif text-lg font-semibold leading-tight mt-0.5">Ficha do Cliente</p>
          </div>
        </div>

        {/* Faixa de identificação do cliente */}
        <div className="border-b-2 border-black px-10 py-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Cliente</p>
          <h1 className="font-serif text-3xl font-bold text-neutral-900 mt-1 leading-tight">{nome}</h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2 text-[12px] text-neutral-700">
            {cpf && <span><span className="text-neutral-500">CPF</span> · <span className="font-medium text-neutral-900">{cpf}</span></span>}
            {statusCfg?.label && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-black" />
                <span className="font-medium text-neutral-900">{statusCfg.label}</span>
              </span>
            )}
            <span className="ml-auto text-[10px] uppercase tracking-wider text-neutral-500">
              Emitida em {new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
            </span>
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className="px-10 py-8">
          {/* Resumo */}
          <section className="mb-7 grid grid-cols-2 gap-x-8 gap-y-0 border border-neutral-200 bg-neutral-50/60 px-5 py-4 break-inside-avoid">
            <Field label="Corretor responsável" value={lead.broker?.name} />
            <Field label="Empreendimento de interesse" value={lead.project?.name} />
            <Field label="Origem" value={lead.lead_origin || lead.source} />
            <Field label="Status atual" value={statusCfg?.label || lead.status} />
            <Field label="Criado em" value={formatDateTimeBR(lead.created_at)} />
            <Field label="Última interação" value={formatDateTimeBR(lead.last_interaction_at)} />
          </section>

          {/* 1. Dados pessoais */}
          <Section number={n()} title="Dados pessoais" show={hasDadosPessoais}>
            <div className="grid grid-cols-2 gap-x-8">
              <Field label="Nome completo" value={cad?.nome_completo || lead?.name} ai={isAi("nome_completo")} />
              <Field label="CPF" value={formatCPF(cad?.cpf || lead?.cpf)} ai={isAi("cpf")} />
              <Field label="RG" value={cad?.rg} ai={isAi("rg")} />
              <Field label="Órgão expedidor" value={cad?.orgao_expedidor} ai={isAi("orgao_expedidor")} />
              <Field label="Data de nascimento" value={formatDateBR(cad?.data_nascimento)} ai={isAi("data_nascimento")} />
              <Field label="Nacionalidade" value={cad?.nacionalidade} ai={isAi("nacionalidade")} />
              <Field label="Profissão" value={cad?.profissao} ai={isAi("profissao")} />
              <Field label="Nome da mãe" value={cad?.nome_mae} ai={isAi("nome_mae")} />
              <Field label="Nome do pai" value={cad?.nome_pai} ai={isAi("nome_pai")} />
              <Field label="E-mail" value={cad?.email || lead?.email} ai={isAi("email")} />
              <Field label="Telefone" value={formatPhoneBR(cad?.telefone || lead?.whatsapp)} ai={isAi("telefone")} />
            </div>
          </Section>

          {/* 2. Estado civil */}
          <Section number={n()} title="Estado civil" show={hasEstadoCivil}>
            <div className="grid grid-cols-2 gap-x-8">
              <Field label="Estado civil" value={ESTADO_CIVIL_LABELS[cad?.estado_civil] || cad?.estado_civil} ai={isAi("estado_civil")} />
              <Field label="Regime de bens" value={REGIME_BENS_LABELS[cad?.regime_bens] || cad?.regime_bens} ai={isAi("regime_bens")} />
              <Field label="Data de casamento / união" value={formatDateBR(cad?.data_casamento_ou_uniao)} ai={isAi("data_casamento_ou_uniao")} />
            </div>
          </Section>

          {/* 3. Cônjuge */}
          <Section number={n()} title="Cônjuge / companheiro(a)" show={isCasado && !!cad?.conjuge_nome_completo}>
            <div className="grid grid-cols-2 gap-x-8">
              <Field label="Nome completo" value={cad?.conjuge_nome_completo} ai={isAi("conjuge_nome_completo")} />
              <Field label="CPF" value={formatCPF(cad?.conjuge_cpf)} ai={isAi("conjuge_cpf")} />
              <Field label="RG" value={cad?.conjuge_rg} ai={isAi("conjuge_rg")} />
              <Field label="Órgão expedidor" value={cad?.conjuge_orgao_expedidor} ai={isAi("conjuge_orgao_expedidor")} />
              <Field label="Data de nascimento" value={formatDateBR(cad?.conjuge_data_nascimento)} ai={isAi("conjuge_data_nascimento")} />
              <Field label="Nacionalidade" value={cad?.conjuge_nacionalidade} ai={isAi("conjuge_nacionalidade")} />
              <Field label="Profissão" value={cad?.conjuge_profissao} ai={isAi("conjuge_profissao")} />
              <Field label="Nome da mãe" value={cad?.conjuge_nome_mae} ai={isAi("conjuge_nome_mae")} />
              <Field label="Nome do pai" value={cad?.conjuge_nome_pai} ai={isAi("conjuge_nome_pai")} />
              <Field label="E-mail" value={cad?.conjuge_email} ai={isAi("conjuge_email")} />
              <Field label="Telefone" value={formatPhoneBR(cad?.conjuge_telefone)} ai={isAi("conjuge_telefone")} />
            </div>
          </Section>

          {/* 4. Endereço */}
          <Section number={n()} title="Endereço residencial" show={hasEndereco}>
            <div className="grid grid-cols-2 gap-x-8">
              <Field label="CEP" value={formatCEP(cad?.endereco_cep)} ai={isAi("endereco_cep")} />
              <Field label="Logradouro" value={cad?.endereco_logradouro} ai={isAi("endereco_logradouro")} />
              <Field label="Número" value={cad?.endereco_numero} ai={isAi("endereco_numero")} />
              <Field label="Complemento" value={cad?.endereco_complemento} ai={isAi("endereco_complemento")} />
              <Field label="Bairro" value={cad?.endereco_bairro} ai={isAi("endereco_bairro")} />
              <Field label="Cidade" value={cad?.endereco_cidade} ai={isAi("endereco_cidade")} />
              <Field label="UF" value={cad?.endereco_estado} ai={isAi("endereco_estado")} />
              <Field label="Titular do comprovante" value={cad?.endereco_titular} ai={isAi("endereco_titular")} />
            </div>
          </Section>

          {/* 5. PJ */}
          <Section number={n()} title="Pessoa jurídica" show={!!cad?.pj_ativo}>
            <div className="grid grid-cols-2 gap-x-8">
              <Field label="Razão social" value={cad?.pj_razao_social} ai={isAi("pj_razao_social")} />
              <Field label="Nome fantasia" value={cad?.pj_nome_fantasia} ai={isAi("pj_nome_fantasia")} />
              <Field label="CNPJ" value={formatCNPJ(cad?.pj_cnpj)} ai={isAi("pj_cnpj")} />
              <Field label="Inscrição estadual" value={cad?.pj_inscricao_estadual} ai={isAi("pj_inscricao_estadual")} />
              <Field label="Endereço da sede" value={cad?.pj_endereco_sede} ai={isAi("pj_endereco_sede")} />
              <Field label="E-mail PJ" value={cad?.pj_email} ai={isAi("pj_email")} />
              <Field label="Telefone PJ" value={formatPhoneBR(cad?.pj_telefone)} ai={isAi("pj_telefone")} />
              <Field label="Representante legal" value={cad?.pj_representante_nome} ai={isAi("pj_representante_nome")} />
              <Field label="CPF do representante" value={formatCPF(cad?.pj_representante_cpf)} ai={isAi("pj_representante_cpf")} />
              <Field label="RG do representante" value={cad?.pj_representante_rg} ai={isAi("pj_representante_rg")} />
              <Field label="Cargo" value={cad?.pj_representante_cargo} ai={isAi("pj_representante_cargo")} />
              <Field label="Possui consolidação" value={cad?.pj_tem_consolidacao ? "Sim" : undefined} />
            </div>
          </Section>

          {/* 6. Observações cônjuge / PJ */}
          <Section number={n()} title="Observações do cadastro" show={!!(cad?.conjuge_observacoes || cad?.pj_observacoes)}>

            {cad?.conjuge_observacoes && (
              <div className="mb-3">
                <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500 font-semibold mb-1">Cônjuge</div>
                <p className="text-[13px] text-neutral-800 whitespace-pre-wrap leading-relaxed">{cad.conjuge_observacoes}</p>
              </div>
            )}
            {cad?.pj_observacoes && (
              <div>
                <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500 font-semibold mb-1">Pessoa jurídica</div>
                <p className="text-[13px] text-neutral-800 whitespace-pre-wrap leading-relaxed">{cad.pj_observacoes}</p>
              </div>
            )}
          </Section>

          {/* 7. Documentos */}
          <Section number={n()} title="Documentos enviados" show={docs.length > 0}>
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="text-[9px] uppercase tracking-[0.12em] text-neutral-500 border-y border-neutral-300 print-exact bg-neutral-50">
                  <th className="text-left py-2 px-2 font-semibold">Documento</th>
                  <th className="text-left py-2 px-2 font-semibold">Arquivo</th>
                  <th className="text-left py-2 px-2 font-semibold">Status</th>
                  <th className="text-left py-2 px-2 font-semibold">Recebido em</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d, i) => (
                  <tr key={i} className="border-b border-neutral-100">
                    <td className="py-2 px-2 text-neutral-900 font-medium">{d.document_type}</td>
                    <td className="py-2 px-2 text-neutral-600">{d.file_name || "—"}</td>
                    <td className="py-2 px-2">
                      <span
                        className={`print-exact inline-block text-[10px] px-2 py-0.5 font-medium ${
                          d.is_received
                            ? "bg-black text-white"
                            : "border border-neutral-400 text-neutral-700"
                        }`}
                      >
                        {d.is_received ? "Recebido" : "Pendente"}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-neutral-600">{formatDateTimeBR(d.received_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* 8. Observações internas (Comprador) */}
          <Section
            number={n()}
            title="Observações internas"
            show={!!cad?.observacoes}
          >
            <div className="p-4 border-l-[3px] border-black bg-neutral-50 print-exact">
              <p className="text-[13px] text-neutral-900 whitespace-pre-wrap leading-relaxed">
                {cad?.observacoes}
              </p>
            </div>
          </Section>
        </div>

        {/* TARJA PRETA INFERIOR */}
        <div className="print-exact bg-black text-white px-10 py-4 flex items-center justify-between text-[10px] uppercase tracking-[0.18em]">
          <span className="text-neutral-300">Enove CRM · Documento interno confidencial</span>
          <span className="text-neutral-400">Lead ID: {leadId?.slice(0, 8)}</span>
        </div>
      </div>
    </div>
  );
}
