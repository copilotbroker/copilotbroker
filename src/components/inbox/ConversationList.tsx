import { useState, useMemo, useEffect } from "react";
import {
  Search, Inbox, MessageSquare, AlertTriangle, Bot, Clock, Flame,
  ArrowUpDown, ThermometerSun, Target, MoreVertical, Check, Zap,
  TrendingUp, Eye, EyeOff, ChevronDown, MessageCircleMore, LayoutGrid, Archive
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Conversation } from "@/hooks/use-conversations";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  isLoading: boolean;
  totalUnread: number;
  onMarkAsRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  isAdminView?: boolean;
}

type SortMode = "recent" | "unread" | "temperature" | "opportunity" | "risk" | "idle";

const STATUS_FILTERS = [
  { id: "all", label: "Todas", icon: Inbox },
  { id: "unread", label: "Não lidas", icon: MessageSquare },
  { id: "attending", label: "Atendendo", icon: Clock },
  { id: "waiting_reply", label: "Aguardando", icon: AlertTriangle },
  { id: "archived", label: "Arquivadas", icon: Archive },
];

const SORT_OPTIONS: { id: SortMode; label: string; icon: typeof ArrowUpDown }[] = [
  { id: "recent", label: "Mais recentes", icon: Clock },
  { id: "unread", label: "Não lidas primeiro", icon: MessageSquare },
  { id: "temperature", label: "Temperatura", icon: ThermometerSun },
  { id: "opportunity", label: "Oportunidade", icon: Target },
  { id: "risk", label: "Em risco", icon: AlertTriangle },
  { id: "idle", label: "Mais tempo parado", icon: Clock },
];

function InboxKPIs({ conversations, activeKpi, onKpiClick }: { conversations: Conversation[]; activeKpi: string | null; onKpiClick: (kpi: string) => void }) {
  const stats = useMemo(() => {
    const active = conversations.length;
    const unread = conversations.filter(c => c.unread_count > 0).length;
    const atRisk = conversations.filter(c => {
      const lead = c.lead as any;
      return c.temperature <= 3 && lead?.status !== "sold" && lead?.status !== "inactive";
    }).length;
    const hot = conversations.filter(c => c.temperature >= 8).length;

    return { active, unread, atRisk, hot };
  }, [conversations]);

    const kpis = [
      { id: "active", label: "Ativas", value: stats.active, tone: "muted" },
      { id: "unread", label: "Não lidas", value: stats.unread, tone: "destructive", highlight: stats.unread > 0 },
      { id: "hot", label: "Quentes", value: stats.hot, tone: "warning", icon: Flame },
      { id: "risk", label: "Em risco", value: stats.atRisk, tone: "destructive", icon: AlertTriangle },
    ];

    return (
      <div className="grid grid-cols-4 gap-1 px-3 py-2">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isActive = activeKpi === kpi.id;
          return (
            <button
              key={kpi.id}
              onClick={() => onKpiClick(kpi.id)}
              className={cn(
                "flex flex-col items-center rounded-lg border border-border bg-card py-1.5 transition-all hover:bg-muted/40",
                isActive && "border-border bg-muted/60 text-foreground"
              )}
            >
              <div className="flex items-center gap-0.5">
                {Icon && <Icon className="h-3 w-3 text-primary" />}
                <span className="text-base font-bold text-foreground">{kpi.value}</span>
              </div>
              <span className="text-[9px] text-muted-foreground">{kpi.label}</span>
            </button>
          );
        })}
      </div>
    );
}

// Stable animation style for active cadence (matches KanbanCard)
const RING_PULSE_STYLE: React.CSSProperties = {
  animation: "ring-pulse 3s ease-in-out infinite",
};

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  isLoading,
  totalUnread,
  onMarkAsRead,
  onArchive,
  isAdminView,
  inboxTab = "meus",
  onTabChange,
  showOthersTab = false,
  novosCount = 0,
}: ConversationListProps) {
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [activeKpi, setActiveKpi] = useState<string | null>(null);
  const [cadenciaLeadIds, setCadenciaLeadIds] = useState<Set<string>>(new Set());

  // Fetch lead IDs with active cadences (pending messages in queue)
  useEffect(() => {
    const leadIds = conversations.filter(c => c.lead_id).map(c => c.lead_id!);
    if (leadIds.length === 0) { setCadenciaLeadIds(new Set()); return; }

    const fetchCadencias = async () => {
      const { data } = await supabase
        .from("whatsapp_message_queue")
        .select("lead_id")
        .in("lead_id", leadIds)
        .in("status", ["queued", "scheduled"]);
      if (data) {
        setCadenciaLeadIds(new Set(data.map((d: any) => d.lead_id)));
      }
    };
    fetchCadencias();
  }, [conversations]);

  const handleKpiClick = (kpi: string) => {
    setActiveKpi(prev => prev === kpi ? null : kpi);
  };

  const kpiFilteredConversations = useMemo(() => {
    if (!activeKpi) return conversations;
    switch (activeKpi) {
      case "unread":
        return conversations.filter(c => c.unread_count > 0);
      case "hot":
        return conversations.filter(c => (c.temperature || 0) >= 8);
      case "risk":
        return conversations.filter(c => {
          const lead = c.lead as any;
          return (c.temperature || 5) <= 3 && lead?.status !== "sold" && lead?.status !== "inactive";
        });
      case "active":
      default:
        return conversations;
    }
  }, [conversations, activeKpi]);

  const sortedConversations = useMemo(() => {
    const sorted = [...kpiFilteredConversations];
    switch (sortMode) {
      case "recent": {
        sorted.sort((a, b) => {
          const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
          const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
          return bTime - aTime;
        });
        break;
      }
      case "unread":
        sorted.sort((a, b) => (b.unread_count || 0) - (a.unread_count || 0));
        break;
      case "temperature":
        sorted.sort((a, b) => (b.temperature || 0) - (a.temperature || 0));
        break;
      case "opportunity":
        sorted.sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));
        break;
      case "risk": {
        sorted.sort((a, b) => (a.temperature || 5) - (b.temperature || 5));
        break;
      }
      case "idle": {
        sorted.sort((a, b) => {
          const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
          const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
          return aTime - bTime;
        });
        break;
      }
      default:
        break;
    }
    return sorted;
  }, [kpiFilteredConversations, sortMode]);

  const getLastPreview = (conv: Conversation) => {
    const preview = conv.last_message_preview || "Sem mensagens";
    switch (conv.last_message_type) {
      case "image":
        return preview === "Sem mensagens" ? "📷 Foto" : `📷 ${preview}`;
      case "audio":
        return preview === "Sem mensagens" ? "🎙️ Áudio" : `🎙️ ${preview}`;
      case "video":
        return preview === "Sem mensagens" ? "🎬 Vídeo" : `🎬 ${preview}`;
      case "document":
        return preview === "Sem mensagens" ? "📄 Documento" : `📄 ${preview}`;
      default:
        return preview;
    }
  };

  const formatLastInteraction = (value: string | null) => {
    if (!value) return "--:--";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--:--";
    if (isToday(date)) return format(date, "HH:mm", { locale: ptBR });
    if (isYesterday(date)) return "Ontem";
    return format(date, "dd/MM", { locale: ptBR });
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="space-y-2 px-3 pb-1 pt-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Inbox className="h-5 w-5 text-primary" />
            {isAdminView ? "Inbox Admin" : "Inbox"}
            {totalUnread > 0 && (
              <Badge variant="destructive" className="min-w-[20px] px-1.5 py-0 text-xs h-5">
                {totalUnread}
              </Badge>
            )}
          </h2>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ArrowUpDown className="h-3 w-3" />
                Ordenar
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {SORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <DropdownMenuItem
                    key={opt.id}
                    onClick={() => setSortMode(opt.id)}
                    className={cn("gap-2 text-xs", sortMode === opt.id && "text-primary")}
                  >
                    <Icon className="h-3 w-3" />
                    {opt.label}
                    {sortMode === opt.id && <Check className="ml-auto h-3 w-3" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="h-9 pl-8 text-sm"
          />
        </div>

        <div className="scrollbar-hide flex gap-1 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.id}
                onClick={() => onStatusFilterChange(f.id)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs whitespace-nowrap transition-colors",
                  statusFilter === f.id
                    ? "border-border bg-card text-foreground font-medium"
                    : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <Icon className="h-3 w-3" />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <InboxKPIs conversations={conversations} activeKpi={activeKpi} onKpiClick={handleKpiClick} />

      <ScrollArea className="flex-1">
        <div className="space-y-1 px-2 pb-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : sortedConversations.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Inbox className="mx-auto mb-2 h-10 w-10 opacity-40" />
              <p className="text-sm">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            sortedConversations.map((conv) => {
              const leadName = conv.display_name || (conv.lead as any)?.name || conv.phone;
              const leadStatus = (conv.lead as any)?.status;
              const isSelected = selectedId === conv.id;
              const isUnread = conv.unread_count > 0;
              const isHot = (conv.temperature || 0) >= 8;
              const isAtRisk = (conv.temperature || 5) <= 3 && leadStatus !== "sold" && leadStatus !== "inactive";
              const hasCopilot = conv.ai_mode === "ai_active";
              const score = conv.opportunity_score || 0;
              const idleHours = conv.last_message_at
                ? (Date.now() - new Date(conv.last_message_at).getTime()) / (1000 * 60 * 60)
                : 0;
              const hasCadenciaAtiva = conv.lead_id ? cadenciaLeadIds.has(conv.lead_id) : false;
              const preview = getLastPreview(conv);

              return (
                <div key={conv.id} className="group relative">
                  <button
                    onClick={() => onSelect(conv)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-3 text-left transition-colors",
                      isSelected
                        ? "border-border bg-card"
                        : isUnread
                        ? "border-border bg-card hover:bg-muted/60"
                        : "border-transparent hover:bg-muted/60"
                    )}
                    style={hasCadenciaAtiva ? RING_PULSE_STYLE : undefined}
                  >
                      <div className="flex items-start gap-3">
                      {(conv as any).source_instance === "global" ? (
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-900/60 text-emerald-400">
                          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                        </div>
                      ) : (
                        <div className={cn(
                          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold",
                          isUnread ? "bg-muted text-foreground" : "bg-muted/70 text-muted-foreground"
                        )}>
                          {leadName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="flex items-start justify-between gap-2">
                          <span className={cn(
                            "min-w-0 flex-1 truncate text-sm leading-none",
                            isUnread ? "font-bold text-foreground" : "font-medium text-foreground"
                          )}>
                            {leadName}
                          </span>
                          <span className="flex-shrink-0 text-right text-[10px] leading-none text-muted-foreground">
                            {formatLastInteraction(conv.last_message_at)}
                          </span>
                        </div>

                        <p className={cn(
                          "mt-1.5 truncate pr-1 text-xs",
                          isUnread ? "text-foreground/80" : "text-muted-foreground"
                        )}>
                          {conv.last_message_direction === "outbound" && "Você: "}
                          {preview}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          {isUnread && conv.unread_count > 0 && (
                            <Badge variant="destructive" className="h-4 px-1 py-0 text-[10px]">
                              {conv.unread_count}
                            </Badge>
                          )}
                          {conv.lead_id ? (
                            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                              <LayoutGrid className="mr-1 h-3 w-3" /> Lead vinculado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                              <LayoutGrid className="mr-1 h-3 w-3" /> Sem card no Kanban
                            </Badge>
                          )}
                          {conv.last_message_type && conv.last_message_type !== "text" && (
                            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                              Mídia
                            </Badge>
                          )}
                          {isHot && (
                            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                              <Flame className="mr-1 h-3 w-3" /> Quente
                            </Badge>
                          )}
                          {isAtRisk && (
                            <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                              <AlertTriangle className="mr-1 h-3 w-3" /> Risco
                            </Badge>
                          )}
                          {hasCopilot && (
                            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                              <Zap className="mr-1 h-3 w-3" /> Piloto Auto
                            </Badge>
                          )}
                          {score > 0 && (
                            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                              <Target className="mr-1 h-3 w-3" /> {score}%
                            </Badge>
                          )}
                          {idleHours > 24 && (
                            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                              <Clock className="mr-1 h-3 w-3" /> {idleHours > 48 ? `${Math.floor(idleHours / 24)}d` : `${Math.round(idleHours)}h`} parado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  {(onMarkAsRead || onArchive) && (
                    <div className="absolute right-2 top-2 hidden items-center gap-0.5 group-hover:flex">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isUnread && onMarkAsRead && (
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); onMarkAsRead(conv.id); }}
                              className="gap-2 text-xs"
                            >
                              <Eye className="h-3 w-3" /> Marcar como lida
                            </DropdownMenuItem>
                          )}
                          {onArchive && (
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); onArchive(conv.id); }}
                              className="gap-2 text-xs"
                            >
                              <EyeOff className="h-3 w-3" /> Arquivar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
