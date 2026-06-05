import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { WhatsAppInput, isValidWhatsApp } from "@/components/ui/whatsapp-input";
import {
  trackLeadAttribution,
  getLeadOriginFromUTM,
  getLeadOriginDetailFromUTM,
} from "@/hooks/use-page-tracking";
import { LandingContent } from "@/types/project";
import { getPalette, getTypography } from "./styles/tokens";

interface Props {
  theme: LandingContent["theme"];
  projectId?: string | null;
  projectSlug?: string | null;
  brokerId?: string | null;
  brokerSlug?: string | null;
  allowBrokerSelection?: boolean;
  webhookUrl?: string | null;
}

const DEFAULT_WEBHOOK =
  "https://webhook.outoflow.online/webhook/622dff9d-d12f-4150-bf6f-b15908e8b205";

export default function LandingFormSection({
  theme,
  projectId,
  projectSlug,
  brokerId,
  brokerSlug,
  allowBrokerSelection = false,
  webhookUrl,
}: Props) {
  const p = getPalette(theme);
  const t = getTypography(theme);
  const serif = `"${t.display}", "Cormorant Garamond", serif`;
  const sans = `"${t.body}", "Inter", system-ui, sans-serif`;

  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", whatsapp: "" });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const whatsappInputRef = useRef<HTMLInputElement>(null);

  const [showBrokerSelect, setShowBrokerSelect] = useState(false);
  const [brokers, setBrokers] = useState<{ id: string; name: string }[]>([]);
  const [selectedBrokerId, setSelectedBrokerId] = useState("");
  const [loadingBrokers, setLoadingBrokers] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchBrokers = async () => {
    if (brokers.length > 0) return;
    setLoadingBrokers(true);
    try {
      const { data, error } = await supabase
        .from("brokers")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      setBrokers(data || []);
    } catch (e) {
      console.error("Erro ao buscar corretores:", e);
    } finally {
      setLoadingBrokers(false);
    }
  };

  const handleToggleBrokerSelect = () => {
    if (!showBrokerSelect) fetchBrokers();
    setShowBrokerSelect(!showBrokerSelect);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const domName = nameInputRef.current?.value ?? "";
    const domWhatsapp = whatsappInputRef.current?.value ?? "";
    const effectiveName = (formData.name || domName).trim();
    const effectiveWhatsappRaw =
      formData.whatsapp || domWhatsapp.replace(/\D/g, "");

    if (effectiveName !== formData.name.trim() || effectiveWhatsappRaw !== formData.whatsapp) {
      setFormData({ name: effectiveName, whatsapp: effectiveWhatsappRaw });
    }
    if (!effectiveName || !effectiveWhatsappRaw) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }
    if (!isValidWhatsApp(effectiveWhatsappRaw)) {
      toast.error("Por favor, insira um número de WhatsApp válido.");
      return;
    }
    if (!acceptedTerms) {
      toast.error("Você precisa aceitar os Termos de Uso e a Política de Privacidade.");
      return;
    }

    setIsSubmitting(true);
    try {
      const leadId = crypto.randomUUID();
      const leadData: any = {
        id: leadId,
        name: effectiveName,
        whatsapp: effectiveWhatsappRaw,
        source: brokerSlug || projectSlug || "enove",
        lead_origin: getLeadOriginFromUTM(),
        lead_origin_detail: getLeadOriginDetailFromUTM(),
      };
      if (projectId) leadData.project_id = projectId;
      if (brokerId) leadData.broker_id = brokerId;
      else if (selectedBrokerId) leadData.broker_id = selectedBrokerId;

      const { error } = await supabase.from("leads").insert(leadData);
      if (error) throw error;

      await trackLeadAttribution(leadId, projectId || undefined, "landing_page");
      supabase.rpc("unify_lead" as any, { _new_lead_id: leadId }).then(null, () => {});
      supabase.functions
        .invoke("auto-cadencia-10d", { body: { leadId } })
        .catch((err) => console.warn("Auto cadencia 10D falhou:", err));

      if (typeof window.gtag === "function") {
        window.gtag("event", "generate_lead", {
          event_category: "Lead",
          event_label: brokerSlug || "enove",
          value: 1,
        });
      }

      const targetWebhook = webhookUrl || DEFAULT_WEBHOOK;
      fetch(targetWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_completo: effectiveName,
          whatsapp: effectiveWhatsappRaw,
          broker_id: brokerId || selectedBrokerId || null,
          project_id: projectId || null,
          source: brokerSlug || projectSlug || "enove",
        }),
      }).catch((err) => console.error("Erro webhook:", err));

      supabase.functions
        .invoke("notify-new-lead", {
          body: {
            leadId,
            leadName: effectiveName,
            leadWhatsapp: effectiveWhatsappRaw,
            brokerId: brokerId || selectedBrokerId || null,
            projectId: projectId || null,
            source: brokerSlug || projectSlug || "Site Enove",
          },
        })
        .catch((err) => console.error("Erro notify-new-lead:", err));

      toast.success("Cadastro realizado com sucesso! Em breve entraremos em contato.");
      setFormData({ name: "", whatsapp: "" });
      setAcceptedTerms(false);
      setSelectedBrokerId("");
      setShowBrokerSelect(false);
    } catch (e) {
      console.error("Erro ao salvar lead:", e);
      toast.error("Ocorreu um erro ao salvar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.85rem 1rem",
    backgroundColor: `${p.surface}`,
    border: `1px solid ${p.border}`,
    borderRadius: 4,
    color: "#f3ede0",
    fontFamily: sans,
    fontSize: "1rem",
    outline: "none",
  };

  return (
    <section
      id="formulario"
      ref={sectionRef}
      className="dark py-20 md:py-28 relative overflow-hidden"
      style={{ backgroundColor: p.bg, color: "#d8cfb8", fontFamily: sans }}
      aria-labelledby="form-title"
    >
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, ${p.primary}30 0%, transparent 60%)` }}
      />
      <div className="container relative z-10 px-4">
        <div
          className={`max-w-xl mx-auto transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <header className="text-center mb-10">
            <h2
              id="form-title"
              className="mb-4"
              style={{
                fontFamily: serif,
                fontSize: "clamp(1.75rem, 4.5vw, 3rem)",
                color: "#f3ede0",
                lineHeight: 1.1,
              }}
            >
              Receba mais informações
            </h2>
            <p className="text-sm sm:text-base" style={{ color: p.muted }}>
              Cadastre-se e nosso corretor entrará em contato.
            </p>
          </header>

          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 md:p-10 space-y-5 sm:space-y-6 rounded-md"
            style={{
              backgroundColor: `${p.surface}cc`,
              border: `1px solid ${p.border}`,
              backdropFilter: "blur(8px)",
            }}
            aria-label="Formulário de cadastro"
          >
            <div>
              <label
                htmlFor="name-landing"
                className="block text-xs uppercase tracking-[0.18em] mb-2"
                style={{ color: p.primary, fontFamily: sans }}
              >
                Nome completo
              </label>
              <input
                ref={nameInputRef}
                type="text"
                id="name-landing"
                name="name"
                autoComplete="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
                placeholder="Seu nome"
                aria-required="true"
              />
            </div>

            <div>
              <label
                htmlFor="whatsapp-landing"
                className="block text-xs uppercase tracking-[0.18em] mb-2"
                style={{ color: p.primary, fontFamily: sans }}
              >
                WhatsApp
              </label>
              <WhatsAppInput
                ref={whatsappInputRef}
                id="whatsapp-landing"
                name="whatsapp"
                autoComplete="tel"
                value={formData.whatsapp}
                onChange={(val) => setFormData({ ...formData, whatsapp: val })}
                style={inputStyle as any}
                aria-required="true"
              />
            </div>

            {allowBrokerSelection && !brokerId && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleToggleBrokerSelect}
                  className="flex items-center gap-1.5 text-xs sm:text-sm transition-colors"
                  style={{ color: p.muted }}
                >
                  {showBrokerSelect ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  Já sou atendido por um corretor
                </button>
                {showBrokerSelect && (
                  <Select
                    value={selectedBrokerId || "none"}
                    onValueChange={(v) => setSelectedBrokerId(v === "none" ? "" : v)}
                  >
                    <SelectTrigger
                      className="w-full"
                      style={{
                        backgroundColor: p.surface,
                        border: `1px solid ${p.border}`,
                        color: "#f3ede0",
                      }}
                    >
                      <SelectValue placeholder="Nenhum / Não encontrei meu corretor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum / Não encontrei meu corretor</SelectItem>
                      {loadingBrokers ? (
                        <SelectItem value="loading" disabled>Carregando...</SelectItem>
                      ) : (
                        brokers.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="flex items-start gap-3">
              <Checkbox
                id="terms-landing"
                checked={acceptedTerms}
                onCheckedChange={(c) => setAcceptedTerms(c === true)}
                className="mt-0.5 min-w-[20px]"
                style={{ borderColor: p.primary }}
              />
              <label
                htmlFor="terms-landing"
                className="text-xs sm:text-sm leading-relaxed cursor-pointer"
                style={{ color: p.muted }}
              >
                Li e aceito os{" "}
                <a
                  href="/termos#termos-de-uso"
                  target="_blank"
                  rel="noopener"
                  className="underline underline-offset-2"
                  style={{ color: p.primary }}
                >
                  Termos de Uso
                </a>{" "}
                e a{" "}
                <a
                  href="/termos#politica-de-privacidade"
                  target="_blank"
                  rel="noopener"
                  className="underline underline-offset-2"
                  style={{ color: p.primary }}
                >
                  Política de Privacidade
                </a>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] rounded-sm transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, ${p.primary}, ${p.primary})`,
                color: p.primaryFg,
                boxShadow: `0 0 32px ${p.primary}55`,
                fontFamily: sans,
              }}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Quero mais informações"}
            </button>

            <p className="text-center text-xs" style={{ color: p.muted }}>
              Cadastro gratuito e sem compromisso
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
