import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Loader2, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppInput, isValidBrazilianWhatsApp } from "@/components/ui/whatsapp-input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { getLeadOriginFromUTM, getLeadOriginDetailFromUTM } from "@/hooks/use-page-tracking";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonacoFormSectionProps {
  projectId?: string;
  brokerId?: string;
  submitted?: boolean;
  allowBrokerSelection?: boolean;
}

const MonacoFormSection = ({ projectId, brokerId, submitted, allowBrokerSelection = true }: MonacoFormSectionProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

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
        broker_id: brokerId || null,
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

      supabase.functions.invoke("notify-new-lead", {
        body: {
          leadId,
          leadName: name.trim(),
          leadWhatsapp: whatsapp,
          brokerId: brokerId || null,
          projectId,
          source: "Monaco",
        },
      }).catch(console.error);

      // Meta Pixel — Lead event with deduplication
      const eventId = crypto.randomUUID();
      try {
        if (typeof window !== "undefined" && window.fbq) {
          window.fbq("track", "Lead", {}, { eventID: eventId });
        }
        supabase.functions.invoke("meta-conversions-api", {
          body: {
            event_name: "Lead",
            pixel_id: "4261464794069997",
            event_id: eventId,
            event_source_url: window.location.href,
            user_data: { ph: whatsapp, fn: name.trim() },
            fbp: document.cookie.match(/_fbp=([^;]+)/)?.[1] || null,
            fbc: document.cookie.match(/_fbc=([^;]+)/)?.[1] || null,
          },
        }).catch(console.warn);
      } catch (e) {
        console.warn("Meta CAPI error:", e);
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
    <section
      id="cadastro"
      ref={sectionRef}
      className="py-20 md:py-32 bg-background relative overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className={`max-w-xl mx-auto transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              QUERO CONHECER O{" "}
              <span className="text-gold-gradient">MÔNACO</span>
            </h2>
            <p className="text-muted-foreground">
              Cadastro gratuito. Acesso limitado. Prioridade real.
            </p>
          </div>

          {submitted ? (
            <div className="card-luxury p-8 md:p-10 flex flex-col items-center justify-center text-center space-y-4 min-h-[200px]">
              <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 text-primary" />
              <h3 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                Parabéns, agora você faz parte da nossa{" "}
                <span className="text-gold-gradient">lista VIP!</span>
              </h3>
              <p className="text-muted-foreground">
                Em breve entraremos em contato pelo WhatsApp.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card-luxury p-8 md:p-10 space-y-6">
              <div>
                <label htmlFor="monaco-name" className="block text-sm font-medium text-foreground/80 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="monaco-name"
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
                <label htmlFor="monaco-whatsapp" className="block text-sm font-medium text-foreground/80 mb-2">
                  WhatsApp
                </label>
                <WhatsAppInput
                  id="monaco-whatsapp"
                  name="whatsapp"
                  autoComplete="tel"
                  value={whatsapp}
                  onChange={setWhatsapp}
                  className="py-3.5 bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="monaco-terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  className="mt-0.5"
                  disabled={isSubmitting}
                />
                <label htmlFor="monaco-terms" className="text-sm text-foreground/80 leading-relaxed cursor-pointer">
                  Li e aceito os{" "}
                  <Link
                    to="/xangrila/monaco/termos#termos-de-uso"
                    target="_blank"
                    className="text-primary hover:text-primary/80 underline underline-offset-2"
                  >
                    Termos de Uso
                  </Link>{" "}
                  e a{" "}
                  <Link
                    to="/xangrila/monaco/termos#politica-de-privacidade"
                    target="_blank"
                    className="text-primary hover:text-primary/80 underline underline-offset-2"
                  >
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
                  "Quero Saber Mais"
                )}
              </button>

              <p className="text-center text-sm text-muted-foreground">
                Cadastro gratuito e sem compromisso
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default MonacoFormSection;
