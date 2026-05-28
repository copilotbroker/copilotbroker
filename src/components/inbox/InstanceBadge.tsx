import { Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface InstanceBadgeProps {
  instance?: string | null;
  brokerName?: string | null;
  size?: "xs" | "sm";
  className?: string;
  /** Long label like "WhatsApp do Plantão" / "WhatsApp pessoal de X" */
  verbose?: boolean;
}

/**
 * Visual indicator for WhatsApp instance source.
 * Green = Personal, Purple = Global/Plantão.
 */
export function InstanceBadge({ instance, brokerName, size = "xs", className, verbose }: InstanceBadgeProps) {
  const isGlobal = instance === "global";
  const Icon = isGlobal ? Building2 : User;

  const label = verbose
    ? isGlobal
      ? "WhatsApp do Plantão"
      : brokerName
        ? `WhatsApp pessoal de ${brokerName.split(" ")[0]}`
        : "WhatsApp pessoal"
    : isGlobal
      ? "Plantão"
      : "Pessoal";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-medium border",
        size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5",
        isGlobal
          ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
          : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
        className,
      )}
      title={label}
    >
      <Icon className={size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {label}
    </span>
  );
}
