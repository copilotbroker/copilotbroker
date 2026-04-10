import { useEffect, useState, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { usePageTracking } from "@/hooks/use-page-tracking";
import FormSection from "@/components/FormSection";
import {
  Building2, Waves, Dumbbell, ChefHat, Shield, TrendingUp, Target,
  MapPin, Star, CheckCircle2, ChevronDown, ChevronUp, X, ChevronLeft,
  ChevronRight, Flame, Baby, Sparkles, PartyPopper, Gamepad2, ShoppingCart,
  Car, ArrowRight, Clock, BadgePercent, Lock, DollarSign, Crosshair
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

const GOLD = "#C9A84C";

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
function ScrollCTA({ text = "Quero saber tudo!", variant = "gold" }: { text?: string; variant?: "gold" | "outline" }) {
  const isOutline = variant === "outline";
  return (
    <button
      onClick={() => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" })}
      className={`group inline-flex items-center gap-2 px-8 py-4 rounded-sm font-semibold text-sm tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] ${
        isOutline ? "border-2 bg-transparent" : "text-white hover:shadow-lg"
      }`}
      style={isOutline ? { borderColor: GOLD, color: GOLD } : { backgroundColor: GOLD, boxShadow: `0 4px 20px ${GOLD}30` }}
    >
      {text}
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </button>
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

  useEffect(() => {
    const fetchProject = async () => {
      const { data } = await supabase.from("projects").select("id").eq("slug", "hantower").maybeSingle();
      if (data) setProjectId((data as any).id);
    };
    fetchProject();
  }, []);

  usePageTracking(projectId);

  const s2 = useInView();
  const s3 = useInView();
  const s4 = useInView();
  const s5 = useInView();
  const s6 = useInView();
  const s7 = useInView();
  const s8 = useInView();

  const fade = (visible: boolean) =>
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

        {/* ═══ HEADER ═══ */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100/80">
          <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between h-20 md:h-24">
            <img src={logoImg} alt="Hantower" className="h-9 md:h-11" />
            <nav className="hidden md:flex items-center gap-10 text-[13px] tracking-[0.08em] uppercase text-gray-500 font-medium">
              <a href="#sobre" className="hover:text-gray-900 transition-colors duration-300">Sobre</a>
              <a href="#fotos" className="hover:text-gray-900 transition-colors duration-300">Fotos</a>
              <a href="#diferenciais" className="hover:text-gray-900 transition-colors duration-300">Diferenciais</a>
              <a href="#localizacao" className="hover:text-gray-900 transition-colors duration-300">Localização</a>
              <a href="#formulario" className="hover:text-gray-900 transition-colors duration-300">Contato</a>
            </nav>
            <button
              onClick={() => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" })}
              className="px-6 py-3 rounded text-[11px] font-semibold tracking-[0.12em] uppercase text-white transition-all hover:shadow-lg hover:scale-[1.02]"
              style={{ backgroundColor: GOLD }}
            >
              Falar com corretor
            </button>
          </div>
        </header>

        {/* ═══ SEÇÃO 1 — HERO ═══ */}
        <section className="relative h-screen flex items-end pb-16 md:pb-24">
          <img src={fachadaImg} alt="Hantower – fachada" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 w-full">
            <div className="max-w-xl">
              <div className="w-12 h-[2px] mb-6" style={{ backgroundColor: GOLD }} />
              <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold text-white leading-[0.95] mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
                HANTOWER
              </h1>
              <p className="text-lg md:text-xl text-white/80 font-light mb-8 leading-relaxed">
                O primeiro Home Club de Estância Velha.<br className="hidden md:block" />
                24 andares. 70 metros de altura.
              </p>
              <ScrollCTA />
            </div>
          </div>
        </section>

        {/* ═══ STATS BAR ═══ */}
        <section className="bg-gray-900 py-6 md:py-8">
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "24", label: "Andares" },
              { value: "70m", label: "De altura" },
              { value: "2 e 3", label: "Suítes" },
              { value: "84-128m²", label: "Privativos" },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-2xl md:text-3xl font-bold mb-1" style={{ color: GOLD, fontFamily: "'Playfair Display', serif" }}>{s.value}</p>
                <p className="text-white/50 text-xs tracking-[0.1em] uppercase">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ SEÇÃO 2 — Posicionamento e desejo ═══ */}
        <section ref={s2.ref as any} id="sobre" className="py-24 md:py-32 px-6">
          <div className={`max-w-3xl mx-auto text-center ${fade(s2.visible)}`}>
            <p className="text-xs tracking-[0.2em] uppercase mb-6" style={{ color: GOLD }}>Um novo patamar</p>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Não é só um apartamento.<br />
              <span style={{ color: GOLD }}>É um novo patamar de vida.</span>
            </h2>
            <p className="text-gray-500 leading-[1.8] text-base md:text-lg max-w-2xl mx-auto">
              O Hantower nasce para quem não aceita o comum. Para quem valoriza arquitetura marcante, ambientes sofisticados, lazer completo e a sensação de viver em um endereço que naturalmente se destaca na cidade.
            </p>
          </div>
        </section>

        {/* ═══ IMAGEM DESTAQUE ═══ */}
        <section className="relative h-[60vh] md:h-[75vh] cursor-pointer overflow-hidden" onClick={() => setLightboxIdx(1)}>
          <img src={sacadasImg} alt="Hantower sacadas" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[1.5s]" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
          <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12">
            <p className="text-white/60 text-xs tracking-[0.15em] uppercase mb-2">Vista das sacadas</p>
            <p className="text-white text-lg md:text-2xl font-light" style={{ fontFamily: "'Playfair Display', serif" }}>Sofisticação em cada detalhe</p>
          </div>
        </section>

        {/* ═══ SEÇÃO 3 — Um empreendimento que impõe presença ═══ */}
        <section ref={s3.ref as any} id="diferenciais" className="py-20 md:py-28 px-4 bg-gray-50">
          <div className={`max-w-6xl mx-auto ${fade(s3.visible)}`}>
            <div className="text-center mb-14">
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                Um empreendimento raro.
              </h2>
              <p className="text-gray-400 text-sm md:text-base">Em um endereço que se destaca naturalmente.</p>
              <p className="text-gray-500 text-sm md:text-base mt-4 max-w-2xl mx-auto">
                No Hantower, cada detalhe foi pensado para unir imponência, estilo de vida e funcionalidade:
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Building2, text: "Maior prédio de Estância Velha" },
                { icon: Star, text: "Primeiro Home Club da região" },
                { icon: Waves, text: "Rooftop com piscina aquecida, borda infinita e raia de 20 metros" },
                { icon: CheckCircle2, text: "Apartamentos amplos, com 2 e 3 suítes" },
                { icon: ChefHat, text: "Sacada gourmet com churrasqueira" },
                { icon: Sparkles, text: "Spa com hidromassagem em unidades selecionadas" },
                { icon: MapPin, text: "Localização privilegiada no Centro de Estância Velha" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-5 rounded-lg bg-white border border-gray-100 hover:shadow-md transition-shadow">
                  <item.icon className="w-6 h-6 shrink-0 mt-0.5" style={{ color: GOLD }} />
                  <span className="text-gray-700 text-sm md:text-base">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SEÇÃO 4 — Experiência Home Club ═══ */}
        <section ref={s4.ref as any} className="py-20 md:py-28 px-4">
          <div className={`max-w-6xl mx-auto ${fade(s4.visible)}`}>
            <div className="text-center mb-14">
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Viva a sensação de estar de férias<br /><span style={{ color: GOLD }}>sem sair de casa.</span>
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base">
                O Hantower leva para o dia a dia o conceito de Home Club com uma estrutura completa para relaxar, receber, cuidar da saúde, aproveitar a família e viver momentos memoráveis.
              </p>
              <p className="text-gray-400 text-sm mt-4">Entre os diferenciais de lazer e conveniência, o empreendimento conta com:</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-12">
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
                <div key={i} className="flex flex-col items-center text-center p-5 rounded-lg bg-gray-50 border border-gray-100 hover:shadow-sm transition-shadow">
                  <item.icon className="w-7 h-7 mb-3" style={{ color: GOLD }} />
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
        <section id="fotos" className="py-20 md:py-28 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs tracking-[0.2em] uppercase text-center mb-3" style={{ color: GOLD }}>Galeria</p>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 text-center mb-12" style={{ fontFamily: "'Playfair Display', serif" }}>
              Conheça cada espaço
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
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

        {/* ═══ SEÇÃO 5 — Apartamentos e plantas ═══ */}
        <section ref={s5.ref as any} className="py-20 md:py-28 px-4">
          <div className={`max-w-6xl mx-auto ${fade(s5.visible)}`}>
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Plantas pensadas para quem quer <span style={{ color: GOLD }}>espaço, conforto e liberdade</span> para personalizar.
                </h2>
                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                  Os apartamentos do Hantower foram projetados para entregar uma experiência superior de moradia, com plantas inteligentes, ambientes generosos e um padrão de acabamento que reforça a proposta premium do empreendimento.
                </p>
                <div className="space-y-3 mb-8">
                  {["2 e 3 suítes", "84m² a 128m² privativos", "Sacada gourmet", "Apartamentos a partir do 9º andar", "Planta formatável, com possibilidade de adaptação conforme a personalização do morador"].map((t, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: GOLD }} />
                      <span className="text-gray-600 text-sm md:text-base">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-center gap-3 mb-6">
                  <button
                    onClick={() => setSelectedPlanta("84")}
                    className={`px-6 py-2.5 rounded-sm text-sm font-semibold tracking-wider transition-all ${
                      selectedPlanta === "84" ? "text-white" : "text-gray-500 bg-white border border-gray-200"
                    }`}
                    style={selectedPlanta === "84" ? { backgroundColor: GOLD } : {}}
                  >
                    84m²
                  </button>
                  <button
                    onClick={() => setSelectedPlanta("128")}
                    className={`px-6 py-2.5 rounded-sm text-sm font-semibold tracking-wider transition-all ${
                      selectedPlanta === "128" ? "text-white" : "text-gray-500 bg-white border border-gray-200"
                    }`}
                    style={selectedPlanta === "128" ? { backgroundColor: GOLD } : {}}
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

        {/* ═══ Segurança + Investimento + Público ═══ */}
        <section ref={s6.ref as any} className="py-20 md:py-28 px-4 bg-gray-50">
          <div className={`max-w-5xl mx-auto space-y-16 ${fade(s6.visible)}`}>
            {/* 🔒 Segurança */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="p-3 rounded-lg border border-gray-200 bg-white shrink-0">
                <Lock className="w-8 h-8" style={{ color: GOLD }} />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Segurança e credibilidade em cada detalhe
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-2">
                  Adquirir um imóvel de alto padrão exige confiança em cada etapa do processo.
                </p>
                <p className="text-gray-500 text-sm leading-relaxed mb-2">
                  O Hantower é desenvolvido por uma construtora com histórico sólido e projetos entregues, garantindo segurança na compra, padrão de execução e previsibilidade de entrega.
                </p>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Isso proporciona mais tranquilidade na tomada de decisão e reforça a consistência de um empreendimento pensado para entregar exatamente o que propõe.
                </p>
              </div>
            </div>

            {/* 💰 Investimento */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="p-3 rounded-lg border border-gray-200 bg-white shrink-0">
                <DollarSign className="w-8 h-8" style={{ color: GOLD }} />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Um imóvel que também é uma decisão estratégica
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-2">
                  Além da experiência de moradia, o Hantower também se posiciona como uma escolha inteligente para quem pensa no futuro.
                </p>
                <p className="text-gray-500 text-sm leading-relaxed mb-2">
                  Empreendimentos com esse nível de diferenciação tendem a se destacar no mercado, tanto em valorização quanto em liquidez.
                </p>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Em uma cidade com oferta limitada de produtos nesse padrão, o potencial de valorização se torna ainda mais relevante, seja para revenda ou geração de renda com locações premium.
                </p>
              </div>
            </div>

            {/* 🎯 Público */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="p-3 rounded-lg border border-gray-200 bg-white shrink-0">
                <Crosshair className="w-8 h-8" style={{ color: GOLD }} />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Para quem este projeto realmente faz sentido
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  O Hantower foi pensado para um público específico — e isso faz parte da sua proposta.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-semibold mb-3" style={{ color: GOLD }}>Faz sentido para quem:</p>
                    <ul className="space-y-2">
                      {[
                        "Valoriza alto padrão e diferenciação real",
                        "Busca mais conforto, exclusividade e qualidade de vida",
                        "Entende o valor de um imóvel acima da média"
                      ].map((t, i) => (
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
                      {[
                        "Está buscando opções mais básicas ou econômicas",
                        "Prioriza apenas preço em vez de experiência e posicionamento"
                      ].map((t, i) => (
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

        {/* ═══ SEÇÃO 6 — Mobilidade e conveniência ═══ */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              Tudo o que um empreendimento de alto padrão precisa para <span style={{ color: GOLD }}>acompanhar o seu ritmo.</span>
            </h2>
            <p className="text-gray-500 text-sm mb-10">
              O Hantower também foi pensado para entregar praticidade e eficiência no dia a dia, com estrutura compatível com um público exigente:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Building2, text: "3 elevadores" },
                { icon: Car, text: "Vagas de garagem com espera para carregamento" },
                { icon: Star, text: "Infraestrutura de lazer, convivência e conveniência integrada ao conceito do projeto" },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-lg bg-gray-50 border border-gray-100 text-center">
                  <item.icon className="w-7 h-7 mx-auto mb-3" style={{ color: GOLD }} />
                  <span className="text-gray-600 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SEÇÃO 7 — Localização ═══ */}
        <section ref={s7.ref as any} id="localizacao" className="py-20 md:py-28 px-4 bg-gray-50">
          <div className={`max-w-4xl mx-auto text-center ${fade(s7.visible)}`}>
            <MapPin className="w-10 h-10 mx-auto mb-4" style={{ color: GOLD }} />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              No Centro de Estância Velha. <span style={{ color: GOLD }}>Perto do que importa.</span>
            </h2>
            <p className="text-gray-500 text-sm mb-4 max-w-xl mx-auto leading-relaxed">
              Morar no Hantower é estar em uma localização estratégica, com a praticidade do centro e a imponência de um empreendimento que se destaca no skyline da cidade.
            </p>
            <p className="text-gray-500 text-sm mb-4 max-w-xl mx-auto">
              Endereço ideal para quem busca conveniência, mobilidade e valorização percebida.
            </p>
            <p className="text-gray-400 text-sm font-medium">Rua Sete de Setembro, Centro, Estância Velha/RS</p>
          </div>
        </section>

        {/* ═══ SEÇÃO 8 — Acesso antecipado ═══ */}
        <section ref={s8.ref as any} className="py-20 px-4">
          <div className={`max-w-3xl mx-auto text-center ${fade(s8.visible)}`}>
            <Clock className="w-10 h-10 mx-auto mb-4" style={{ color: GOLD }} />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Cadastre-se agora e tenha <span style={{ color: GOLD }}>acesso antecipado.</span>
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Empreendimentos com esse nível de exclusividade, metragem e conceito tendem a gerar alta procura desde o início.
            </p>
            <ScrollCTA text="Garantir meu acesso antecipado" />
          </div>
        </section>

        {/* ═══ SEÇÃO 9 — Condição especial ═══ */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border mb-6" style={{ borderColor: `${GOLD}40`, color: GOLD }}>
              <BadgePercent className="w-5 h-5" />
              <span className="text-sm font-semibold">Condição especial de lançamento</span>
            </div>
            <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Parcelamento direto com a incorporadora
            </h2>
            <p className="text-gray-500 text-sm">
              Com 10% de entrada e saldo em 100x, corrigido pelo CUB.
            </p>
          </div>
        </section>

        {/* ═══ SEÇÃO 10 — FAQ ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10" style={{ fontFamily: "'Playfair Display', serif" }}>
              Dúvidas Frequentes
            </h2>
            <FAQItem q="Onde fica o Hantower?" a="No Centro de Estância Velha, em localização privilegiada." />
            <FAQItem q="Quais são as tipologias?" a="Apartamentos de 2 e 3 suítes, com metragens entre 84m² e 128m² privativos." />
            <FAQItem q="Quais são os principais diferenciais do empreendimento?" a="O Hantower reúne atributos como 70 metros de altura, 24 andares, conceito Home Club, rooftop com piscina de borda infinita, lazer completo e plantas com proposta premium." />
            <FAQItem q="Como faço para receber as informações em primeira mão?" a="Basta preencher o cadastro para receber nosso contato imediatamente." />
          </div>
        </section>

        {/* ═══ SEÇÃO 11 — Fechamento ═══ */}
        <section className="py-20 md:py-28 px-4 text-center bg-gray-900">
          <h2 className="text-4xl md:text-6xl font-bold mb-4" style={{ color: GOLD, fontFamily: "'Playfair Display', serif" }}>HANTOWER</h2>
          <p className="text-white/70 text-base md:text-lg mb-4 max-w-xl mx-auto">
            Um novo ícone do alto padrão em Estância Velha.
          </p>
          <p className="text-white/40 text-sm max-w-lg mx-auto mb-10">
            Se você quer receber em primeira mão todos os detalhes deste projeto, entre em contato agora e descubra por que o Hantower marca uma nova fase na cidade.
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
        Quero saber tudo!
      </button>
    </>
  );
};

export default HantowerLandingPage;
