import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

const STFloatingCTA = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground/70 hover:text-primary hover:border-primary transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary pb-safe ${
        showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
      }`}
      aria-label="Voltar ao topo"
      aria-hidden={!showScrollTop}
      tabIndex={showScrollTop ? 0 : -1}
    >
      <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
    </button>
  );
};

export default STFloatingCTA;
