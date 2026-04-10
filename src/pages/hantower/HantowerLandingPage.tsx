import { useEffect, useState, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { usePageTracking } from "@/hooks/use-page-tracking";
import FormSection from "@/components/FormSection";
import {
  Building2, Waves, Dumbbell, ChefHat, Shield, TrendingUp, Target,
  MapPin, Star, CheckCircle2, ChevronDown, ChevronUp, X, ChevronLeft,
  ChevronRight, Flame, Baby, Sparkles, PartyPopper, Gamepad2, ShoppingCart,
  Car, ArrowRight, Clock, BadgePercent
} from "lucide-react";

import logoImg from "@/assets/hantower/logo.png";
import heroImg from "@/assets/hantower/hero-fachada.jpg";
import renderNoturna from "@/assets/hantower/render-noturna.jpg";
import renderAerea from "@/assets/hantower/render-aerea.jpg";
import img10 from "@/assets/hantower/img-10.jpg";
import img12 from "@/assets/hantower/img-12.jpg";
import img14 from "@/assets/hantower/img-14.jpg";
import img15 from "@/assets/hantower/img-15.jpg";
import img23 from "@/assets/hantower/img-23.jpg";
import img24 from "@/assets/hantower/img-24.jpg";
import img26 from "@/assets/hantower/img-26.jpg";
import planta84 from "@/assets/hantower/planta-84.jpg";
import planta128 from "@/assets/hantower/planta-128.jpg";
import logoFooter from "@/assets/hantower/logo-footer.png";

const GOLD = "#C9A84C";
const GOLD_LIGHT = "#D4B96A";

const galleryImages = [
  { src: heroImg, alt: "Fachada Hantower" },
  { src: renderNoturna, alt: "Vista noturna do Hantower" },
  { src: renderAerea, alt: "Vista aérea do empreendimento" },
  { src: img10, alt: "Área de lazer" },
  { src: img12, alt: "Espaço gourmet" },
  { src: img14, alt: "Piscina" },
  { src: img15, alt: "Rooftop" },
  { src: img23, alt: "Interior" },
  { src: img24, alt: "Detalhes do empreendimento" },
  { src: img26, alt: "Fachada lateral" },
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
        src={images[idx].src}
        alt={images[idx].alt}
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
    <div className="border-b border-gray-200">
      <button onClick={() => setOpen(!open)} className="w-full flex justify-between items-center py-5 text-left">
        <span className="text-gray-800 font-medium text-base md:text-lg pr-4">{q}</span>
        {open ? <ChevronUp className="w-5 h-5 shrink-0" style={{ color: GOLD }} /> : <ChevronDown className="w-5 h-5 shrink-0" style={{ color: GOLD }} />}
      </button>
      {open && <p className="pb-5 text-gray-500 leading-relaxed text-sm md:text-base">{a}</p>}
    </div>
  );
}

/* ── CTA Button ── */
function ScrollCTA({ text = "Falar com um corretor", variant = "gold" }: { text?: string; variant?: "gold" | "outline" }) {
  const isOutline = variant === "outline";
  return (
    <button
      onClick={() => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" })}
      className={`group inline-flex items-center gap-2 px-8 py-4 rounded-sm font-semibold text-sm tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] ${
        isOutline
          ? "border-2 bg-transparent hover:bg-opacity-10"
          : "text-white hover:shadow-lg"
      }`}
      style={isOutline
        ? { borderColor: GOLD, color: GOLD }
        : { backgroundColor: GOLD, boxShadow: `0 4px 20px ${GOLD}30` }
      }
    >
      {text}
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </button>
  );
}

/* ── Section observer hook ── */
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

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("projects").select("id").eq("slug", "hantower").maybeSingle();
      if (data) setProjectId((data as any).id);
    };
    fetch();
  }, []);

  usePageTracking(projectId);

  const s2 = useInView();
  const s3 = useInView();
  const s4 = useInView();
  const s5 = useInView();
  const s6 = useInView();
  const s7 = useInView();

  const fadeClass = (visible: boolean, delay = 0) =>
    `transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`;

  return (
    <>
      <Helmet>
        <title>Hantower | Alto Padrão em Estância Velha</title>
        <meta name="description" content="Hantower: o primeiro Home Club de Estância Velha. 24 andares, rooftop com piscina infinita, apartamentos de 2 e 3 suítes. Cadastre-se." />
      </Helmet>

      {lightboxIdx !== null && (
        <Lightbox images={galleryImages} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}

      <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* ═══ HEADER / NAV ═══ */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16 md:h-20">
            <img src={logoImg} alt="Hantower" className="h-8 md:h-10" />
            <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
              <a href="#sobre" className="hover:text-gray-900 transition-colors">Sobre</a>
              <a href="#fotos" className="hover:text-gray-900 transition-colors">Fotos</a>
              <a href="#diferenciais" className="hover:text-gray-900 transition-colors">Diferenciais</a>
              <a href="#localizacao" className="hover:text-gray-900 transition-colors">Localização</a>
              <a href="#formulario" className="hover:text-gray-900 transition-colors">Contato</a>
            </nav>
            <button
              onClick={() => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" })}
              className="px-5 py-2.5 rounded-sm text-xs font-semibold tracking-wider uppercase text-white transition-all hover:shadow-lg"
              style={{ backgroundColor: GOLD }}
            >
              Falar com um corretor
            </button>
          </div>
        </header>

        {/* ═══ HERO ═══ */}
        <section className="relative min-h-screen flex items-center pt-20">
          {/* Background image with light overlay */}
          <img src={heroImg} alt="Hantower – fachada" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/70" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-px" style={{ backgroundColor: GOLD }} />
                <span className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: GOLD }}>
                  Venha morar no
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-gray-900 leading-[1.05] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                Maior prédio de<br />Estância Velha
              </h1>

              <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-8 max-w-lg">
                com 70 metros de altura | 24 andares | 2 e 3 suites | Sacada gourmet com churrasqueira e SPA com Hidromassagem | 84m² a 128m² privativos
              </p>

              <ScrollCTA />
            </div>
          </div>
        </section>

        {/* ═══ CONDIÇÃO ESPECIAL ═══ */}
        <section className="py-16 md:py-24 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
            <div className="relative rounded-lg overflow-hidden cursor-pointer" onClick={() => setLightboxIdx(1)}>
              <img src={renderNoturna} alt="Hantower vista noturna" className="w-full h-72 md:h-96 object-cover" loading="lazy" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-px" style={{ backgroundColor: GOLD }} />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400">
                  Parcelamento direto com a incorporadora,
                </span>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                com 10% de entrada e saldo em 100x sem juros.
              </h2>
              <p className="text-gray-400 text-sm">(Corrigido pelo CUB)</p>
            </div>
          </div>
        </section>

        {/* ═══ SOBRE / PRÉ VENDA ═══ */}
        <section ref={s2.ref as any} id="sobre" className="py-20 md:py-28 px-4">
          <div className={`max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center ${fadeClass(s2.visible)}`}>
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-6"
                style={{ color: GOLD, backgroundColor: `${GOLD}10`, border: `1px solid ${GOLD}30` }}>
                ✨ Pré Venda
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Não é só um apartamento.<br />
                <span style={{ color: GOLD }}>É um novo patamar de vida.</span>
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4 text-sm md:text-base">
                Prédio mais exclusivo da cidade, com 24 andares, 2 e 3 suites. O prédio que vai mudar o conceito de investimento imobiliário em Estância Velha.
              </p>
              <p className="text-gray-500 leading-relaxed text-sm md:text-base">
                Apartamentos começam no 9º andar, e têm a planta formatável, ou seja, não tem pilares dentro do apartamento, podendo alterar a planta conforme sua própria personalização.
              </p>
            </div>
            <div className="relative rounded-lg overflow-hidden cursor-pointer" onClick={() => setLightboxIdx(2)}>
              <img src={renderAerea} alt="Vista aérea Hantower" className="w-full h-72 md:h-[420px] object-cover" loading="lazy" />
            </div>
          </div>
        </section>

        {/* ═══ DIFERENCIAIS ═══ */}
        <section ref={s3.ref as any} id="diferenciais" className="py-20 md:py-28 px-4 bg-gray-50">
          <div className={`max-w-6xl mx-auto ${fadeClass(s3.visible)}`}>
            <div className="text-center mb-14">
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                Diferenciais
              </h2>
              <p className="text-gray-400 text-sm md:text-base">Um empreendimento raro, em um endereço que se destaca naturalmente.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { icon: ChefHat, text: "Sacada gourmet com churrasqueira e SPA com Hidromassagem" },
                { icon: Building2, text: "Maior prédio da cidade, com 70 metros de altura" },
                { icon: Shield, text: "Segurança 24 Hrs" },
                { icon: Waves, text: "Rooftop com piscina com borda infinita" },
                { icon: Star, text: "2 e 3 suites" },
                { icon: CheckCircle2, text: "84m² à 128m² privativos" },
                { icon: MapPin, text: "Localização privilegiada no Centro" },
                { icon: Sparkles, text: "Primeiro Home Club da região" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center p-6 rounded-lg bg-white border border-gray-100 hover:shadow-md transition-shadow">
                  <item.icon className="w-8 h-8 mb-4" style={{ color: GOLD }} />
                  <span className="text-gray-700 text-xs md:text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 8º ANDAR – INFRAESTRUTURA ═══ */}
        <section className="py-20 md:py-28 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: GOLD }}>Oitavo andar</p>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                Infraestrutura do futuro
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { icon: ChefHat, text: "Área gourmet equipada" },
                { icon: Flame, text: "Pit fire" },
                { icon: Dumbbell, text: "Academia 100m² com vista panorâmica" },
                { icon: Star, text: "Pista de corrida com 45m" },
                { icon: Building2, text: "Coworking" },
                { icon: ShoppingCart, text: "Mini mercado com auto atendimento" },
                { icon: PartyPopper, text: "Salão de festas mobiliado e decorado" },
                { icon: Gamepad2, text: "Sala de jogos com cozinha e churrasqueira" },
                { icon: Sparkles, text: "Sauna seca e molhada" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 bg-white">
                  <item.icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: GOLD }} />
                  <span className="text-gray-600 text-xs md:text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ ROOFTOP ═══ */}
        <section ref={s4.ref as any} className="py-20 md:py-28 px-4 bg-gray-50">
          <div className={`max-w-6xl mx-auto ${fadeClass(s4.visible)}`}>
            <div className="text-center mb-14">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: GOLD }}>Rooftop</p>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                Viva a sensação de estar de férias<br /><span style={{ color: GOLD }}>sem sair de casa.</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
              {[
                { icon: Waves, text: "Piscina com borda infinita" },
                { icon: Waves, text: "Raia de 20 metros" },
                { icon: Baby, text: "Piscina infantil" },
                { icon: Sparkles, text: "Jacuzzi" },
                { icon: ChefHat, text: "Salão gourmet com vista panorâmica" },
                { icon: PartyPopper, text: "Salão de festas na cobertura" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-lg bg-white border border-gray-100">
                  <item.icon className="w-5 h-5 shrink-0" style={{ color: GOLD }} />
                  <span className="text-gray-600 text-xs md:text-sm">{item.text}</span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <ScrollCTA text="Quero receber o material completo" variant="outline" />
            </div>
          </div>
        </section>

        {/* ═══ GALERIA ═══ */}
        <section id="fotos" className="py-16 md:py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                Fotos
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {galleryImages.map((img, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-md cursor-pointer group aspect-[4/3]"
                  onClick={() => setLightboxIdx(i)}
                >
                  <img src={img.src} alt={img.alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ PLANTAS ═══ */}
        <section ref={s5.ref as any} className="py-20 md:py-28 px-4 bg-gray-50">
          <div className={`max-w-5xl mx-auto ${fadeClass(s5.visible)}`}>
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                Plantas
              </h2>
              <p className="text-gray-400 text-sm">Planta formatável, sem pilares internos.</p>
            </div>
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={() => setSelectedPlanta("84")}
                className={`px-6 py-2.5 rounded-sm text-sm font-semibold tracking-wider transition-all ${
                  selectedPlanta === "84" ? "text-white" : "text-gray-500 bg-white border border-gray-200 hover:border-gray-300"
                }`}
                style={selectedPlanta === "84" ? { backgroundColor: GOLD } : {}}
              >
                84m²
              </button>
              <button
                onClick={() => setSelectedPlanta("128")}
                className={`px-6 py-2.5 rounded-sm text-sm font-semibold tracking-wider transition-all ${
                  selectedPlanta === "128" ? "text-white" : "text-gray-500 bg-white border border-gray-200 hover:border-gray-300"
                }`}
                style={selectedPlanta === "128" ? { backgroundColor: GOLD } : {}}
              >
                128m²
              </button>
            </div>
            <div className="flex justify-center">
              <img
                src={selectedPlanta === "84" ? planta84 : planta128}
                alt={`Planta ${selectedPlanta}m²`}
                className="max-w-full max-h-[500px] object-contain rounded-lg cursor-pointer"
                onClick={() => setLightboxIdx(0)}
              />
            </div>
          </div>
        </section>

        {/* ═══ Segurança + Investimento + Público ═══ */}
        <section ref={s6.ref as any} className="py-20 md:py-28 px-4">
          <div className={`max-w-5xl mx-auto space-y-14 ${fadeClass(s6.visible)}`}>
            {[
              {
                icon: Shield,
                title: "Segurança e credibilidade em cada detalhe",
                text: "O Hantower é desenvolvido por uma construtora com histórico sólido e projetos entregues, garantindo segurança na compra, padrão de execução e previsibilidade de entrega.",
              },
              {
                icon: TrendingUp,
                title: "Um imóvel que também é uma decisão estratégica",
                text: "Empreendimentos com esse nível de diferenciação tendem a se destacar no mercado, tanto em valorização quanto em liquidez. Em uma cidade com oferta limitada de produtos nesse padrão, o potencial de valorização se torna ainda mais relevante.",
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-6 items-start">
                <div className="p-3 rounded-lg border border-gray-200 shrink-0">
                  <item.icon className="w-8 h-8" style={{ color: GOLD }} />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}

            {/* Público */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="p-3 rounded-lg border border-gray-200 shrink-0">
                <Target className="w-8 h-8" style={{ color: GOLD }} />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Para quem este projeto realmente faz sentido</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-semibold mb-3" style={{ color: GOLD }}>Faz sentido para quem:</p>
                    <ul className="space-y-2">
                      {["Valoriza alto padrão e diferenciação real", "Busca mais conforto e qualidade de vida", "Entende o valor de um imóvel acima da média"].map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: GOLD }} />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-400 mb-3">Pode não fazer sentido para quem:</p>
                    <ul className="space-y-2">
                      {["Está buscando opções mais básicas ou econômicas", "Prioriza apenas preço em vez de experiência"].map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-400 text-sm">
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
        </section>

        {/* ═══ MOBILIDADE ═══ */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
              Tudo para acompanhar <span style={{ color: GOLD }}>o seu ritmo.</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Building2, text: "3 elevadores" },
                { icon: Car, text: "Vagas com espera para carregamento elétrico" },
                { icon: Star, text: "Infraestrutura completa de lazer e conveniência" },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-lg bg-white border border-gray-100 text-center">
                  <item.icon className="w-7 h-7 mx-auto mb-3" style={{ color: GOLD }} />
                  <span className="text-gray-600 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ LOCALIZAÇÃO ═══ */}
        <section ref={s7.ref as any} id="localizacao" className="py-20 md:py-28 px-4">
          <div className={`max-w-4xl mx-auto text-center ${fadeClass(s7.visible)}`}>
            <MapPin className="w-10 h-10 mx-auto mb-4" style={{ color: GOLD }} />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Localização e Contatos
            </h2>
            <div className="space-y-2 text-gray-500 text-sm">
              <p>Estância Velha – Centro</p>
              <p>Localização Privilegiada</p>
              <p>Maior prédio da cidade, com <strong className="text-gray-700">70 metros de altura</strong></p>
              <p>Atendimento (51) 99766.8999</p>
            </div>
          </div>
        </section>

        {/* ═══ ACESSO ANTECIPADO ═══ */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-3xl mx-auto text-center">
            <Clock className="w-10 h-10 mx-auto mb-4" style={{ color: GOLD }} />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Cadastre-se agora e tenha <span style={{ color: GOLD }}>acesso antecipado.</span>
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Empreendimentos com esse nível de exclusividade tendem a gerar alta procura desde o início.
            </p>
            <ScrollCTA text="Garantir meu acesso antecipado" />
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10" style={{ fontFamily: "'Playfair Display', serif" }}>
              Dúvidas Frequentes
            </h2>
            <FAQItem q="Onde fica o Hantower?" a="No Centro de Estância Velha, em localização privilegiada." />
            <FAQItem q="Quais são as tipologias?" a="Apartamentos de 2 e 3 suítes, com metragens entre 84m² e 128m² privativos." />
            <FAQItem q="Quais são os principais diferenciais?" a="O Hantower reúne atributos como 70 metros de altura, 24 andares, conceito Home Club, rooftop com piscina de borda infinita, lazer completo e plantas com proposta premium." />
            <FAQItem q="Como faço para receber as informações em primeira mão?" a="Basta preencher o cadastro abaixo para receber nosso contato imediatamente." />
          </div>
        </section>

        {/* ═══ FECHAMENTO ═══ */}
        <section className="py-20 md:py-28 px-4 text-center bg-gray-900">
          <img src={logoFooter} alt="Hantower" className="h-12 md:h-16 mx-auto mb-6" />
          <p className="text-white/70 text-base md:text-lg mb-4 max-w-xl mx-auto">
            Um novo ícone do alto padrão em Estância Velha.
          </p>
          <p className="text-white/40 text-sm max-w-lg mx-auto mb-10">
            Se você quer receber em primeira mão todos os detalhes deste projeto, entre em contato agora.
          </p>
          <ScrollCTA text="Quero saber tudo sobre o Hantower" />
        </section>

        {/* ═══ FORMULÁRIO CRM ═══ */}
        <FormSection
          projectId={projectId}
          projectSlug="hantower"
          allowBrokerSelection={true}
        />

        {/* ═══ FOOTER ═══ */}
        <footer className="py-8 px-4 border-t border-gray-100 text-center bg-white">
          <img src={logoFooter} alt="Hantower" className="h-8 mx-auto mb-4 opacity-60" />
          <div className="text-gray-400 text-xs space-y-1">
            <p>Estância Velha – Centro | Localização Privilegiada | Maior prédio da cidade, com 70 metros de altura</p>
            <p>Atendimento (51) 99766.8999</p>
            <p className="mt-3">ENOVE {new Date().getFullYear()} - Todos Os Direitos Reservados - CRECI: 24775J</p>
            <p>Imagens meramente ilustrativas. Informações sujeitas a alteração sem aviso prévio.</p>
          </div>
        </footer>
      </div>

      {/* Floating CTA mobile */}
      <button
        onClick={() => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" })}
        className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-full font-semibold text-xs tracking-wider uppercase shadow-xl transition-all hover:scale-105 md:hidden text-white"
        style={{ backgroundColor: GOLD, boxShadow: `0 8px 30px ${GOLD}40` }}
      >
        Falar com um corretor
      </button>
    </>
  );
};

export default HantowerLandingPage;
