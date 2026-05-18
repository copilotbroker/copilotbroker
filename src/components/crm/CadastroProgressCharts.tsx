import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { CadastroCompleto, CadastroDocument } from "@/hooks/use-lead-cadastro";

export interface CompletionReport {
  fields: { filled: number; total: number; missing: string[] };
  docs: { filled: number; total: number; missing: string[] };
}

export function computeCompletion(cad: CadastroCompleto | null, docs: CadastroDocument[]): CompletionReport {
  const c = cad ?? ({} as CadastroCompleto);
  const baseFields: { key: keyof CadastroCompleto; label: string }[] = [
    { key: "nome_completo", label: "Nome completo" },
    { key: "cpf", label: "CPF" },
    { key: "profissao", label: "Profissão" },
    { key: "nacionalidade", label: "Nacionalidade" },
    { key: "estado_civil", label: "Estado civil" },
    { key: "endereco_cep", label: "CEP" },
    { key: "endereco_logradouro", label: "Logradouro" },
    { key: "endereco_cidade", label: "Cidade" },
    { key: "endereco_estado", label: "UF" },
  ];
  const isMarried = c.estado_civil === "casado" || c.estado_civil === "uniao_estavel";
  const conjFields: { key: keyof CadastroCompleto; label: string }[] = isMarried ? [
    { key: "conjuge_nome_completo", label: "Nome do cônjuge" },
    { key: "conjuge_cpf", label: "CPF do cônjuge" },
    { key: "regime_bens", label: "Regime de bens" },
  ] : [];
  const pjFields: { key: keyof CadastroCompleto; label: string }[] = c.pj_ativo ? [
    { key: "pj_razao_social", label: "Razão social" },
    { key: "pj_cnpj", label: "CNPJ" },
    { key: "pj_representante_nome", label: "Representante legal" },
  ] : [];
  const all = [...baseFields, ...conjFields, ...pjFields];
  const missingFields = all.filter(f => !String((c as any)[f.key] ?? "").trim()).map(f => f.label);
  const filledFields = all.length - missingFields.length;

  const required: { type: string; label: string }[] = [
    { type: "documento_comprador", label: "Documento do comprador" },
    { type: "comprovante_estado_civil", label: "Comprovante de estado civil" },
    { type: "comprovante_residencia", label: "Comprovante de residência" },
  ];
  if (isMarried) required.push({ type: "documento_conjuge", label: "Documento do cônjuge" });
  if (c.pj_ativo) {
    required.push({ type: "cartao_cnpj", label: "Cartão CNPJ" });
    required.push({ type: "contrato_social", label: "Contrato Social" });
  }
  const have = new Set(docs.filter(d => d.is_active).map(d => d.document_type));
  const missingDocs = required.filter(r => !have.has(r.type)).map(r => r.label);
  const filledDocs = required.length - missingDocs.length;

  return {
    fields: { filled: filledFields, total: all.length, missing: missingFields },
    docs: { filled: filledDocs, total: required.length, missing: missingDocs },
  };
}

function Donut({ filled, total, label }: { filled: number; total: number; label: string }) {
  const pct = total === 0 ? 0 : Math.round((filled / total) * 100);
  const data = [
    { name: "ok", value: filled },
    { name: "missing", value: Math.max(0, total - filled) },
  ];
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={48} outerRadius={68} startAngle={90} endAngle={-270} stroke="none">
              <Cell fill="hsl(var(--primary))" />
              <Cell fill="#1e1e22" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-100">{pct}%</span>
          <span className="text-[10px] text-slate-500">{filled}/{total}</span>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-2">{label}</p>
    </div>
  );
}

export function CadastroProgressCharts({ report }: { report: CompletionReport }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0f0f12] border border-[#1e1e22] rounded-xl p-4">
          <Donut filled={report.docs.filled} total={report.docs.total} label="Documentos enviados" />
        </div>
        <div className="bg-[#0f0f12] border border-[#1e1e22] rounded-xl p-4">
          <Donut filled={report.fields.filled} total={report.fields.total} label="Campos preenchidos" />
        </div>
      </div>
      {(report.docs.missing.length > 0 || report.fields.missing.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {report.docs.missing.length > 0 && (
            <div className="bg-[#0f0f12] border border-amber-500/20 rounded-xl p-3">
              <p className="text-amber-300 font-medium mb-2">Documentos pendentes</p>
              <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                {report.docs.missing.map((m) => <li key={m}>{m}</li>)}
              </ul>
            </div>
          )}
          {report.fields.missing.length > 0 && (
            <div className="bg-[#0f0f12] border border-amber-500/20 rounded-xl p-3">
              <p className="text-amber-300 font-medium mb-2">Campos pendentes</p>
              <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                {report.fields.missing.map((m) => <li key={m}>{m}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
