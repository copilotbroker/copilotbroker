import { useEffect, useRef, useState } from "react";
import logoEnove from "@/assets/logo-enove-select.png";

const WhatsAppIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const ArrowDown = ({ className = "" }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M19 12l-7 7-7-7"/>
  </svg>
);

/* ─── Intersection Observer hook for scroll-triggered animations ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

const Reveal = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const Section = ({ children, className = "", dark = false, id }: { children: React.ReactNode; className?: string; dark?: boolean; id?: string }) => (
  <section id={id} className={`relative py-16 md:py-24 lg:py-28 px-5 md:px-8 ${dark ? "bg-[#0a0a0a] text-white" : "bg-[#f5f0e8] text-[#1a1a1a]"} ${className}`}>
    <div className="max-w-5xl mx-auto">{children}</div>
  </section>
);

const SectionLabel = ({ children, number }: { children: React.ReactNode; number?: string }) => (
  <Reveal>
    <div className="flex items-center gap-3 mb-5 md:mb-7">
      {number && (
        <span className="font-serif text-[#c9a84c]/70 text-sm tabular-nums">{number}</span>
      )}
      <span className="h-px w-8 bg-[#c9a84c]/40" />
      <span className="text-[10px] md:text-xs font-semibold tracking-[0.3em] uppercase text-[#c9a84c]">
        {children}
      </span>
    </div>
  </Reveal>
);

const SectionTitle = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => (
  <Reveal delay={100}>
    <h2 className={`font-serif text-[1.75rem] sm:text-3xl md:text-4xl lg:text-[2.75rem] font-semibold leading-[1.15] tracking-tight mb-6 md:mb-8 ${light ? "text-white" : "text-[#1a1a1a]"}`}>
      {children}
    </h2>
  </Reveal>
);

const Highlight = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[#c9a84c]">{children}</span>
);

const Divider = () => (
  <div className="w-16 h-px bg-gradient-to-r from-[#c9a84c]/60 to-transparent my-6 md:my-9" />
);

const BulletList = ({ items, light = false }: { items: string[]; light?: boolean }) => (
  <ul className={`space-y-3 text-sm md:text-base leading-relaxed ${light ? "text-white/75" : "text-[#1a1a1a]/75"}`}>
    {items.map((item, i) => (
      <Reveal key={i} delay={i * 50}>
        <li className="flex items-start gap-3.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] mt-2 shrink-0" />
          <span>{item}</span>
        </li>
      </Reveal>
    ))}
  </ul>
);

const Quote = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => (
  <Reveal>
    <blockquote className={`relative pl-6 md:pl-7 py-2 font-serif italic text-lg md:text-xl lg:text-2xl leading-relaxed ${light ? "text-white/85" : "text-[#1a1a1a]/85"}`}>
      <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#c9a84c] via-[#c9a84c]/60 to-transparent" />
      {children}
    </blockquote>
  </Reveal>
);

/* ─── Main Page ─── */
const Canela = () => {
  useEffect(() => {
    document.title = "Lançamento em Canela | Operação Enove";
    window.scrollTo(0, 0);
  }, []);

  const whatsappUrl = "https://wa.me/5551997010323?text=" + encodeURIComponent("Olá! Vim pela apresentação do lançamento em Canela. Quero conversar sobre a parceria.");

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans antialiased selection:bg-[#c9a84c]/30 selection:text-white">

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-5 text-center bg-[#0a0a0a] overflow-hidden">
        {/* Ambient gold glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#c9a84c]/[0.06] blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#c9a84c]/[0.04] blur-[100px] pointer-events-none" />

        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iLjA1Ii8+PC9zdmc+')]" />

        {/* Top corner accents */}
        <div className="absolute top-6 left-6 md:top-8 md:left-8 w-10 h-10 border-l border-t border-[#c9a84c]/30" />
        <div className="absolute top-6 right-6 md:top-8 md:right-8 w-10 h-10 border-r border-t border-[#c9a84c]/30" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-10 animate-[fadeIn_1.2s_ease-out]">
          <img src={logoEnove} alt="Enove" className="h-20 md:h-24 mx-auto opacity-80" />

          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#c9a84c]/25 bg-[#c9a84c]/5 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
            <span className="text-[10px] md:text-xs font-medium tracking-[0.25em] uppercase text-[#c9a84c]">
              Proposta Exclusiva · Canela / RS
            </span>
          </div>

          <div className="space-y-5">
            <h1 className="font-serif text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-white leading-[1.05] tracking-tight">
              Lançamento em<br />
              <span className="text-[#c9a84c] italic font-normal">Canela</span>
            </h1>
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-[#c9a84c]/40" />
              <p className="text-[10px] md:text-xs text-white/55 tracking-[0.3em] uppercase">
                Operação Completa de Lançamento
              </p>
              <span className="h-px w-8 bg-[#c9a84c]/40" />
            </div>
          </div>

          <p className="text-base md:text-lg lg:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed font-light">
            Comercial, tecnologia, evento e governança em uma única operação.<br className="hidden md:block" />
            <span className="text-white/50">Desenhada para vender mais, com mais controle e menos ruído.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 bg-[#c9a84c] hover:bg-[#d4b35a] text-[#0a0a0a] font-semibold px-7 py-3.5 rounded-full text-sm md:text-base transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_10px_40px_-10px_rgba(201,168,76,0.6)]"
            >
              <WhatsAppIcon className="w-4 h-4 md:w-5 md:h-5" />
              Conversar agora
            </a>
            <a
              href="#posicionamento"
              className="group inline-flex items-center gap-2 text-white/70 hover:text-[#c9a84c] text-sm md:text-base transition-colors duration-300"
            >
              Conhecer a proposta
              <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-5 h-8 border border-white/20 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-[#c9a84c]/60 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* ═══════════ POSICIONAMENTO ═══════════ */}
      <Section dark id="posicionamento">
        <SectionLabel number="01">Posicionamento</SectionLabel>
        <SectionTitle light>
          Lançamentos exigem <Highlight>método</Highlight>.<br />Não improviso.
        </SectionTitle>
        <Reveal delay={200}>
          <p className="text-white/60 text-base md:text-lg leading-relaxed max-w-2xl">
            Lançar um empreendimento não é abrir vendas.<br />
            É construir posicionamento, gerar demanda qualificada e executar uma operação comercial estruturada.
          </p>
        </Reveal>
        <Divider />
        <Quote light>
          Grandes empreendimentos não nascem em bairros consolidados. Eles consolidam bairros.
        </Quote>
        <Reveal delay={250}>
          <div className="mt-9">
            <p className="text-white/50 text-[11px] uppercase tracking-[0.25em] mb-4">Nosso Papel</p>
            <BulletList light items={["Criar uma nova narrativa", "Elevar a percepção de valor"]} />
          </div>
        </Reveal>
        <Divider />
        <Reveal delay={300}>
          <p className="text-[#c9a84c] font-serif italic text-lg md:text-xl">
            A Enove nasceu com esse foco.
          </p>
        </Reveal>
      </Section>

      {/* ═══════════ QUEM SOMOS ═══════════ */}
      <Section>
        <SectionLabel number="02">Quem Somos</SectionLabel>
        <SectionTitle>
          <Highlight>12 anos</Highlight> de atuação em lançamentos imobiliários
        </SectionTitle>
        <Reveal delay={150}>
          <p className="text-[#1a1a1a]/75 text-base md:text-lg leading-relaxed mb-8 max-w-3xl">
            O setor de lançamentos da Enove nasceu de um projeto embrionário com o <strong>Horizon Clube Residencial</strong>,
            premiado pelo desempenho do lançamento. Desde então, lançamos empreendimentos lado a lado com incorporadoras,
            atuando em todas as etapas:
          </p>
        </Reveal>
        <BulletList items={[
          "Concepção do produto",
          "Estruturação estratégica",
          "Geração de demanda",
          "Execução comercial",
          "Venda da última unidade",
        ]} />
        <Divider />
        <Quote>Nosso objetivo é simples: maximizar velocidade de vendas e valorização do produto.</Quote>
      </Section>

      {/* ═══════════ O QUE ENTREGAMOS ═══════════ */}
      <Section dark>
        <SectionLabel number="03">O Que Entregamos</SectionLabel>
        <SectionTitle light>
          Operação <Highlight>completa</Highlight> de lançamentos
        </SectionTitle>
        <Reveal delay={150}>
          <p className="text-white/60 text-base md:text-lg mb-8">
            Não somos apenas intermediadores.<br />
            Somos uma estrutura completa de lançamento:
          </p>
        </Reveal>
        <BulletList light items={[
          "Planejamento estratégico",
          "Estrutura de marketing própria",
          "Gestão comercial especializada",
          "Operação orientada por dados",
          "Segurança jurídica e LGPD",
        ]} />
        <Divider />
        <Reveal delay={300}>
          <p className="text-[#c9a84c] font-serif italic text-lg md:text-xl">
            Marketing e vendas integrados desde o primeiro dia.
          </p>
        </Reveal>
      </Section>

      {/* ═══════════ MARKETING ═══════════ */}
      <Section>
        <SectionLabel number="04">Equipe de Marketing Própria</SectionLabel>
        <SectionTitle>
          Planejamento, criação e <Highlight>execução</Highlight>
        </SectionTitle>
        <BulletList items={[
          "Posicionamento e naming",
          "Branding e storytelling",
          "Estratégia de mídia e tráfego pago",
          "Landing pages e funis",
          "Automação e nutrição de leads",
          "Campanhas de conversão",
        ]} />
        <Divider />
        <Quote>Tudo interno. Sem dependência de terceiros.</Quote>
      </Section>

      {/* ═══════════ CORRETORES ═══════════ */}
      <Section dark>
        <SectionLabel number="05">Corretores de Alta Performance</SectionLabel>
        <SectionTitle light>
          Especialistas em <Highlight>lançamentos</Highlight>
        </SectionTitle>
        <BulletList light items={[
          "Processo comercial estruturado",
          "Scripts e playbooks próprios",
          "Gestão ativa de leads",
          "Métricas de conversão monitoradas",
          "Cultura de metas e performance",
        ]} />
        <Divider />
        <Reveal>
          <p className="text-[#c9a84c] font-serif italic text-lg md:text-xl">
            Cada lead é tratado como uma oportunidade real.
          </p>
        </Reveal>
      </Section>

      {/* ═══════════ PRODUÇÃO ═══════════ */}
      <Section>
        <SectionLabel number="06">Produção</SectionLabel>
        <SectionTitle>
          Renderização 3D e conteúdo audiovisual de <Highlight>alto padrão</Highlight>
        </SectionTitle>
        <Reveal delay={150}>
          <p className="text-[#1a1a1a]/75 text-base md:text-lg leading-relaxed mb-8 max-w-3xl">
            Produção visual completa para sustentar o posicionamento do produto e potencializar a percepção de valor desde o primeiro contato.
          </p>
        </Reveal>
        <BulletList items={[
          "Elaboração completa de renderização 3D",
          "Imagens ultra realistas, com vida",
          "Vídeos profissionais com narrativa de produto",
          "Conteúdo visual pronto para campanhas de mídia",
        ]} />
        <Divider />
        <Quote>Imagem é o primeiro contrato emocional do cliente com o produto.</Quote>
      </Section>

      {/* ═══════════ TECNOLOGIA E DADOS ═══════════ */}
      <Section dark>
        <SectionLabel number="07">Tecnologia e Dados</SectionLabel>
        <SectionTitle light>
          Operação orientada por <Highlight>dados</Highlight>
        </SectionTitle>
        <BulletList light items={[
          "CRM exclusivo para lançamentos",
          "Distribuição inteligente de leads",
          "Monitoramento de tempo de resposta",
          "Acompanhamento de taxa de conversão",
          "Funil comercial rastreável",
        ]} />
        <Divider />
        <Quote light>Decisão baseada em número, não em opinião.</Quote>
      </Section>

      {/* ═══════════ LGPD ═══════════ */}
      <Section>
        <SectionLabel number="08">LGPD e Segurança</SectionLabel>
        <SectionTitle>
          Processo adaptado à <Highlight>LGPD</Highlight>
        </SectionTitle>
        <BulletList items={[
          "Processos auditáveis",
          "Tratamento legal de dados",
          "Proteção da incorporadora",
          "Segurança jurídica",
        ]} />
        <Divider />
        <Reveal>
          <p className="text-[#1a1a1a]/75 text-base md:text-lg">
            Parceiros precisam de segurança.<br />
            <span className="text-[#c9a84c] font-semibold">Nós entregamos.</span>
          </p>
        </Reveal>
      </Section>

      {/* ═══════════ MODELO DE ATUAÇÃO ═══════════ */}
      <Section dark>
        <SectionLabel number="09">Modelo de Atuação</SectionLabel>
        <SectionTitle light>
          Ciclo <Highlight>completo</Highlight> do lançamento
        </SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-6 mt-12">
          <Reveal delay={0}>
            <div className="border border-white/10 rounded-lg p-6 md:p-8 hover:border-[#c9a84c]/40 transition-all duration-300 hover:-translate-y-1 group h-full">
              <div className="text-[#c9a84c] font-serif text-4xl md:text-5xl font-semibold mb-3 group-hover:scale-105 transition-transform origin-left">01</div>
              <h3 className="font-serif text-xl md:text-2xl font-semibold mb-2 text-white">Pré-lançamento</h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-5">Construção da base de demanda</p>
              <ul className="space-y-2 text-sm text-white/65">
                <li>• Estratégia comercial</li>
                <li>• Jornada do cliente</li>
                <li>• Captação de leads</li>
                <li>• Lista qualificada</li>
                <li>• Testes de preço e aceitação</li>
              </ul>
              <div className="mt-5 pt-4 border-t border-white/10">
                <p className="font-serif italic text-sm text-[#c9a84c]">Antes de vender, construímos mercado.</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="relative border border-[#c9a84c]/40 rounded-lg p-6 md:p-8 bg-gradient-to-br from-[#c9a84c]/[0.08] to-[#c9a84c]/[0.02] hover:border-[#c9a84c]/70 transition-all duration-300 hover:-translate-y-1 group h-full">
              <div className="absolute top-3 right-3 text-[9px] uppercase tracking-[0.2em] text-[#c9a84c]/70 font-semibold">Foco</div>
              <div className="text-[#c9a84c] font-serif text-4xl md:text-5xl font-semibold mb-3 group-hover:scale-105 transition-transform origin-left">02</div>
              <h3 className="font-serif text-xl md:text-2xl font-semibold mb-2 text-white">Lançamento</h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-5">Execução coordenada</p>
              <ul className="space-y-2 text-sm text-white/80">
                <li>• Gestão de plantões</li>
                <li>• Acompanhamento em tempo real</li>
                <li>• Conversão intensiva</li>
                <li>• Estratégia de escassez</li>
                <li>• Propostas de intenção estruturadas</li>
              </ul>
              <div className="mt-5 pt-4 border-t border-[#c9a84c]/20">
                <p className="font-serif italic text-sm text-[#c9a84c]">Velocidade é percepção de valor.</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <div className="border border-white/10 rounded-lg p-6 md:p-8 hover:border-[#c9a84c]/40 transition-all duration-300 hover:-translate-y-1 group h-full">
              <div className="text-[#c9a84c] font-serif text-4xl md:text-5xl font-semibold mb-3 group-hover:scale-105 transition-transform origin-left">03</div>
              <h3 className="font-serif text-xl md:text-2xl font-semibold mb-2 text-white">Pós-lançamento</h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-5">Até a última unidade</p>
              <ul className="space-y-2 text-sm text-white/65">
                <li>• Gestão de estoque</li>
                <li>• Campanhas específicas</li>
                <li>• Estratégia de giro</li>
                <li>• Relacionamento contínuo</li>
              </ul>
              <div className="mt-5 pt-4 border-t border-white/10">
                <p className="font-serif italic text-sm text-[#c9a84c]">Nosso compromisso não termina no evento de lançamento.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ═══════════ DIVISOR EDITORIAL ═══════════ */}
      <section className="relative bg-[#f5f0e8] py-12 md:py-16 px-5 overflow-hidden">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <p className="text-[10px] md:text-xs font-semibold tracking-[0.4em] uppercase text-[#c9a84c] mb-4">
              ─ Aplicação Prática ─
            </p>
            <p className="font-serif text-xl md:text-2xl lg:text-3xl text-[#1a1a1a]/85 italic leading-relaxed">
              A partir daqui, o método encontra <span className="text-[#c9a84c] not-italic font-semibold">Canela</span>.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ TRANSIÇÃO PARA CANELA ═══════════ */}
      <Section>
        <SectionLabel>Proposta para Canela</SectionLabel>
        <SectionTitle>
          Aplicando o método ao <Highlight>lançamento em Canela</Highlight>
        </SectionTitle>
        <Reveal delay={150}>
          <p className="text-[#1a1a1a]/75 text-base md:text-lg leading-relaxed max-w-3xl">
            O foco não é apenas colocar produto no mercado.<br />
            O foco é criar uma <strong>operação de alta performance</strong> que acelere vendas,
            organize o processo e dê <strong>segurança, controle e previsibilidade</strong> à incorporadora.
          </p>
        </Reveal>
      </Section>

      {/* ═══════════ O PROBLEMA ═══════════ */}
      <Section dark>
        <SectionLabel>O Problema</SectionLabel>
        <SectionTitle light>
          A maioria dos lançamentos perde resultado <Highlight>na operação</Highlight>
        </SectionTitle>
        <BulletList light items={[
          "Reservas sem regra clara",
          "Unidades travadas sem conversão real",
          "Propostas demoradas",
          "Falta de visão em tempo real",
          "Parceiros sem fit com o produto",
          "Evento sem método comercial",
          "Retrabalho entre comercial e administrativo",
        ]} />
        <Divider />
        <Quote light>Produto bom sem operação forte vende abaixo do potencial.</Quote>
      </Section>

      {/* ═══════════ O QUE PROPOMOS ═══════════ */}
      <Section>
        <SectionLabel>O Que Propomos</SectionLabel>
        <SectionTitle>
          Gestão completa da <Highlight>operação do lançamento</Highlight>
        </SectionTitle>
        <Reveal delay={150}>
          <p className="text-[#1a1a1a]/75 text-base md:text-lg leading-relaxed mb-6 max-w-3xl">
            Uma estrutura que combina <strong>sistema, processo e pessoas</strong> para
            organizar cada etapa do lançamento, da reserva à assinatura do contrato.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <p className="text-[#c9a84c] font-serif italic text-lg md:text-2xl leading-snug mb-10 max-w-3xl border-l-2 border-[#c9a84c]/40 pl-5">
            Incorporadora com controle absoluto e em tempo real da operação.
          </p>
        </Reveal>
        <BulletList items={[
          "Sistema de gestão do lançamento com espelho de vendas em tempo real",
          "Visualização de disponibilidade por unidade",
          "Fila inteligente e automática de reservas",
          "Prazo configurável para envio da proposta",
          "Queda automática da reserva sem conversão",
          "Notificação instantânea por WhatsApp a cada proposta cadastrada",
          "Análise e aprovação das propostas online",
          "Fluxo automatizado de documentação",
          "Gestão e acompanhamento do contrato até a assinatura",
          "Curadoria e treinamento das imobiliárias parceiras",
          "Evento de lançamento com lógica de conversão",
          "Processo comercial de alta performance (mesma metodologia utilizada em Itapema)",
        ]} />
        <Divider />
        <Quote>A incorporadora mantém o comando. Nós estruturamos e operamos a máquina.</Quote>
        <Reveal delay={200}>
          <p className="text-[#c9a84c] font-serif italic text-lg md:text-xl mt-6">
            Mais velocidade, menos falha humana, mais governança.
          </p>
        </Reveal>
      </Section>

      {/* ═══════════ CURADORIA COMERCIAL ═══════════ */}
      <Section dark>
        <SectionLabel>Curadoria Comercial</SectionLabel>
        <SectionTitle light>
          Estratégia no <Highlight>recrutamento de imobiliárias</Highlight>
        </SectionTitle>
        <BulletList light items={[
          "Análise das imobiliárias com maior fit com o produto e metodologia de lançamento",
          "Seleção por perfil, carteira e aderência ao produto",
          "Treinamento comercial e técnico",
          "Alinhamento de narrativa e processo comercial",
          "Ativação dos parceiros certos",
        ]} />
        <Divider />
        <Quote light>Volume sem aderência gera ruído. Curadoria gera resultado.</Quote>
      </Section>

      {/* ═══════════ EVENTO + OPERAÇÃO ═══════════ */}
      <Section>
        <SectionLabel>Evento + Operação</SectionLabel>
        <SectionTitle>
          O evento como <Highlight>pico de absorção</Highlight>
        </SectionTitle>
        <Reveal delay={150}>
          <p className="text-[#1a1a1a]/75 text-base md:text-lg leading-relaxed mb-8 max-w-3xl">
            O evento de lançamento como estratégia comercial para fechamento de negócios, desenhado para converter.
          </p>
        </Reveal>
        <BulletList items={[
          "Evento como ferramenta de venda, não apenas apresentação",
          "Fluxo comercial organizado",
          "Regras claras de atendimento e prioridade",
          "Integração entre evento e sistema",
          "Equipe preparada para reservar, propor e avançar contrato",
          "Operação pensada para absorção rápida das unidades",
        ]} />
      </Section>

      {/* ═══════════ RESULTADO PARA A INCORPORADORA ═══════════ */}
      <Section dark>
        <SectionLabel>Resultado para a Incorporadora</SectionLabel>
        <SectionTitle light>
          O que a incorporadora <Highlight>ganha</Highlight>
        </SectionTitle>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 mt-10 md:mt-12">
          {[
            { title: "Mais controle", desc: "Acompanha a operação em tempo real" },
            { title: "Mais velocidade", desc: "Menos tempo entre interesse e contrato" },
            { title: "Mais segurança", desc: "Menos erro, menos conflito, menos retrabalho" },
            { title: "Mais venda", desc: "Maior capacidade de absorção do estoque" },
          ].map((item, i) => (
            <Reveal key={item.title} delay={i * 120}>
              <div className="relative border border-white/10 rounded-lg p-6 md:p-8 hover:border-[#c9a84c]/50 transition-all duration-300 hover:-translate-y-1 h-full bg-white/[0.02] group overflow-hidden">
                <div className="absolute top-0 left-0 w-12 h-px bg-gradient-to-r from-[#c9a84c] to-transparent" />
                <h3 className="font-serif text-xl md:text-2xl font-semibold text-[#c9a84c] mb-2">{item.title}</h3>
                <p className="text-sm md:text-base text-white/70 leading-relaxed">{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 md:mt-16">
          <Quote light>
            Nossa proposta não é apenas vender o lançamento.<br />
            É fazer o lançamento performar como operação profissional.
          </Quote>
        </div>
      </Section>

      {/* ═══════════ CTA FINAL ═══════════ */}
      <section className="relative bg-[#0a0a0a] py-20 md:py-28 lg:py-32 px-5 md:px-8 overflow-hidden border-t border-white/5">
        {/* Ambient glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[#c9a84c]/[0.07] blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[#c9a84c]/[0.05] blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          {/* Premium gradient border card */}
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-[#c9a84c]/60 via-[#c9a84c]/15 to-[#c9a84c]/40">
            <div className="relative rounded-2xl bg-[#0a0a0a] px-6 py-12 md:px-12 md:py-16 lg:px-16 lg:py-20 overflow-hidden">
              {/* Inner subtle pattern */}
              <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_top_right,_#c9a84c_0%,_transparent_50%)] pointer-events-none" />

              <div className="relative">
                {/* Eyebrow */}
                <Reveal>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="h-px w-10 bg-[#c9a84c]" />
                    <span className="text-[10px] md:text-xs font-semibold tracking-[0.35em] uppercase text-[#c9a84c]">
                      Vamos lançar juntos
                    </span>
                  </div>
                </Reveal>

                {/* Main headline */}
                <Reveal delay={100}>
                  <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-semibold leading-[1.1] tracking-tight text-white mb-6">
                    Lançamento estruturado<br />
                    <span className="text-[#c9a84c] italic font-normal">concentra resultado.</span>
                  </h2>
                </Reveal>

                {/* Sub */}
                <Reveal delay={200}>
                  <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-2xl mb-10 md:mb-12">
                    Estruturamos e conduzimos o lançamento em <strong className="text-white">Canela</strong> com
                    padrão elevado de organização, inteligência e performance — entregando à incorporadora uma operação
                    previsível, monitorável e preparada para converter em alta velocidade.
                  </p>
                </Reveal>

                {/* Checklist - 2 columns on desktop */}
                <Reveal delay={300}>
                  <div className="mb-10 md:mb-12">
                    <p className="text-white/55 text-[11px] md:text-xs uppercase tracking-[0.25em] mb-5">
                      Se vocês buscam um parceiro preparado para
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5">
                      {[
                        "Criar valor onde o mercado ainda não enxerga",
                        "Reposicionar um bairro ou região",
                        "Maximizar velocidade de vendas",
                        "Conduzir o processo com segurança jurídica",
                      ].map((item, i) => (
                        <Reveal key={item} delay={350 + i * 80}>
                          <div className="flex items-start gap-3">
                            <span className="mt-1.5 shrink-0">
                              <svg className="w-4 h-4 text-[#c9a84c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                            <span className="text-white/80 text-sm md:text-base leading-snug">{item}</span>
                          </div>
                        </Reveal>
                      ))}
                    </div>
                  </div>
                </Reveal>

                {/* "Estamos prontos" */}
                <Reveal delay={500}>
                  <div className="flex items-center gap-4 mb-10">
                    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9a84c]/40 to-transparent" />
                    <p className="text-[#c9a84c] font-serif italic text-2xl md:text-3xl lg:text-4xl whitespace-nowrap">
                      Estamos prontos.
                    </p>
                    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9a84c]/40 to-transparent" />
                  </div>
                </Reveal>

                {/* CTA Buttons */}
                <Reveal delay={600}>
                  <div className="flex flex-col items-center gap-5">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative inline-flex items-center gap-3 bg-[#c9a84c] hover:bg-[#d4b35a] text-[#0a0a0a] font-semibold px-8 py-4 md:px-10 md:py-5 rounded-full text-base md:text-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_15px_50px_-10px_rgba(201,168,76,0.7)]"
                    >
                      <span className="absolute inset-0 rounded-full bg-[#c9a84c] blur-xl opacity-30 group-hover:opacity-50 transition-opacity -z-10" />
                      <WhatsAppIcon className="w-5 h-5 md:w-6 md:h-6" />
                      Falar no WhatsApp
                      <svg className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </a>

                    <div className="flex items-center gap-2 text-white/55 text-xs md:text-sm">
                      <svg className="w-3.5 h-3.5 text-[#c9a84c]/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <span className="tracking-wider">(51) 99701-0323</span>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-[#0a0a0a] border-t border-white/5 py-10 md:py-12 px-5">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 text-center">
          <img src={logoEnove} alt="Enove" className="h-16 md:h-20 opacity-60" />
          <p className="text-xs md:text-sm text-white/40 tracking-[0.2em] uppercase">
            Enove Imobiliária + Enove Select
          </p>
          <p className="text-[10px] md:text-xs text-white/30 mt-2">
            © {new Date().getFullYear()} Enove. Proposta exclusiva para o lançamento em Canela.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Canela;
