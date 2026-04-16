import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Loader2, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppInput, isValidBrazilianWhatsApp } from "@/components/ui/whatsapp-input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { getLeadOriginFromUTM, getLeadOriginDetailFromUTM } from "@/hooks/use-page-tracking";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ALFormSectionProps {
  projectId?: string;
  brokerId?: string;
  submitted?: boolean;
  allowBrokerSelection?: boolean;
}

const ALFormSection = ({ projectId, brokerId, submitted, allowBrokerSelection = true }: ALFormSectionProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (brokers.length > 0 || !projectId) return;
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
    if (!name.trim()) {
      toast({ title: "Nome obrigatório", description: "Por favor, informe seu nome.", variant: "destructive" });
      return;
    }
    if (!isValidBrazilianWhatsApp(whatsapp)) {
      toast({ title: "WhatsApp inválido", description: "Por favor, informe um número válido com DDD.", variant: "destructive" });
      return;
    }
    if (!acceptedTerms) {
      toast({ title: "Termos não aceitos", description: "Você precisa aceitar os termos para continuar.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const leadId = crypto.randomUUID();
      const { error } = await supabase.from("leads").insert({
        id: leadId,
        name: name.trim(),
        whatsapp,
        project_id: projectId || null,
        broker_id: brokerId || selectedBrokerId || null,
        source: brokerId ? "broker_landing" : "landing_page",
        lead_origin: getLeadOriginFromUTM(),
        lead_origin_detail: getLeadOriginDetailFromUTM(),
      });
      if (error) throw error;

      await supabase.from("lead_attribution").insert({
        lead_id: leadId,
        project_id: projectId || null,
        landing_page: "landing_page",
        referrer: document.referrer || null,
        utm_source: new URLSearchParams(window.location.search).get("utm_source"),
        utm_medium: new URLSearchParams(window.location.search).get("utm_medium"),
        utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
      });

      supabase.rpc("unify_lead" as any, { _new_lead_id: leadId }).then(null, () => {});
      supabase.functions.invoke("auto-cadencia-10d", { body: { leadId } }).catch(console.warn);

      const eventId = crypto.randomUUID();
      if (typeof window !== "undefined" && window.fbq) {
        (window.fbq as Function)("track", "Lead", {}, { eventID: eventId });
      }

      const basePath = location.pathname.replace(/\/obrigado$/, "").replace(/\/+$/, "");
      navigate(`${basePath}/obrigado`, { replace: true });
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast({ title: "Erro ao cadastrar", description: "Por favor, tente novamente em alguns instantes.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="cadastro" ref={sectionRef} className="py-20 md:py-32 bg-card relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className={`max-w-xl mx-auto transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              QUERO GARANTIR{" "}
              <span className="text-gold-gradient">MEU LOTE</span>
            </h2>
            <p className="text-muted-foreground">Receba tabela atualizada, condições e simulação personalizada.</p>
          </div>

          {submitted ? (
            <div className="card-luxury p-8 md:p-10 flex flex-col items-center justify-center text-center space-y-4 min-h-[200px]">
              <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 text-primary" />
              <h3 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                Parabéns, sua reserva de interesse foi{" "}
                <span className="text-gold-gradient">registrada!</span>
              </h3>
              <p className="text-muted-foreground">Em breve entraremos em contato pelo WhatsApp com tabela e condições.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card-luxury p-8 md:p-10 space-y-6">
              <div>
                <label htmlFor="al-name" className="block text-sm font-medium text-foreground/80 mb-2">Nome Completo</label>
                <input
                  type="text"
                  id="al-name"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="Digite seu nome completo"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="al-whatsapp" className="block text-sm font-medium text-foreground/80 mb-2">WhatsApp</label>
                <WhatsAppInput
                  id="al-whatsapp"
                  name="whatsapp"
                  autoComplete="tel"
                  value={whatsapp}
                  onChange={setWhatsapp}
                  className="py-3.5 bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  disabled={isSubmitting}
                />
              </div>

              {allowBrokerSelection && !brokerId && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleToggleBrokerSelect}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
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
                        <SelectTrigger className="w-full bg-background border-border text-muted-foreground">
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
                  id="al-terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  className="mt-0.5"
                  disabled={isSubmitting}
                />
                <label htmlFor="al-terms" className="text-sm text-foreground/80 leading-relaxed cursor-pointer">
                  Li e aceito os{" "}
                  <Link to="/novasantarita/auralegano/termos#termos-de-uso" target="_blank" className="text-primary hover:text-primary/80 underline underline-offset-2">
                    Termos de Uso
                  </Link>{" "}
                  e a{" "}
                  <Link to="/novasantarita/auralegano/termos#politica-de-privacidade" target="_blank" className="text-primary hover:text-primary/80 underline underline-offset-2">
                    Política de Privacidade
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  "Quero Garantir Meu Lote"
                )}
              </button>

              <p className="text-center text-sm text-muted-foreground">Cadastro gratuito e sem compromisso</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default ALFormSection;
