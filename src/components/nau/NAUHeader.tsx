import { useState, useEffect } from "react";
import logoNau from "@/assets/nau/logo-nau.png";

const NAUHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToForm = () => {
    document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 pt-safe ${
        isScrolled
          ? "bg-[hsl(210,35%,8%)]/95 backdrop-blur-md border-b border-[hsl(200,60%,40%)]/20 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container flex items-center justify-between px-4">
        <img
          src={logoNau}
          alt="NAU Condomínio Náutico"
          className="h-10 sm:h-12 md:h-14 w-auto"
        />
        <button
          onClick={scrollToForm}
          className="hidden sm:inline-flex px-6 py-3 bg-[hsl(200,60%,40%)] hover:bg-[hsl(200,60%,35%)] text-white font-semibold uppercase tracking-[0.15em] text-xs transition-all duration-300 rounded"
        >
          Garantir Meu Lote
        </button>
      </div>
    </header>
  );
};

export default NAUHeader;
