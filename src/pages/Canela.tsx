import { useEffect, useRef, useState } from "react";
import logoEnove from "@/assets/logo-enove.png";

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
  <section id={id} className={`py-10 md:py-14 lg:py-18 px-5 md:px-8 ${dark ? "bg-[#0a0a0a] text-white" : "bg-[#f5f0e8] text-[#1a1a1a]"} ${className}`}>
    <div className="max-w-5xl mx-auto">{children}</div>
  </section>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <Reveal>
    <span className="inline-block text-[11px] md:text-xs font-semibold tracking-[0.3em] uppercase text-[#c9a84c] mb-4 md:mb-6">
      {children}
    </span>
  </Reveal>
);

const SectionTitle = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => (
  <Reveal delay={100}>
    <h2 className={`font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight mb-6 md:mb-8 ${light ? "text-white" : "text-[#1a1a1a]"}`}>
      {children}
    </h2>
  </Reveal>
);

const Highlight = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[#c9a84c]">{children}</span>
);

const Divider = () => (
  <div className="w-16 h-px bg-[#c9a84c]/40 my-5 md:my-8" />
);

const BulletList = ({ items, light = false }: { items: string[]; light?: boolean }) => (
  <ul className={`space-y-2.5 text-sm md:text-base leading-relaxed ${light ? "text-white/75" : "text-[#1a1a1a]/70"}`}>
    {items.map((item, i) => (
      <Reveal key={i} delay={i * 60}>
        <li className="flex items-start gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] mt-2 shrink-0" />
          {item}
        </li>
      </Reveal>
    ))}
  </ul>
);

const Quote = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => (
  <Reveal>
    <blockquote className={`border-l-2 border-[#c9a84c]/50 pl-5 md:pl-6 py-2 font-serif italic text-lg md:text-xl lg:text-2xl leading-relaxed ${light ? "text-white/80" : "text-[#1a1a1a]/80"}`}>
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans antialiased selection:bg-[#c9a84c]/30 selection:text-white">

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-5 text-center bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iLjA1Ii8+PC9zdmc+')]" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-8 animate-[fadeIn_1.2s_ease-out]">
          <img src={logoEnove} alt="Enove" className="h-8 md:h-10 mx-auto opacity-70" />

          <div className="space-y-3">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-tight">
              Lançamento em <span className="text-[#c9a84c]">Canela</span>
            </h1>
            <p className="text-sm md:text-base text-white/50 tracking-[0.2em] uppercase">
              Operação completa de lançamento — comercial, tecnologia, evento e governança
            </p>
          </div>

          <div className="w-12 h-px bg-[#c9a84c]/50 mx-auto" />

          <p className="text-base md:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            Uma operação de lançamento desenhada para vender mais, com mais controle e menos ruído.
          </p>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-5 h-8 border border-white/20 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-[#c9a84c]/60 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* ═══════════ POSICIONAMENTO ═══════════ */}
      <Section dark>
        <SectionLabel>Posicionamento</SectionLabel>
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
        <Reveal delay={300}>
          <p className="text-[#c9a84c] font-serif italic text-lg md:text-xl">
            A Enove nasceu com esse foco.
          </p>
        </Reveal>
      </Section>

      {/* ═══════════ QUEM SOMOS ═══════════ */}
      <Section>
        <SectionLabel>Quem Somos</SectionLabel>
        <SectionTitle>
          <Highlight>12 anos</Highlight> de atuação em lançamentos imobiliários
        </SectionTitle>
        <Reveal delay={150}>
          <p className="text-[#1a1a1a]/70 text-base md:text-lg leading-relaxed mb-8 max-w-3xl">
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
        <SectionLabel>O Que Entregamos</SectionLabel>
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
          <p className="text-[#c9a84c] font-serif italic text-lg">
            Marketing e vendas integrados desde o primeiro dia.
          </p>
        </Reveal>
      </Section>

      {/* ═══════════ MARKETING ═══════════ */}
      <Section>
        <SectionLabel>Equipe de Marketing Própria</SectionLabel>
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
        <SectionLabel>Corretores de Alta Performance</SectionLabel>
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
          <p className="text-[#c9a84c] font-serif italic text-lg">
            Cada lead é tratado como uma oportunidade real.
          </p>
        </Reveal>
      </Section>

      {/* ═══════════ TECNOLOGIA E DADOS ═══════════ */}
      <Section>
        <SectionLabel>Tecnologia e Dados</SectionLabel>
        <SectionTitle>
          Operação orientada por <Highlight>dados</Highlight>
        </SectionTitle>
        <BulletList items={[
          "CRM exclusivo para lançamentos",
          "Distribuição inteligente de leads",
          "Monitoramento de tempo de resposta",
          "Acompanhamento de taxa de conversão",
          "Funil comercial rastreável",
        ]} />
        <Divider />
        <Quote>Decisão baseada em número, não em opinião.</Quote>
      </Section>

      {/* ═══════════ LGPD ═══════════ */}
      <Section dark>
        <SectionLabel>LGPD e Segurança</SectionLabel>
        <SectionTitle light>
          Primeira imobiliária do RS completamente adaptada à <Highlight>LGPD</Highlight>
        </SectionTitle>
        <BulletList light items={[
          "Processos auditáveis",
          "Tratamento legal de dados",
          "Proteção da incorporadora",
          "Segurança jurídica",
        ]} />
        <Divider />
        <Reveal>
          <p className="text-white/60 text-base md:text-lg">
            Parceiros precisam de segurança.<br />
            <span className="text-[#c9a84c] font-semibold">Nós entregamos.</span>
          </p>
        </Reveal>
      </Section>

      {/* ═══════════ MODELO DE ATUAÇÃO — CICLO COMPLETO ═══════════ */}
      <Section>
        <SectionLabel>Modelo de Atuação</SectionLabel>
        <SectionTitle>
          Ciclo <Highlight>completo</Highlight> do lançamento
        </SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 mt-12">
          <Reveal delay={0}>
            <div className="border border-[#1a1a1a]/10 rounded-lg p-6 md:p-8 hover:border-[#c9a84c]/40 transition-colors group">
              <div className="text-[#c9a84c] font-serif text-4xl md:text-5xl font-semibold mb-3 group-hover:scale-105 transition-transform">01</div>
              <h3 className="font-serif text-xl md:text-2xl font-semibold mb-2">Pré-lançamento</h3>
              <p className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-4">Construção da base de demanda</p>
              <ul className="space-y-2 text-sm text-[#1a1a1a]/65">
                <li>• Estratégia comercial</li>
                <li>• Jornada do cliente</li>
                <li>• Captação de leads</li>
                <li>• Lista qualificada</li>
                <li>• Testes de preço e aceitação</li>
              </ul>
              <div className="mt-5 pt-4 border-t border-[#1a1a1a]/10">
                <p className="font-serif italic text-sm text-[#c9a84c]">Antes de vender, construímos mercado.</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="border border-[#c9a84c]/30 rounded-lg p-6 md:p-8 bg-[#c9a84c]/5 hover:border-[#c9a84c]/60 transition-colors group">
              <div className="text-[#c9a84c] font-serif text-4xl md:text-5xl font-semibold mb-3 group-hover:scale-105 transition-transform">02</div>
              <h3 className="font-serif text-xl md:text-2xl font-semibold mb-2">Lançamento</h3>
              <p className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-4">Execução coordenada</p>
              <ul className="space-y-2 text-sm text-[#1a1a1a]/65">
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
            <div className="border border-[#1a1a1a]/10 rounded-lg p-6 md:p-8 hover:border-[#c9a84c]/40 transition-colors group">
              <div className="text-[#c9a84c] font-serif text-4xl md:text-5xl font-semibold mb-3 group-hover:scale-105 transition-transform">03</div>
              <h3 className="font-serif text-xl md:text-2xl font-semibold mb-2">Pós-lançamento</h3>
              <p className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-4">Até a última unidade</p>
              <ul className="space-y-2 text-sm text-[#1a1a1a]/65">
                <li>• Gestão de estoque</li>
                <li>• Campanhas específicas</li>
                <li>• Estratégia de giro</li>
                <li>• Relacionamento contínuo</li>
              </ul>
              <div className="mt-5 pt-4 border-t border-[#1a1a1a]/10">
                <p className="font-serif italic text-sm text-[#c9a84c]">Nosso compromisso não termina no evento de lançamento.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ═══════════ TRANSIÇÃO PARA CANELA ═══════════ */}
      <Section dark>
        <SectionLabel>Proposta para Canela</SectionLabel>
        <SectionTitle light>
          Aplicando o método ao <Highlight>lançamento em Canela</Highlight>
        </SectionTitle>
        <Reveal delay={150}>
          <p className="text-white/65 text-base md:text-lg leading-relaxed max-w-3xl">
            O foco não é apenas colocar produto no mercado.<br />
            O foco é criar uma <strong className="text-white">operação de alta performance</strong> que acelere vendas,
            organize o processo e dê <strong className="text-white">segurança, controle e previsibilidade</strong> à incorporadora.
          </p>
        </Reveal>
      </Section>

      {/* ═══════════ O PROBLEMA ═══════════ */}
      <Section>
        <SectionLabel>O Problema</SectionLabel>
        <SectionTitle>
          A maioria dos lançamentos perde resultado <Highlight>na operação</Highlight>
        </SectionTitle>
        <BulletList items={[
          "Reservas sem regra clara",
          "Unidades travadas sem conversão real",
          "Propostas demoradas",
          "Falta de visão em tempo real",
          "Parceiros sem fit com o produto",
          "Evento sem método comercial",
          "Retrabalho entre comercial e administrativo",
        ]} />
        <Divider />
        <Quote>Produto bom sem operação forte vende abaixo do potencial.</Quote>
      </Section>

      {/* ═══════════ O QUE PROPOMOS ═══════════ */}
      <Section dark>
        <SectionLabel>O Que Propomos</SectionLabel>
        <SectionTitle light>
          Gestão completa da <Highlight>operação do lançamento</Highlight>
        </SectionTitle>
        <BulletList light items={[
          "Sistema de gestão do lançamento",
          "Controle de unidades e espelho de vendas em tempo real",
          "Fila inteligente de reservas",
          "Notificação instantânea de propostas",
          "Aprovação das propostas online",
          "Fluxo automatizado de documentação",
          "Gestão do contrato até assinatura",
          "Curadoria e treinamento das imobiliárias",
          "Evento de lançamento com lógica de conversão",
          "Processo comercial de alta performance (mesma metodologia utilizada em Itapema)",
        ]} />
        <Divider />
        <Quote light>A incorporadora mantém o comando. Nós estruturamos e operamos a máquina.</Quote>
      </Section>

      {/* ═══════════ TECNOLOGIA QUE DÁ CONTROLE ═══════════ */}
      <Section>
        <SectionLabel>Tecnologia Aplicada ao Lançamento</SectionLabel>
        <SectionTitle>
          Tecnologia que dá <Highlight>controle real</Highlight> à incorporadora
        </SectionTitle>
        <BulletList items={[
          "Espelho de vendas em tempo real",
          "Visualização de disponibilidade por unidade",
          "Fila automática de reservas",
          "Prazo configurável para envio da proposta",
          "Queda automática da reserva sem conversão",
          "Aviso por WhatsApp a cada proposta cadastrada",
          "Análise e aprovação online",
          "Envio automático da documentação",
          "Acompanhamento do status contratual",
        ]} />
        <Divider />
        <Reveal>
          <p className="text-[#c9a84c] font-serif italic text-lg md:text-xl">
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
          <p className="text-[#1a1a1a]/70 text-base md:text-lg leading-relaxed mb-8 max-w-3xl">
            O evento de lançamento como estratégia comercial para fechamento de negócios — desenhado para converter.
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
              <div className="border border-white/10 rounded-lg p-6 md:p-8 hover:border-[#c9a84c]/50 transition-colors h-full bg-white/[0.02]">
                <h3 className="font-serif text-xl md:text-2xl font-semibold text-[#c9a84c] mb-2">{item.title}</h3>
                <p className="text-sm md:text-base text-white/65 leading-relaxed">{item.desc}</p>
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

      {/* ═══════════ FECHAMENTO ═══════════ */}
      <Section>
        <SectionLabel>Encerramento</SectionLabel>
        <SectionTitle>
          Uma operação <Highlight>previsível</Highlight>, monitorável e preparada para converter
        </SectionTitle>
        <Reveal delay={150}>
          <p className="text-[#1a1a1a]/75 text-base md:text-lg leading-relaxed max-w-3xl">
            Nossa proposta é estruturar e conduzir o lançamento em <strong>Canela</strong> com padrão elevado de
            organização, inteligência e performance — entregando à incorporadora uma operação previsível,
            monitorável e preparada para converter em alta velocidade.
          </p>
        </Reveal>
      </Section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-[#0a0a0a] border-t border-white/5 py-10 md:py-12 px-5">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 text-center">
          <img src={logoEnove} alt="Enove" className="h-7 md:h-8 opacity-60" />
          <p className="text-xs md:text-sm text-white/40 tracking-[0.2em] uppercase">
            Enove Imobiliária + Enove Select
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Canela;
