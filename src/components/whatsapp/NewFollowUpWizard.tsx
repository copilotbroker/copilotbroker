import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Zap, ClipboardList, Megaphone, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type FollowUpType = "automatic" | "manual" | "campaign";

interface NewFollowUpWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: FollowUpType) => void;
}

const OPTIONS: Array<{
  type: FollowUpType;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  example: string;
  accent: string;
  ring: string;
  glow: string;
}> = [
  {
    type: "automatic",
    icon: Zap,
    title: "Follow-up Automático",
    desc: "Dispara sozinho quando um novo lead chega no empreendimento.",
    example: "Ex.: 1ª mensagem em 1 min, depois 1h, 3h, 1 dia…",
    accent: "text-amber-400",
    ring: "hover:border-amber-500/50",
    glow: "from-amber-500/10",
  },
  {
    type: "manual",
    icon: ClipboardList,
    title: "Follow-up Manual",
    desc: "Salva como template. Você aplica no lead pela página dele quando quiser.",
    example: "Ex.: cadência de pós-visita, reengajamento…",
    accent: "text-blue-400",
    ring: "hover:border-blue-500/50",
    glow: "from-blue-500/10",
  },
  {
    type: "campaign",
    icon: Megaphone,
    title: "Campanha",
    desc: "Disparo em massa para leads filtrados por status, empreendimento, origem ou etiqueta.",
    example: "Ex.: campanha para todos os leads de WhatsApp com etiqueta VIP.",
    accent: "text-purple-400",
    ring: "hover:border-purple-500/50",
    glow: "from-purple-500/10",
  },
];

export function NewFollowUpWizard({ open, onOpenChange, onSelect }: NewFollowUpWizardProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#0f0f12] border-[#1e1e22] w-full sm:max-w-lg flex flex-col h-full p-0">
        <div className="px-6 pt-6 pb-2">
          <SheetHeader>
            <SheetTitle className="text-white">Como deseja criar seu follow-up?</SheetTitle>
            <SheetDescription className="text-slate-400">
              Escolha o tipo abaixo para começar.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-3">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => onSelect(opt.type)}
                className={cn(
                  "group relative w-full text-left p-4 rounded-xl border border-[#1e1e22] bg-[#111114] transition-all",
                  "active:scale-[0.99]",
                  opt.ring
                )}
              >
                <div
                  className={cn(
                    "absolute inset-0 rounded-xl bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
                    opt.glow
                  )}
                />
                <div className="relative flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg bg-[#1a1a1d] shrink-0")}>
                    <Icon className={cn("w-5 h-5", opt.accent)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white mb-0.5">{opt.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{opt.desc}</p>
                    <p className="text-[11px] text-slate-500 mt-1.5 italic">{opt.example}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors mt-1 shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
