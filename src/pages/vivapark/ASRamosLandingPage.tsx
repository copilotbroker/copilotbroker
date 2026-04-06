import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  CheckCircle2, Loader2, ChevronDown, ChevronUp, Sun, Moon,
  Building2, Layers, Sofa, BedDouble, TrendingUp, Clock,
  Sparkles, Ruler, DollarSign, Key, CalendarClock, Shield,
  Waves, Users, Dumbbell
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppInput, isValidWhatsApp } from "@/components/ui/whatsapp-input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { getLeadOriginFromUTM, getLeadOriginDetailFromUTM } from "@/hooks/use-page-tracking";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Reuse VivaPark images for context sections
import heroImg from "@/assets/vivapark/0.webp";
import lifestyleImg from "@/assets/vivapark/8.webp";
import loungeImg from "@/assets/vivapark/9.webp";
import rooftopImg from "@/assets/vivapark/22.webp";
import poolImg from "@/assets/vivapark/26.webp";
import nightImg from "@/assets/vivapark/31.webp";
import facadeImg from "@/assets/vivapark/36.webp";
import streetImg from "@/assets/vivapark/44.webp";
import parkImg from "@/assets/vivapark/49.webp";
import familyImg from "@/assets/vivapark/50.webp";
import nightPanoImg from "@/assets/vivapark/51.webp";

interface ASRamosLandingPageProps {
  brokerId?: string;
  brokerName?: string;
}

const ASRamosLandingPage = ({ brokerId: propBrokerId, brokerName }: ASRamosLandingPageProps = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isThankYou = location.pathname.endsWith("/obrigado");

  const [vpTheme, setVpTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vp-theme");
      if (saved === "light" || saved === "dark") return saved;
      return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    return "dark";
  });

  const toggleTheme = useCallback(() => {
    setVpTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("vp-theme", next);
      return next;
    });
  }, []);

  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => { setHeroVisible(true); }, []);

  // Form state
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [showBrokerSelect, setShowBrokerSelect] = useState(false);
  const [brokers, setBrokers] = useState<{ id: string; name: string }[]>([]);
  const [selectedBrokerId, setSelectedBrokerId] = useState("");
  const [loadingBrokers, setLoadingBrokers] = useState(false);
  const formRef = useRef<HTMLElement>(null);

  useEffect(() => {
    supabase.from("projects").select("id").eq("slug", "asramos-vivapark").maybeSingle()
      .then(({ data }) => { if (data) setProjectId((data as any).id); });
  }, []);

  const fetchBrokers = async () => {
    if (brokers.length > 0 || !projectId) return;
    setLoadingBrokers(true);
    try {
      const { data } = await supabase
        .from("broker_projects").select("broker:brokers(id, name)")
        .eq("project_id", projectId).eq("is_active", true);
      const list = data?.map((bp) => bp.broker)
        .filter((b): b is { id: string; name: string } => b !== null)
        .sort((a, b) => a.name.localeCompare(b.name)) || [];
      setBrokers(list);
    } catch (e) { console.error(e); } finally { setLoadingBrokers(false); }
  };

  const handleToggleBroker = () => {
    if (!showBrokerSelect) fetchBrokers();
    setShowBrokerSelect(!showBrokerSelect);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast({ title: "Preencha seu nome", variant: "destructive" }); return; }
    if (!isValidWhatsApp(whatsapp)) { toast({ title: "WhatsApp inválido", variant: "destructive" }); return; }
    if (!acceptedTerms) { toast({ title: "Aceite os termos", variant: "destructive" }); return; }
    setIsSubmitting(true);
    try {
      const leadId = crypto.randomUUID();
      const finalBrokerId = propBrokerId || selectedBrokerId || null;
      const finalSource = propBrokerId ? "broker_landing" : "landing_page";
      await supabase.from("leads").insert({ id: leadId, name: name.trim(), whatsapp, project_id: projectId, broker_id: finalBrokerId, source: finalSource, lead_origin: getLeadOriginFromUTM(), lead_origin_detail: getLeadOriginDetailFromUTM() });
      await supabase.from("lead_attribution").insert({ lead_id: leadId, project_id: projectId, landing_page: "asramos-vivapark", referrer: document.referrer || null, utm_source: new URLSearchParams(window.location.search).get("utm_source"), utm_medium: new URLSearchParams(window.location.search).get("utm_medium"), utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign") });
      supabase.rpc("unify_lead" as any, { _new_lead_id: leadId }).then(null, () => {});
      supabase.functions.invoke("auto-cadencia-10d", { body: { leadId } }).catch(console.warn);
      supabase.functions.invoke("notify-new-lead", { body: { leadId, leadName: name.trim(), leadWhatsapp: whatsapp, brokerId: finalBrokerId, projectId, source: "AS Ramos - Vivapark" } }).catch(console.error);
      const basePath = location.pathname.replace(/\/obrigado$/, "").replace(/\/+$/, "");
      navigate(`${basePath}/obrigado`, { replace: true });
    } catch { toast({ title: "Erro ao enviar", variant: "destructive" }); } finally { setIsSubmitting(false); }
  };

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

  const paymentItems = [
    { icon: DollarSign, text: "Valores a partir de R$839.000" },
    { icon: Key, text: "Entrada de 10%" },
    { icon: CalendarClock, text: "Parcelamento da entrada em até 3x" },
    { icon: Building2, text: "Financiamento direto com a construtora em até 120 meses" },
    { icon: Shield, text: "Parcelas a partir de aproximadamente R$2.800" },
  ];

  const leisureItems = [
    { icon: Waves, text: "Piscina adulto e infantil" },
    { icon: Dumbbell, text: "Fitness center" },
    { icon: Users, text: "Espaço gourmet" },
    { icon: Sofa, text: "Lounge" },
    { icon: Sparkles, text: "Rooftop" },
  ];

  return (
    <div className={`vivapark-theme ${vpTheme === "light" ? "vp-light" : "vp-dark"} min-h-screen bg-background text-foreground transition-colors duration-500`}>
      <Helmet>
        <title>AS Ramos — Lofts Duplex no Vivapark Porto Belo</title>
        <meta name="description" content="Novo empreendimento da AS Ramos dentro do Vivapark Porto Belo. Lofts duplex a partir de 47m². Investimento inteligente no primeiro bairro parque do Brasil." />
      </Helmet>

      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex flex-col">
            <span className="font-serif text-lg font-bold tracking-wider text-gold-gradient">AS RAMOS</span>
            <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">no Vivapark Porto Belo</span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-muted transition-all duration-300 text-muted-foreground hover:text-foreground"
            title={vpTheme === "dark" ? "Light mode" : "Dark mode"}
          >
            {vpTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <img src={heroImg} alt="Vivapark Porto Belo" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background" />

        <div className={`relative z-10 max-w-4xl mx-auto px-4 text-center transition-all duration-1000 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="inline-flex items-center gap-1.5 px-4 py-2 mb-8 border border-primary/30 rounded-full bg-primary/10 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] sm:text-xs font-medium tracking-[0.2em] uppercase text-primary">
              Pré-lançamento exclusivo
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.95] mb-6">
            <span className="text-foreground">Antes de ter nome, </span>
            <span className="text-gold-gradient">já está sendo escolhido.</span>
          </h1>

          <div className="w-16 h-px bg-primary/50 mx-auto mb-6" />

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Um novo capítulo dentro do Vivapark Porto Belo — pensado para quem entende valor antes dele aparecer no preço.
          </p>

          <button onClick={scrollToForm} className="btn-primary text-sm sm:text-base px-10 py-5">
            Receber informações
          </button>
        </div>
      </section>

      {/* ── SEÇÃO 1 — ABERTURA ── */}
      <section className="py-20 md:py-28 px-4 bg-card/50">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
            Existe um tipo de ativo que não precisa se provar.
          </p>
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
            Ele simplesmente atrai o tipo certo de comprador.
          </p>
          <div className="w-10 h-px bg-primary/50 mx-auto" />
          <p className="text-foreground font-serif text-xl md:text-2xl font-semibold leading-relaxed">
            Esse projeto nasce dentro do Vivapark —<br />
            <span className="text-gold-gradient">o primeiro bairro parque planejado do Brasil.</span>
          </p>
          <p className="text-muted-foreground text-base italic">
            E isso, por si só, já muda o nível da conversa.
          </p>
        </div>
      </section>

      {/* ── SEÇÃO 2 — CONTEXTO ── */}
      <section className="py-20 md:py-28 px-4 bg-background">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-[10px] sm:text-xs font-medium tracking-[0.25em] uppercase text-primary block">
              Contexto que valoriza
            </span>
            <div className="w-10 h-px bg-primary/50" />
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
              O Vivapark não é um endereço.
            </h2>
            <p className="text-foreground font-semibold text-lg">É um ecossistema completo.</p>
            <p className="text-muted-foreground text-base leading-relaxed">
              Um lugar onde morar, trabalhar, estudar, cuidar da saúde e viver bem acontecem no mesmo espaço — com planejamento urbano real, não improvisado.
            </p>
            <div className="w-10 h-px bg-primary/50" />
            <p className="font-serif text-lg text-foreground font-medium italic">
              Isso cria algo raro no mercado imobiliário:<br />
              <span className="text-gold-gradient">valor sustentado ao longo do tempo.</span>
            </p>
          </div>
          <div className="relative">
            <img src={lifestyleImg} alt="Vivapark lifestyle" className="rounded-lg shadow-[0_0_60px_hsl(var(--gold)/0.1)] border border-border/50 w-full h-auto object-cover" loading="lazy" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-lg overflow-hidden border-2 border-primary/30 shadow-lg hidden md:block">
              <img src={loungeImg} alt="Lounge" className="w-full h-full object-cover" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Full-width image break ── */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <img src={rooftopImg} alt="Vivapark rooftop" className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
      </div>

      {/* ── SEÇÃO 3 — O PRODUTO ── */}
      <section className="py-20 md:py-28 px-4 bg-card/50">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <span className="text-[10px] sm:text-xs font-medium tracking-[0.25em] uppercase text-primary block">
            O empreendimento
          </span>
          <div className="w-10 h-px bg-primary/50 mx-auto" />
          <p className="text-muted-foreground text-lg leading-relaxed">
            Dentro desse contexto, surge um novo empreendimento.
          </p>
          <p className="font-serif text-2xl md:text-3xl font-bold text-foreground">
            Ainda sem nome.
          </p>
          <p className="text-muted-foreground text-base leading-relaxed">
            E isso diz mais sobre ele do que parece.
          </p>
          <div className="w-10 h-px bg-primary/50 mx-auto" />
          <p className="text-muted-foreground text-base leading-relaxed max-w-xl mx-auto">
            Porque você não está olhando para algo massificado.<br />
            Está olhando para algo em <span className="text-foreground font-medium">fase inicial</span> — onde as melhores decisões são tomadas.
          </p>
        </div>
      </section>

      {/* ── SEÇÃO 4 — DESIGN ── */}
      <section className="py-0 bg-background relative overflow-hidden">
        <div className="grid md:grid-cols-2 min-h-[500px]">
          <div className="relative">
            <img src={facadeImg} alt="Fachada" className="w-full h-full object-cover min-h-[400px]" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/50 hidden md:block" />
          </div>
          <div className="flex items-center py-16 md:py-20 px-6 md:px-12">
            <div className="space-y-5 max-w-lg">
              <Sparkles className="w-10 h-10 text-primary mb-4" />
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                Aqui, o projeto não começa no apartamento.
              </h2>
              <p className="text-foreground font-semibold text-lg">Começa na experiência.</p>
              <div className="space-y-4 text-muted-foreground text-base leading-relaxed">
                <p>O hall não é um espaço de passagem.<br /><span className="text-foreground font-medium">É uma galeria.</span></p>
                <p>O edifício não é só funcional.<br /><span className="text-foreground font-medium">É estético.</span></p>
              </div>
              <div className="w-10 h-px bg-primary/50 my-6" />
              <p className="font-serif text-muted-foreground italic text-lg">
                Existe uma intenção clara:<br />
                <span className="text-gold-gradient font-semibold not-italic">fugir do padrão que já saturou o mercado.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 5 — PRODUTO (LOFTS) ── */}
      <section className="py-20 md:py-28 px-4 bg-card/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[10px] sm:text-xs font-medium tracking-[0.25em] uppercase text-primary mb-4 block">
              Tipologia
            </span>
            <div className="w-10 h-px bg-primary/50 mx-auto mb-8" />
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3">
              Lofts duplex a partir de <span className="text-gold-gradient">47,01m²</span>
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              Com uma lógica simples e bem resolvida:
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-10">
            <div className="card-luxury flex items-center gap-4 p-6 border border-primary/20 hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_hsl(var(--gold)/0.12)]">
              <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BedDouble className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-serif font-semibold text-foreground">Andar superior</p>
                <p className="text-sm text-muted-foreground">Área íntima (dormitórios)</p>
              </div>
            </div>
            <div className="card-luxury flex items-center gap-4 p-6 border border-primary/20 hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_hsl(var(--gold)/0.12)]">
              <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sofa className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-serif font-semibold text-foreground">Andar inferior</p>
                <p className="text-sm text-muted-foreground">Área social integrada</p>
              </div>
            </div>
          </div>

          <p className="text-center text-muted-foreground text-base italic">
            Uma tipologia que funciona tanto para <span className="text-foreground font-medium">uso próprio</span> quanto para <span className="text-foreground font-medium">renda</span>.
          </p>
        </div>
      </section>

      {/* ── SEÇÃO 6 — INVESTIMENTO ── */}
      <section className="py-0 bg-background relative overflow-hidden">
        <div className="grid md:grid-cols-2 min-h-[500px]">
          <div className="flex items-center py-16 md:py-20 px-6 md:px-12 order-2 md:order-1">
            <div className="space-y-5 max-w-lg mx-auto md:ml-auto md:mr-0 text-center md:text-right">
              <TrendingUp className="w-10 h-10 text-primary mb-4 mx-auto md:ml-auto md:mr-0" />
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                Uso inteligente
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed">
                Esse tipo de planta tem um comportamento claro no mercado:
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-end">
                {["Alta liquidez", "Alta procura", "Boa performance em locação por diária"].map((item, i) => (
                  <span key={i} className="px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-sm text-foreground font-medium">
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Principalmente em regiões com fluxo constante e infraestrutura completa — como é o caso do Vivapark.
              </p>
              <div className="w-10 h-px bg-primary/50 my-4 mx-auto md:ml-auto md:mr-0" />
              <p className="font-serif text-lg font-semibold text-gold-gradient">
                Não é uma aposta. É um padrão que já se repete.
              </p>
            </div>
          </div>
          <div className="relative order-1 md:order-2">
            <img src={poolImg} alt="Piscina e lazer" className="w-full h-full object-cover min-h-[400px]" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background/50 hidden md:block" />
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 7 — LAZER ── */}
      <section className="py-20 md:py-28 px-4 bg-card/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Layers className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-3">
              Mais de <span className="text-gold-gradient">1.400m²</span> de lazer
            </h2>
            <p className="text-muted-foreground text-base">Distribuídos em 9 ambientes</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-10 rounded-lg overflow-hidden">
            <img src={poolImg} alt="Piscina" className="w-full h-48 md:h-64 object-cover" loading="lazy" />
            <img src={streetImg} alt="Área comum" className="w-full h-48 md:h-64 object-cover" loading="lazy" />
            <img src={parkImg} alt="Parque" className="w-full h-48 md:h-64 object-cover" loading="lazy" />
          </div>

          <div className="max-w-2xl mx-auto text-center space-y-6">
            <p className="text-muted-foreground text-base">Não como excesso. Mas como <span className="text-foreground font-medium">permanência</span>.</p>
            <div className="w-10 h-px bg-primary/50 mx-auto" />
            <p className="font-serif text-lg text-foreground italic">
              Quanto mais tempo as pessoas permanecem,<br />
              <span className="text-gold-gradient font-semibold not-italic">mais o ativo se valoriza.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 8 — CONSTRUTORA ── */}
      <section className="py-20 md:py-28 px-4 bg-background">
        <div className="max-w-3xl mx-auto text-center">
          <Building2 className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gold-gradient mb-6">
            AS RAMOS
          </h2>
          <p className="font-serif text-xl md:text-2xl text-foreground font-semibold mb-4">
            Mais de 75 empreendimentos entregues.
          </p>
          <div className="w-10 h-px bg-primary/50 mx-auto my-6" />
          <p className="text-muted-foreground text-lg italic max-w-xl mx-auto">
            Experiência suficiente para tirar o projeto do campo da ideia e colocar no campo da execução.
          </p>
        </div>
      </section>

      {/* ── Full-width image break ── */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <img src={nightImg} alt="Vista noturna" className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/40" />
      </div>

      {/* ── SEÇÃO 9 — CONDIÇÕES ── */}
      <section className="py-20 md:py-28 px-4 bg-card/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[10px] sm:text-xs font-medium tracking-[0.25em] uppercase text-primary mb-4 block">
              Condições
            </span>
            <div className="w-10 h-px bg-primary/50 mx-auto mb-8" />
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              A partir de <span className="text-gold-gradient">R$839.000</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
            {paymentItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="card-luxury flex items-start gap-3 p-5 border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-[0_0_30px_hsl(var(--gold)/0.1)]">
                  <div className="w-9 h-9 rounded-sm bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">{item.text}</p>
                </div>
              );
            })}
          </div>

          <div className="max-w-xl mx-auto text-center">
            <div className="w-10 h-px bg-primary/50 mx-auto mb-6" />
            <p className="text-muted-foreground text-base">
              Sem estrutura bancária no meio do caminho.<br />
              <span className="text-foreground font-medium">Mais controle, mais previsibilidade.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 10 — MOMENTO ── */}
      <section className="py-16 md:py-24 px-4 bg-background">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <Clock className="w-10 h-10 text-primary mx-auto" />
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
            Esse ainda é o início.
          </h2>
          <p className="text-muted-foreground text-lg">
            E início tem uma característica que não volta depois:
          </p>
          <p className="font-serif text-2xl md:text-3xl font-bold text-gold-gradient">
            liberdade de escolha.
          </p>
        </div>
      </section>

      {/* ── FORM ── */}
      <section id="cadastro" ref={formRef} className="py-24 md:py-32 px-4 bg-card/50 relative overflow-hidden">
        <img src={familyImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" loading="lazy" aria-hidden="true" />
        <div className="absolute inset-0 bg-card/80" />
        <div className="max-w-xl mx-auto relative z-10">
          {isThankYou ? (
            <div className="text-center p-12 rounded-lg bg-card border border-border/50 shadow-[0_0_60px_hsl(var(--gold)/0.1)]">
              <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Cadastro realizado!</h2>
              <p className="text-muted-foreground">Em breve entraremos em contato com as informações completas.</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-12">
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Receba as informações completas
                </h2>
                <p className="text-muted-foreground">
                  Se fizer sentido entender melhor as unidades disponíveis neste momento:
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5 p-8 md:p-10 rounded-lg bg-card border border-border/50 shadow-[0_0_60px_hsl(var(--gold)/0.08)]">
                <div>
                  <label className="block text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2">Nome</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-sm border border-border bg-input text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2">WhatsApp</label>
                  <WhatsAppInput value={whatsapp} onChange={setWhatsapp} defaultCountryCode="55" />
                </div>

                {projectId && !propBrokerId && (
                  <div>
                    <button type="button" onClick={handleToggleBroker} className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
                      {showBrokerSelect ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      Já tem um corretor?
                    </button>
                    {showBrokerSelect && (
                      <div className="mt-2">
                        {loadingBrokers ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Select value={selectedBrokerId} onValueChange={setSelectedBrokerId}>
                            <SelectTrigger><SelectValue placeholder="Selecione seu corretor" /></SelectTrigger>
                            <SelectContent>
                              {brokers.map((b) => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Checkbox checked={acceptedTerms} onCheckedChange={(v) => setAcceptedTerms(!!v)} id="ar-terms" className="mt-0.5" />
                  <label htmlFor="ar-terms" className="text-xs text-muted-foreground leading-tight">
                    Concordo com os{" "}
                    <a href="/portobelo/vivapark/termos" target="_blank" className="underline text-primary hover:text-primary/80 transition-colors">termos de uso</a>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-4 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  Receber informações
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative py-20 px-4 border-t border-border/30 overflow-hidden">
        <img src={nightPanoImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" loading="lazy" aria-hidden="true" />
        <div className="absolute inset-0 bg-card/85" />
        <div className="max-w-3xl mx-auto text-center space-y-4 relative z-10">
          <p className="font-serif text-lg md:text-xl text-foreground font-medium">
            Alguns imóveis são comprados.
          </p>
          <p className="font-serif text-lg md:text-xl text-foreground font-medium">
            Outros são escolhidos antes de se tornarem óbvios.
          </p>
          <div className="w-10 h-px bg-primary/50 mx-auto my-6" />
          <p className="text-xs text-muted-foreground/50 mt-8">
            © {new Date().getFullYear()} AS Ramos — Vivapark Porto Belo. Enove Inteligência Imobiliária.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ASRamosLandingPage;
