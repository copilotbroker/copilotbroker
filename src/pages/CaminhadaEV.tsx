import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { WhatsAppInput, isValidWhatsApp } from "@/components/ui/whatsapp-input";
import { trackLeadAttribution, getLeadOriginFromUTM, getLeadOriginDetailFromUTM } from "@/hooks/use-page-tracking";
import logoEnove from "@/assets/logo-enove.png";
import {
  Calendar,
  Clock,
  MapPin,
  Footprints,
  TreePine,
  Sunrise,
  Home,
  Wine,
  Camera,
  Map,
  Sparkles,
  Heart,
  Users,
  Eye,
  BookOpen,
  ArrowDown,
  Ticket,
  Package,
  Shirt,
  Building2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SECTION_CLASSES = "py-16 md:py-24 px-4 relative";

const FadeInSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </div>
  );
};

const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-2xl ${className}`}>
    {children}
  </div>
);

const IconBox = ({ icon: Icon, className = "" }: { icon: React.ElementType; className?: string }) => (
  <div className={`w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 mx-auto ${className}`}>
    <Icon className="w-5 h-5 text-primary" />
  </div>
);

const CaminhadaEV = () => {
  const [formData, setFormData] = useState({ name: "", whatsapp: "", email: "", shirtSize: "" });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      const { data } = await supabase
        .from("projects")
        .select("id")
        .eq("slug", "enove-select")
        .maybeSingle();
      if (data) setProjectId(data.id);
    };
    fetchProject();
  }, []);

  const scrollToForm = () => {
    document.getElementById("form-caminhada")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.whatsapp.trim() || !formData.shirtSize) {
      toast.error("Por favor, preencha nome, WhatsApp e tamanho de camiseta.");
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
        email: formData.email.trim() || null,
        source: "caminhada-ev",
        lead_origin: getLeadOriginFromUTM() || "caminhada",
        lead_origin_detail: getLeadOriginDetailFromUTM() || "caminhada-estancia-velha-abril",
        notes: `Tamanho camiseta: ${formData.shirtSize}`,
      };
      if (projectId) leadData.project_id = projectId;

      const { error } = await supabase.from("leads").insert(leadData);
      if (error) throw error;

      await trackLeadAttribution(leadId, projectId || undefined, "landing_page");
      Promise.resolve(supabase.rpc("unify_lead", { _new_lead_id: leadId } as any)).catch(() => {});
      supabase.functions.invoke("auto-first-message", { body: { leadId } }).catch(() => {});
      supabase.functions.invoke("notify-new-lead", {
        body: {
          leadId,
          leadName: formData.name.trim(),
          leadWhatsapp: formData.whatsapp.trim(),
          source: "Caminhada Estância Velha",
        },
      }).catch(() => {});

      if (typeof window.gtag === "function") {
        window.gtag("event", "generate_lead", {
          event_category: "Lead",
          event_label: "caminhada-ev",
          value: 1,
        });
      }

      toast.success("Inscrição realizada com sucesso! Em breve entraremos em contato.");
      setFormData({ name: "", whatsapp: "", email: "", shirtSize: "" });
      setAcceptedTerms(false);
    } catch (error) {
      console.error("Erro ao salvar lead:", error);
      toast.error("Ocorreu um erro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Caminhada Novo Condomínio Estância Velha | Enove</title>
        <meta name="description" content="Participe de uma caminhada exclusiva no terreno do novo condomínio em Estância Velha. Caminhe hoje onde você pode morar amanhã." />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

        {/* ───── HERO ───── */}
        <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[hsl(var(--charcoal))] via-[hsl(var(--charcoal-light))] to-background">
          {/* Decorative blurred orbs */}
          <div className="absolute top-20 -left-32 w-72 h-72 bg-primary/10 rounded-full blur-[120px]" aria-hidden="true" />
          <div className="absolute bottom-40 -right-24 w-60 h-60 bg-primary/8 rounded-full blur-[100px]" aria-hidden="true" />
          <div className="absolute top-1/3 right-10 w-40 h-40 bg-white/[0.02] rounded-full blur-[80px]" aria-hidden="true" />

          {/* subtle pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

          <div className="relative z-10 container max-w-3xl text-center px-4 py-20">
            <img src={logoEnove} alt="Enove" className="h-8 mx-auto mb-12 opacity-60" />

            <FadeInSection>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.1] text-white/60 text-xs sm:text-sm font-medium mb-8 backdrop-blur-sm">
                <Footprints className="w-4 h-4 text-primary" />
                Experiência exclusiva • Vagas limitadas
              </div>
            </FadeInSection>

            <FadeInSection>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight text-white mb-6">
                Caminhe hoje.{" "}
                <span className="text-primary">More amanhã.</span>
              </h1>
            </FadeInSection>

            <FadeInSection className="delay-200">
              <p className="text-lg sm:text-xl text-white/65 max-w-xl mx-auto mb-4 leading-relaxed">
                Participe de uma experiência única no terreno do Novo Condomínio de Estância Velha — <strong className="text-white/90">Enove Select</strong>.
              </p>
              <p className="text-base sm:text-lg text-white/45 max-w-lg mx-auto mb-10">
                Uma caminhada especial onde você poderá conhecer o lugar antes mesmo da construção… e imaginar como seria viver ali.
              </p>
            </FadeInSection>

            <FadeInSection className="delay-500">
              <GlassCard className="inline-flex flex-wrap justify-center gap-x-6 gap-y-3 px-6 py-4 mb-10">
                <span className="flex items-center gap-2 text-sm sm:text-base text-white/80 font-medium">
                  <Calendar className="w-4 h-4 text-primary" /> 04 de abril
                </span>
                <span className="flex items-center gap-2 text-sm sm:text-base text-white/80 font-medium">
                  <Clock className="w-4 h-4 text-primary" /> 08h30
                </span>
                <span className="flex items-center gap-2 text-sm sm:text-base text-white/80 font-medium">
                  <MapPin className="w-4 h-4 text-primary" /> Estância Velha
                </span>
              </GlassCard>
            </FadeInSection>

            <FadeInSection className="delay-700">
              <button
                onClick={scrollToForm}
                className="btn-primary text-base sm:text-lg px-8 py-4 rounded-xl shadow-[0_0_40px_hsl(var(--primary)/0.25)] hover:shadow-[0_0_60px_hsl(var(--primary)/0.35)] hover:scale-[1.02] transition-all"
              >
                <Ticket className="w-5 h-5 mr-2 inline" />
                Quero participar
              </button>
              <div className="mt-8 animate-bounce">
                <ArrowDown className="w-5 h-5 text-white/30 mx-auto" />
              </div>
            </FadeInSection>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* ───── SEU NOVO CAPÍTULO ───── */}
        <section className={SECTION_CLASSES}>
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/[0.03] rounded-full blur-[80px] -translate-y-1/2" aria-hidden="true" />

          <FadeInSection className="max-w-2xl mx-auto text-center">
            <IconBox icon={BookOpen} />
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">
              Seu novo capítulo <span className="text-primary">começa aqui</span>
            </h2>

            <GlassCard className="p-6 sm:p-8 text-left space-y-4 bg-card/50 border-border/50">
              <p className="text-muted-foreground leading-relaxed">
                Antes mesmo das primeiras casas serem construídas, você terá a oportunidade de pisar no terreno onde um novo condomínio nascerá em Estância Velha.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                A proposta dessa caminhada é simples: permitir que você caminhe pelo espaço, observe o ambiente e comece a imaginar como poderia ser viver ali.
              </p>
              <div className="flex items-start gap-3 pt-2 border-t border-border/30">
                <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-foreground/80 font-medium leading-relaxed">
                  Mais do que um evento, será uma experiência pensada para que você sinta o lugar antes mesmo dele existir.
                </p>
              </div>
            </GlassCard>
          </FadeInSection>
        </section>

        {/* ───── IMAGINE SUA VIDA ───── */}
        <section className={`${SECTION_CLASSES} bg-card/50`}>
          <div className="absolute top-10 left-0 w-80 h-80 bg-primary/[0.02] rounded-full blur-[100px]" aria-hidden="true" />

          <FadeInSection className="max-w-3xl mx-auto">
            <IconBox icon={Eye} />
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-4">
              Imagine sua vida <span className="text-primary">aqui</span>
            </h2>
            <p className="text-muted-foreground text-center leading-relaxed mb-10 max-w-xl mx-auto">
              Durante a caminhada, pequenos elementos convidam você a imaginar coisas simples do dia a dia:
            </p>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: TreePine, text: "Onde poderiam estar os espaços de lazer" },
                { icon: Sunrise, text: "Como seria caminhar ali todas as manhãs" },
                { icon: Home, text: "Como seria viver nesse lugar" },
              ].map((item, i) => (
                <GlassCard key={i} className="p-6 text-center bg-card/60 border-border/40 hover:border-primary/30 transition-colors group">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 mx-auto group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{item.text}</p>
                </GlassCard>
              ))}
            </div>

            <p className="text-muted-foreground text-center mt-8 italic text-sm">
              É um convite para olhar o terreno com outros olhos.
            </p>
          </FadeInSection>
        </section>

        {/* ───── EXPERIÊNCIA DIFERENTE ───── */}
        <section className={SECTION_CLASSES}>
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary/[0.03] rounded-full blur-[100px]" aria-hidden="true" />

          <FadeInSection className="max-w-2xl mx-auto text-center">
            <IconBox icon={Sparkles} />
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">
              Uma experiência <span className="text-primary">diferente</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              A caminhada também foi pensada para ser um momento leve e agradável. Durante o percurso haverá um ponto especial de parada:
            </p>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
              {[
                { icon: Wine, label: "Fazer uma pausa" },
                { icon: Camera, label: "Registrar o momento" },
                { icon: Map, label: "Conhecer o projeto" },
              ].map((item, i) => (
                <GlassCard key={i} className="p-4 sm:p-5 bg-card/40 border-border/30">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 mx-auto">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs sm:text-sm text-foreground/70 leading-snug">{item.label}</p>
                </GlassCard>
              ))}
            </div>

            <p className="text-foreground/80 leading-relaxed text-sm sm:text-base">
              Um momento para desacelerar, olhar ao redor e imaginar como aquele espaço poderá se transformar no futuro.
            </p>
          </FadeInSection>
        </section>

        {/* ───── MARCA SIMBÓLICA ───── */}
        <section className={`${SECTION_CLASSES} bg-card/50`}>
          <FadeInSection className="max-w-2xl mx-auto text-center">
            <IconBox icon={Heart} />
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">
              Marque o início <span className="text-primary">dessa história</span>
            </h2>
            <GlassCard className="p-6 sm:p-8 bg-card/60 border-border/40">
              <p className="text-muted-foreground leading-relaxed mb-4">
                Durante a experiência, os participantes também terão a oportunidade de deixar sua marca simbólica no início do projeto.
              </p>
              <div className="w-16 h-[1px] bg-primary/30 mx-auto my-5" />
              <p className="text-foreground/80 leading-relaxed font-medium">
                Um pequeno gesto que representa os primeiros sonhos e expectativas das pessoas que caminharam ali antes mesmo do condomínio existir.
              </p>
            </GlassCard>
          </FadeInSection>
        </section>

        {/* ───── PARA QUEM ───── */}
        <section className={SECTION_CLASSES}>
          <div className="absolute top-10 left-0 w-60 h-60 bg-primary/[0.02] rounded-full blur-[90px]" aria-hidden="true" />

          <FadeInSection className="max-w-2xl mx-auto text-center">
            <IconBox icon={Users} />
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">
              Para quem se imagina <span className="text-primary">morando aqui</span>
            </h2>
            <div className="space-y-4 text-left">
              <GlassCard className="p-5 bg-card/40 border-border/30 flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Eye className="w-4 h-4 text-primary" />
                </div>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  Essa caminhada é destinada para pessoas que desejam conhecer de perto o terreno e avaliar o potencial de se tornar um futuro morador.
                </p>
              </GlassCard>
              <GlassCard className="p-5 bg-card/40 border-border/30 flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Footprints className="w-4 h-4 text-primary" />
                </div>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  Ao percorrer o espaço, você terá a oportunidade de observar o local, entender a proposta e imaginar como seria viver ali.
                </p>
              </GlassCard>
              <GlassCard className="p-5 bg-card/40 border-border/30 flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <p className="text-foreground/80 leading-relaxed font-medium text-sm sm:text-base">
                  Se você enxergar que esse pode ser o lugar do seu próximo capítulo, poderá se cadastrar para receber mais informações sobre o projeto.
                </p>
              </GlassCard>
            </div>
          </FadeInSection>
        </section>

        {/* ───── INFO DO EVENTO ───── */}
        <section className={`${SECTION_CLASSES} bg-card/50`}>
          <FadeInSection className="max-w-lg mx-auto text-center">
            <IconBox icon={Calendar} />
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-8">
              Informações do <span className="text-primary">evento</span>
            </h2>
            <GlassCard className="p-6 sm:p-8 bg-card/60 border-border/40">
              <div className="space-y-4">
                {[
                  { icon: Calendar, label: "Data", value: "04 de abril" },
                  { icon: Clock, label: "Concentração", value: "08h30" },
                  { icon: Footprints, label: "Início da caminhada", value: "09h" },
                  { icon: MapPin, label: "Local", value: "Terreno do Novo Condomínio — Estância Velha" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm sm:text-base text-foreground/90 font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </FadeInSection>
        </section>

        {/* ───── RETIRADA DO KIT ───── */}
        <section className={SECTION_CLASSES}>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/[0.03] rounded-full blur-[100px]" aria-hidden="true" />

          <FadeInSection className="max-w-2xl mx-auto text-center">
            <IconBox icon={Package} />
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Retirada do <span className="text-primary">Kit</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Todos os participantes receberão um kit exclusivo contendo:
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
              <GlassCard className="p-5 bg-card/40 border-border/30 text-center">
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 mx-auto">
                  <Shirt className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-foreground/80 font-medium">Camiseta personalizada</p>
              </GlassCard>
              <GlassCard className="p-5 bg-card/40 border-border/30 text-center">
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 mx-auto">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-foreground/80 font-medium">Squeezy personalizada</p>
              </GlassCard>
            </div>

            <GlassCard className="p-6 sm:p-8 bg-card/60 border-border/40">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Local de retirada</p>
                  <p className="text-sm sm:text-base text-foreground/90 font-medium">Imobiliária Enove</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Endereço</p>
                  <p className="text-sm sm:text-base text-foreground/90 font-medium">Av. Brasil, 1213 - Centro, Estância Velha - RS</p>
                  <p className="text-xs text-muted-foreground">CEP 93600-010</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Período</p>
                  <p className="text-sm sm:text-base text-foreground/90 font-medium">30/03 a 02/04</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Horário</p>
                  <p className="text-sm sm:text-base text-foreground/90 font-medium">08h15 às 18h</p>
                </div>
              </div>
            </GlassCard>
          </FadeInSection>
        </section>

        <section className={`${SECTION_CLASSES} bg-gradient-to-b from-card/50 to-background`}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[120px]" aria-hidden="true" />

          <FadeInSection className="max-w-2xl mx-auto text-center relative z-10">
            <h2 className="font-display text-3xl sm:text-5xl font-bold mb-6">
              Caminhe hoje. <span className="text-primary">More amanhã.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Talvez você esteja apenas participando de uma caminhada.
            </p>
            <p className="text-foreground/80 font-medium leading-relaxed mb-10">
              Ou talvez esteja dando o primeiro passo para o lugar onde irá morar no futuro.
            </p>
            <button
              onClick={scrollToForm}
              className="btn-primary px-8 py-4 text-base sm:text-lg rounded-xl shadow-[0_0_40px_hsl(var(--primary)/0.2)] hover:shadow-[0_0_60px_hsl(var(--primary)/0.3)] transition-all"
            >
              <Footprints className="w-5 h-5 mr-2 inline" />
              Quero participar da caminhada
            </button>
          </FadeInSection>
        </section>

        {/* ───── FORMULÁRIO ───── */}
        <section id="form-caminhada" className={`${SECTION_CLASSES} bg-background`}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/[0.04] rounded-full blur-[120px] -translate-y-1/2" aria-hidden="true" />

          <FadeInSection className="max-w-xl mx-auto relative z-10">
            <div className="text-center mb-8">
              <IconBox icon={Ticket} />
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
                Garanta sua <span className="text-primary">participação</span>
              </h2>
              <p className="text-muted-foreground">As vagas são limitadas. Preencha seus dados para participar.</p>
            </div>

            <form onSubmit={handleSubmit} className="relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 sm:p-10 space-y-5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)]">
              {/* Glow accent */}
              <div className="absolute -top-px left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" aria-hidden="true" />

              <div>
                <label htmlFor="cam-name" className="block text-sm font-medium text-foreground/80 mb-2">Nome Completo</label>
                <input
                  id="cam-name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-background/60 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base"
                  placeholder="Digite seu nome completo"
                  required
                />
              </div>

              <div>
                <label htmlFor="cam-whatsapp" className="block text-sm font-medium text-foreground/80 mb-2">WhatsApp</label>
                <WhatsAppInput
                  id="cam-whatsapp"
                  name="whatsapp"
                  autoComplete="tel"
                  value={formData.whatsapp}
                  onChange={(val) => setFormData({ ...formData, whatsapp: val })}
                  className="py-3 bg-background/60 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary text-base"
                />
              </div>

              <div>
                <label htmlFor="cam-email" className="block text-sm font-medium text-foreground/80 mb-2">E-mail <span className="text-muted-foreground">(opcional)</span></label>
                <input
                  id="cam-email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-background/60 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label htmlFor="cam-shirt" className="block text-sm font-medium text-foreground/80 mb-2">
                  <Shirt className="w-4 h-4 inline mr-1.5 -mt-0.5 text-primary" />
                  Tamanho da Camiseta
                </label>
                <Select
                  value={formData.shirtSize}
                  onValueChange={(value) => setFormData({ ...formData, shirtSize: value })}
                >
                  <SelectTrigger className="w-full py-3 bg-background/60 border-border text-foreground">
                    <SelectValue placeholder="Selecione o tamanho" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {["PP", "P", "M", "G", "GG", "XGG"].map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                <div className="flex items-start gap-3">
                  id="cam-terms"
                  checked={acceptedTerms}
                  onCheckedChange={(c) => setAcceptedTerms(c === true)}
                  className="mt-0.5 min-w-[20px]"
                />
                <label htmlFor="cam-terms" className="text-xs sm:text-sm text-foreground/80 leading-relaxed cursor-pointer">
                  Li e aceito os{" "}
                  <Link to="/termos#termos-de-uso" target="_blank" className="text-primary hover:text-primary/80 underline underline-offset-2" rel="noopener">Termos de Uso</Link>{" "}
                  e a{" "}
                  <Link to="/termos#politica-de-privacidade" target="_blank" className="text-primary hover:text-primary/80 underline underline-offset-2" rel="noopener">Política de Privacidade</Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] text-sm sm:text-base rounded-xl shadow-[0_0_30px_hsl(var(--primary)/0.2)]"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    Enviando...
                  </span>
                ) : (
                  <>
                    <Footprints className="w-5 h-5 mr-2 inline" />
                    Quero participar da caminhada
                  </>
                )}
              </button>
            </form>
          </FadeInSection>
        </section>

        {/* ───── FOOTER ───── */}
        <footer className="py-8 text-center border-t border-border/30">
          <img src={logoEnove} alt="Enove" className="h-6 mx-auto mb-3 opacity-40" />
          <p className="text-xs text-muted-foreground/60">© {new Date().getFullYear()} Enove. Todos os direitos reservados.</p>
        </footer>
      </div>
    </>
  );
};

export default CaminhadaEV;
