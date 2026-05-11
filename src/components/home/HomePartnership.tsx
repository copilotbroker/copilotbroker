import { useEffect, useRef, useState } from "react";
import { Quote, TrendingUp, ChevronLeft, ChevronRight, Star } from "lucide-react";

const testimonials = [
  {
    name: "Rafael Mendes",
    role: "Corretor há 8 anos · Porto Alegre",
    initials: "RM",
    text: "Cara, eu ia desistir desse lead da landing de Canoas. Tinha mandado duas mensagens, ele sumiu. No 5º contato do Copilot ele respondeu \"oi, desculpa, tava em obra\" e marcou visita pra sábado. Fechei R$ 380 mil. Esse lead tava MORTO pra mim.",
  },
  {
    name: "Camila Borges",
    role: "Corretora · Novo Hamburgo",
    initials: "CB",
    text: "Eu sou péssima pra dar continuidade. Atendo bem na primeira, depois esqueço, vou pra outro. Agora o sistema lembra por mim. Mês passado fechei 2 vendas que vieram do follow-up automático, leads de mais de 20 dias atrás.",
  },
  {
    name: "Diego Almeida",
    role: "Corretor · Caxias do Sul",
    initials: "DA",
    text: "Confesso que paguei meio desconfiado. R$ 97 parecia barato demais. Em 12 dias o sistema reativou um lead antigo que eu tinha dado como perdido. Visita marcada, proposta aceita. Já se pagou umas 200 vezes. Sério.",
  },
  {
    name: "Juliana Reis",
    role: "Corretora · Gramado",
    initials: "JR",
    text: "O que mais me ajudou foi a tranquilidade. Antes eu dormia pensando \"ai, esqueci de responder o fulano\". Agora não. O bot dá conta dos contatos, eu entro pra fechar. Minha cabeça agradece tanto quanto meu bolso.",
  },
  {
    name: "Marcos Vinícius",
    role: "Corretor · Pelotas",
    initials: "MV",
    text: "Tô há 12 anos no mercado e sempre achei que CRM era frescura de gerente. Esse aqui é diferente, é como ter um estagiário que só faz follow-up e nunca dorme. Em 2 meses dobrei minha taxa de agendamento.",
  },
  {
    name: "Patrícia Lopes",
    role: "Corretora · Bento Gonçalves",
    initials: "PL",
    text: "Importei uma planilha velha de 80 leads esquecidos. Coloquei na cadência 10D só pra testar. 6 voltaram a falar comigo. Fechei 1. Esse lead tava parado há quase um ano. Não tem como não recomendar.",
  },
  {
    name: "Eduardo Tavares",
    role: "Corretor · Canoas",
    initials: "ET",
    text: "Sou daqueles que odeia tecnologia. Levei 25 minutos pra configurar tudo, achei que ia travar em algum lugar. Não travou. Tá rodando. E o que mais me impressiona é que as mensagens não parecem robô, parecem eu falando.",
  },
  {
    name: "Larissa Schmidt",
    role: "Corretora · São Leopoldo",
    initials: "LS",
    text: "Trabalho com lançamentos. O volume de lead na semana de abertura é insano e eu sempre perdia uns 30%. Agora o Copilot atende todo mundo na hora, qualifica, e eu só pego os quentes. Mudou meu jogo.",
  },
];

const HomePartnership = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const o = new IntersectionObserver(
      ([e]) => e.isIntersecting && setIsVisible(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) o.observe(sectionRef.current);
    return () => o.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-16 sm:py-20 px-4 bg-[#0a0a0f]"
      aria-labelledby="partnership-heading"
    >
      <div
        className={`container max-w-5xl transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Authority */}
        <div className="text-center mb-14">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-5">
            Criado por quem vende de verdade
          </span>
          <h2
            id="partnership-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight"
          >
            Desenvolvido dentro de uma imobiliária que fez:
          </h2>

          <div className="inline-flex items-center gap-4 px-8 py-6 rounded-2xl bg-[#111114] border-2 border-primary/40 shadow-[0_0_60px_hsl(var(--primary)/0.2)]">
            <TrendingUp className="w-10 h-10 text-primary" aria-hidden="true" />
            <div className="text-left">
              <p className="font-serif text-3xl sm:text-4xl font-bold text-primary">
                +400 milhões
              </p>
              <p className="text-white/70 text-sm sm:text-base">de VGV</p>
            </div>
          </div>

          <p className="text-white/70 text-base sm:text-lg mt-8 max-w-2xl mx-auto">
            O Copilot Broker nasceu porque{" "}
            <strong className="text-white">follow-up manual não escala.</strong>
          </p>
          <p className="font-serif text-2xl sm:text-3xl text-primary italic mt-3">
            Sistema escala.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-5">
            Quem usa, conta
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">
            O que os corretores estão achando
          </h3>
          <p className="text-white/60 text-sm sm:text-base">
            Direto de quem está usando no dia a dia.
          </p>
        </div>

        <TestimonialsCarousel />
      </div>
    </section>
  );
};

const TestimonialsCarousel = () => {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  const go = (dir: number) => {
    setIndex((i) => (i + dir + testimonials.length) % testimonials.length);
  };

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="overflow-hidden rounded-xl">
        <div
          ref={trackRef}
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {testimonials.map((t) => (
            <article
              key={t.name}
              className="w-full shrink-0 p-6 sm:p-8 bg-[#111114] border border-[#1e1e22] relative"
            >
              <Quote
                className="absolute top-5 right-5 w-9 h-9 text-primary/15"
                aria-hidden="true"
              />
              <div className="flex gap-1 mb-4" aria-label="5 estrelas">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-6 font-serif italic">
                "{t.text}"
              </p>
              <div className="flex items-center gap-4 border-t border-[#1e1e22] pt-5">
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-base">{t.initials}</span>
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold text-sm sm:text-base">{t.name}</p>
                  <p className="text-white/55 text-xs sm:text-sm">{t.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-5">
        <button
          onClick={() => go(-1)}
          aria-label="Depoimento anterior"
          className="w-10 h-10 rounded-full bg-[#111114] border border-[#1e1e22] hover:border-primary/40 text-white/70 hover:text-primary flex items-center justify-center transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Depoimento ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-8 bg-primary" : "w-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => go(1)}
          aria-label="Próximo depoimento"
          className="w-10 h-10 rounded-full bg-[#111114] border border-[#1e1e22] hover:border-primary/40 text-white/70 hover:text-primary flex items-center justify-center transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default HomePartnership;
