import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, Loader2, MapPin, ChevronDown, ChevronUp, GraduationCap, HeartPulse, TreePine, Cpu, Shield, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppInput, isValidBrazilianWhatsApp } from "@/components/ui/whatsapp-input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { getLeadOriginFromUTM, getLeadOriginDetailFromUTM } from "@/hooks/use-page-tracking";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { translations, flags, type Lang } from "@/components/vivapark/translations";

const categoryIcons = [GraduationCap, HeartPulse, TreePine, Cpu, Shield, Store];

const VivaParkLandingPage = () => {
  const [lang, setLang] = useState<Lang>("pt");
  const t = translations[lang];
  const navigate = useNavigate();
  const location = useLocation();
  const isThankYou = location.pathname.endsWith("/obrigado");

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
    supabase
      .from("projects")
      .select("id")
      .eq("slug", "vivapark")
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProjectId((data as any).id);
      });
  }, []);

  const fetchBrokers = async () => {
    if (brokers.length > 0 || !projectId) return;
    setLoadingBrokers(true);
    try {
      const { data } = await supabase
        .from("broker_projects")
        .select("broker:brokers(id, name)")
        .eq("project_id", projectId)
        .eq("is_active", true);
      const list = data
        ?.map((bp) => bp.broker)
        .filter((b): b is { id: string; name: string } => b !== null)
        .sort((a, b) => a.name.localeCompare(b.name)) || [];
      setBrokers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBrokers(false);
    }
  };

  const handleToggleBroker = () => {
    if (!showBrokerSelect) fetchBrokers();
    setShowBrokerSelect(!showBrokerSelect);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast({ title: t.form_name, variant: "destructive" }); return; }
    if (!isValidBrazilianWhatsApp(whatsapp)) { toast({ title: "WhatsApp inválido", variant: "destructive" }); return; }
    if (!acceptedTerms) { toast({ title: t.form_terms_prefix, variant: "destructive" }); return; }

    setIsSubmitting(true);
    try {
      const leadId = crypto.randomUUID();
      await supabase.from("leads").insert({
        id: leadId,
        name: name.trim(),
        whatsapp,
        project_id: projectId,
        broker_id: selectedBrokerId || null,
        source: "landing_page",
        lead_origin: getLeadOriginFromUTM(),
        lead_origin_detail: getLeadOriginDetailFromUTM(),
      });
      await supabase.from("lead_attribution").insert({
        lead_id: leadId,
        project_id: projectId,
        landing_page: "vivapark",
        referrer: document.referrer || null,
        utm_source: new URLSearchParams(window.location.search).get("utm_source"),
        utm_medium: new URLSearchParams(window.location.search).get("utm_medium"),
        utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
      });
      supabase.rpc("unify_lead" as any, { _new_lead_id: leadId }).then(null, () => {});
      supabase.functions.invoke("auto-cadencia-10d", { body: { leadId } }).catch(console.warn);
      supabase.functions.invoke("notify-new-lead", {
        body: { leadId, leadName: name.trim(), leadWhatsapp: whatsapp, brokerId: selectedBrokerId || null, projectId, source: "Vivapark" },
      }).catch(console.error);

      const eventId = crypto.randomUUID();
      try {
        if (typeof window !== "undefined" && window.fbq) window.fbq("track", "Lead", {}, { eventID: eventId });
        supabase.functions.invoke("meta-conversions-api", {
          body: { event_name: "Lead", pixel_id: "4261464794069997", event_id: eventId, event_source_url: window.location.href, user_data: { ph: whatsapp, fn: name.trim() }, fbp: document.cookie.match(/_fbp=([^;]+)/)?.[1] || null, fbc: document.cookie.match(/_fbc=([^;]+)/)?.[1] || null },
        }).catch(console.warn);
      } catch {}

      const basePath = location.pathname.replace(/\/obrigado$/, "").replace(/\/+$/, "");
      navigate(`${basePath}/obrigado`, { replace: true });
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="vivapark-theme min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Vivapark Porto Belo | Investimento Inteligente</title>
        <meta name="description" content="Vivapark Porto Belo — o primeiro bairro parque do Brasil. Investimento inteligente no litoral de Santa Catarina." />
      </Helmet>

      {/* Language switcher bar */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-2">
          <span className="font-bold text-lg tracking-tight text-primary">VIVAPARK</span>
          <div className="flex gap-1">
            {(Object.keys(flags) as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`text-2xl px-2 py-1 rounded-md transition-all ${lang === l ? "bg-primary/20 scale-110 ring-2 ring-primary" : "hover:bg-muted opacity-70 hover:opacity-100"}`}
                title={flags[l].label}
              >
                {flags[l].emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="relative py-24 md:py-36 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-foreground">
            {t.headline}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t.subheadline}
          </p>
          <button onClick={scrollToForm} className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-4 rounded-lg text-lg hover:brightness-110 transition-all shadow-lg">
            {t.form_submit}
          </button>
        </div>
      </section>

      {/* SEÇÃO 1 — Abertura */}
      <section className="py-16 md:py-24 px-4 bg-card">
        <div className="max-w-3xl mx-auto space-y-6">
          {[t.s1_p1, t.s1_p2, t.s1_p3].map((p, i) => (
            <p key={i} className="text-base md:text-lg text-muted-foreground whitespace-pre-line leading-relaxed">
              {i === 2 ? <strong className="text-foreground">{p}</strong> : p}
            </p>
          ))}
        </div>
      </section>

      {/* SEÇÃO 2 — Autoridade */}
      <section className="py-16 md:py-24 px-4 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-10 text-foreground">{t.s2_title}</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {t.s2_items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-5 rounded-xl bg-card border border-border text-left">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-lg italic">{t.s2_footer}</p>
        </div>
      </section>

      {/* SEÇÃO 3 — Investidores */}
      <section className="py-16 md:py-24 px-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-foreground">{t.s3_title}</h2>
          <p className="text-muted-foreground whitespace-pre-line text-center mb-8">{t.s3_intro}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            {t.s3_factors.map((f, i) => (
              <div key={i} className="flex-1 text-center p-6 rounded-xl bg-primary/10 border border-primary/20">
                <span className="text-3xl font-bold text-primary mb-2 block">{i + 1}</span>
                <span className="text-foreground font-medium">{f}</span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-3 p-5 rounded-xl bg-background border border-border">
            <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground">{t.s3_location}</p>
              {t.s3_location_details.map((d, i) => (
                <p key={i} className="text-sm text-muted-foreground">{d}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 4 — Diferenciais */}
      <section className="py-16 md:py-24 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center text-foreground">{t.s4_title}</h2>
          <p className="text-muted-foreground whitespace-pre-line text-center mb-12">{t.s4_intro}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.s4_categories.map((cat, i) => {
              const Icon = categoryIcons[i];
              return (
                <div key={i} className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground">{cat.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {cat.items.map((item, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="text-center mt-8 text-lg font-semibold text-primary">{t.s4_footer}</p>
        </div>
      </section>

      {/* SEÇÃO 5 — Valorização */}
      <section className="py-16 md:py-24 px-4 bg-card">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t.s5_title}</h2>
          {t.s5_lines.map((l, i) => (
            <p key={i} className={`text-lg ${i === 0 ? "text-muted-foreground" : "text-foreground font-medium"}`}>{l}</p>
          ))}
          <p className="text-muted-foreground whitespace-pre-line mt-6 text-lg italic">{t.s5_conclusion}</p>
        </div>
      </section>

      {/* SEÇÃO 6 — Timing */}
      <section className="py-16 md:py-24 px-4 bg-background">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t.s6_title}</h2>
          {t.s6_lines.map((l, i) => (
            <p key={i} className="text-muted-foreground text-lg">{l}</p>
          ))}
          <p className="text-xl font-bold text-primary mt-6">{t.s6_cta}</p>
        </div>
      </section>

      {/* SEÇÃO 7 — Decisão */}
      <section className="py-16 md:py-20 px-4 bg-card">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">{t.s7_title}</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="flex-1 p-6 rounded-xl border border-border bg-background text-muted-foreground">
              {t.s7_option1}
            </div>
            <div className="flex-1 p-6 rounded-xl border-2 border-primary bg-primary/10 text-foreground font-semibold">
              {t.s7_option2}
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section id="cadastro" ref={formRef} className="py-20 md:py-28 px-4 bg-background relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="max-w-xl mx-auto relative z-10">
          {isThankYou ? (
            <div className="text-center p-10 rounded-2xl bg-card border border-border">
              <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">{t.form_success_title}</h2>
              <p className="text-muted-foreground">{t.form_success_msg}</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t.form_title}</h2>
                <p className="text-muted-foreground">{t.form_subtitle}</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5 p-8 rounded-2xl bg-card border border-border shadow-xl">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t.form_name}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder={t.form_name}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t.form_phone}</label>
                  <WhatsAppInput value={whatsapp} onChange={setWhatsapp} />
                </div>

                {/* Broker selection */}
                {projectId && (
                  <div>
                    <button type="button" onClick={handleToggleBroker} className="flex items-center gap-2 text-sm text-primary hover:underline">
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

                <div className="flex items-start gap-2">
                  <Checkbox checked={acceptedTerms} onCheckedChange={(v) => setAcceptedTerms(!!v)} id="vp-terms" />
                  <label htmlFor="vp-terms" className="text-xs text-muted-foreground leading-tight">
                    {t.form_terms_prefix}{" "}
                    <a href="/termos" target="_blank" className="underline text-primary">{t.form_terms_link}</a>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-bold text-lg hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {t.form_submit}
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 px-4 bg-card border-t border-border">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <p className="text-lg text-foreground font-medium">{t.footer_line1}</p>
          <p className="text-lg text-foreground font-medium">{t.footer_line2}</p>
          <p className="text-muted-foreground italic mt-4">{t.footer_line3}</p>
          <p className="text-xs text-muted-foreground mt-8">© {new Date().getFullYear()} Vivapark Porto Belo. Enove Inteligência Imobiliária.</p>
        </div>
      </footer>
    </div>
  );
};

export default VivaParkLandingPage;
