import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

const NAUFloatingCTA = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[hsl(210,35%,12%)] border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:border-white/30 transition-all duration-300 ${
        showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
      }`}
      aria-label="Voltar ao topo da página"
      aria-hidden={!showScrollTop}
      tabIndex={showScrollTop ? 0 : -1}
    >
      <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
    </button>
  );
};

export default NAUFloatingCTA;
