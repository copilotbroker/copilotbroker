import logoNau from "@/assets/nau/logo-nau.png";
import logoEnove from "@/assets/logo-enove.png";

const NAUFooter = () => {
  return (
    <footer className="py-12 bg-[hsl(210,35%,5%)] border-t border-[hsl(24,70%,42%)]/10">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-sm text-white/50 italic leading-relaxed">
            <strong className="text-white/70">Observação importante:</strong> O material apresentado é meramente ilustrativo e não representa o projeto oficial, que será divulgado exclusivamente aos cadastrados no momento oportuno.
          </p>
        </div>

        <div className="flex flex-col items-center gap-8 mb-8">
          <img
            src={logoNau}
            alt="NAU Condomínio Náutico"
            className="h-16 w-auto brightness-0 invert"
          />

          <div className="text-center">
            <p className="text-sm text-white/50 mb-2">Condomínio Náutico</p>
            <p className="font-serif text-lg font-semibold text-white">
              Osório — Lagoa do Peixoto
            </p>
          </div>

          <div className="w-20 h-px bg-[hsl(24,70%,42%)]/20" />

          <div className="text-center">
            <p className="text-sm text-white/50 mb-3">Comercialização</p>
            <img
              src={logoEnove}
              alt="Enove Imobiliária"
              className="h-8 w-auto mx-auto"
            />
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-white/40">© 2026 Todos os direitos reservados</p>
        </div>
      </div>
    </footer>
  );
};

export default NAUFooter;
