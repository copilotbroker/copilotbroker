import { User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminScope = "mine" | "all";

interface AdminScopeToggleProps {
  scope: AdminScope;
  onScopeChange: (scope: AdminScope) => void;
  hasBrokerProfile: boolean;
  mineLabel?: string;
  allLabel?: string;
  className?: string;
}

/**
 * Scope toggle used on admin dashboards/lists so admins/managers see
 * "their own data" by default, with a switch to view the whole brokerage.
 *
 * Hidden when the admin doesn't have a broker profile (no "mine" possible).
 */
export function AdminScopeToggle({
  scope,
  onScopeChange,
  hasBrokerProfile,
  mineLabel = "Meus dados",
  allLabel = "Imobiliária toda",
  className,
}: AdminScopeToggleProps) {
  if (!hasBrokerProfile) return null;

  return (
    <div className={cn("inline-flex items-center rounded-lg border border-[#2a2a2e] bg-[#16161a] p-0.5", className)}>
      <button
        type="button"
        onClick={() => onScopeChange("mine")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
          scope === "mine"
            ? "bg-[#FFFF00] text-black"
            : "text-slate-400 hover:text-white"
        )}
      >
        <User className="w-3.5 h-3.5" />
        {mineLabel}
      </button>
      <button
        type="button"
        onClick={() => onScopeChange("all")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
          scope === "all"
            ? "bg-[#FFFF00] text-black"
            : "text-slate-400 hover:text-white"
        )}
      >
        <Users className="w-3.5 h-3.5" />
        {allLabel}
      </button>
    </div>
  );
}
