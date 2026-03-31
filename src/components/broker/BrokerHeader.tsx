import { useState, ReactNode } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { useLocation } from "react-router-dom";
import { BROKER_TAB_LABELS, getBrokerTabFromPath } from "./brokerNavigation";
import { cn } from "@/lib/utils";
import { BrokerRoletaStatusCompact } from "./BrokerRoletaStatusCompact";

interface BrokerHeaderProps {
  brokerName?: string;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  collapsibleContent?: ReactNode;
  onAddLead?: () => void;
  brokerId?: string;
}

export function BrokerHeader({
  brokerName,
  searchTerm,
  onSearchChange,
  collapsibleContent,
  onAddLead,
  brokerId,
}: BrokerHeaderProps) {
  const location = useLocation();
  const activeTab = getBrokerTabFromPath(location.pathname);
  const copy = BROKER_TAB_LABELS[activeTab];
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[#141417]/95 backdrop-blur-sm border-b border-[#2a2a2e] pt-safe">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <h1 className="text-lg font-bold text-white">{copy.title}</h1>
          {collapsibleContent && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#2a2a2e] transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
        {brokerId && (
          <div className="flex-1 min-w-0 overflow-hidden">
            <BrokerRoletaStatusCompact brokerId={brokerId} />
          </div>
        )}
        {collapsibleContent && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#2a2a2e] transition-colors shrink-0"
          >
            <Search className="w-5 h-5" />
          </button>
        )}
        {collapsibleContent && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#2a2a2e] transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Collapsible content - mobile only (always mounted for portal targets, hidden via CSS) */}
      {collapsibleContent && (
        <div className={cn(
          "lg:hidden px-4 pb-3 space-y-2",
          isExpanded ? "animate-in slide-in-from-top-2 duration-200" : "hidden"
        )}>
          {collapsibleContent}
        </div>
      )}

      {/* Desktop header */}
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
