import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WhatsAppInput, isValidWhatsApp } from "@/components/ui/whatsapp-input";
import { trackLeadAttribution, getLeadOriginFromUTM, getLeadOriginDetailFromUTM } from "@/hooks/use-page-tracking";

interface NAUFormSectionProps {
  projectId: string;
  brokerId?: string | null;
  brokerSlug?: string | null;
  webhookUrl?: string | null;
  allowBrokerSelection?: boolean;
  submitted?: boolean;
}

const NAUFormSection = ({
  projectId,
  brokerId,
  brokerSlug,
  webhookUrl,
  allowBrokerSelection = true,
  submitted = false,
}: NAUFormSectionProps) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", whatsapp: "" });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const [showBrokerSelect, setShowBrokerSelect] = useState(false);
  const [brokers, setBrokers] = useState<{ id: string; name: string }[]>([]);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("");
  const [loadingBrokers, setLoadingBrokers] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
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
        .from("broker_projects")
        .select("broker:brokers(id, name)")
        .eq("project_id", projectId)
        .eq("is_active", true);
      if (error) throw error;
      const activeBrokers = data
        ?.map((bp) => bp.broker)
        .filter((b): b is { id: string; name: string } => b !== null)
        .sort((a, b) => a.name.localeCompare(b.name)) || [];
      setBrokers(activeBrokers);
    } catch (error) {
      console.error("Erro ao buscar corretores:", error);
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
    if (!formData.name.trim() || !formData.whatsapp.trim()) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }
    if (!isValidWhatsApp(formData.whatsapp)) {
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
        name: formData.name.trim(),
        whatsapp: formData.whatsapp.trim(),
        project_id: projectId,
        source: brokerSlug ? `nau/${brokerSlug}` : "nau",
        lead_origin: getLeadOriginFromUTM(),
        lead_origin_detail: getLeadOriginDetailFromUTM(),
      };

      if (brokerId) leadData.broker_id = brokerId;
      else if (selectedBrokerId) leadData.broker_id = selectedBrokerId;

      const { error } = await supabase.from("leads").insert(leadData);
      if (error) throw error;

      await trackLeadAttribution(leadId, projectId, "landing_page");
      supabase.rpc("unify_lead" as any, { _new_lead_id: leadId }).then(null, () => {});
      
      supabase.functions.invoke("auto-first-message", { body: { leadId } }).catch(console.warn);
      supabase.functions.invoke("auto-cadencia-10d", { body: { leadId } }).catch(console.warn);

      if (webhookUrl) {
        fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome_completo: formData.name.trim(),
            whatsapp: formData.whatsapp.trim(),
            broker_id: brokerId || selectedBrokerId || null,
            project_id: projectId,
            source: brokerSlug ? `nau/${brokerSlug}` : "nau",
          }),
        }).catch(console.error);
      }

      supabase.functions.invoke("notify-new-lead", {
        body: {
          leadId,
          leadName: formData.name.trim(),
          leadWhatsapp: formData.whatsapp.trim(),
          brokerId: brokerId || selectedBrokerId || null,
          projectId,
          source: brokerSlug ? `NAU/${brokerSlug}` : "NAU",
        },
      }).catch(console.error);

      toast.success("Cadastro realizado com sucesso! Em breve entraremos em contato.");
      setFormData({ name: "", whatsapp: "" });
      setAcceptedTerms(false);
      setSelectedBrokerId("");
      setShowBrokerSelect(false);
      navigate("/osorio/nau/obrigado");
    } catch (error) {
      console.error("Erro ao salvar lead:", error);
      toast.error("Ocorreu um erro ao salvar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="cadastro"
      ref={sectionRef}
      className="py-20 md:py-32 bg-[hsl(210,35%,8%)] relative overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[hsl(24,70%,42%)]/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className={`max-w-xl mx-auto transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white">
              GARANTA SEU{" "}
              <span className="text-[hsl(24,70%,50%)]">LOTE AGORA</span>
            </h2>
            <p className="text-white/60">
              Cadastre-se para receber mais informações e consultar os últimos lotes disponíveis.
            </p>
          </div>

          {submitted ? (
            <div className="p-8 md:p-10 flex flex-col items-center justify-center text-center space-y-4 min-h-[200px] rounded-lg bg-[hsl(210,35%,10%)] border border-[hsl(24,70%,42%)]/20">
              <h3 className="font-serif text-2xl md:text-3xl font-bold text-white">
                Parabéns! Você está na{" "}
                <span className="text-[hsl(24,70%,50%)]">lista prioritária!</span>
              </h3>
              <p className="text-white/60">Em breve entraremos em contato pelo WhatsApp.</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="p-8 md:p-10 space-y-6 rounded-lg bg-[hsl(210,35%,10%)] border border-[hsl(24,70%,42%)]/20"
            >
              <div>
                <label htmlFor="nau-name" className="block text-sm font-medium text-white/80 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="nau-name"
                  name="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3.5 bg-[hsl(210,35%,8%)] border border-[hsl(24,70%,42%)]/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[hsl(24,70%,42%)]/50 focus:border-[hsl(24,70%,42%)] transition-all"
                  placeholder="Digite seu nome completo"
                />
              </div>

              <div>
                <label htmlFor="nau-whatsapp" className="block text-sm font-medium text-white/80 mb-2">
                  WhatsApp
                </label>
                <WhatsAppInput
                  id="nau-whatsapp"
                  name="whatsapp"
                  autoComplete="tel"
                  value={formData.whatsapp}
                  onChange={(val) => setFormData({ ...formData, whatsapp: val })}
                  className="py-3.5 bg-[hsl(210,35%,8%)] border-[hsl(24,70%,42%)]/20 text-white placeholder:text-white/40 focus:ring-2 focus:ring-[hsl(24,70%,42%)]/50 focus:border-[hsl(24,70%,42%)]"
                />
              </div>

              {allowBrokerSelection && !brokerId && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleToggleBrokerSelect}
                    className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors whitespace-nowrap"
                  >
                    {showBrokerSelect ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    Já sou atendido por um corretor
                  </button>
                  {showBrokerSelect && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <Select
                        value={selectedBrokerId || "none"}
                        onValueChange={(value) => setSelectedBrokerId(value === "none" ? "" : value)}
                      >
                        <SelectTrigger className="w-full bg-[hsl(210,35%,8%)] border-[hsl(24,70%,42%)]/20 text-white/60">
                          <SelectValue placeholder="Nenhum / Não encontrei meu corretor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum / Não encontrei meu corretor</SelectItem>
                          {loadingBrokers ? (
                            <SelectItem value="loading" disabled>Carregando...</SelectItem>
                          ) : (
                            brokers.map((broker) => (
                              <SelectItem key={broker.id} value={broker.id}>{broker.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-start gap-3">
                <Checkbox
                  id="nau-terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="nau-terms" className="text-sm text-white/70 leading-relaxed cursor-pointer">
                  Li e aceito os{" "}
                  <Link
                    to="/osorio/nau/termos#termos-de-uso"
                    target="_blank"
                    className="text-[hsl(24,70%,50%)] hover:text-[hsl(24,70%,40%)] underline underline-offset-2"
                  >
                    Termos de Uso
                  </Link>{" "}
                  e a{" "}
                  <Link
                    to="/osorio/nau/termos#politica-de-privacidade"
                    target="_blank"
                    className="text-[hsl(24,70%,50%)] hover:text-[hsl(24,70%,40%)] underline underline-offset-2"
                  >
                    Política de Privacidade
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-4 bg-[hsl(24,70%,42%)] hover:bg-[hsl(24,70%,36%)] text-white font-semibold uppercase tracking-[0.15em] text-sm transition-all duration-300 rounded disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  "Quero Garantir Meu Lote"
                )}
              </button>

              <p className="text-center text-sm text-white/50">Cadastro gratuito e sem compromisso</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default NAUFormSection;
