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

import heroImg from "@/assets/hantower/hero-building.jpg";
import poolImg from "@/assets/hantower/rooftop-pool.jpg";
import interiorImg from "@/assets/hantower/interior-living.jpg";
import gymImg from "@/assets/hantower/gym.jpg";
import spaImg from "@/assets/hantower/spa.jpg";
import partyImg from "@/assets/hantower/party-hall.jpg";
import lobbyImg from "@/assets/hantower/lobby.jpg";
import balconyImg from "@/assets/hantower/balcony.jpg";

const GOLD = "#C9A84C";
const DARK = "#0A0A0A";
const DARK_CARD = "#141414";

const galleryImages = [
  { src: heroImg, alt: "Fachada Hantower" },
  { src: poolImg, alt: "Rooftop com piscina de borda infinita" },
  { src: interiorImg, alt: "Interior do apartamento" },
  { src: balconyImg, alt: "Sacada gourmet com churrasqueira" },
  { src: gymImg, alt: "Academia completa" },
  { src: spaImg, alt: "Spa com hidromassagem" },
  { src: partyImg, alt: "Salão de festas" },
  { src: lobbyImg, alt: "Hall de entrada" },
];

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
        onTouchEnd={e => {
          const diff = e.changedTouches[0].clientX - touchStart.current;
          if (Math.abs(diff) > 50) diff > 0 ? prev() : next();
        }}
        draggable={false}
      />
      <div className="absolute bottom-6 text-white/60 text-sm">{idx + 1} / {images.length}</div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button onClick={() => setOpen(!open)} className="w-full flex justify-between items-center py-5 text-left">
        <span className="text-white font-medium text-base md:text-lg pr-4">{q}</span>
        {open ? <ChevronUp className="w-5 h-5 shrink-0" style={{ color: GOLD }} /> : <ChevronDown className="w-5 h-5 shrink-0" style={{ color: GOLD }} />}
      </button>
      {open && <p className="pb-5 text-white/60 leading-relaxed text-sm md:text-base">{a}</p>}
    </div>
  );
}

function ScrollCTA({ text = "Quero saber tudo!" }: { text?: string }) {
  return (
    <button
      onClick={() => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" })}
      className="group inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base md:text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
      style={{ backgroundColor: GOLD, color: DARK, boxShadow: `0 12px 40px ${GOLD}40` }}
    >
      {text}
      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
    </button>
  );
}

const HantowerLandingPage = () => {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("projects").select("id").eq("slug", "hantower").maybeSingle();
      if (data) setProjectId((data as any).id);
    };
    fetch();
  }, []);

  usePageTracking(projectId);

  return (
    <>
      <Helmet>
        <title>Hantower | Alto Padrão em Estância Velha</title>
        <meta name="description" content="Hantower: o primeiro Home Club de Estância Velha. 24 andares, rooftop com piscina infinita, apartamentos de 2 e 3 suítes. Cadastre-se." />
      </Helmet>

      {lightboxIdx !== null && (
        <Lightbox images={galleryImages} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}

      <div className="min-h-screen" style={{ backgroundColor: DARK, fontFamily: "'Inter', sans-serif" }}>

        {/* ═══ HERO ═══ */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <img src={heroImg} alt="Hantower – fachada noturna" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto py-32">
            <span className="inline-block px-5 py-1.5 rounded-full text-xs font-semibold tracking-[0.2em] uppercase mb-6 border" style={{ borderColor: `${GOLD}60`, color: GOLD, backgroundColor: `${GOLD}10` }}>
              Pré-lançamento exclusivo
            </span>
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight mb-4" style={{ color: GOLD, fontFamily: "'Playfair Display', serif" }}>
              HANTOWER
            </h1>
            <p className="text-lg md:text-2xl text-white/90 font-light mb-6">
              Redefinindo o mercado imobiliário de Estância Velha
            </p>
            <p className="text-sm md:text-base text-white/60 max-w-2xl mx-auto mb-4 leading-relaxed">
              Chegou a hora de conhecer um novo marco do alto padrão na cidade. Um empreendimento criado para quem quer morar com imponência, conforto, sofisticação e uma experiência de lazer acima do comum.
            </p>
            <p className="text-base md:text-lg font-semibold text-white mb-2">
              O primeiro Home Club da região, no maior prédio de Estância Velha.
            </p>
            <p className="text-sm text-white/50 max-w-xl mx-auto mb-10">
              70m de altura · 24 andares · 2 e 3 suítes · 84m² a 128m² privativos · Sacada gourmet · Spa com hidromassagem
            </p>
            <ScrollCTA />
            <p className="mt-4 text-xs text-white/40">Receba agora mesmo todos os detalhes do Hantower.</p>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-white/30" />
          </div>
        </section>

        {/* ═══ SEÇÃO 2 — Posicionamento ═══ */}
        <section className="py-20 md:py-32 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Não é só um apartamento.<br />
              <span style={{ color: GOLD }}>É um novo patamar de vida em Estância Velha.</span>
            </h2>
            <p className="text-white/60 leading-relaxed mb-4 text-sm md:text-base">
              O Hantower nasce para quem não aceita o comum. Para quem valoriza arquitetura marcante, ambientes sofisticados, lazer completo e a sensação de viver em um endereço que naturalmente se destaca na cidade.
            </p>
            <p className="text-white/50 leading-relaxed text-sm md:text-base">
              Inspirado em referências arquitetônicas nacionais e internacionais, o empreendimento foi concebido para entregar uma experiência de bem-estar, conforto e exclusividade todos os dias.
            </p>
          </div>
        </section>

        {/* ═══ SEÇÃO 3 — Presença ═══ */}
        <section className="py-20 md:py-28 px-4" style={{ backgroundColor: DARK_CARD }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                Um empreendimento raro.
              </h2>
              <p className="text-white/50 text-sm md:text-base">Em um endereço que se destaca naturalmente.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Building2, text: "Maior prédio de Estância Velha" },
                { icon: Star, text: "Primeiro Home Club da região" },
                { icon: Waves, text: "Rooftop com piscina aquecida, borda infinita e raia de 20m" },
                { icon: CheckCircle2, text: "Apartamentos amplos, com 2 e 3 suítes" },
                { icon: ChefHat, text: "Sacada gourmet com churrasqueira" },
                { icon: Sparkles, text: "Spa com hidromassagem em unidades selecionadas" },
                { icon: MapPin, text: "Localização privilegiada no Centro de Estância Velha" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-5 rounded-xl border border-white/5 bg-white/[0.02]">
                  <item.icon className="w-6 h-6 shrink-0 mt-0.5" style={{ color: GOLD }} />
                  <span className="text-white/80 text-sm md:text-base">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ IMAGEM DESTAQUE ═══ */}
        <section className="relative h-[50vh] md:h-[70vh] cursor-pointer" onClick={() => setLightboxIdx(1)}>
          <img src={poolImg} alt="Rooftop piscina de borda infinita" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <p className="text-white/80 text-sm">Clique para ampliar</p>
          </div>
        </section>

        {/* ═══ SEÇÃO 4 — Home Club ═══ */}
        <section className="py-20 md:py-32 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Viva a sensação de estar de férias<br /><span style={{ color: GOLD }}>sem sair de casa.</span>
              </h2>
              <p className="text-white/50 max-w-2xl mx-auto text-sm md:text-base">
                O Hantower leva para o dia a dia o conceito de Home Club com uma estrutura completa para relaxar, receber, cuidar da saúde, aproveitar a família e viver momentos memoráveis.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-12">
              {[
                { icon: Waves, text: "Piscina aquecida de 20m com borda infinita" },
                { icon: Baby, text: "Piscina infantil" },
                { icon: Sparkles, text: "Hidromassagem Jacuzzi na cobertura" },
                { icon: Flame, text: "Sauna seca e molhada" },
                { icon: PartyPopper, text: "Salão de festas (60 pessoas)" },
                { icon: Star, text: "Salão Garden" },
                { icon: PartyPopper, text: "Salão de festas na cobertura" },
                { icon: Gamepad2, text: "Sala de jogos + espaço gourmet" },
                { icon: Dumbbell, text: "Academia completa" },
                { icon: Baby, text: "Brinquedoteca" },
                { icon: ShoppingCart, text: "Mercado inteligente" },
                { icon: Flame, text: "Fireplace" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                  <item.icon className="w-7 h-7 mb-3" style={{ color: GOLD }} />
                  <span className="text-white/70 text-xs md:text-sm">{item.text}</span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <ScrollCTA text="Quero receber o material completo" />
            </div>
          </div>
        </section>

        {/* ═══ GALERIA ═══ */}
        <section className="py-16 px-4" style={{ backgroundColor: DARK_CARD }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
              Galeria do Empreendimento
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {galleryImages.map((img, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-lg cursor-pointer group aspect-[4/3]"
                  onClick={() => setLightboxIdx(i)}
                >
                  <img src={img.src} alt={img.alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">Ampliar</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SEÇÃO 5 — Plantas ═══ */}
        <section className="py-20 md:py-28 px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                Plantas pensadas para quem quer <span style={{ color: GOLD }}>espaço, conforto e liberdade.</span>
              </h2>
              <p className="text-white/50 text-sm mb-8 leading-relaxed">
                Os apartamentos do Hantower foram projetados para entregar uma experiência superior de moradia, com plantas inteligentes, ambientes generosos e um padrão de acabamento premium.
              </p>
              <div className="space-y-3">
                {["2 e 3 suítes", "84m² a 128m² privativos", "Sacada gourmet com churrasqueira", "Apartamentos a partir do 9º andar", "Planta formatável e personalizável"].map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: GOLD }} />
                    <span className="text-white/70 text-sm md:text-base">{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden cursor-pointer" onClick={() => setLightboxIdx(2)}>
              <img src={interiorImg} alt="Interior do apartamento Hantower" className="w-full h-80 md:h-[420px] object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          </div>
        </section>

        {/* ═══ Segurança + Investimento + Público ═══ */}
        <section className="py-20 px-4" style={{ backgroundColor: DARK_CARD }}>
          <div className="max-w-5xl mx-auto space-y-16">
            {/* Segurança */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="p-4 rounded-xl border border-white/10 shrink-0">
                <Shield className="w-10 h-10" style={{ color: GOLD }} />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3">Segurança e credibilidade em cada detalhe</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  Adquirir um imóvel de alto padrão exige confiança em cada etapa do processo. O Hantower é desenvolvido por uma construtora com histórico sólido e projetos entregues, garantindo segurança na compra, padrão de execução e previsibilidade de entrega.
                </p>
              </div>
            </div>
            {/* Investimento */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="p-4 rounded-xl border border-white/10 shrink-0">
                <TrendingUp className="w-10 h-10" style={{ color: GOLD }} />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3">Um imóvel que também é uma decisão estratégica</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  Empreendimentos com esse nível de diferenciação tendem a se destacar no mercado, tanto em valorização quanto em liquidez. Em uma cidade com oferta limitada de produtos nesse padrão, o potencial de valorização se torna ainda mais relevante, seja para revenda ou geração de renda com locações premium.
                </p>
              </div>
            </div>
            {/* Público */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="p-4 rounded-xl border border-white/10 shrink-0">
                <Target className="w-10 h-10" style={{ color: GOLD }} />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3">Para quem este projeto realmente faz sentido</h3>
                <div className="grid md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <p className="text-sm font-semibold mb-3" style={{ color: GOLD }}>Faz sentido para quem:</p>
                    <ul className="space-y-2">
                      {["Valoriza alto padrão e diferenciação real", "Busca mais conforto, exclusividade e qualidade de vida", "Entende o valor de um imóvel acima da média"].map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-white/60 text-sm">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: GOLD }} />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/40 mb-3">Pode não fazer sentido para quem:</p>
                    <ul className="space-y-2">
                      {["Está buscando opções mais básicas ou econômicas", "Prioriza apenas preço em vez de experiência"].map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-white/40 text-sm">
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

        {/* ═══ SEÇÃO 6 — Mobilidade ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Tudo para acompanhar <span style={{ color: GOLD }}>o seu ritmo.</span>
            </h2>
            <p className="text-white/50 text-sm mb-10">Estrutura compatível com um público exigente.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Building2, text: "3 elevadores" },
                { icon: Car, text: "Vagas com espera para carregamento elétrico" },
                { icon: Star, text: "Infraestrutura completa de lazer e conveniência" },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-xl border border-white/5 bg-white/[0.02] text-center">
                  <item.icon className="w-8 h-8 mx-auto mb-3" style={{ color: GOLD }} />
                  <span className="text-white/70 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SEÇÃO 7 — Localização ═══ */}
        <section className="py-20 px-4" style={{ backgroundColor: DARK_CARD }}>
          <div className="max-w-4xl mx-auto text-center">
            <MapPin className="w-10 h-10 mx-auto mb-4" style={{ color: GOLD }} />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              No Centro de Estância Velha. <span style={{ color: GOLD }}>Perto do que importa.</span>
            </h2>
            <p className="text-white/50 text-sm mb-6 max-w-xl mx-auto leading-relaxed">
              Morar no Hantower é estar em uma localização estratégica, com a praticidade do centro e a imponência de um empreendimento que se destaca no skyline da cidade.
            </p>
            <p className="text-white/40 text-sm">Rua Sete de Setembro, Centro, Estância Velha/RS</p>
          </div>
        </section>

        {/* ═══ SEÇÃO 8 — Acesso antecipado ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Clock className="w-10 h-10 mx-auto mb-4" style={{ color: GOLD }} />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Cadastre-se agora e tenha <span style={{ color: GOLD }}>acesso antecipado.</span>
            </h2>
            <p className="text-white/50 text-sm mb-8">
              Empreendimentos com esse nível de exclusividade, metragem e conceito tendem a gerar alta procura desde o início.
            </p>
            <ScrollCTA text="Garantir meu acesso antecipado" />
          </div>
        </section>

        {/* ═══ SEÇÃO 9 — Condição ═══ */}
        <section className="py-16 px-4" style={{ backgroundColor: DARK_CARD }}>
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border mb-6" style={{ borderColor: `${GOLD}40`, color: GOLD }}>
              <BadgePercent className="w-5 h-5" />
              <span className="text-sm font-semibold">Condição especial de lançamento</span>
            </div>
            <h2 className="text-xl md:text-3xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              10% de entrada + saldo em 100x
            </h2>
            <p className="text-white/50 text-sm">Parcelamento direto com a incorporadora, corrigido pelo CUB.</p>
          </div>
        </section>

        {/* ═══ SEÇÃO 10 — FAQ ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10" style={{ fontFamily: "'Playfair Display', serif" }}>
              Dúvidas Frequentes
            </h2>
            <FAQItem q="Onde fica o Hantower?" a="No Centro de Estância Velha, em localização privilegiada." />
            <FAQItem q="Quais são as tipologias?" a="Apartamentos de 2 e 3 suítes, com metragens entre 84m² e 128m² privativos." />
            <FAQItem q="Quais são os principais diferenciais?" a="O Hantower reúne atributos como 70 metros de altura, 24 andares, conceito Home Club, rooftop com piscina de borda infinita, lazer completo e plantas com proposta premium." />
            <FAQItem q="Como faço para receber as informações em primeira mão?" a="Basta preencher o cadastro abaixo para receber nosso contato imediatamente." />
          </div>
        </section>

        {/* ═══ SEÇÃO 11 — Fechamento ═══ */}
        <section className="py-20 md:py-28 px-4 text-center" style={{ background: `linear-gradient(135deg, ${DARK_CARD} 0%, ${DARK} 100%)` }}>
          <h2 className="text-4xl md:text-6xl font-black mb-4" style={{ color: GOLD, fontFamily: "'Playfair Display', serif" }}>HANTOWER</h2>
          <p className="text-white/60 text-base md:text-lg mb-8 max-w-xl mx-auto">
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
        <footer className="py-8 px-4 border-t border-white/5 text-center">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Hantower. Imagens meramente ilustrativas. Informações sujeitas a alteração sem aviso prévio.
          </p>
        </footer>
      </div>

      {/* Floating CTA */}
      <button
        onClick={() => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" })}
        className="fixed bottom-6 right-6 z-50 px-6 py-3 rounded-full font-bold text-sm shadow-2xl transition-all hover:scale-105 md:hidden"
        style={{ backgroundColor: GOLD, color: DARK, boxShadow: `0 8px 30px ${GOLD}50` }}
      >
        Quero saber tudo!
      </button>
    </>
  );
};

export default HantowerLandingPage;
