import { useEffect, useState, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { usePageTracking } from "@/hooks/use-page-tracking";
import FormSection from "@/components/FormSection";
import {
  Building2, Waves, Dumbbell, ChefHat, Star, CheckCircle2, ChevronDown, ChevronUp, X, ChevronLeft,
  ChevronRight, Flame, Baby, Sparkles, Gamepad2, ShoppingCart,
  Car, ArrowRight, Clock, BadgePercent, MapPin, ArrowUp, Briefcase, Eye,
  Zap, Maximize, LayoutGrid, Store, ParkingCircle, Plug
} from "lucide-react";


import img01 from "@/assets/sentower/gallery/img-01.jpg";
import img02 from "@/assets/sentower/gallery/img-02.jpg";
import img03 from "@/assets/sentower/gallery/img-03.jpg";
import img04 from "@/assets/sentower/gallery/img-04.jpg";
import img05 from "@/assets/sentower/piscina-borda-infinita.png";
import img06 from "@/assets/sentower/gallery/img-06.jpg";
import img07 from "@/assets/sentower/gallery/img-07.jpg";
import img08 from "@/assets/sentower/hidromassagem-living.png";
import img09 from "@/assets/sentower/gallery/img-09.jpg";
import img10 from "@/assets/sentower/gallery/img-10.jpg";
import img11 from "@/assets/sentower/gallery/img-11.jpg";
import img12 from "@/assets/sentower/gallery/img-12.jpg";
import img13 from "@/assets/sentower/gallery/img-13.jpg";
import img14 from "@/assets/sentower/gallery/img-14.jpg";
import img15 from "@/assets/sentower/gallery/img-15.jpg";
import img16 from "@/assets/sentower/gallery/img-16.jpg";
import img17 from "@/assets/sentower/gallery/img-17.jpg";
import img18 from "@/assets/sentower/gallery/img-18.jpg";
import img19 from "@/assets/sentower/gallery/img-19.jpg";
import img20 from "@/assets/sentower/gallery/img-20.jpg";
import img21 from "@/assets/sentower/gallery/img-21.jpg";
import img22 from "@/assets/sentower/gallery/img-22.jpg";
import img23 from "@/assets/sentower/gallery/img-23.jpg";
import img24 from "@/assets/sentower/gallery/img-24.jpg";
import img25 from "@/assets/sentower/gallery/img-25.jpg";
import img26 from "@/assets/sentower/gallery/img-26.jpg";

// img-01 = fachada (hero)
const fachadaImg = img01;

const galleryImages = [
  { src: img01, alt: "Fachada Sentower" },
  { src: img02, alt: "Vista lateral do empreendimento" },
  { src: img03, alt: "Perspectiva do Sentower" },
  { src: img04, alt: "Detalhe arquitetônico" },
  { src: img05, alt: "Área externa" },
  { src: img06, alt: "Espaço de lazer" },
  { src: img07, alt: "Área gourmet" },
  { src: img08, alt: "Living decorado" },
  { src: img09, alt: "Sala de estar" },
  { src: img10, alt: "Cozinha integrada" },
  { src: img11, alt: "Suíte master" },
  { src: img12, alt: "Banheiro" },
  { src: img13, alt: "Sacada gourmet" },
  { src: img14, alt: "Área de convivência" },
  { src: img15, alt: "Piscina" },
  { src: img16, alt: "Academia" },
  { src: img17, alt: "Salão de festas" },
  { src: img18, alt: "Espaço coworking" },
  { src: img19, alt: "Spa e sauna" },
  { src: img20, alt: "Brinquedoteca" },
  { src: img21, alt: "Rooftop" },
  { src: img22, alt: "Hall de entrada" },
  { src: img23, alt: "Planta do apartamento" },
  { src: img24, alt: "Planta do loft" },
  { src: img25, alt: "Implantação" },
  { src: img26, alt: "Vista panorâmica" },
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
const SentowerLandingPage = () => {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      const { data } = await supabase.from("projects").select("id").eq("slug", "sentower").maybeSingle();
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
        <title>Sentower | O Novo Nível do Alto Padrão em Estância Velha</title>
        <meta name="description" content="Sentower: 24 pavimentos, hidromassagem integrada, planta livre e rooftop com piscina infinita em Estância Velha. Cadastre-se para acesso antecipado." />
      </Helmet>

      {lightboxIdx !== null && (
        <Lightbox images={galleryImages} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}

      <div className="hantower-theme min-h-screen bg-background text-foreground pb-14 sm:pb-0">

        {/* ═══ HERO ═══ */}
        <section
          className="relative min-h-[70vh] sm:min-h-[75vh] flex flex-col items-center justify-center overflow-hidden"
          aria-labelledby="hero-heading"
        >
          <div
            className={`absolute inset-0 transition-opacity duration-1000 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            style={{ backgroundImage: `url(${fachadaImg})`, backgroundSize: "cover", backgroundPosition: "center bottom" }}
            role="img"
            aria-label="Fachada do Sentower"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />


          <div className="relative z-10 container px-4 pt-16 sm:pt-20 text-center flex-1 flex items-center justify-center">
            <div className="max-w-4xl mx-auto">

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-6 border border-white/30 rounded-full bg-white/10 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] sm:text-xs font-medium tracking-widest uppercase text-white/90">
                  O novo nível do alto padrão
                </span>
              </div>

              <h1
                id="hero-heading"
                className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 text-white leading-[1.05] uppercase"
              >
                Existe um antes e um depois de conhecer o Sentower.
              </h1>

              <div className="w-16 h-px bg-white/40 mx-auto mb-4" />

              <p className="text-sm sm:text-base text-white/70 mb-6 max-w-2xl mx-auto">
                Apartamentos de 2 e 3 dormitórios e lofts de luxo, com hidromassagem integrada aos ambientes.
              </p>

              <button
                onClick={() => document.getElementById("sobre")?.scrollIntoView({ behavior: "smooth" })}
                className="btn-primary text-sm sm:text-base px-8 py-4 sm:px-10 sm:py-5"
              >
                Quero Conhecer o Sentower
              </button>

              <p className="text-white/40 text-xs mt-4">
                Receba agora todos os detalhes exclusivos do empreendimento.
              </p>
            </div>
          </div>

          {/* Stats no rodapé do hero */}
          <div className="relative z-10 w-full pb-6 sm:pb-8">
            <div className="grid grid-cols-4 gap-3 sm:gap-6 max-w-lg mx-auto text-center">
              {[
                { value: "24", label: "Pavimentos" },
                { value: "2 e 3", label: "Dormitórios" },
                { value: "76-124m²", label: "Privativos" },
                { value: "Hidro", label: "Integrada" },
              ].map((s, i) => (
                <div key={i}>
                  <p className="text-lg sm:text-xl font-bold font-serif text-primary">{s.value}</p>
                  <p className="text-white/50 text-[9px] sm:text-[10px] tracking-[0.1em] uppercase">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <main id="main-content" role="main">
          {/* ═══ SEÇÃO 2 — Posicionamento ═══ */}
          <section ref={s2.ref as any} id="sobre" className="py-24 md:py-32 relative overflow-hidden">
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

            <div className={`container px-4 relative z-10 ${fade(s2.visible)}`}>
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                  NÃO É SÓ MORAR.{" "}
                  <span className="text-gold-gradient">É VIVER EM UM NÍVEL ACIMA.</span>
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-4">
                  O Sentower foi criado para quem não se encaixa no comum. Para quem valoriza arquitetura moderna, liberdade de personalização e ambientes que traduzem estilo, conforto e sofisticação.
                </p>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
                  Cada detalhe do projeto foi pensado para entregar uma experiência completa: do design à funcionalidade, do lazer ao bem-estar.
                </p>
                <div className="divider-gold mx-auto" />
              </div>
            </div>
          </section>

          {/* ═══ IMAGEM DESTAQUE — Rooftop ═══ */}
          <section className="relative h-[60vh] md:h-[75vh] cursor-pointer overflow-hidden" onClick={() => setLightboxIdx(1)}>
            <img src={img05} alt="Rooftop com piscina infinita" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[1.5s]" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
            <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12">
              <p className="text-white/60 text-xs tracking-[0.15em] uppercase mb-2">Rooftop</p>
              <p className="text-white text-lg md:text-2xl font-light font-serif">Piscina de borda infinita com vista panorâmica</p>
            </div>
          </section>

          {/* ═══ SEÇÃO 3 — Diferenciais ═══ */}
          <section ref={s3.ref as any} id="diferenciais" className="py-24 md:py-32 bg-card relative overflow-hidden">
            <div className="absolute top-1/4 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />

            <div className={`container px-4 relative z-10 ${fade(s3.visible)}`}>
              <div className="text-center mb-16">
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                  DIFERENCIAIS QUE TORNAM O SENTOWER{" "}
                  <span className="text-gold-gradient">ÚNICO.</span>
                </h2>
                <p className="text-muted-foreground text-base">Um empreendimento que se destaca naturalmente na cidade.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                {[
                  { icon: Building2, text: "24 pavimentos com presença arquitetônica marcante" },
                  { icon: Eye, text: "Vista garantida a partir do 9º andar" },
                  { icon: Maximize, text: "Planta livre sem pilares internos" },
                  { icon: Waves, text: "Hidromassagem integrada aos ambientes" },
                  { icon: Store, text: "Lojas comerciais de alto padrão no térreo" },
                  { icon: ParkingCircle, text: "Garagens do 3º ao 7º pavimento" },
                  { icon: Plug, text: "Infraestrutura para carros elétricos" },
                  { icon: Zap, text: "Três elevadores" },
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

          {/* ═══ IMAGEM BREAK — Living com Hidro ═══ */}
          <section className="relative h-[45vh] md:h-[55vh] overflow-hidden cursor-pointer" onClick={() => setLightboxIdx(2)}>
            <img src={img08} alt="Living com hidromassagem" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[1.5s]" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12">
              <p className="text-white/60 text-xs tracking-[0.15em] uppercase mb-2">Diferencial exclusivo</p>
              <p className="text-white text-lg md:text-2xl font-light font-serif">Hidromassagem integrada ao living</p>
            </div>
          </section>

          {/* ═══ SEÇÃO 4 — Home Club ═══ */}
          <section ref={s4.ref as any} className="py-24 md:py-32 relative overflow-hidden">
            <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />

            <div className={`container px-4 relative z-10 ${fade(s4.visible)}`}>
              <div className="text-center mb-16">
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                  VIVER AQUI É TRANSFORMAR ROTINA{" "}
                  <span className="text-gold-gradient">EM EXPERIÊNCIA.</span>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
                  O Sentower entrega um Home Club elevado a outro nível, com ambientes pensados para lazer, relaxamento, produtividade e convivência.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto mb-12">
                {[
                  { icon: ChefHat, text: "Área gourmet panorâmica" },
                  { icon: Flame, text: "Garden Grill integrado ao pit fire" },
                  { icon: Dumbbell, text: "Academia com vista panorâmica e espaço yoga" },
                  { icon: ArrowRight, text: "Pista de corrida" },
                  { icon: Briefcase, text: "Coworking" },
                  { icon: ShoppingCart, text: "Mini mercado com autoatendimento" },
                  { icon: Star, text: "Salão Supreme para eventos" },
                  { icon: Baby, text: "Brinquedoteca" },
                  { icon: Gamepad2, text: "Sala de jogos integrada ao salão de festas" },
                  { icon: Flame, text: "Sauna seca e molhada" },
                  { icon: Sparkles, text: "Sala de massagem" },
                  { icon: Star, text: "Pet place" },
                  { icon: Waves, text: "Piscina com borda infinita no rooftop" },
                  { icon: ChefHat, text: "Salão gourmet no rooftop com vista panorâmica" },
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
                  const isLarge = i === 0 || i === 4;
                  return (
                    <div
                      key={i}
                      className={`relative overflow-hidden rounded-lg cursor-pointer group aspect-square ${
                        isLarge ? "md:col-span-2 md:row-span-2 md:aspect-[4/3]" : ""
                      }`}
                      onClick={() => setLightboxIdx(i)}
                    >
                      <img src={img.src} alt={img.alt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ═══ SEÇÃO 5 — Tipologias ═══ */}
          <section ref={s5.ref as any} className="py-24 md:py-32 relative overflow-hidden">
            <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

            <div className={`container px-4 relative z-10 ${fade(s5.visible)}`}>
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight">
                    PLANTAS QUE SE ADAPTAM{" "}
                    <span className="text-gold-gradient">AO SEU ESTILO DE VIDA.</span>
                  </h2>
                  <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
                    O Sentower oferece opções exclusivas, pensadas para diferentes perfis, mas com o mesmo padrão de sofisticação.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { tipo: "Loft de luxo", quartos: "1 suíte", area: "76 m²", destaque: "Hidromassagem integrada ao living" },
                    { tipo: "Apartamento", quartos: "2 suítes", area: "100 m²", destaque: "Hidromassagem na área gourmet" },
                    { tipo: "Apartamento", quartos: "3 dormitórios (2 suítes)", area: "124 m²", destaque: "Hidromassagem integrada ao living" },
                  ].map((t, i) => (
                    <div key={i} className="card-luxury text-center">
                      <p className="text-primary font-serif text-lg font-semibold mb-1">{t.tipo}</p>
                      <p className="text-foreground font-medium text-sm mb-1">{t.quartos}</p>
                      <p className="text-3xl font-bold font-serif text-foreground mb-3">{t.area}</p>
                      <div className="w-10 h-px bg-primary/40 mx-auto mb-3" />
                      <p className="text-muted-foreground text-xs">{t.destaque}</p>
                    </div>
                  ))}
                </div>

                <div className="text-center mt-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">Planta livre, sem pilares internos — personalização total</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══ SEÇÃO 6 — Mobilidade ═══ */}
          <section ref={s6.ref as any} className="py-20 md:py-28 bg-card relative overflow-hidden">
            <div className={`container px-4 ${fade(s6.visible)}`}>
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                  ESTRUTURA PENSADA PARA{" "}
                  <span className="text-gold-gradient">ACOMPANHAR O SEU RITMO.</span>
                </h2>
                <p className="text-muted-foreground text-sm mb-10">
                  O Sentower entrega uma experiência completa também no dia a dia.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { icon: ParkingCircle, text: "Estacionamento em múltiplos pavimentos" },
                    { icon: Plug, text: "Infraestrutura para carregamento de veículos elétricos" },
                    { icon: Building2, text: "Integração entre áreas comerciais e residenciais com elevadores modernos" },
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

          {/* ═══ SEÇÃO 7 — Localização ═══ */}
          <section ref={s7.ref as any} id="localizacao" className="py-24 md:py-32 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className={`container px-4 relative z-10 ${fade(s7.visible)}`}>
              <div className="max-w-4xl mx-auto text-center">
                <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-7 h-7 text-primary" />
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                  EM ESTÂNCIA VELHA,{" "}
                  <span className="text-gold-gradient">COM PRESENÇA E VALORIZAÇÃO.</span>
                </h2>
                <p className="text-muted-foreground text-sm mb-4 max-w-xl mx-auto leading-relaxed">
                  Morar no Sentower é estar em uma localização estratégica, com acesso facilitado e valorização garantida.
                </p>
                <p className="text-muted-foreground text-sm mb-4 max-w-xl mx-auto">
                  Um empreendimento que não apenas se integra à cidade — ele se destaca nela.
                </p>
                <div className="divider-gold mx-auto my-8" />
                <p className="text-foreground font-serif text-lg font-semibold">
                  Estância Velha/RS
                </p>
              </div>
            </div>
          </section>

          {/* ═══ SEÇÃO 8 — Urgência ═══ */}
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
                <p className="text-muted-foreground text-sm mb-4">
                  Projetos com esse nível de exclusividade, arquitetura e diferenciais não ficam disponíveis por muito tempo.
                </p>
                <p className="text-muted-foreground text-sm mb-8 font-medium">
                  Quem chega antes escolhe melhor.
                </p>
                <button onClick={scrollToForm} className="btn-primary text-sm">
                  Garantir Meu Acesso Antecipado
                </button>
              </div>
            </div>
          </section>

          {/* ═══ SEÇÃO 9 — Condição comercial ═══ */}
          <section ref={s9.ref as any} className="py-20 md:py-28 bg-card relative overflow-hidden">
            <div className={`container px-4 ${fade(s9.visible)}`}>
              <div className="max-w-3xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/40 bg-primary/10 mb-6">
                  <BadgePercent className="w-5 h-5 text-primary" />
                  <span className="text-sm font-semibold text-primary">Condição especial</span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Facilidade para entrar em um novo padrão de vida.
                </h2>
                <div className="flex justify-center gap-8 mb-6">
                  <div>
                    <p className="text-3xl font-bold font-serif text-primary">10%</p>
                    <p className="text-sm text-muted-foreground">Entrada</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold font-serif text-primary">100x</p>
                    <p className="text-sm text-muted-foreground">Parcelas</p>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">
                  Uma condição pensada para tornar acessível um empreendimento de alto padrão.
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
                <FAQItem q="Onde fica o Sentower?" a="Em Estância Velha, em localização estratégica e valorizada." />
                <FAQItem q="Quais são as tipologias?" a="Lofts de luxo, apartamentos de 2 suítes e apartamentos de 3 dormitórios com até 124 m²." />
                <FAQItem q="Quais os diferenciais?" a="Planta livre, hidromassagem integrada, rooftop com piscina infinita, Home Club completo e vista garantida." />
                <FAQItem q="Como faço para receber informações?" a="Basta preencher o cadastro e você recebe o contato imediatamente." />
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
              <h2 className="font-serif text-4xl md:text-6xl font-bold mb-4 text-gold-gradient">SENTOWER</h2>
              <p className="text-white/70 text-base md:text-lg mb-4 max-w-xl mx-auto">
                Mais do que um empreendimento. Um novo padrão em Estância Velha.
              </p>
              <p className="text-white/40 text-sm max-w-lg mx-auto mb-10">
                Se você busca exclusividade, sofisticação e liberdade para viver do seu jeito, o Sentower foi feito para você. Entre em contato agora e descubra todos os detalhes deste projeto único.
              </p>
              <button onClick={scrollToForm} className="btn-primary text-sm">
                Quero Saber Tudo Sobre o Sentower
              </button>
            </div>
          </section>

          {/* ═══ FORMULÁRIO CRM ═══ */}
          <section id="formulario" className="py-24 md:py-32 bg-background relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />

            <div className="max-w-lg mx-auto px-6 relative z-10">
              <div className="text-center mb-10">
                <div className="divider-gold mx-auto mb-6" />
              </div>
              <FormSection
                projectId={projectId}
                projectSlug="sentower"
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
              <span className="font-serif text-2xl font-bold text-muted-foreground/60 tracking-wider">SENTOWER</span>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Estância Velha – RS</p>
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

export default SentowerLandingPage;
