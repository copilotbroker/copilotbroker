import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, Loader2, MapPin, ChevronDown, ChevronUp, GraduationCap, HeartPulse, TreePine, Cpu, Shield, Store, TrendingUp, Clock, ArrowRight, BarChart3, Plane, CheckCircle, Building2, Landmark, Sun, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppInput, isValidWhatsApp } from "@/components/ui/whatsapp-input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { getLeadOriginFromUTM, getLeadOriginDetailFromUTM } from "@/hooks/use-page-tracking";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { translations, flags, type Lang } from "@/components/vivapark/translations";
import { investorTranslations } from "@/components/vivapark/investor-translations";

import heroImg from "@/assets/vivapark/0.webp";
import coastImg from "@/assets/vivapark/4.webp";
import lifestyleImg from "@/assets/vivapark/8.webp";
import loungeImg from "@/assets/vivapark/9.webp";
import rooftopImg from "@/assets/vivapark/22.webp";
import sunsetImg from "@/assets/vivapark/24.webp";
import poolImg from "@/assets/vivapark/26.webp";
import nightImg from "@/assets/vivapark/31.webp";
import facadeImg from "@/assets/vivapark/36.webp";
import streetImg from "@/assets/vivapark/44.webp";
import parkImg from "@/assets/vivapark/49.webp";
import familyImg from "@/assets/vivapark/50.webp";
import nightPanoImg from "@/assets/vivapark/51.webp";
import personImg from "@/assets/vivapark/1.webp";
import badge1Img from "@/assets/vivapark/6.webp";
import badge2Img from "@/assets/vivapark/7.webp";
import leedBadgeImg from "@/assets/vivapark/leed-badge.svg";

const categoryIcons = [GraduationCap, HeartPulse, TreePine, Cpu, Shield, Store];
const categoryImages = [familyImg, lifestyleImg, parkImg, streetImg, nightImg, loungeImg];

interface VivaParkLandingPageProps {
  brokerId?: string;
  brokerName?: string;
}

const VivaParkLandingPage = ({ brokerId: propBrokerId, brokerName }: VivaParkLandingPageProps = {}) => {
  const [lang, setLang] = useState<Lang>("pt");
  const t = translations[lang];
  const inv = investorTranslations[lang];
  const navigate = useNavigate();
  const location = useLocation();
  const isThankYou = location.pathname.endsWith("/obrigado");

  // Theme state — defaults to system preference
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
    supabase.from("projects").select("id").eq("slug", "vivapark").maybeSingle()
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
    if (!name.trim()) { toast({ title: t.form_name, variant: "destructive" }); return; }
    if (!isValidWhatsApp(whatsapp)) { toast({ title: "WhatsApp inválido", variant: "destructive" }); return; }
    if (!acceptedTerms) { toast({ title: t.form_terms_prefix, variant: "destructive" }); return; }
    setIsSubmitting(true);
    try {
      const leadId = crypto.randomUUID();
      const finalBrokerId = propBrokerId || selectedBrokerId || null;
      const finalSource = propBrokerId ? "broker_landing" : "landing_page";
      await supabase.from("leads").insert({ id: leadId, name: name.trim(), whatsapp, project_id: projectId, broker_id: finalBrokerId, source: finalSource, lead_origin: getLeadOriginFromUTM(), lead_origin_detail: getLeadOriginDetailFromUTM() });
      await supabase.from("lead_attribution").insert({ lead_id: leadId, project_id: projectId, landing_page: "vivapark", referrer: document.referrer || null, utm_source: new URLSearchParams(window.location.search).get("utm_source"), utm_medium: new URLSearchParams(window.location.search).get("utm_medium"), utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign") });
      supabase.rpc("unify_lead" as any, { _new_lead_id: leadId }).then(null, () => {});
      supabase.functions.invoke("auto-cadencia-10d", { body: { leadId } }).catch(console.warn);
      supabase.functions.invoke("notify-new-lead", { body: { leadId, leadName: name.trim(), leadWhatsapp: whatsapp, brokerId: finalBrokerId, projectId, source: "Vivapark" } }).catch(console.error);
      const eventId = crypto.randomUUID();
      try {
        if (typeof window !== "undefined" && window.fbq) window.fbq("track", "Lead", {}, { eventID: eventId });
        supabase.functions.invoke("meta-conversions-api", { body: { event_name: "Lead", pixel_id: "4261464794069997", event_id: eventId, event_source_url: window.location.href, user_data: { ph: whatsapp, fn: name.trim() }, fbp: document.cookie.match(/_fbp=([^;]+)/)?.[1] || null, fbc: document.cookie.match(/_fbc=([^;]+)/)?.[1] || null } }).catch(console.warn);
      } catch {}
      const basePath = location.pathname.replace(/\/obrigado$/, "").replace(/\/+$/, "");
      navigate(`${basePath}/obrigado`, { replace: true });
    } catch { toast({ title: "Erro", variant: "destructive" }); } finally { setIsSubmitting(false); }
  };

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className={`vivapark-theme ${vpTheme === "light" ? "vp-light" : "vp-dark"} min-h-screen bg-background text-foreground transition-colors duration-500`}>
      <Helmet>
        <title>Vivapark Porto Belo | Investimento Inteligente</title>
        <meta name="description" content="Vivapark Porto Belo — o primeiro bairro parque do Brasil. Investimento inteligente no litoral de Santa Catarina." />
      </Helmet>

      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <span className="font-serif text-xl font-bold tracking-wider text-gold-gradient">VIVAPARK</span>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-muted transition-all duration-300 text-muted-foreground hover:text-foreground"
              title={vpTheme === "dark" ? "Light mode" : "Dark mode"}
            >
              {vpTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="w-px h-5 bg-border/50 mx-1 hidden sm:block" />
            {(Object.keys(flags) as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`text-xl sm:text-2xl px-2.5 py-1.5 rounded transition-all duration-300 ${
                  lang === l
                    ? "bg-primary/20 scale-110 shadow-[0_0_15px_hsl(var(--gold)/0.3)]"
                    : "hover:bg-muted opacity-60 hover:opacity-100"
                }`}
                title={flags[l].label}
              >
                {flags[l].emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── HERO with background image ── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <img src={heroImg} alt="Vivapark Porto Belo aerial view" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />

        <div className={`relative z-10 max-w-4xl mx-auto px-4 text-center transition-all duration-1000 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="inline-flex items-center gap-1.5 px-4 py-2 mb-8 border border-primary/30 rounded-full bg-primary/10 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] sm:text-xs font-medium tracking-[0.2em] uppercase text-primary">
              {inv.badge_first_park}
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.95] mb-6">
            {t.headline.split(" ").map((word, i, arr) => (
              <span key={i}>
                {i >= arr.length - 3 ? (
                  <span className="text-gold-gradient">{word}</span>
                ) : (
                  <span className="text-foreground">{word}</span>
                )}
                {i < arr.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>

          <div className="w-16 h-px bg-primary/50 mx-auto mb-6" />

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.subheadline}
          </p>

          {/* Video */}
          <div className="max-w-2xl mx-auto mb-10 rounded-lg overflow-hidden shadow-[0_0_60px_hsl(var(--gold)/0.15)] border border-border/50">
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                key={lang}
                className="absolute inset-0 w-full h-full"
                src={lang === "en"
                  ? "https://www.youtube.com/embed/n2dt_xUeY28"
                  : lang === "fr"
                  ? "https://www.youtube.com/embed/vKkOWuJg5sg"
                  : lang === "es"
                  ? "https://www.youtube.com/embed/LKHEwubIb0M"
                  : "https://www.youtube.com/embed/EpmPylLq2PI"}
                title="Vivapark Porto Belo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>

          <button onClick={scrollToForm} className="btn-primary text-sm sm:text-base px-10 py-5">
            {t.form_submit}
          </button>
        </div>
      </section>

      {/* ── STATS RIBBON ── */}
      <section className="py-16 md:py-24 px-4 bg-card border-y border-primary/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <BarChart3 className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] sm:text-xs font-medium tracking-[0.25em] uppercase text-primary">{inv.stats_title}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {inv.stats.map((s, i) => {
              const icons = [TrendingUp, TreePine, Shield, Landmark];
              const Icon = icons[i];
              return (
                <div key={i} className="relative text-center p-6 md:p-8 rounded-xl bg-background border border-border/50 hover:border-primary/30 transition-all duration-500 group hover:shadow-[0_0_40px_hsl(var(--gold)/0.1)]">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-10 h-10 rounded-full bg-card border border-primary/30 flex items-center justify-center shadow-[0_0_20px_hsl(var(--gold)/0.15)] group-hover:shadow-[0_0_30px_hsl(var(--gold)/0.25)] transition-shadow">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <span className="block font-serif text-3xl md:text-4xl font-bold text-gold-gradient mt-3 mb-3">{s.value}</span>
                  <div className="w-8 h-px bg-primary/30 mx-auto mb-3" />
                  <span className="text-xs sm:text-sm text-muted-foreground leading-tight">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 px-4 bg-card/50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            {[t.s1_p1, t.s1_p2, t.s1_p3].map((p, i) => (
              <p key={i} className={`text-base md:text-lg whitespace-pre-line leading-relaxed ${
                i === 2 ? "text-foreground font-semibold text-lg md:text-xl" : "text-muted-foreground"
              }`}>
                {p}
              </p>
            ))}
          </div>
          <div className="relative">
            <img src={lifestyleImg} alt="Vivapark lifestyle" className="rounded-lg shadow-[0_0_60px_hsl(var(--gold)/0.1)] border border-border/50 w-full h-auto object-cover" loading="lazy" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-lg overflow-hidden border-2 border-primary/30 shadow-lg hidden md:block">
              <img src={loungeImg} alt="Lounge area" className="w-full h-full object-cover" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 2 — Autoridade ── */}
      <section className="py-20 md:py-28 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[10px] sm:text-xs font-medium tracking-[0.25em] uppercase text-primary mb-4 block">
              {t.s2_title}
            </span>
            <div className="w-10 h-px bg-primary/50 mx-auto mb-8" />
          </div>

          {/* Authority grid — 2x2 cards with images */}
          <div className="grid md:grid-cols-2 gap-6 mb-14 max-w-4xl mx-auto">

            {/* Jaime Lerner */}
            <div className="card-luxury flex flex-col items-center text-center p-6 gap-4 border border-primary/20 hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_hsl(var(--gold)/0.12)]">
              <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-primary/30 shadow-[0_0_30px_hsl(var(--gold)/0.15)]">
                <img src={personImg} alt="Jaime Lerner" className="w-full h-full object-cover object-top" loading="lazy" />
              </div>
              <h3 className="font-serif text-foreground font-semibold text-base">{t.s2_items[1]}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{t.s2_descs[0]}</p>
            </div>

            {/* Architecture Construction & Design Awards */}
            <div className="card-luxury flex flex-col items-center text-center p-6 gap-4 border border-primary/20 hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_hsl(var(--gold)/0.12)]">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-white/5 flex items-center justify-center p-3">
                <img src={badge1Img} alt="Architecture Construction & Design Awards" className="w-full h-full object-contain" loading="lazy" />
              </div>
              <h3 className="font-serif text-foreground font-semibold text-base">{t.s2_items[3]}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{t.s2_descs[1]}</p>
            </div>

            {/* DNA Paris Design Awards */}
            <div className="card-luxury flex flex-col items-center text-center p-6 gap-4 border border-primary/20 hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_hsl(var(--gold)/0.12)]">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-white flex items-center justify-center p-3">
                <img src={badge2Img} alt="DNA Paris Design Awards" className="w-full h-full object-contain" loading="lazy" />
              </div>
              <h3 className="font-serif text-foreground font-semibold text-base">{t.s2_items[0]}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{t.s2_descs[2]}</p>
            </div>

            {/* LEED Platinum */}
            <div className="card-luxury flex flex-col items-center text-center p-6 gap-4 border border-primary/20 hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_hsl(var(--gold)/0.12)]">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-white/5 flex items-center justify-center p-3">
                <img src={leedBadgeImg} alt="LEED Platinum Certification" className="w-full h-full object-contain" loading="lazy" />
              </div>
              <h3 className="font-serif text-foreground font-semibold text-base">{t.s2_items[2]}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{t.s2_descs[3]}</p>
            </div>

          </div>

          <p className="font-serif text-lg md:text-xl text-muted-foreground italic text-center max-w-3xl mx-auto">{t.s2_footer}</p>
        </div>
      </section>

      {/* ── Full-width image break — Rooftop pools ── */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <img src={rooftopImg} alt="Vivapark rooftop pools" className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
      </div>

      {/* ── SEÇÃO 3 — Investidores + location image ── */}
      <section className="py-20 md:py-28 px-4 bg-card/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[10px] sm:text-xs font-medium tracking-[0.25em] uppercase text-primary mb-4 block">
              {t.s3_title}
            </span>
            <div className="w-10 h-px bg-primary/50 mx-auto mb-8" />
            <p className="text-muted-foreground whitespace-pre-line max-w-xl mx-auto">{t.s3_intro}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {t.s3_factors.map((f, i) => (
              <div key={i} className="flex-1 text-center p-8 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-[0_0_30px_hsl(var(--gold)/0.1)]">
                <span className="font-serif text-4xl font-bold text-gold-gradient mb-3 block">0{i + 1}</span>
                <span className="text-foreground font-medium text-sm">{f}</span>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="card-luxury flex items-start gap-4">
              <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-serif font-semibold text-foreground text-lg">{t.s3_location}</p>
                {t.s3_location_details.map((d, i) => (
                  <p key={i} className="text-sm text-muted-foreground mt-1">{d}</p>
                ))}
              </div>
            </div>
            <img src={coastImg} alt="Porto Belo coast" className="rounded-lg shadow-[0_0_40px_hsl(var(--gold)/0.08)] border border-border/50 w-full h-64 object-cover" loading="lazy" />
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 4 — Diferenciais + gallery ── */}
      <section className="py-20 md:py-28 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[10px] sm:text-xs font-medium tracking-[0.25em] uppercase text-primary mb-4 block">
              {t.s4_title}
            </span>
            <div className="w-10 h-px bg-primary/50 mx-auto mb-8" />
            <p className="text-muted-foreground whitespace-pre-line max-w-xl mx-auto">{t.s4_intro}</p>
          </div>

          {/* Image gallery strip */}
          <div className="grid grid-cols-3 gap-3 mb-14 rounded-lg overflow-hidden">
            <img src={poolImg} alt="Vivapark pool area" className="w-full h-48 md:h-64 object-cover" loading="lazy" />
            <img src={streetImg} alt="Vivapark neighborhood" className="w-full h-48 md:h-64 object-cover" loading="lazy" />
            <img src={parkImg} alt="Vivapark park" className="w-full h-48 md:h-64 object-cover" loading="lazy" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {t.s4_categories.map((cat, i) => {
              const Icon = categoryIcons[i];
              const catImg = categoryImages[i];
              return (
                <div key={i} className="card-luxury group overflow-hidden p-0">
                  <div className="overflow-hidden">
                    <img src={catImg} alt={cat.title} className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-serif font-semibold text-foreground">{cat.title}</h3>
                    </div>
                    <ul className="space-y-2.5">
                      {cat.items.map((item, j) => (
                        <li key={j} className="text-sm text-muted-foreground flex items-start gap-2.5">
                          <span className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-center mt-10 font-serif text-lg font-semibold text-gold-gradient">{t.s4_footer}</p>
        </div>
      </section>

      {/* ── SEÇÃO 5 — Valorização with sunset image ── */}
      <section className="py-0 bg-card/50 relative overflow-hidden">
        <div className="grid md:grid-cols-2 min-h-[500px]">
          <div className="relative">
            <img src={sunsetImg} alt="Vivapark at sunset" className="w-full h-full object-cover min-h-[400px]" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/50 hidden md:block" />
          </div>
          <div className="flex items-center py-16 md:py-20 px-6 md:px-12">
            <div className="space-y-5 max-w-lg">
              <TrendingUp className="w-10 h-10 text-primary mb-4" />
              <h2 className="font-serif text-2xl md:text-4xl font-bold text-foreground">{t.s5_title}</h2>
              {t.s5_lines.map((l, i) => (
                <p key={i} className={`text-lg ${i === 0 ? "text-muted-foreground" : "text-foreground font-medium"}`}>{l}</p>
              ))}
              <div className="w-10 h-px bg-primary/50 my-6" />
              <p className="font-serif text-muted-foreground whitespace-pre-line text-lg italic">{t.s5_conclusion}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 6 — Timing with night image ── */}
      <section className="py-0 bg-background relative overflow-hidden">
        <div className="grid md:grid-cols-2 min-h-[500px]">
          <div className="flex items-center py-16 md:py-20 px-6 md:px-12 order-2 md:order-1">
            <div className="space-y-5 max-w-lg mx-auto md:ml-auto md:mr-0 text-center md:text-right">
              <Clock className="w-10 h-10 text-primary mb-4 mx-auto md:ml-auto md:mr-0" />
              <h2 className="font-serif text-2xl md:text-4xl font-bold text-foreground">{t.s6_title}</h2>
              {t.s6_lines.map((l, i) => (
                <p key={i} className="text-muted-foreground text-lg">{l}</p>
              ))}
              <div className="w-10 h-px bg-primary/50 my-6 mx-auto md:ml-auto md:mr-0" />
              <p className="font-serif text-xl md:text-2xl font-bold text-gold-gradient">{t.s6_cta}</p>
            </div>
          </div>
          <div className="relative order-1 md:order-2">
            <img src={nightImg} alt="Vivapark at night" className="w-full h-full object-cover min-h-[400px]" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background/50 hidden md:block" />
          </div>
        </div>
      </section>

      {/* ── Full-width image break — facade detail ── */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <img src={facadeImg} alt="Vivapark architecture" className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/40" />
      </div>

      {/* ── SC MARKET DATA ── */}
      <section className="py-20 md:py-28 px-4 bg-card/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <BarChart3 className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4">{inv.sc_title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{inv.sc_subtitle}</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
            {inv.sc_ranking.map((r, i) => (
              <div key={i} className={`card-luxury text-center p-6 ${i === 0 ? "border-primary/40 shadow-[0_0_30px_hsl(var(--gold)/0.12)]" : ""}`}>
                <span className="block font-serif text-3xl font-bold text-gold-gradient mb-1">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                <span className="block text-sm font-semibold text-foreground mb-2">{r.city}</span>
                <span className="block text-lg font-bold text-foreground">{r.price}</span>
                <span className="block text-sm font-semibold text-primary">{r.growth}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground/60">{inv.sc_source}</p>
        </div>
      </section>

      {/* ── PORTO BELO INVESTMENT ── */}
      <section className="py-20 md:py-28 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <MapPin className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4">{inv.porto_title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{inv.porto_subtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-14">
            <div className="space-y-3">
              {inv.porto_reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-card/50 transition-colors">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground text-sm">{r}</span>
                </div>
              ))}
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-foreground mb-4">{inv.porto_indicators_title}</h3>
              <div className="space-y-3">
                {inv.porto_indicators.map((ind, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border/50">
                    <TrendingUp className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{ind}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Location distances */}
          <div className="flex flex-wrap justify-center gap-4">
            {inv.location_distances.map((d, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 text-sm">
                <Plane className="w-3.5 h-3.5 text-primary" />
                <span className="text-muted-foreground">{d.place}</span>
                <span className="font-semibold text-foreground">{d.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REAL ESTATE MARKET ── */}
      <section className="py-20 md:py-28 px-4 bg-card/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Building2 className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4">{inv.market_title}</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="card-luxury">
              <p className="text-muted-foreground leading-relaxed">{inv.market_p1}</p>
            </div>
            <div className="card-luxury">
              <p className="text-muted-foreground leading-relaxed">{inv.market_p2}</p>
            </div>
          </div>

          <div className="max-w-lg mx-auto">
            <h3 className="font-serif text-lg font-semibold text-foreground mb-5 text-center">{inv.market_invest_title}</h3>
            <div className="space-y-2.5">
              {inv.market_invest_items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border/50">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 md:py-24 px-4 bg-card/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8 text-foreground">{t.s7_title}</h2>
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-stretch">
            <div className="flex-1 p-8 rounded-lg border border-border/50 bg-card text-muted-foreground text-lg flex items-center justify-center">
              {t.s7_option1}
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-primary rotate-90 sm:rotate-0" />
            </div>
            <div className="flex-1 p-8 rounded-lg border-2 border-primary bg-primary/10 text-foreground font-semibold text-lg flex items-center justify-center shadow-[0_0_30px_hsl(var(--gold)/0.15)]">
              {t.s7_option2}
            </div>
          </div>
        </div>
      </section>

      {/* ── FORM with family image background ── */}
      <section id="cadastro" ref={formRef} className="py-24 md:py-32 px-4 bg-background relative overflow-hidden">
        <img src={familyImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" loading="lazy" aria-hidden="true" />
        <div className="absolute inset-0 bg-background/80" />
        <div className="max-w-xl mx-auto relative z-10">
          {isThankYou ? (
            <div className="text-center p-12 rounded-lg bg-card border border-border/50 shadow-[0_0_60px_hsl(var(--gold)/0.1)]">
              <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="font-serif text-2xl font-bold text-foreground mb-2">{t.form_success_title}</h2>
              <p className="text-muted-foreground">{t.form_success_msg}</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-12">
                <h2 className="font-serif text-2xl md:text-4xl font-bold text-foreground mb-3">{t.form_title}</h2>
                <p className="text-muted-foreground">{t.form_subtitle}</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5 p-8 md:p-10 rounded-lg bg-card border border-border/50 shadow-[0_0_60px_hsl(var(--gold)/0.08)]">
                <div>
                  <label className="block text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2">{t.form_name}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-sm border border-border bg-input text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all"
                    placeholder={t.form_name}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2">{t.form_phone}</label>
                  <WhatsAppInput value={whatsapp} onChange={setWhatsapp} />
                </div>

                {projectId && !propBrokerId && (
                  <div>
                    <button type="button" onClick={handleToggleBroker} className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
                      {showBrokerSelect ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {t.form_broker_toggle}
                    </button>
                    {showBrokerSelect && (
                      <div className="mt-2">
                        {loadingBrokers ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Select value={selectedBrokerId} onValueChange={setSelectedBrokerId}>
                            <SelectTrigger><SelectValue placeholder={t.form_broker_placeholder} /></SelectTrigger>
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
                  <Checkbox checked={acceptedTerms} onCheckedChange={(v) => setAcceptedTerms(!!v)} id="vp-terms" className="mt-0.5" />
                  <label htmlFor="vp-terms" className="text-xs text-muted-foreground leading-tight">
                    {t.form_terms_prefix}{" "}
                    <a href="/portobelo/vivapark/termos" target="_blank" className="underline text-primary hover:text-primary/80 transition-colors">{t.form_terms_link}</a>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-4 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {t.form_submit}
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      {/* ── FOOTER with night panoramic ── */}
      <footer className="relative py-20 px-4 border-t border-border/30 overflow-hidden">
        <img src={nightPanoImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" loading="lazy" aria-hidden="true" />
        <div className="absolute inset-0 bg-card/85" />
        <div className="max-w-3xl mx-auto text-center space-y-4 relative z-10">
          <p className="font-serif text-lg md:text-xl text-foreground font-medium">{t.footer_line1}</p>
          <p className="font-serif text-lg md:text-xl text-foreground font-medium">{t.footer_line2}</p>
          <div className="w-10 h-px bg-primary/50 mx-auto my-6" />
          <p className="text-muted-foreground italic">{t.footer_line3}</p>
          <p className="text-xs text-muted-foreground/50 mt-8">© {new Date().getFullYear()} Vivapark Porto Belo. Enove Inteligência Imobiliária.</p>
        </div>
      </footer>
    </div>
  );
};

export default VivaParkLandingPage;
