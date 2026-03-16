import { Search } from "lucide-react";
import { useLocation } from "react-router-dom";
import { BROKER_TAB_LABELS, getBrokerTabFromPath } from "./brokerNavigation";

interface BrokerHeaderProps {
  brokerName?: string;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

export function BrokerHeader({
  brokerName,
  searchTerm,
  onSearchChange,
}: BrokerHeaderProps) {
  const location = useLocation();
  const activeTab = getBrokerTabFromPath(location.pathname);
  const copy = BROKER_TAB_LABELS[activeTab];

  return (
    <header className="sticky top-0 z-30 bg-[#141417]/95 backdrop-blur-sm border-b border-[#2a2a2e] pt-safe">
      <div className="lg:hidden flex items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-lg font-bold text-white">{copy.title}</h1>
          {copy.subtitle && <p className="text-xs text-slate-400 mt-0.5">{copy.subtitle}</p>}
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-between px-6 py-3 gap-4">
        <nav className="flex items-center gap-2 text-sm min-w-0">
          <span className="text-slate-500">Corretor</span>
          <span className="text-slate-500">›</span>
          <span className="text-slate-200 font-medium">{copy.title}</span>
          {brokerName && (
            <>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500 truncate">{brokerName}</span>
            </>
          )}
        </nav>

        {onSearchChange && (
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar leads..."
              value={searchTerm || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#1e1e22] border border-[#2a2a2e] rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FFFF00]/50 focus:border-[#FFFF00]/50 transition-all"
            />
          </div>
        )}
      </div>
    </header>
  );
}
