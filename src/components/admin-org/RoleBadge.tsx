import { Crown, Star, Target, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export type OrgRole = "owner" | "admin" | "manager" | "leader" | "broker";

export const ROLE_META: Record<OrgRole, {
  label: string;
  short: string;
  icon: typeof Crown;
  description: string;
  // Tailwind tokens — usamos cores semânticas + acentos pontuais
  ring: string;
  text: string;
  bg: string;
  glow: string;
}> = {
  owner: {
    label: "Proprietário",
    short: "Owner",
    icon: Shield,
    description: "Dono da imobiliária. Acesso total e irrestrito.",
    ring: "ring-amber-400/40",
    text: "text-amber-300",
    bg: "bg-amber-500/10",
    glow: "shadow-[0_0_18px_-4px_rgba(251,191,36,0.45)]",
  },
  admin: {
    label: "Administrador",
    short: "Admin",
    icon: Shield,
    description: "Acesso técnico legado.",
    ring: "ring-amber-400/40",
    text: "text-amber-300",
    bg: "bg-amber-500/10",
    glow: "",
  },
  manager: {
    label: "Gerente",
    short: "Gerente",
    icon: Crown,
    description:
      "Acesso administrativo total da imobiliária. Vê e gerencia todos os leads, equipes, roletas e configurações. Também atende leads.",
    ring: "ring-violet-400/40",
    text: "text-violet-300",
    bg: "bg-violet-500/10",
    glow: "shadow-[0_0_18px_-4px_rgba(167,139,250,0.45)]",
  },
  leader: {
    label: "Líder",
    short: "Líder",
    icon: Star,
    description:
      "Lidera uma equipe. Vê o Kanban e a performance da própria equipe, atende leads e supervisiona corretores.",
    ring: "ring-sky-400/40",
    text: "text-sky-300",
    bg: "bg-sky-500/10",
    glow: "shadow-[0_0_18px_-4px_rgba(56,189,248,0.45)]",
  },
  broker: {
    label: "Corretor",
    short: "Corretor",
    icon: Target,
    description:
      "Atende seus próprios leads. Acesso individual ao Inbox, Copiloto e ao próprio Kanban.",
    ring: "ring-emerald-400/40",
    text: "text-emerald-300",
    bg: "bg-emerald-500/10",
    glow: "shadow-[0_0_18px_-4px_rgba(52,211,153,0.45)]",
  },
};

interface RoleBadgeProps {
  role: OrgRole;
  size?: "sm" | "md";
  className?: string;
}

export const RoleBadge = ({ role, size = "sm", className }: RoleBadgeProps) => {
  const meta = ROLE_META[role] ?? ROLE_META.broker;
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-transparent ring-1",
        meta.ring,
        meta.bg,
        meta.text,
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        className,
      )}
    >
      <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      <span className="font-semibold tracking-wide">{meta.short}</span>
    </span>
  );
};
