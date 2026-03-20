import { useState, useEffect } from "react";
import logoMonaco from "@/assets/monaco/logo-monaco.png";

const MonacoHeader = () => {
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
          ? "bg-[hsl(215,45%,8%)]/95 backdrop-blur-md border-b border-[hsl(35,35%,50%)]/20 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container flex items-center justify-between px-4">
        <img
          src={logoMonaco}
          alt="Mônaco Grand Marina"
          className={`h-10 sm:h-12 md:h-14 w-auto transition-opacity duration-300 brightness-0 invert ${isScrolled ? "opacity-100" : "opacity-0"}`}
        />
        <button
          onClick={scrollToForm}
          className="hidden sm:inline-flex px-6 py-3 bg-[hsl(35,35%,45%)] hover:bg-[hsl(35,35%,38%)] text-white font-semibold uppercase tracking-[0.15em] text-xs transition-all duration-300 rounded"
        >
          Quero Saber Mais
        </button>
      </div>
    </header>
  );
};

export default MonacoHeader;
