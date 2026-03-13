import { Link2, Sparkles, PenLine, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardMethodSelectorProps {
  onSelectLink: () => void;
  onSelectManual: () => void;
  typeLabel: string;
}

export default function WizardMethodSelector({ onSelectLink, onSelectManual, typeLabel }: WizardMethodSelectorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+5rem)] lg:pb-0">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFF00]/10 border border-[#FFFF00]/20 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#FFFF00]" />
          <span className="text-xs font-medium text-[#FFFF00]">Assistente de Criação</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Como deseja criar seu {typeLabel}?
        </h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Escolha a forma mais prática para você. A IA cuida do resto.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
        {/* Import from Link */}
        <button
          onClick={onSelectLink}
          className={cn(
            "group relative flex flex-col items-start p-6 rounded-2xl border-2 transition-all duration-300",
            "border-[#FFFF00]/30 bg-gradient-to-br from-[#FFFF00]/5 to-transparent",
            "hover:border-[#FFFF00] hover:shadow-[0_0_30px_rgba(255,255,0,0.1)]"
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-[#FFFF00]/10 flex items-center justify-center mb-4 group-hover:bg-[#FFFF00]/20 transition-colors mx-auto">
            <Link2 className="w-6 h-6 text-[#FFFF00]" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1.5 text-center w-full">Importar de um Link</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Cole o link de um anúncio e a IA captura automaticamente fotos, dados e informações para criar uma landing page de alta conversão.
          </p>
          <div className="flex items-center gap-1.5 text-[#FFFF00] text-xs font-medium mt-auto group-hover:gap-2.5 transition-all">
            Começar <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* Create from scratch */}
        <button
          onClick={onSelectManual}
          className={cn(
            "group flex flex-col items-start p-6 rounded-2xl border-2 transition-all duration-300",
            "border-[#2a2a2e] bg-[#1a1a1e]",
            "hover:border-[#3a3a3e] hover:bg-[#1e1e22]"
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-[#2a2a2e] flex items-center justify-center mb-4 group-hover:bg-[#333] transition-colors mx-auto">
            <PenLine className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1.5">Adicionar Imóvel ou Empreendimento</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Preencha os dados manualmente, envie fotos e vídeos, e a IA gera a landing page a partir do conteúdo fornecido.
          </p>
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mt-auto group-hover:text-white group-hover:gap-2.5 transition-all">
            Começar <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>
    </div>
  );
}
