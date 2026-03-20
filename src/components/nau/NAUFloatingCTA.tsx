import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

const NAUFloatingCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const formSection = document.getElementById("cadastro");
      if (formSection) {
        const formTop = formSection.offsetTop - window.innerHeight;
        const scrollY = window.scrollY;
        setIsVisible(scrollY > 600 && scrollY < formTop);
        setShowScrollTop(scrollY > 500);
      } else {
        setIsVisible(window.scrollY > 600);
        setShowScrollTop(window.scrollY > 500);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToForm = () => {
    document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <button
        onClick={scrollToForm}
        className={`fixed bottom-4 sm:bottom-6 left-4 sm:left-1/2 sm:-translate-x-1/2 z-50
          px-4 py-2.5 sm:px-6 sm:py-4
          bg-[hsl(24,70%,42%)] text-white
          font-semibold uppercase tracking-wider text-[11px] sm:text-sm
          rounded-full shadow-[0_10px_40px_hsl(200,60%,40%,0.4)]
          transition-all duration-500
          hover:shadow-[0_15px_50px_hsl(200,60%,40%,0.6)] hover:scale-105
          min-h-[40px] sm:min-h-[48px] max-w-[calc(100%-5rem)] sm:max-w-none
          pb-safe ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        aria-label="Ir para o cadastro"
        aria-hidden={!isVisible}
        tabIndex={isVisible ? 0 : -1}
      >
        Quero Garantir Meu Lote
      </button>

      <button
        onClick={scrollToTop}
        className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[hsl(210,35%,12%)] border border-[hsl(24,70%,42%)]/20 flex items-center justify-center text-white/70 hover:text-[hsl(24,70%,50%)] hover:border-[hsl(24,70%,42%)]/50 transition-all duration-300 ${
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        aria-label="Voltar ao topo da página"
        aria-hidden={!showScrollTop}
        tabIndex={showScrollTop ? 0 : -1}
      >
        <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </>
  );
};

export default NAUFloatingCTA;
