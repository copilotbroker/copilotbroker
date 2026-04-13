import { useEffect, useState, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { usePageTracking } from "@/hooks/use-page-tracking";
import FormSection from "@/components/FormSection";
import {
  Building2, Waves, Dumbbell, ChefHat, Shield, TrendingUp, Target,
  MapPin, Star, CheckCircle2, ChevronDown, ChevronUp, X, ChevronLeft,
  ChevronRight, Flame, Baby, Sparkles, PartyPopper, Gamepad2, ShoppingCart,
  Car, ArrowRight, Clock, BadgePercent, Lock, DollarSign, Crosshair, ArrowUp, Users
} from "lucide-react";

import logoImg from "@/assets/hantower/logo.png";
import fachadaImg from "@/assets/hantower/fachada.jpg";
import sacadasImg from "@/assets/hantower/sacadas.jpg";
import salaoGourmet1 from "@/assets/hantower/salao-gourmet-1.jpg";
import salaoGourmet2 from "@/assets/hantower/salao-gourmet-2.jpg";
import piscinaImg from "@/assets/hantower/piscina.jpg";
import hallImg from "@/assets/hantower/hall.jpg";
import garagemImg from "@/assets/hantower/garagem.jpg";
import academiaImg from "@/assets/hantower/academia.jpg";
import salaoFestasImg from "@/assets/hantower/salao-festas.jpg";
import coberturaPiscinaImg from "@/assets/hantower/cobertura-piscina.jpg";
import planta84 from "@/assets/hantower/planta-84.jpg";
import planta128 from "@/assets/hantower/planta-128.jpg";
import logoFooter from "@/assets/hantower/logo-footer.png";
import cozinha1 from "@/assets/hantower/cozinha-1.jpg";
import salaoJantar1 from "@/assets/hantower/salao-jantar-1.jpg";
import salaoJantar2 from "@/assets/hantower/salao-jantar-2.jpg";
import coworking1 from "@/assets/hantower/coworking-1.jpg";
import coworking2 from "@/assets/hantower/coworking-2.jpg";
import coworking3 from "@/assets/hantower/coworking-3.jpg";
import rooftop1 from "@/assets/hantower/rooftop-1.jpg";
import rooftop2 from "@/assets/hantower/rooftop-2.jpg";
import spa1 from "@/assets/hantower/spa-1.jpg";
import spa2 from "@/assets/hantower/spa-2.jpg";

const galleryImages = [
  { src: fachadaImg, alt: "Fachada Hantower" },
  { src: sacadasImg, alt: "Sacadas com vista panorâmica" },
  { src: coberturaPiscinaImg, alt: "Piscina na cobertura com borda infinita" },
  { src: hallImg, alt: "Hall de entrada sofisticado" },
  { src: salaoGourmet1, alt: "Salão gourmet" },
  { src: salaoGourmet2, alt: "Espaço gourmet completo" },
  { src: piscinaImg, alt: "Área da piscina vista aérea" },
  { src: garagemImg, alt: "Hall e garagem" },
  { src: academiaImg, alt: "Academia completa" },
  { src: salaoFestasImg, alt: "Salão de festas" },
  { src: cozinha1, alt: "Cozinha gourmet integrada" },
  { src: salaoJantar1, alt: "Salão de jantar com lustres" },
  { src: salaoJantar2, alt: "Salão de jantar panorâmico" },
  { src: coworking1, alt: "Coworking lounge" },
  { src: coworking2, alt: "Coworking estações de trabalho" },
  { src: coworking3, alt: "Sala de reuniões" },
  { src: rooftop1, alt: "Rooftop lounge com vista" },
  { src: rooftop2, alt: "Rooftop deck panorâmico" },
  { src: spa1, alt: "Spa com hidromassagem" },
  { src: spa2, alt: "Spa e ofurô com vista" },
];

/* ── Lightbox ── */
function Lightbox({ images, startIndex, onClose }: { images: typeof galleryImages; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  const touchStart = useRef(0);
  const prev = useCallback(() => setIdx(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose, prev, next]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 z-10 text-white/70 hover:text-white p-2"><X className="w-8 h-8" /></button>
      <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-2 md:left-6 z-10 text-white/70 hover:text-white p-2"><ChevronLeft className="w-10 h-10" /></button>
      <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-2 md:right-6 z-10 text-white/70 hover:text-white p-2"><ChevronRight className="w-10 h-10" /></button>
      <img
        src={images[idx].src} alt={images[idx].alt}
        className="max-h-[90vh] max-w-[95vw] object-contain select-none"
        onClick={e => e.stopPropagation()}
        onTouchStart={e => { touchStart.current = e.touches[0].clientX; }}
        onTouchEnd={e => { const diff = e.changedTouches[0].clientX - touchStart.current; if (Math.abs(diff) > 50) diff > 0 ? prev() : next(); }}
        draggable={false}
      />
      <div className="absolute bottom-6 text-white/60 text-sm">{idx + 1} / {images.length}</div>
    </div>
  );
}

/* ── FAQ ── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/50">
      <button onClick={() => setOpen(!open)} className="w-full flex justify-between items-center py-5 text-left">
        <span className="text-foreground font-medium text-base md:text-lg pr-4">{q}</span>
        {open ? <ChevronUp className="w-5 h-5 shrink-0 text-primary" /> : <ChevronDown className="w-5 h-5 shrink-0 text-primary" />}
      </button>
      {open && <p className="pb-5 text-muted-foreground leading-relaxed text-sm md:text-base">{a}</p>}
    </div>
  );
}

/* ── Intersection observer hook ── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ══════════════════════════════════════════════ */
const HantowerLandingPage = () => {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [selectedPlanta, setSelectedPlanta] = useState<"84" | "128">("84");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      const { data } = await supabase.from("projects").select("id").eq("slug", "hantower").maybeSingle();
      if (data) setProjectId((data as any).id);
    };
    fetchProject();
  }, []);

  usePageTracking(projectId);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = fachadaImg;
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const s2 = useInView();
  const s3 = useInView();
  const s4 = useInView();
  const s5 = useInView();
  const s6 = useInView();
  const s7 = useInView();
  const s8 = useInView();
  const s9 = useInView();

  const fade = (visible: boolean) =>
    `transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`;

  const scrollToForm = () => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <Helmet>
        <title>Hantower | Alto Padrão em Estância Velha</title>
        <meta name="description" content="Hantower: o primeiro Home Club de Estância Velha. 24 andares, rooftop com piscina infinita, apartamentos de 2 e 3 suítes. Cadastre-se." />
      </Helmet>

      {lightboxIdx !== null && (
        <Lightbox images={galleryImages} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}

      <div className="hantower-theme min-h-screen bg-background text-foreground pb-14 sm:pb-0">

        {/* ═══ HERO ═══ */}
        <section
          className="relative min-h-[70vh] sm:min-h-[75vh] flex items-center justify-center overflow-hidden"
          aria-labelledby="hero-heading"
        >
          <div
            className={`absolute inset-0 transition-opacity duration-1000 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            style={{ backgroundImage: `url(${fachadaImg})`, backgroundSize: "cover", backgroundPosition: "center bottom" }}
            role="img"
            aria-label="Fachada do Hantower"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />

          {/* Logo fixa no topo */}
          <div className="absolute top-0 left-0 right-0 z-20 flex justify-center pt-5">
            <img src={logoImg} alt="Hantower" className="h-4 sm:h-5 w-auto brightness-0 invert" />
          </div>

          <div className="relative z-10 container px-4 py-16 sm:py-20 text-center">
            <div className="max-w-4xl mx-auto">

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-6 border border-white/30 rounded-full bg-white/10 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] sm:text-xs font-medium tracking-widest uppercase text-white/90">
                  Primeiro Home Club de Estância Velha
                </span>
              </div>

              <h1
                id="hero-heading"
                className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-3 text-white leading-[0.95]"
              >
                HANTOWER
              </h1>

              <div className="w-16 h-px bg-white/40 mx-auto mb-4" />

              <p className="text-sm sm:text-base text-white/70 mb-6 max-w-2xl mx-auto">
                Redefinindo o mercado imobiliário de Estância Velha. 24 andares, rooftop com piscina infinita e apartamentos de 2 e 3 suítes.
              </p>

              <button
                onClick={() => document.getElementById("sobre")?.scrollIntoView({ behavior: "smooth" })}
                className="btn-primary text-sm sm:text-base px-8 py-4 sm:px-10 sm:py-5"
              >
                Quero Saber Tudo
              </button>
            </div>

            <button
              onClick={() => document.getElementById("sobre")?.scrollIntoView({ behavior: "smooth" })}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-primary transition-colors animate-bounce"
              aria-label="Rolar para baixo"
            >
              <ChevronDown className="w-8 h-8" />
            </button>
          </div>
        </section>

        {/* ═══ STATS BAR ═══ */}
        <section className="py-8 md:py-10 bg-primary">
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "24", label: "Andares" },
              { value: "70m", label: "De altura" },
              { value: "2 e 3", label: "Suítes" },
              { value: "84-128m²", label: "Privativos" },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-2xl md:text-3xl font-bold mb-1 font-serif text-white">{s.value}</p>
                <p className="text-white/70 text-xs tracking-[0.1em] uppercase">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <main id="main-content" role="main">
          {/* ═══ SEÇÃO 2 — Posicionamento ═══ */}
          <section ref={s2.ref as any} id="sobre" className="py-24 md:py-32 relative overflow-hidden">
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

            <div className={`container px-4 relative z-10 ${fade(s2.visible)}`}>
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                  NÃO É SÓ UM APARTAMENTO.{" "}
                  <span className="text-gold-gradient">É UM NOVO PATAMAR DE VIDA.</span>
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
                  O Hantower nasce para quem não aceita o comum. Para quem valoriza arquitetura marcante, ambientes sofisticados, lazer completo e a sensação de viver em um endereço que naturalmente se destaca na cidade.
                </p>
                <div className="divider-gold mx-auto" />
              </div>
            </div>
          </section>

          {/* ═══ IMAGEM DESTAQUE — Sacadas ═══ */}
          <section className="relative h-[60vh] md:h-[75vh] cursor-pointer overflow-hidden" onClick={() => setLightboxIdx(1)}>
            <img src={sacadasImg} alt="Hantower sacadas" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[1.5s]" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
            <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12">
              <p className="text-white/60 text-xs tracking-[0.15em] uppercase mb-2">Vista das sacadas</p>
              <p className="text-white text-lg md:text-2xl font-light font-serif">Sofisticação em cada detalhe</p>
            </div>
          </section>

          {/* ═══ SEÇÃO 3 — Diferenciais ═══ */}
          <section ref={s3.ref as any} id="diferenciais" className="py-24 md:py-32 bg-card relative overflow-hidden">
            <div className="absolute top-1/4 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />

            <div className={`container px-4 relative z-10 ${fade(s3.visible)}`}>
              <div className="text-center mb-16">
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                  UM EMPREENDIMENTO{" "}
                  <span className="text-gold-gradient">RARO.</span>
                </h2>
                <p className="text-muted-foreground text-base">Em um endereço que se destaca naturalmente.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                {[
                  { icon: Building2, text: "Maior prédio de Estância Velha" },
                  { icon: Star, text: "Primeiro Home Club da região" },
                  { icon: Waves, text: "Rooftop com piscina aquecida, borda infinita e raia de 20m" },
                  { icon: CheckCircle2, text: "Apartamentos amplos, com 2 e 3 suítes" },
                  { icon: ChefHat, text: "Sacada gourmet com churrasqueira" },
                  { icon: Sparkles, text: "Spa com hidromassagem em unidades selecionadas" },
                  { icon: MapPin, text: "Centro de Estância Velha" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-5 rounded-lg bg-background/80 border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-500"
                    style={{ transitionDelay: `${i * 80}ms` }}
                  >
                    <div className="w-11 h-11 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-foreground text-sm md:text-base pt-2.5">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ IMAGEM BREAK — Cobertura ═══ */}
          <section className="relative h-[45vh] md:h-[55vh] overflow-hidden cursor-pointer" onClick={() => setLightboxIdx(2)}>
            <img src={coberturaPiscinaImg} alt="Piscina na cobertura" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[1.5s]" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12">
              <p className="text-white/60 text-xs tracking-[0.15em] uppercase mb-2">Rooftop</p>
              <p className="text-white text-lg md:text-2xl font-light font-serif">Piscina de borda infinita com vista</p>
            </div>
          </section>

          {/* ═══ SEÇÃO 4 — Experiência Home Club ═══ */}
          <section ref={s4.ref as any} className="py-24 md:py-32 relative overflow-hidden">
            <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />

            <div className={`container px-4 relative z-10 ${fade(s4.visible)}`}>
              <div className="text-center mb-16">
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                  VIVA A SENSAÇÃO DE ESTAR DE FÉRIAS{" "}
                  <span className="text-gold-gradient">SEM SAIR DE CASA.</span>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
                  O Hantower leva para o dia a dia o conceito de Home Club com uma estrutura completa para relaxar, receber, cuidar da saúde, aproveitar a família e viver momentos memoráveis.
                </p>
                <p className="text-muted-foreground text-sm mt-4">Entre os diferenciais de lazer e conveniência, o empreendimento conta com:</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto mb-12">
                {[
                  { icon: Waves, text: "Piscina aquecida de 20m com borda infinita" },
                  { icon: Baby, text: "Piscina infantil" },
                  { icon: Sparkles, text: "Hidromassagem estilo Jacuzzi na cobertura" },
                  { icon: Flame, text: "Sauna seca e molhada" },
                  { icon: PartyPopper, text: "Salão de festas para 60 pessoas sentadas" },
                  { icon: Star, text: "Salão Garden" },
                  { icon: PartyPopper, text: "Salão de festas na cobertura" },
                  { icon: Gamepad2, text: "Sala de jogos integrada com espaço gourmet" },
                  { icon: Dumbbell, text: "Academia completa" },
                  { icon: Baby, text: "Brinquedoteca" },
                  { icon: ShoppingCart, text: "Mercado inteligente" },
                  { icon: Flame, text: "Fireplace" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center text-center p-5 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-all duration-500"
                    style={{ transitionDelay: `${i * 50}ms` }}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-muted-foreground text-xs md:text-sm">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <button onClick={scrollToForm} className="btn-outline text-sm">
                  Quero receber o material completo
                </button>
              </div>
            </div>
          </section>

          {/* ═══ GALERIA ═══ */}
          <section id="fotos" className="py-24 md:py-32 bg-card relative overflow-hidden">
            <div className="container px-4">
              <div className="text-center mb-12">
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                  CONHEÇA CADA{" "}
                  <span className="text-gold-gradient">ESPAÇO</span>
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-6xl mx-auto">
                {galleryImages.map((img, i) => {
                  const isLarge = i === 0 || i === 5;
                  return (
                    <div
                      key={i}
                      className={`relative overflow-hidden rounded-lg cursor-pointer group ${
                        isLarge ? "col-span-2 row-span-2 aspect-[4/3]" : "aspect-square"
                      }`}
                      onClick={() => setLightboxIdx(i)}
                    >
                      <img src={img.src} alt={img.alt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <p className="absolute bottom-3 left-4 text-white text-xs tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-500">{img.alt}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ═══ SEÇÃO 5 — Plantas ═══ */}
          <section ref={s5.ref as any} className="py-24 md:py-32 relative overflow-hidden">
            <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

            <div className={`container px-4 relative z-10 ${fade(s5.visible)}`}>
              <div className="grid md:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight">
                    PLANTAS PENSADAS PARA QUEM QUER{" "}
                    <span className="text-gold-gradient">ESPAÇO, CONFORTO E LIBERDADE</span>
                  </h2>
                  <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                    Os apartamentos do Hantower foram projetados para entregar uma experiência superior de moradia, com plantas inteligentes, ambientes generosos e um padrão de acabamento que reforça a proposta premium do empreendimento.
                  </p>
                  <div className="space-y-4 mb-8">
                    {["2 e 3 suítes", "84m² a 128m² privativos", "Sacada gourmet", "Apartamentos a partir do 9º andar", "Planta formatável, com possibilidade de adaptação conforme a personalização do morador"].map((t, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-foreground text-sm md:text-base pt-1">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-center gap-3 mb-6">
                    <button
                      onClick={() => setSelectedPlanta("84")}
                      className={`px-6 py-2.5 rounded-sm text-sm font-semibold tracking-wider transition-all ${
                        selectedPlanta === "84" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
                      }`}
                    >
                      84m²
                    </button>
                    <button
                      onClick={() => setSelectedPlanta("128")}
                      className={`px-6 py-2.5 rounded-sm text-sm font-semibold tracking-wider transition-all ${
                        selectedPlanta === "128" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
                      }`}
                    >
                      128m²
                    </button>
                  </div>
                  <img
                    src={selectedPlanta === "84" ? planta84 : planta128}
                    alt={`Planta ${selectedPlanta}m²`}
                    className="w-full max-h-[450px] object-contain rounded-lg"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ═══ SEÇÃO 6 — Segurança + Investimento + Público ═══ */}
          <section ref={s6.ref as any} className="py-24 md:py-32 bg-card relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />

            <div className={`container px-4 relative z-10 ${fade(s6.visible)}`}>
              <div className="max-w-5xl mx-auto space-y-12">
                {/* Segurança */}
                <div className="card-luxury flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-14 h-14 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lock className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-3">
                      Segurança e credibilidade em cada detalhe
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                      Adquirir um imóvel de alto padrão exige confiança em cada etapa do processo.
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                      O Hantower é desenvolvido por uma construtora com histórico sólido e projetos entregues, garantindo segurança na compra, padrão de execução e previsibilidade de entrega.
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Isso proporciona mais tranquilidade na tomada de decisão e reforça a consistência de um empreendimento pensado para entregar exatamente o que propõe.
                    </p>
                  </div>
                </div>

                {/* Investimento */}
                <div className="card-luxury flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-14 h-14 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-3">
                      Um imóvel que também é uma decisão estratégica
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                      Além da experiência de moradia, o Hantower também se posiciona como uma escolha inteligente para quem pensa no futuro.
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                      Empreendimentos com esse nível de diferenciação tendem a se destacar no mercado, tanto em valorização quanto em liquidez.
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Em uma cidade com oferta limitada de produtos nesse padrão, o potencial de valorização se torna ainda mais relevante, seja para revenda ou geração de renda com locações premium.
                    </p>
                  </div>
                </div>

                {/* Público */}
                <div className="card-luxury flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-14 h-14 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <Crosshair className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-4">
                      Para quem este projeto realmente faz sentido
                    </h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      O Hantower foi pensado para um público específico — e isso faz parte da sua proposta.
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-semibold text-primary mb-3">Faz sentido para quem:</p>
                        <ul className="space-y-2">
                          {[
                            "Valoriza alto padrão e diferenciação real",
                            "Busca mais conforto, exclusividade e qualidade de vida",
                            "Entende o valor de um imóvel acima da média"
                          ].map((t, i) => (
                            <li key={i} className="flex items-start gap-2 text-foreground text-sm">
                              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-3">Pode não fazer sentido para quem:</p>
                        <ul className="space-y-2">
                          {[
                            "Está buscando opções mais básicas ou econômicas",
                            "Prioriza apenas preço em vez de experiência e posicionamento"
                          ].map((t, i) => (
                            <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
                              <X className="w-4 h-4 mt-0.5 shrink-0" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══ Mobilidade e conveniência ═══ */}
          <section className="py-20 md:py-28 relative overflow-hidden">
            <div className="container px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                  TUDO PARA{" "}
                  <span className="text-gold-gradient">ACOMPANHAR O SEU RITMO.</span>
                </h2>
                <p className="text-muted-foreground text-sm mb-10">
                  O Hantower também foi pensado para entregar praticidade e eficiência no dia a dia, com estrutura compatível com um público exigente:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { icon: Building2, text: "3 elevadores" },
                    { icon: Car, text: "Vagas de garagem com espera para carregamento" },
                    { icon: Star, text: "Infraestrutura de lazer, convivência e conveniência integrada ao conceito do projeto" },
                  ].map((item, i) => (
                    <div key={i} className="card-luxury flex flex-col items-center text-center">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <item.icon className="w-7 h-7 text-primary" />
                      </div>
                      <span className="text-foreground text-sm">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ═══ Localização ═══ */}
          <section ref={s7.ref as any} id="localizacao" className="py-24 md:py-32 bg-card relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className={`container px-4 relative z-10 ${fade(s7.visible)}`}>
              <div className="max-w-4xl mx-auto text-center">
                <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-7 h-7 text-primary" />
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                  NO CENTRO DE ESTÂNCIA VELHA.{" "}
                  <span className="text-gold-gradient">PERTO DO QUE IMPORTA.</span>
                </h2>
                <p className="text-muted-foreground text-sm mb-4 max-w-xl mx-auto leading-relaxed">
                  Morar no Hantower é estar em uma localização estratégica, com a praticidade do centro e a imponência de um empreendimento que se destaca no skyline da cidade.
                </p>
                <p className="text-muted-foreground text-sm mb-4 max-w-xl mx-auto">
                  Endereço ideal para quem busca conveniência, mobilidade e valorização percebida.
                </p>
                <div className="divider-gold mx-auto my-8" />
                <p className="text-foreground font-serif text-lg font-semibold">
                  Rua Sete de Setembro, Centro, Estância Velha/RS
                </p>
              </div>
            </div>
          </section>

          {/* ═══ Acesso antecipado ═══ */}
          <section ref={s8.ref as any} className="py-24 md:py-32 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />

            <div className={`container px-4 relative z-10 ${fade(s8.visible)}`}>
              <div className="max-w-3xl mx-auto text-center">
                <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-7 h-7 text-primary" />
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                  CADASTRE-SE AGORA E TENHA{" "}
                  <span className="text-gold-gradient">ACESSO ANTECIPADO.</span>
                </h2>
                <p className="text-muted-foreground text-sm mb-8">
                  Empreendimentos com esse nível de exclusividade, metragem e conceito tendem a gerar alta procura desde o início.
                </p>
                <button onClick={scrollToForm} className="btn-primary text-sm">
                  Garantir Meu Acesso Antecipado
                </button>
              </div>
            </div>
          </section>

          {/* ═══ Condição especial ═══ */}
          <section ref={s9.ref as any} className="py-20 md:py-28 bg-card relative overflow-hidden">
            <div className={`container px-4 ${fade(s9.visible)}`}>
              <div className="max-w-3xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/40 bg-primary/10 mb-6">
                  <BadgePercent className="w-5 h-5 text-primary" />
                  <span className="text-sm font-semibold text-primary">Condição especial de lançamento</span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Parcelamento direto com a incorporadora
                </h2>
                <p className="text-muted-foreground text-sm">
                  Com 10% de entrada e saldo em 100x, corrigido pelo CUB.
                </p>
              </div>
            </div>
          </section>

          {/* ═══ FAQ ═══ */}
          <section className="py-24 md:py-32 relative overflow-hidden">
            <div className="container px-4">
              <div className="max-w-3xl mx-auto">
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12">
                  DÚVIDAS{" "}
                  <span className="text-gold-gradient">FREQUENTES</span>
                </h2>
                <FAQItem q="Onde fica o Hantower?" a="No Centro de Estância Velha, em localização privilegiada." />
                <FAQItem q="Quais são as tipologias?" a="Apartamentos de 2 e 3 suítes, com metragens entre 84m² e 128m² privativos." />
                <FAQItem q="Quais são os principais diferenciais do empreendimento?" a="O Hantower reúne atributos como 70 metros de altura, 24 andares, conceito Home Club, rooftop com piscina de borda infinita, lazer completo e plantas com proposta premium." />
                <FAQItem q="Como faço para receber as informações em primeira mão?" a="Basta preencher o cadastro para receber nosso contato imediatamente." />
              </div>
            </div>
          </section>

          {/* ═══ CTA Final ═══ */}
          <section className="py-20 md:py-32 relative overflow-hidden">
            <div className="absolute inset-0">
              <img src={fachadaImg} alt="" className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/70" />
            </div>

            <div className="container px-4 relative z-10 text-center">
              <h2 className="font-serif text-4xl md:text-6xl font-bold mb-4 text-gold-gradient">HANTOWER</h2>
              <p className="text-white/70 text-base md:text-lg mb-4 max-w-xl mx-auto">
                Um novo ícone do alto padrão em Estância Velha.
              </p>
              <p className="text-white/40 text-sm max-w-lg mx-auto mb-10">
                Se você quer receber em primeira mão todos os detalhes deste projeto, entre em contato agora e descubra por que o Hantower marca uma nova fase na cidade.
              </p>
              <button onClick={scrollToForm} className="btn-primary text-sm">
                Quero Saber Tudo Sobre o Hantower
              </button>
            </div>
          </section>

          {/* ═══ FORMULÁRIO CRM ═══ */}
          <section id="formulario" className="py-24 md:py-32 bg-background relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />

            <div className="max-w-lg mx-auto px-6 relative z-10">
              <div className="text-center mb-10">
                <div className="divider-gold mx-auto mb-6" />
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3">
                  CADASTRE-SE
                </h2>
                <p className="text-muted-foreground text-sm tracking-wide">
                  Receba informações exclusivas em primeira mão.
                </p>
              </div>
              <FormSection
                projectId={projectId}
                projectSlug="hantower"
                allowBrokerSelection={true}
              />
            </div>
          </section>
        </main>

        {/* ═══ FOOTER ═══ */}
        <footer className="py-12 bg-card border-t border-border/50">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                <strong>Observação importante:</strong> Imagens meramente ilustrativas. Informações sujeitas a alteração sem aviso prévio.
              </p>
            </div>
            <div className="flex flex-col items-center gap-6 mb-8">
              <img src={logoFooter} alt="Hantower" className="h-8 w-auto opacity-60" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Estância Velha – Centro</p>
                <p className="text-sm text-muted-foreground">Atendimento (51) 99766.8999</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} ENOVE — Todos os direitos reservados — CRECI: 24775J
              </p>
            </div>
          </div>
        </footer>

        {/* ═══ Scroll to top ═══ */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-card border border-border flex items-center justify-center text-foreground/70 hover:text-primary hover:border-primary transition-all duration-300 ${
            showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
          }`}
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </>
  );
};

export default HantowerLandingPage;
