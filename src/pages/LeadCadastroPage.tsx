import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import JSZip from "jszip";
import {
  ArrowLeft, ArrowRight, Check, Loader2, Printer, Save, Sparkles, ClipboardList,
  User, Heart, Users as UsersIcon, Home, Building2, CheckCircle2, AlertCircle,
  FileText, Download, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useLeadCadastro, type CadastroCompleto } from "@/hooks/use-lead-cadastro";
import { CadastroUploadField } from "@/components/crm/CadastroUploadField";
import { PhoneField, formatPhoneBR } from "@/components/crm/PhoneField";
import { computeCompletion } from "@/components/crm/CadastroProgressCharts";
import {
  formatCPF, formatCNPJ, formatCEP,
  isValidCPF, isValidCNPJ, isValidEmail, isValidPhone, isValidCEP,
} from "@/lib/br-validators";

const ESTADO_CIVIL_OPTIONS = [
  { value: "solteiro", label: "Solteiro(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "divorciado", label: "Divorciado(a)" },
  { value: "viuvo", label: "Viúvo(a)" },
  { value: "uniao_estavel", label: "União estável" },
  { value: "separado", label: "Separado(a)" },
  { value: "outro", label: "Outro" },
];
const REGIME_BENS_OPTIONS = [
  { value: "comunhao_parcial", label: "Comunhão parcial de bens" },
  { value: "comunhao_universal", label: "Comunhão universal de bens" },
  { value: "separacao_total", label: "Separação total de bens" },
  { value: "separacao_obrigatoria", label: "Separação obrigatória de bens" },
  { value: "outro", label: "Outro" },
];

type StepId = "comprador" | "estado_civil" | "conjuge" | "residencia" | "pj" | "revisao";

interface StepDef {
  id: StepId;
  title: string;
  subtitle: string;
  icon: typeof User;
}

function Field({
  label, value, onChange, type = "text", aiFilled, error, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; aiFilled?: boolean; error?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium text-slate-300">{label}</Label>
        {aiFilled && (
          <Badge variant="outline" className="text-[9px] border-[#FFFF00]/40 text-[#FFFF00] bg-[#FFFF00]/5">
            <Sparkles className="w-2.5 h-2.5 mr-0.5" /> IA · revisar
          </Badge>
        )}
      </div>
      <Input
        type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={cn(
          "bg-[#0f0f12] border-[#1e1e22] text-slate-100 h-11 sm:h-10 rounded-lg text-base sm:text-sm",
          "focus-visible:ring-[#FFFF00]/30 focus-visible:border-[#FFFF00]/40",
          error && "border-red-500/60 focus-visible:ring-red-500/30",
        )}
      />
      {error && <p className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }: { icon: typeof User; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-[#FFFF00]/10 border border-[#FFFF00]/20 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-[#FFFF00]" />
      </div>
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">{title}</h2>
        {description && <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

export default function LeadCadastroPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [leadMeta, setLeadMeta] = useState<{ name: string | null; whatsapp: string | null; email: string | null } | null>(null);

  const { data, docs, loading, saving, save, uploadDocument, extractWithAI, getSignedUrl, removeDocument, refetch } = useLeadCadastro(leadId ?? null);
  const [form, setForm] = useState<CadastroCompleto>({ lead_id: leadId ?? "" });
  const [aiFilled, setAiFilled] = useState<Set<string>>(new Set());

  // AI processing overlay
  const [aiProcessing, setAiProcessing] = useState<string | null>(null);

  // Dirty tracking for auto-save and exit-warning
  const dirtyRef = useRef(false);
  const [exitDialog, setExitDialog] = useState(false);
  const pendingNavRef = useRef<null | "back">(null);

  // Fetch lead basics
  useEffect(() => {
    if (!leadId) return;
    (async () => {
      const { data: l } = await supabase.from("leads").select("name, whatsapp, email").eq("id", leadId).maybeSingle();
      if (l) setLeadMeta({ name: l.name ?? null, whatsapp: l.whatsapp ?? null, email: (l as any).email ?? null });
    })();
  }, [leadId]);

  useEffect(() => {
    if (data) {
      setForm({
        ...data,
        telefone: data.telefone || leadMeta?.whatsapp || "",
        nome_completo: data.nome_completo || leadMeta?.name || "",
        email: data.email || leadMeta?.email || "",
      });
      setAiFilled(new Set(data.ai_filled_fields ?? []));
      dirtyRef.current = false;
    }
  }, [data, leadMeta]);

  const isMarried = form.estado_civil === "casado" || form.estado_civil === "uniao_estavel";
  const pjActive = !!form.pj_ativo;

  const set = <K extends keyof CadastroCompleto>(k: K, v: CadastroCompleto[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    setAiFilled((prev) => { const n = new Set(prev); n.delete(k as string); return n; });
    dirtyRef.current = true;
  };

  const applyAi = (mapping: Record<string, any>) => {
    const AI_OVERRIDE_FIELDS = new Set(["nome_completo"]);
    setForm((p) => {
      const next = { ...p };
      const added = new Set(aiFilled);
      for (const [k, v] of Object.entries(mapping)) {
        if (v == null || v === "") continue;
        if (AI_OVERRIDE_FIELDS.has(k) || !String((p as any)[k] ?? "").trim()) {
          (next as any)[k] = v;
          added.add(k);
        }
      }
      setAiFilled(added);
      return next;
    });
    dirtyRef.current = true;
    toast.info("IA preencheu campos — revise antes de salvar.");
  };

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (form.cpf && !isValidCPF(form.cpf)) e.cpf = "CPF inválido";
    if (form.conjuge_cpf && !isValidCPF(form.conjuge_cpf)) e.conjuge_cpf = "CPF inválido";
    if (form.pj_cnpj && !isValidCNPJ(form.pj_cnpj)) e.pj_cnpj = "CNPJ inválido";
    if (form.email && !isValidEmail(form.email)) e.email = "E-mail inválido";
    if (form.telefone && !isValidPhone(form.telefone)) e.telefone = "Telefone inválido";
    if (form.endereco_cep && !isValidCEP(form.endereco_cep)) e.endereco_cep = "CEP inválido";
    return e;
  }, [form]);

  const report = computeCompletion(form, docs);
  const fieldsPct = report.fields.total ? Math.round((report.fields.filled / report.fields.total) * 100) : 0;
  const docsPct = report.docs.total ? Math.round((report.docs.filled / report.docs.total) * 100) : 0;

  // Build active steps
  const steps = useMemo<StepDef[]>(() => {
    const base: StepDef[] = [
      { id: "comprador", title: "Comprador", subtitle: "Dados pessoais e documento", icon: User },
      { id: "estado_civil", title: "Estado civil", subtitle: "Situação e regime", icon: Heart },
    ];
    if (isMarried) base.push({ id: "conjuge", title: "Cônjuge", subtitle: "Dados do(a) parceiro(a)", icon: UsersIcon });
    base.push({ id: "residencia", title: "Residência", subtitle: "Endereço e comprovante", icon: Home });
    base.push({ id: "pj", title: "Pessoa Jurídica", subtitle: "Contrato em nome de empresa", icon: Building2 });
    base.push({ id: "revisao", title: "Revisão", subtitle: "Confira e finalize", icon: CheckCircle2 });
    return base;
  }, [isMarried]);

  const stepParam = (searchParams.get("step") as StepId | null) ?? "comprador";
  const currentIdx = Math.max(0, steps.findIndex(s => s.id === stepParam));
  const current = steps[currentIdx] ?? steps[0];

  const handleSave = useCallback(async (opts?: { silent?: boolean; thenNavigate?: boolean }) => {
    if (Object.keys(errors).length > 0) {
      toast.error("Corrija os campos inválidos antes de salvar");
      return false;
    }
    const ok = await save({ ...form, ai_filled_fields: Array.from(aiFilled) }, { silent: opts?.silent });
    if (!ok) return false;
    dirtyRef.current = false;
    const newName = form.nome_completo?.trim();
    if (newName && newName !== (leadMeta?.name ?? "").trim() && leadId) {
      const { error } = await supabase.from("leads").update({ name: newName }).eq("id", leadId);
      if (error) toast.error("Nome do lead não atualizado: " + error.message);
      else setLeadMeta((p) => p ? { ...p, name: newName } : p);
    }
    if (opts?.thenNavigate && leadId) navigate(`/corretor/lead/${leadId}`);
    return true;
  }, [errors, form, aiFilled, save, leadMeta, leadId, navigate]);

  const goToStep = useCallback(async (id: StepId) => {
    if (id === current.id) return;
    if (dirtyRef.current) {
      const ok = await handleSave({ silent: true });
      if (!ok) return;
    }
    setSearchParams((sp) => { const n = new URLSearchParams(sp); n.set("step", id); return n; }, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [current.id, handleSave, setSearchParams]);

  const goPrev = () => { if (currentIdx > 0) goToStep(steps[currentIdx - 1].id); };
  const goNext = () => { if (currentIdx < steps.length - 1) goToStep(steps[currentIdx + 1].id); };

  // Refresh files when entering Revisão
  useEffect(() => {
    if (current.id === "revisao") refetch();
  }, [current.id, refetch]);

  // Warn on tab close / reload
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const handleBack = () => {
    if (dirtyRef.current) {
      pendingNavRef.current = "back";
      setExitDialog(true);
    } else if (leadId) {
      navigate(`/corretor/lead/${leadId}`);
    }
  };

  const aiStart = (label: string) => setAiProcessing(label);
  const aiEnd = () => setAiProcessing(null);

  // Bulk download
  const [zipping, setZipping] = useState<{ i: number; n: number } | null>(null);
  const downloadAllDocs = async () => {
    const active = docs.filter(d => d.is_active && d.file_path);
    if (!active.length) { toast.error("Nenhum documento para baixar"); return; }
    const zip = new JSZip();
    setZipping({ i: 0, n: active.length });
    try {
      for (let i = 0; i < active.length; i++) {
        const d = active[i];
        setZipping({ i: i + 1, n: active.length });
        const url = await getSignedUrl(d.file_path!);
        if (!url) continue;
        const resp = await fetch(url);
        const blob = await resp.blob();
        const safeName = (d.file_name || `${d.document_type}-${d.id}`).replace(/[^\w.\-]+/g, "_");
        zip.file(`${d.document_type}/${safeName}`, blob);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      const cliente = (form.nome_completo || leadMeta?.name || "cliente").replace(/[^\w]+/g, "_").toLowerCase();
      a.href = url; a.download = `cadastro-${cliente}-${dateStr}.zip`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Documentos baixados");
    } catch (e: any) {
      toast.error("Erro ao gerar zip: " + (e?.message ?? ""));
    } finally {
      setZipping(null);
    }
  };



  if (!leadId) {
    return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-slate-400">Lead inválido</div>;
  }

  return (
    <>
      <Helmet>
        <title>Completar Cadastro {leadMeta?.name ? `· ${leadMeta.name}` : ""} | Enove</title>
      </Helmet>

      <div className="min-h-screen bg-[#0a0a0f] text-slate-100">
        {/* Header */}
        <header
          className="sticky top-0 z-30 bg-[#0a0a0f]/95 backdrop-blur border-b border-[#1e1e22]"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="max-w-6xl mx-auto pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:px-6 py-2.5 sm:py-3 flex items-center gap-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-white transition-colors p-1 -ml-1"
              aria-label="Voltar ao lead"
            >
              <ArrowLeft className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Voltar ao lead</span>
            </button>
            <div className="h-4 w-px bg-[#1e1e22]" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 hidden sm:block">Completar Cadastro</p>
              <h1 className="text-sm sm:text-base font-semibold text-white truncate">
                {leadMeta?.name ?? "Carregando..."}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm" onClick={() => handleSave()} disabled={saving}
                className="h-9 px-3 bg-[#FFFF00] text-black hover:bg-[#FFFF00]/90 font-semibold"
              >
                {saving ? <Loader2 className="w-4 h-4 sm:mr-1.5 animate-spin" /> : <Save className="w-4 h-4 sm:mr-1.5" />}
                <span className="hidden sm:inline">Salvar</span>
              </Button>
            </div>
          </div>
          {/* Mobile step indicator (dots + label) */}
          <div className="sm:hidden px-3 pb-2.5 -mt-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 shrink-0">
                {steps.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => goToStep(s.id)}
                    aria-label={`Ir para ${s.title}`}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === currentIdx ? "w-6 bg-[#FFFF00]" : i < currentIdx ? "w-1.5 bg-[#FFFF00]/50" : "w-1.5 bg-[#2a2a2e]",
                    )}
                  />
                ))}
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
                <current.icon className="w-3.5 h-3.5 text-[#FFFF00] shrink-0" />
                <span className="text-xs font-medium text-white truncate">{current.title}</span>
                <span className="text-[10px] text-slate-500 shrink-0">{currentIdx + 1}/{steps.length}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] sm:pb-[calc(env(safe-area-inset-bottom,0px)+6rem)]">
          {/* Hero — desktop only (mobile uses compact header indicator) */}
          <section className="mb-5 sm:mb-8 hidden sm:block">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFF00]/10 border border-[#FFFF00]/20 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#FFFF00]" />
              <span className="text-xs font-medium text-[#FFFF00]">Wizard inteligente</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Vamos completar o cadastro juntos
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Envie os documentos e deixe a IA preencher os campos automaticamente. Você revisa, ajusta e segue para o próximo passo.
            </p>
          </section>

          {/* Progress bars (compact on mobile) */}
          <section className="mb-5 sm:mb-8">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="bg-[#111114] border border-[#1e1e22] rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-[10px] sm:text-xs text-slate-400 truncate">Dados</span>
                  <span className="text-xs sm:text-sm font-semibold text-white">{fieldsPct}%</span>
                </div>
                <Progress value={fieldsPct} className="h-1.5 sm:h-2 bg-[#1e1e22]" />
                <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1 sm:mt-1.5">{report.fields.filled}/{report.fields.total} campos</p>
              </div>
              <div className="bg-[#111114] border border-[#1e1e22] rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-[10px] sm:text-xs text-slate-400 truncate">Arquivos</span>
                  <span className="text-xs sm:text-sm font-semibold text-white">{docsPct}%</span>
                </div>
                <Progress value={docsPct} className="h-1.5 sm:h-2 bg-[#1e1e22]" />
                <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1 sm:mt-1.5">{report.docs.filled}/{report.docs.total} docs</p>
              </div>
            </div>
          </section>

          {/* Stepper — desktop only; mobile uses header dots + jump select below */}
          <nav className="mb-6 hidden sm:block">
            <ol className="flex items-center gap-0">
              {steps.map((s, i) => {
                const active = i === currentIdx;
                const done = i < currentIdx;
                return (
                  <li key={s.id} className="flex items-center flex-auto">
                    <button
                      onClick={() => goToStep(s.id)}
                      className={cn(
                        "group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap",
                        active && "bg-[#FFFF00]/10 border border-[#FFFF00]/30",
                        !active && "border border-transparent hover:bg-[#111114]",
                      )}
                    >
                      <span className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                        active && "bg-[#FFFF00] text-black",
                        done && "bg-[#FFFF00]/20 text-[#FFFF00] border border-[#FFFF00]/40",
                        !active && !done && "bg-[#1a1a1e] text-slate-400 border border-[#2a2a2e]",
                      )}>
                        {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                      </span>
                      <span className={cn(
                        "text-sm font-medium",
                        active ? "text-white" : done ? "text-slate-300" : "text-slate-500",
                      )}>{s.title}</span>
                    </button>
                    {i < steps.length - 1 && (
                      <div className={cn("h-px flex-1 mx-2 min-w-4", done ? "bg-[#FFFF00]/40" : "bg-[#1e1e22]")} />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* Mobile: jump-to-step select */}
          <div className="sm:hidden mb-4">
            <Select value={current.id} onValueChange={(v) => goToStep(v as StepId)}>
              <SelectTrigger className="bg-[#111114] border-[#1e1e22] h-11 rounded-xl text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {steps.map((s, i) => (
                  <SelectItem key={s.id} value={s.id}>
                    {i + 1}. {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step content card */}
          <section className="relative bg-[#111114] border border-[#1e1e22] rounded-2xl p-4 sm:p-6 lg:p-8">
            {aiProcessing && (
              <div className="absolute inset-0 z-20 bg-[#111114]/85 backdrop-blur-sm rounded-2xl flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-[#0f0f12] border border-[#FFFF00]/30 rounded-xl p-5 shadow-2xl space-y-3">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-[#FFFF00] animate-pulse" />
                    <p className="text-sm font-semibold text-white">Lendo documento com IA…</p>
                  </div>
                  <p className="text-xs text-slate-400">
                    Estamos lendo <span className="text-slate-200 font-medium">{aiProcessing}</span> e
                    preenchendo os campos automaticamente. Isso leva alguns segundos.
                  </p>
                  <div className="relative h-1.5 bg-[#1e1e22] rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#FFFF00]/0 via-[#FFFF00] to-[#FFFF00]/0 animate-[shimmer_1.5s_infinite]" style={{ animation: "shimmer 1.4s linear infinite" }} />
                  </div>
                  <style>{`@keyframes shimmer { 0% { transform: translateX(-100%);} 100% { transform: translateX(400%);} }`}</style>
                </div>
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            ) : (
              <>
                {current.id === "comprador" && (
                  <div className="space-y-5">
                    <SectionHeader icon={User} title="Dados do comprador" description="Envie o documento (CNH, RG ou equivalente) e a IA preenche os campos." />
                    <CadastroUploadField
                      label="Documento do comprador (CNH, RG ou equivalente)"
                      documentType="documento_comprador" docs={docs}
                      onUpload={uploadDocument} onExtract={extractWithAI}
                      onExtracted={(d) => applyAi({
                        nome_completo: d.nome_completo, nacionalidade: d.nacionalidade,
                        cpf: d.cpf ? formatCPF(d.cpf) : "", rg: d.rg, orgao_expedidor: d.orgao_expedidor,
                        data_nascimento: d.data_nascimento, nome_mae: d.nome_mae, nome_pai: d.nome_pai,
                      })}
                      onDownload={getSignedUrl} onRemove={removeDocument} onAiStart={aiStart} onAiEnd={aiEnd}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Nome completo" value={form.nome_completo ?? ""} onChange={(v) => set("nome_completo", v)} aiFilled={aiFilled.has("nome_completo")} />
                      <Field label="Nacionalidade" value={form.nacionalidade ?? ""} onChange={(v) => set("nacionalidade", v)} aiFilled={aiFilled.has("nacionalidade")} />
                      <Field label="CPF" value={form.cpf ?? ""} onChange={(v) => set("cpf", formatCPF(v))} aiFilled={aiFilled.has("cpf")} error={errors.cpf} />
                      <Field label="RG" value={form.rg ?? ""} onChange={(v) => set("rg", v)} aiFilled={aiFilled.has("rg")} />
                      <Field label="Órgão expedidor" value={form.orgao_expedidor ?? ""} onChange={(v) => set("orgao_expedidor", v)} aiFilled={aiFilled.has("orgao_expedidor")} />
                      <Field label="Data de nascimento" type="date" value={form.data_nascimento ?? ""} onChange={(v) => set("data_nascimento", v)} aiFilled={aiFilled.has("data_nascimento")} />
                      <Field label="Nome da mãe" value={form.nome_mae ?? ""} onChange={(v) => set("nome_mae", v)} aiFilled={aiFilled.has("nome_mae")} />
                      <Field label="Nome do pai" value={form.nome_pai ?? ""} onChange={(v) => set("nome_pai", v)} aiFilled={aiFilled.has("nome_pai")} />
                      <Field label="Profissão" value={form.profissao ?? ""} onChange={(v) => set("profissao", v)} />
                      <Field label="E-mail" value={form.email ?? ""} onChange={(v) => set("email", v)} error={errors.email} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-300">Telefone</Label>
                      <div className="flex items-center gap-2 bg-[#0a0a0f] border border-[#1e1e22] rounded-lg h-11 sm:h-10 px-3 opacity-80">
                        <span className="flex-1 text-base sm:text-sm text-slate-300 truncate font-mono tracking-tight">
                          {formatPhoneBR(form.telefone ?? "") || "—"}
                        </span>
                        <span className="text-[10px] text-slate-500">somente leitura</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Para alterar o telefone, edite no cadastro do lead.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-300">Observações internas</Label>
                      <Textarea value={form.observacoes ?? ""} onChange={(e) => set("observacoes", e.target.value)}
                        className="bg-[#0f0f12] border-[#1e1e22] text-slate-100 rounded-lg text-base sm:text-sm" rows={3} />
                    </div>
                  </div>
                )}

                {current.id === "estado_civil" && (
                  <div className="space-y-5">
                    <SectionHeader icon={Heart} title="Estado civil" description="Envie a certidão ou escritura. A IA identifica regime e dados do cônjuge." />
                    <CadastroUploadField
                      label="Comprovante de estado civil (certidão, escritura, etc.)"
                      documentType="comprovante_estado_civil" docs={docs} multiple
                      onUpload={uploadDocument} onExtract={extractWithAI}
                      onExtracted={(d) => applyAi({
                        estado_civil: d.estado_civil, regime_bens: d.regime_bens,
                        conjuge_nome_completo: d.nome_conjuge, data_casamento_ou_uniao: d.data_casamento_ou_uniao,
                      })}
                      onDownload={getSignedUrl} onRemove={removeDocument} onAiStart={aiStart} onAiEnd={aiEnd}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-slate-300">Estado civil</Label>
                        <Select value={form.estado_civil ?? ""} onValueChange={(v) => set("estado_civil", v)}>
                          <SelectTrigger className="bg-[#0f0f12] border-[#1e1e22] h-11 sm:h-10 rounded-lg text-base sm:text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{ESTADO_CIVIL_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      {isMarried && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-slate-300">Regime de bens</Label>
                          <Select value={form.regime_bens ?? ""} onValueChange={(v) => set("regime_bens", v)}>
                            <SelectTrigger className="bg-[#0f0f12] border-[#1e1e22] h-11 sm:h-10 rounded-lg text-base sm:text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>{REGIME_BENS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      )}
                      {isMarried && (
                        <Field label="Data de casamento/união" type="date" value={form.data_casamento_ou_uniao ?? ""} onChange={(v) => set("data_casamento_ou_uniao", v)} aiFilled={aiFilled.has("data_casamento_ou_uniao")} />
                      )}
                    </div>
                  </div>
                )}

                {current.id === "conjuge" && isMarried && (
                  <div className="space-y-5">
                    <SectionHeader icon={UsersIcon} title="Dados do(a) cônjuge" description="Envie o documento do(a) parceiro(a) para preenchimento automático." />
                    <CadastroUploadField
                      label="Documento do cônjuge/companheiro(a)"
                      documentType="documento_conjuge" docs={docs}
                      onUpload={uploadDocument} onExtract={extractWithAI}
                      onExtracted={(d) => applyAi({
                        conjuge_nome_completo: d.nome_completo, conjuge_nacionalidade: d.nacionalidade,
                        conjuge_cpf: d.cpf ? formatCPF(d.cpf) : "", conjuge_rg: d.rg, conjuge_orgao_expedidor: d.orgao_expedidor,
                        conjuge_data_nascimento: d.data_nascimento, conjuge_nome_mae: d.nome_mae, conjuge_nome_pai: d.nome_pai,
                      })}
                      onDownload={getSignedUrl} onRemove={removeDocument} onAiStart={aiStart} onAiEnd={aiEnd}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Nome completo" value={form.conjuge_nome_completo ?? ""} onChange={(v) => set("conjuge_nome_completo", v)} aiFilled={aiFilled.has("conjuge_nome_completo")} />
                      <Field label="Nacionalidade" value={form.conjuge_nacionalidade ?? ""} onChange={(v) => set("conjuge_nacionalidade", v)} aiFilled={aiFilled.has("conjuge_nacionalidade")} />
                      <Field label="CPF" value={form.conjuge_cpf ?? ""} onChange={(v) => set("conjuge_cpf", formatCPF(v))} aiFilled={aiFilled.has("conjuge_cpf")} error={errors.conjuge_cpf} />
                      <Field label="RG" value={form.conjuge_rg ?? ""} onChange={(v) => set("conjuge_rg", v)} aiFilled={aiFilled.has("conjuge_rg")} />
                      <Field label="Órgão expedidor" value={form.conjuge_orgao_expedidor ?? ""} onChange={(v) => set("conjuge_orgao_expedidor", v)} aiFilled={aiFilled.has("conjuge_orgao_expedidor")} />
                      <Field label="Data de nascimento" type="date" value={form.conjuge_data_nascimento ?? ""} onChange={(v) => set("conjuge_data_nascimento", v)} aiFilled={aiFilled.has("conjuge_data_nascimento")} />
                      <Field label="Profissão" value={form.conjuge_profissao ?? ""} onChange={(v) => set("conjuge_profissao", v)} />
                      <Field label="E-mail" value={form.conjuge_email ?? ""} onChange={(v) => set("conjuge_email", v)} />
                    </div>
                    <PhoneField label="Telefone" value={form.conjuge_telefone ?? ""} onChange={(v) => set("conjuge_telefone", v)} />
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-300">Observações</Label>
                      <Textarea value={form.conjuge_observacoes ?? ""} onChange={(e) => set("conjuge_observacoes", e.target.value)}
                        className="bg-[#0f0f12] border-[#1e1e22] text-slate-100 rounded-lg text-base sm:text-sm" rows={3} />
                    </div>
                  </div>
                )}

                {current.id === "residencia" && (
                  <div className="space-y-5">
                    <SectionHeader icon={Home} title="Endereço residencial" description="Envie o comprovante de residência atualizado." />
                    <CadastroUploadField
                      label="Comprovante de residência"
                      documentType="comprovante_residencia" docs={docs}
                      onUpload={uploadDocument} onExtract={extractWithAI}
                      onExtracted={(d) => applyAi({
                        endereco_cep: d.cep ? formatCEP(d.cep) : "", endereco_logradouro: d.logradouro,
                        endereco_numero: d.numero, endereco_complemento: d.complemento,
                        endereco_bairro: d.bairro, endereco_cidade: d.cidade, endereco_estado: d.estado,
                        endereco_titular: d.titular_comprovante,
                      })}
                      onDownload={getSignedUrl} onRemove={removeDocument} onAiStart={aiStart} onAiEnd={aiEnd}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Field label="CEP" value={form.endereco_cep ?? ""} onChange={(v) => set("endereco_cep", formatCEP(v))} aiFilled={aiFilled.has("endereco_cep")} error={errors.endereco_cep} />
                      <div className="sm:col-span-2">
                        <Field label="Logradouro" value={form.endereco_logradouro ?? ""} onChange={(v) => set("endereco_logradouro", v)} aiFilled={aiFilled.has("endereco_logradouro")} />
                      </div>
                      <Field label="Número" value={form.endereco_numero ?? ""} onChange={(v) => set("endereco_numero", v)} aiFilled={aiFilled.has("endereco_numero")} />
                      <Field label="Complemento" value={form.endereco_complemento ?? ""} onChange={(v) => set("endereco_complemento", v)} aiFilled={aiFilled.has("endereco_complemento")} />
                      <Field label="Bairro" value={form.endereco_bairro ?? ""} onChange={(v) => set("endereco_bairro", v)} aiFilled={aiFilled.has("endereco_bairro")} />
                      <Field label="Cidade" value={form.endereco_cidade ?? ""} onChange={(v) => set("endereco_cidade", v)} aiFilled={aiFilled.has("endereco_cidade")} />
                      <Field label="UF" value={form.endereco_estado ?? ""} onChange={(v) => set("endereco_estado", v.toUpperCase().slice(0, 2))} aiFilled={aiFilled.has("endereco_estado")} />
                      <Field label="Titular do comprovante" value={form.endereco_titular ?? ""} onChange={(v) => set("endereco_titular", v)} aiFilled={aiFilled.has("endereco_titular")} />
                    </div>
                  </div>
                )}

                {current.id === "pj" && (
                  <div className="space-y-5">
                    <SectionHeader icon={Building2} title="Pessoa Jurídica" description="Se o contrato será em nome de uma empresa, ative e envie os documentos." />
                    <div className="flex items-center justify-between bg-[#0f0f12] border border-[#1e1e22] rounded-xl p-4">
                      <div>
                        <p className="text-sm text-slate-200 font-medium">Contrato será feito em Pessoa Jurídica?</p>
                        <p className="text-xs text-slate-500">Ative para exibir campos e documentos da PJ.</p>
                      </div>
                      <Switch checked={pjActive} onCheckedChange={(v) => set("pj_ativo", v)} />
                    </div>
                    {pjActive && (
                      <>
                        <CadastroUploadField
                          label="Cartão CNPJ"
                          documentType="cartao_cnpj" docs={docs}
                          onUpload={uploadDocument} onExtract={extractWithAI}
                          onExtracted={(d) => applyAi({
                            pj_razao_social: d.razao_social, pj_nome_fantasia: d.nome_fantasia,
                            pj_cnpj: d.cnpj ? formatCNPJ(d.cnpj) : "", pj_inscricao_estadual: d.inscricao_estadual,
                            pj_endereco_sede: d.endereco_sede,
                            pj_representante_nome: d.representantes_legais?.[0]?.nome,
                            pj_representante_cpf: d.representantes_legais?.[0]?.cpf ? formatCPF(d.representantes_legais[0].cpf) : "",
                            pj_representante_rg: d.representantes_legais?.[0]?.rg,
                            pj_representante_cargo: d.representantes_legais?.[0]?.cargo,
                          })}
                          onDownload={getSignedUrl} onRemove={removeDocument} onAiStart={aiStart} onAiEnd={aiEnd}
                        />
                        <CadastroUploadField label="Contrato Social" documentType="contrato_social" docs={docs}
                          onUpload={uploadDocument} onExtract={extractWithAI}
                          onExtracted={(d) => applyAi({
                            pj_razao_social: d.razao_social,
                            pj_representante_nome: d.representantes_legais?.[0]?.nome,
                          })}
                          onDownload={getSignedUrl} onRemove={removeDocument} onAiStart={aiStart} onAiEnd={aiEnd} />
                        <div className="flex items-center justify-between bg-[#0f0f12] border border-[#1e1e22] rounded-xl p-3">
                          <Label className="text-xs text-slate-300">Existe consolidação contratual?</Label>
                          <Switch checked={!!form.pj_tem_consolidacao} onCheckedChange={(v) => set("pj_tem_consolidacao", v)} />
                        </div>
                        {form.pj_tem_consolidacao ? (
                          <CadastroUploadField label="Consolidação do contrato social" documentType="consolidacao_contratual" docs={docs}
                            onUpload={uploadDocument} onExtract={extractWithAI} onExtracted={() => {}}
                            onDownload={getSignedUrl} onRemove={removeDocument} onAiStart={aiStart} onAiEnd={aiEnd} />
                        ) : (
                          <CadastroUploadField label="Alterações contratuais (envie todas as arquivadas na Junta Comercial)"
                            documentType="alteracao_contratual" docs={docs} multiple
                            onUpload={uploadDocument} onExtract={extractWithAI} onExtracted={() => {}}
                            onDownload={getSignedUrl} onRemove={removeDocument} onAiStart={aiStart} onAiEnd={aiEnd} />
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Field label="Razão social" value={form.pj_razao_social ?? ""} onChange={(v) => set("pj_razao_social", v)} aiFilled={aiFilled.has("pj_razao_social")} />
                          <Field label="Nome fantasia" value={form.pj_nome_fantasia ?? ""} onChange={(v) => set("pj_nome_fantasia", v)} aiFilled={aiFilled.has("pj_nome_fantasia")} />
                          <Field label="CNPJ" value={form.pj_cnpj ?? ""} onChange={(v) => set("pj_cnpj", formatCNPJ(v))} aiFilled={aiFilled.has("pj_cnpj")} error={errors.pj_cnpj} />
                          <Field label="Inscrição estadual" value={form.pj_inscricao_estadual ?? ""} onChange={(v) => set("pj_inscricao_estadual", v)} aiFilled={aiFilled.has("pj_inscricao_estadual")} />
                          <div className="sm:col-span-2">
                            <Field label="Endereço da sede" value={form.pj_endereco_sede ?? ""} onChange={(v) => set("pj_endereco_sede", v)} aiFilled={aiFilled.has("pj_endereco_sede")} />
                          </div>
                          <Field label="Representante legal" value={form.pj_representante_nome ?? ""} onChange={(v) => set("pj_representante_nome", v)} aiFilled={aiFilled.has("pj_representante_nome")} />
                          <Field label="CPF do representante" value={form.pj_representante_cpf ?? ""} onChange={(v) => set("pj_representante_cpf", formatCPF(v))} aiFilled={aiFilled.has("pj_representante_cpf")} />
                          <Field label="RG do representante" value={form.pj_representante_rg ?? ""} onChange={(v) => set("pj_representante_rg", v)} aiFilled={aiFilled.has("pj_representante_rg")} />
                          <Field label="Cargo do representante" value={form.pj_representante_cargo ?? ""} onChange={(v) => set("pj_representante_cargo", v)} aiFilled={aiFilled.has("pj_representante_cargo")} />
                          <Field label="E-mail" value={form.pj_email ?? ""} onChange={(v) => set("pj_email", v)} />
                        </div>
                        <PhoneField label="Telefone" value={form.pj_telefone ?? ""} onChange={(v) => set("pj_telefone", v)} />
                      </>
                    )}
                  </div>
                )}

                {current.id === "revisao" && (
                  <div className="space-y-5">
                    <SectionHeader icon={CheckCircle2} title="Revisão final" description="Confira o que falta e finalize o cadastro." />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={cn(
                        "rounded-xl border p-4",
                        report.docs.missing.length === 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20",
                      )}>
                        <div className="flex items-center gap-2 mb-3">
                          {report.docs.missing.length === 0 ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                          )}
                          <p className="text-sm font-semibold text-white">
                            Documentos {report.docs.filled}/{report.docs.total}
                          </p>
                        </div>
                        {report.docs.missing.length === 0 ? (
                          <p className="text-xs text-emerald-300/80">Todos os documentos foram enviados.</p>
                        ) : (
                          <ul className="space-y-1 text-xs text-slate-300">
                            {report.docs.missing.map((m) => <li key={m} className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-amber-400" />{m}</li>)}
                          </ul>
                        )}
                      </div>
                      <div className={cn(
                        "rounded-xl border p-4",
                        report.fields.missing.length === 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20",
                      )}>
                        <div className="flex items-center gap-2 mb-3">
                          {report.fields.missing.length === 0 ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                          )}
                          <p className="text-sm font-semibold text-white">
                            Campos {report.fields.filled}/{report.fields.total}
                          </p>
                        </div>
                        {report.fields.missing.length === 0 ? (
                          <p className="text-xs text-emerald-300/80">Todos os campos obrigatórios preenchidos.</p>
                        ) : (
                          <ul className="space-y-1 text-xs text-slate-300">
                            {report.fields.missing.map((m) => <li key={m} className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-amber-400" />{m}</li>)}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#0f0f12] border border-[#1e1e22] rounded-xl p-4 sm:p-5">
                      <div className="flex items-start gap-3 mb-4">
                        <Printer className="w-5 h-5 text-[#FFFF00] shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">Impressão de documentos</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Gere a ficha completa do cliente ou a declaração Ábaco para impressão e assinatura.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => window.open(`/corretor/lead/${leadId}/ficha`, "_blank")}
                          className="flex-1 border-[#2a2a2e] bg-[#1a1a1e] text-slate-200 hover:bg-[#22222a]">
                          <Printer className="w-4 h-4 mr-1.5" /> Imprimir ficha do cliente
                        </Button>
                        <Button variant="outline" onClick={() => window.open(`/corretor/lead/${leadId}/declaracao`, "_blank")}
                          className="flex-1 border-[#2a2a2e] bg-[#1a1a1e] text-slate-200 hover:bg-[#22222a]">
                          <Printer className="w-4 h-4 mr-1.5" /> Imprimir declaração
                        </Button>
                      </div>
                    </div>

                    {/* Lista de documentos enviados */}
                    <div className="bg-[#0f0f12] border border-[#1e1e22] rounded-xl p-4 sm:p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <FileText className="w-5 h-5 text-[#FFFF00] shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">Documentos enviados ({docs.filter(d => d.is_active).length})</p>
                          <p className="text-xs text-slate-400 mt-1">Todos os arquivos enviados durante o cadastro.</p>
                        </div>
                      </div>
                      {docs.filter(d => d.is_active).length === 0 ? (
                        <p className="text-xs text-slate-500">Nenhum documento enviado.</p>
                      ) : (
                        <ul className="space-y-1.5 mb-3">
                          {docs.filter(d => d.is_active).map((d) => (
                            <li key={d.id} className="flex items-center gap-2 text-xs bg-[#111114] rounded-lg px-3 py-2 border border-[#1e1e22]">
                              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-200 truncate">{d.file_name ?? d.id}</p>
                                <p className="text-[10px] text-slate-500">{d.document_type}</p>
                              </div>
                              <button
                                title="Baixar"
                                className="text-slate-400 hover:text-white p-1"
                                onClick={async () => {
                                  if (!d.file_path) return;
                                  const url = await getSignedUrl(d.file_path);
                                  if (url) window.open(url, "_blank");
                                }}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <Button onClick={downloadAllDocs} disabled={!!zipping || docs.filter(d => d.is_active).length === 0}
                        variant="outline" className="w-full border-[#2a2a2e] bg-[#1a1a1e] text-slate-200 hover:bg-[#22222a]">
                        {zipping ? (
                          <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Compactando {zipping.i}/{zipping.n}…</>
                        ) : (
                          <><Package className="w-4 h-4 mr-1.5" /> Baixar todos os documentos (.zip)</>
                        )}
                      </Button>
                    </div>

                  </div>
                )}
              </>
            )}
          </section>

          {/* Desktop footer nav (inline) */}
          {!loading && (
            <div className="mt-5 hidden sm:flex items-center justify-between gap-3">
              <Button
                variant="outline" onClick={goPrev} disabled={currentIdx === 0}
                className="border-[#2a2a2e] bg-[#1a1a1e] text-slate-200 hover:bg-[#22222a] disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Anterior
              </Button>
              <p className="text-xs text-slate-500">
                Passo {currentIdx + 1} de {steps.length} · {current.subtitle}
              </p>
              {currentIdx < steps.length - 1 ? (
                <Button onClick={goNext} className="bg-[#FFFF00] text-black hover:bg-[#FFFF00]/90 font-semibold">
                  Continuar <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              ) : (
                <Button onClick={() => handleSave({ thenNavigate: true })} disabled={saving}
                  className="bg-[#FFFF00] text-black hover:bg-[#FFFF00]/90 font-semibold">
                  {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
                  Finalizar
                </Button>
              )}
            </div>
          )}
        </main>

        {/* Mobile fixed bottom action bar (thumb reach) */}
        {!loading && (
          <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-[#0a0a0f]/95 backdrop-blur border-t border-[#1e1e22] pt-2.5 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[calc(env(safe-area-inset-bottom,0px)+0.625rem)]">
            <div className="flex items-center gap-2">
              <Button
                variant="outline" onClick={goPrev} disabled={currentIdx === 0}
                className="h-11 px-3 border-[#2a2a2e] bg-[#1a1a1e] text-slate-200 hover:bg-[#22222a] disabled:opacity-40 shrink-0"
                aria-label="Anterior"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              {currentIdx < steps.length - 1 ? (
                <Button onClick={goNext} className="flex-1 h-11 bg-[#FFFF00] text-black hover:bg-[#FFFF00]/90 font-semibold text-sm">
                  Continuar <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              ) : (
                <Button onClick={() => handleSave({ thenNavigate: true })} disabled={saving}
                  className="flex-1 h-11 bg-[#FFFF00] text-black hover:bg-[#FFFF00]/90 font-semibold text-sm">
                  {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
                  Finalizar cadastro
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={exitDialog} onOpenChange={setExitDialog}>
        <AlertDialogContent className="bg-[#111114] border-[#1e1e22] text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Há campos preenchidos que ainda não foram salvos. O que deseja fazer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="bg-[#1a1a1e] border-[#2a2a2e] text-slate-200 hover:bg-[#22222a]">
              Continuar editando
            </AlertDialogCancel>
            <Button variant="outline" className="border-[#2a2a2e] bg-[#1a1a1e] text-slate-200 hover:bg-[#22222a]"
              onClick={() => { setExitDialog(false); if (leadId) navigate(`/corretor/lead/${leadId}`); }}>
              Sair sem salvar
            </Button>
            <AlertDialogAction asChild>
              <Button className="bg-[#FFFF00] text-black hover:bg-[#FFFF00]/90 font-semibold"
                onClick={async () => { setExitDialog(false); await handleSave({ thenNavigate: true }); }}>
                Salvar e sair
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

