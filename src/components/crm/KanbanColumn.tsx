import { useRef, useCallback, useEffect, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useQuery } from "@tanstack/react-query";

import { Plus, MoreHorizontal, MessageSquare } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CRMLead, LeadStatus, STATUS_CONFIG } from "@/types/crm";
import { useKanbanColumn, KanbanColumnFilters, ActiveFlowData } from "@/hooks/use-kanban-column";
import { KanbanCard } from "./KanbanCard";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface KanbanColumnProps {
  status: LeadStatus;
  filters: KanbanColumnFilters;
  activeFlow: ActiveFlowData;
  newLeadIds?: Set<string>;
  activeFlowLeadIds?: Set<string>;
  onCancelCadencia?: (leadId: string) => void;
  onCardClick: (lead: CRMLead) => void;
  onUpdateOrigin?: (leadId: string, origin: string) => Promise<void>;
  onDelete?: (leadId: string) => Promise<void>;
  onIniciarAtendimento?: (leadId: string) => Promise<void>;
  onOpenAgendamento?: (leadId: string) => void;
  onOpenComparecimento?: (leadId: string) => void;
  onOpenVenda?: (leadId: string) => void;
  onOpenPerda?: (leadId: string, currentStatus: LeadStatus) => void;
  onDispatchWhatsApp?: (status: LeadStatus) => void;
  onAddLead?: () => void;
  onOpenProposta?: (lead: CRMLead) => void;
  onOpenReagendamento?: (leadId: string) => void;
  onLeadsLoaded?: (leads: CRMLead[]) => void;
  onSendWhatsAppNow?: (leadId: string, content: string) => Promise<void>;
  onScheduleWhatsApp?: (leadId: string, content: string, scheduledAt: string) => Promise<void>;
  onCallClick?: (leadId: string) => void;
  onTransfer?: (leadId: string) => void;
  onClaimDisputa?: (leadId: string) => void;
}

const STATUS_SQUARE_COLORS: Record<LeadStatus, string> = {
  new: "bg-blue-500",
  info_sent: "bg-enove-yellow",
  awaiting_docs: "bg-lime-500",
  scheduling: "bg-orange-500",
  docs_received: "bg-emerald-500",
  registered: "bg-slate-400",
  inactive: "bg-red-500"
};

export function KanbanColumn({
  status, filters, activeFlow, newLeadIds, activeFlowLeadIds, onCancelCadencia,
  onCardClick, onUpdateOrigin, onDelete, onIniciarAtendimento,
  onOpenAgendamento, onOpenComparecimento, onOpenVenda, onOpenPerda,
  onDispatchWhatsApp, onAddLead, onOpenProposta, onOpenReagendamento,
  onLeadsLoaded, onSendWhatsAppNow, onScheduleWhatsApp, onCallClick, onTransfer,
}: KanbanColumnProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const config = STATUS_CONFIG[status];
  const canDispatchWhatsApp = status !== "inactive" && status !== "registered";

  const { leads, totalCount, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useKanbanColumn(status, filters, activeFlow);

  // Report loaded leads to parent for lookup
  useEffect(() => {
    onLeadsLoaded?.(leads);
  }, [leads, onLeadsLoaded]);

  // Batch fetch labels for all leads in this column (1 query instead of 2×N)
  const leadIds = useMemo(() => leads.map((l) => l.id), [leads]);
  const leadIdsHash = useMemo(() => {
    let hash = 0;
    const str = leadIds.join(",");
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return hash;
  }, [leadIds]);

  const { data: rawLeadLabels } = useQuery({
    queryKey: ["column-lead-labels", status, leadIdsHash],
    enabled: leadIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("lead_whatsapp_labels")
        .select("lead_id, label:whatsapp_labels(id, name, color)")
        .in("lead_id", leadIds);
      return data || [];
    },
    staleTime: 60_000,
  });

  const labelsByLead = useMemo(() => {
    const map = new Map<string, Array<{ id: string; name: string; color: string | null }>>();
    for (const row of rawLeadLabels || []) {
      if (!map.has(row.lead_id)) map.set(row.lead_id, []);
      if (row.label) map.get(row.lead_id)!.push(row.label as any);
    }
    return map;
  }, [rawLeadLabels]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: leads.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 210,
    overscan: 2,
  });

  // IntersectionObserver for reliable infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: container, rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const setRefs = useCallback((node: HTMLDivElement | null) => {
    scrollContainerRef.current = node;
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
    <div className="flex flex-col w-[280px] md:min-w-[300px] md:max-w-[320px] shrink-0 h-full min-h-[400px]">
      <div className="flex items-center gap-2.5 px-2 py-3 mb-2">
        <div className={cn("w-2 h-2 rounded-sm shrink-0", STATUS_SQUARE_COLORS[status])} />
        <h3 className="font-medium text-sm text-slate-300">
          {config.label} <span className="text-slate-500">({totalCount})</span>
        </h3>
        <div className="flex-1" />
        <button onClick={onAddLead} className={cn("w-7 h-7 rounded-lg flex items-center justify-center", "text-slate-500 hover:text-primary hover:bg-primary/10", "transition-all duration-200")}>
          <Plus className="w-4 h-4" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-[#1e1e22] transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#1e1e22] border-[#2a2a2e]">
            {canDispatchWhatsApp && totalCount > 0 && (
              <>
                <DropdownMenuItem className="text-green-400 focus:bg-green-500/10 focus:text-green-400" onClick={() => onDispatchWhatsApp?.(status)}>
                  <MessageSquare className="w-4 h-4 mr-2" />Disparar WhatsApp ({totalCount})
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#2a2a2e]" />
              </>
            )}
            <DropdownMenuItem className="text-slate-200 focus:bg-slate-700/50">Ordenar por data</DropdownMenuItem>
            <DropdownMenuItem className="text-slate-200 focus:bg-slate-700/50">Ordenar por nome</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        ref={setRefs}
        className={cn(
          "flex-1 min-h-0 p-2 rounded-xl overflow-y-auto scrollbar-subtle",
          "bg-[#18181b]/50"
        )}
      >
        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[200px] rounded-xl bg-[#2a2a2e]" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <div className="text-slate-600 text-sm">Nenhum lead</div>
            <button onClick={onAddLead} className="mt-2 text-xs text-primary/70 hover:text-primary transition-colors">+ Adicionar</button>
          </div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const lead = leads[virtualItem.index];
              return (
                <div
                  key={lead.id}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="pb-2.5">
                    <KanbanCard
                      lead={lead}
                      isNew={newLeadIds?.has(lead.id)}
                      hasAutomacaoAtiva={activeFlowLeadIds?.has(lead.id)}
                      preloadedLabels={labelsByLead.get(lead.id)}
                      onCancelCadencia={onCancelCadencia}
                      onClick={() => onCardClick(lead)}
                      onUpdateOrigin={onUpdateOrigin}
                      onDelete={onDelete}
                      onIniciarAtendimento={onIniciarAtendimento}
                      onOpenAgendamento={onOpenAgendamento}
                      onOpenComparecimento={onOpenComparecimento}
                      onOpenVenda={onOpenVenda}
                      onOpenPerda={onOpenPerda}
                      onOpenProposta={() => onOpenProposta?.(lead)}
                      onOpenReagendamento={onOpenReagendamento}
                      onSendWhatsAppNow={onSendWhatsAppNow}
                      onScheduleWhatsApp={onScheduleWhatsApp}
                      onCallClick={onCallClick}
                      onTransfer={onTransfer}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sentinel for infinite scroll */}
        {hasNextPage && <div ref={sentinelRef} className="h-1" />}

        {isFetchingNextPage && (
          <div className="space-y-2.5 pt-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={`loading-${i}`} className="h-[200px] rounded-xl bg-[#2a2a2e]" />
            ))}
          </div>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}
