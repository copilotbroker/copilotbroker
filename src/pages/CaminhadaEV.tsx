import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { WhatsAppInput, isValidWhatsApp } from "@/components/ui/whatsapp-input";
import { trackLeadAttribution, getLeadOriginFromUTM, getLeadOriginDetailFromUTM } from "@/hooks/use-page-tracking";
import logoEnove from "@/assets/logo-enove.png";

const SECTION_CLASSES = "py-16 md:py-24 px-4";

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

const CaminhadaEV = () => {
  const [formData, setFormData] = useState({ name: "", whatsapp: "", email: "" });
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
    if (!formData.name.trim() || !formData.whatsapp.trim()) {
      toast.error("Por favor, preencha nome e WhatsApp.");
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
      };
      if (projectId) leadData.project_id = projectId;

      const { error } = await supabase.from("leads").insert(leadData);
      if (error) throw error;

      await trackLeadAttribution(leadId, projectId || undefined, "landing_page");

      // Unify if duplicate
      Promise.resolve(supabase.rpc("unify_lead", { _new_lead_id: leadId } as any)).catch(() => {});

      // Auto first message
      supabase.functions.invoke("auto-first-message", { body: { leadId } }).catch(() => {});

      // Notify
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
      setFormData({ name: "", whatsapp: "", email: "" });
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

      <div className="min-h-screen bg-background text-foreground">
        {/* ───── HERO ───── */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[hsl(var(--charcoal))] via-[hsl(var(--charcoal-light))] to-background">
          {/* subtle nature texture overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

          <div className="relative z-10 container max-w-3xl text-center px-4 py-20">
            <img src={logoEnove} alt="Enove" className="h-8 mx-auto mb-10 opacity-70" />

            <FadeInSection>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-white mb-6">
                Caminhe hoje.{" "}
                <span className="text-primary">More amanhã.</span>
              </h1>
            </FadeInSection>

            <FadeInSection className="delay-200">
              <p className="text-lg sm:text-xl text-white/70 max-w-xl mx-auto mb-4 leading-relaxed">
                Participe de uma experiência única no terreno do Novo Condomínio de Estância Velha — <strong className="text-white/90">Enove Select</strong>.
              </p>
              <p className="text-base sm:text-lg text-white/55 max-w-lg mx-auto mb-10">
                Uma caminhada especial onde você poderá conhecer o lugar antes mesmo da construção… e imaginar como seria viver ali.
              </p>
            </FadeInSection>

            <FadeInSection className="delay-500">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm sm:text-base text-white/80 mb-10 font-medium">
                <span>📅 04 de abril</span>
                <span>⏰ 08h30</span>
                <span>📍 Estância Velha</span>
              </div>
            </FadeInSection>

            <FadeInSection className="delay-700">
              <button
                onClick={scrollToForm}
                className="btn-primary text-base sm:text-lg px-8 py-4 rounded-lg shadow-lg hover:scale-[1.02] transition-transform"
              >
                Quero participar
              </button>
            </FadeInSection>
          </div>

          {/* bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* ───── SEU NOVO CAPÍTULO ───── */}
        <section className={SECTION_CLASSES}>
          <FadeInSection className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">
              Seu novo capítulo <span className="text-primary">começa aqui</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Antes mesmo das primeiras casas serem construídas, você terá a oportunidade de pisar no terreno onde um novo condomínio nascerá em Estância Velha.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              A proposta dessa caminhada é simples: permitir que você caminhe pelo espaço, observe o ambiente e comece a imaginar como poderia ser viver ali.
            </p>
            <p className="text-foreground/80 font-medium leading-relaxed">
              Mais do que um evento, será uma experiência pensada para que você sinta o lugar antes mesmo dele existir.
            </p>
          </FadeInSection>
        </section>

        {/* ───── IMAGINE SUA VIDA ───── */}
        <section className={`${SECTION_CLASSES} bg-card`}>
          <FadeInSection className="max-w-2xl mx-auto">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-8">
              Imagine sua vida <span className="text-primary">aqui</span>
            </h2>
            <p className="text-muted-foreground text-center leading-relaxed mb-8">
              Durante a caminhada você percorrerá o terreno enquanto descobre pontos preparados para ajudar a visualizar o futuro do condomínio. Ao longo do percurso, pequenos elementos convidam você a imaginar coisas simples do dia a dia:
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                "Onde poderiam estar os espaços de lazer",
                "Como seria caminhar ali todas as manhãs",
                "Como seria viver nesse lugar",
              ].map((item, i) => (
                <div key={i} className="bg-background border border-border rounded-xl p-6 text-center text-sm text-foreground/80 leading-relaxed">
                  {item}
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-center mt-8 italic">
              É um convite para olhar o terreno com outros olhos.
            </p>
          </FadeInSection>
        </section>

        {/* ───── EXPERIÊNCIA DIFERENTE ───── */}
        <section className={SECTION_CLASSES}>
          <FadeInSection className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">
              Uma experiência <span className="text-primary">diferente</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              A caminhada também foi pensada para ser um momento leve e agradável. Durante o percurso haverá um ponto especial de parada onde os participantes poderão:
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-lg mb-6">
              <span>🥂 Fazer uma pausa</span>
              <span>📸 Registrar o momento</span>
              <span>📍 Conhecer o projeto</span>
            </div>
            <p className="text-foreground/80 leading-relaxed">
              Esse será um momento para desacelerar, olhar ao redor e imaginar como aquele espaço poderá se transformar no futuro.
            </p>
          </FadeInSection>
        </section>

        {/* ───── MARCA SIMBÓLICA ───── */}
        <section className={`${SECTION_CLASSES} bg-card`}>
          <FadeInSection className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">
              Marque o início <span className="text-primary">dessa história</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Durante a experiência, os participantes também terão a oportunidade de deixar sua marca simbólica no início do projeto.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              Um pequeno gesto que representa os primeiros sonhos e expectativas das pessoas que caminharam ali antes mesmo do condomínio existir.
            </p>
          </FadeInSection>
        </section>

        {/* ───── PARA QUEM ───── */}
        <section className={SECTION_CLASSES}>
          <FadeInSection className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">
              Para quem se imagina <span className="text-primary">morando aqui</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Essa caminhada é destinada para pessoas que desejam conhecer de perto o terreno e avaliar o potencial de se tornar um futuro morador do novo condomínio de Estância Velha.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Ao percorrer o espaço, você terá a oportunidade de observar o local, entender a proposta do empreendimento e imaginar como seria viver ali.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              Se durante essa experiência você enxergar que esse pode ser o lugar do seu próximo capítulo, poderá se cadastrar para receber mais informações sobre o projeto.
            </p>
          </FadeInSection>
        </section>

        {/* ───── INFO DO EVENTO ───── */}
        <section className={`${SECTION_CLASSES} bg-card`}>
          <FadeInSection className="max-w-lg mx-auto text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-8">
              Informações do <span className="text-primary">evento</span>
            </h2>
            <div className="space-y-3 text-base sm:text-lg text-foreground/80 mb-8">
              <p>📅 <strong>Data:</strong> 04 de abril</p>
              <p>⏰ <strong>Concentração:</strong> 08h30</p>
              <p>🚶‍♂️ <strong>Início da caminhada:</strong> 09h</p>
              <p>📍 <strong>Local:</strong> Terreno do Novo Condomínio — Estância Velha</p>
            </div>
          </FadeInSection>
        </section>

        {/* ───── CTA + FRASE ───── */}
        <section className={`${SECTION_CLASSES} bg-gradient-to-b from-card to-background`}>
          <FadeInSection className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl sm:text-5xl font-bold mb-6">
              Caminhe hoje. <span className="text-primary">More amanhã.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Talvez você esteja apenas participando de uma caminhada.
            </p>
            <p className="text-foreground/80 font-medium leading-relaxed mb-10">
              Ou talvez esteja dando o primeiro passo para o lugar onde irá morar no futuro.
            </p>
            <button onClick={scrollToForm} className="btn-primary px-8 py-4 text-base sm:text-lg rounded-lg">
              Quero participar da caminhada
            </button>
          </FadeInSection>
        </section>

        {/* ───── FORMULÁRIO ───── */}
        <section id="form-caminhada" className={`${SECTION_CLASSES} bg-background`}>
          <FadeInSection className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
                Garanta sua <span className="text-primary">participação</span>
              </h2>
              <p className="text-muted-foreground">As vagas para a caminhada são limitadas. Preencha seus dados para participar.</p>
            </div>

            <form onSubmit={handleSubmit} className="card-luxury p-6 sm:p-10 space-y-5">
              <div>
                <label htmlFor="cam-name" className="block text-sm font-medium text-foreground/80 mb-2">Nome Completo</label>
                <input
                  id="cam-name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base"
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
                  className="py-3 bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary text-base"
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
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base"
                  placeholder="seu@email.com"
                />
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
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
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    Enviando...
                  </span>
                ) : (
                  "👉 Quero participar da caminhada"
                )}
              </button>
            </form>
          </FadeInSection>
        </section>

        {/* ───── FOOTER ───── */}
        <footer className="py-8 text-center border-t border-border">
          <img src={logoEnove} alt="Enove" className="h-6 mx-auto mb-3 opacity-50" />
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Enove. Todos os direitos reservados.</p>
        </footer>
      </div>
    </>
  );
};

export default CaminhadaEV;
