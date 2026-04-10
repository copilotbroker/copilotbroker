import { useState, useMemo, useEffect } from "react";
import {
  Search, Inbox, MessageSquare, AlertTriangle, Bot, Clock, Flame,
  Target, MoreVertical, Check, Zap,
  Eye, EyeOff, LayoutGrid, Archive,
  Users, UserPlus, User, Headphones, Tag, ChevronDown, RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Conversation, InboxTab, BrokerInboxTab } from "@/hooks/use-conversations";
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
  inboxTab?: InboxTab;
  onTabChange?: (tab: InboxTab) => void;
  showOthersTab?: boolean;
  novosCount?: number;
  emptyMessage?: string;
  /** Broker inbox mode: tabs */
  brokerInboxTab?: BrokerInboxTab;
  onBrokerTabChange?: (tab: BrokerInboxTab) => void;
  brokerNovosCount?: number;
  brokerAtendimentoCount?: number;
  brokerId?: string | null;
  /** Broker filter for atendimento tab (admin/leader) */
  brokerFilter?: string;
  onBrokerFilterChange?: (brokerId: string) => void;
  brokerOptions?: { id: string; name: string }[];
  /** The logged-in user's own broker ID, to show badge when viewing others */
  myBrokerId?: string | null;
}

interface BrokerLabel {
  id: string;
  name: string;
  color: string | null;
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
  emptyMessage,
  brokerInboxTab,
  onBrokerTabChange,
  brokerNovosCount = 0,
  brokerAtendimentoCount = 0,
  brokerId,
  brokerFilter,
  onBrokerFilterChange,
  brokerOptions = [],
  myBrokerId,
}: ConversationListProps) {
  const [cadenciaLeadIds, setCadenciaLeadIds] = useState<Set<string>>(new Set());
  const [leadLabelMap, setLeadLabelMap] = useState<Map<string, string[]>>(new Map());
  const [brokerLabels, setBrokerLabels] = useState<BrokerLabel[]>([]);
  const [quickFilter, setQuickFilter] = useState<null | "unread" | "oldest">(null);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [labelPopoverOpen, setLabelPopoverOpen] = useState(false);
  const [isSyncingLabels, setIsSyncingLabels] = useState(false);

  // Reset quick filter when tab changes
  useEffect(() => { setQuickFilter(null); setSelectedLabelId(null); }, [inboxTab, brokerInboxTab]);

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

  // Fetch broker labels catalog
  useEffect(() => {
    if (!brokerId) { setBrokerLabels([]); return; }
    const fetchBrokerLabels = async () => {
      const { data } = await supabase
        .from("whatsapp_labels")
        .select("id, name, color")
        .eq("broker_id", brokerId)
        .order("name");
      if (data) setBrokerLabels(data as BrokerLabel[]);
    };
    fetchBrokerLabels();
  }, [brokerId]);

  const handleSyncLabels = async () => {
    if (!brokerId || isSyncingLabels) return;
    setIsSyncingLabels(true);
    try {
      // Find any lead to use for the sync call
      const anyLeadId = conversations.find(c => c.lead_id)?.lead_id;
      if (anyLeadId) {
        await supabase.functions.invoke("whatsapp-labels", {
          body: { action: "sync", leadId: anyLeadId },
        });
      }
      // Refresh local labels
      const { data } = await supabase
        .from("whatsapp_labels")
        .select("id, name, color")
        .eq("broker_id", brokerId)
        .order("name");
      if (data) setBrokerLabels(data as BrokerLabel[]);
    } catch (e) {
      console.error("Erro ao sincronizar etiquetas:", e);
    } finally {
      setIsSyncingLabels(false);
    }
  };


  useEffect(() => {
    const leadIds = conversations.filter(c => c.lead_id).map(c => c.lead_id!);
    if (leadIds.length === 0) { setLeadLabelMap(new Map()); return; }

    const fetchLabels = async () => {
      const { data } = await supabase
        .from("lead_whatsapp_labels")
        .select("lead_id, label_id")
        .in("lead_id", leadIds);
      if (data) {
        const map = new Map<string, string[]>();
        data.forEach((d: any) => {
          const existing = map.get(d.lead_id) || [];
          existing.push(d.label_id);
          map.set(d.lead_id, existing);
        });
        setLeadLabelMap(map);
      }
    };
    fetchLabels();
  }, [conversations]);

  const sortedConversations = useMemo(() => {
    let result = [...conversations];
    if (quickFilter === "unread") result = result.filter(c => c.unread_count > 0);
    if (selectedLabelId) result = result.filter(c => c.lead_id && leadLabelMap.get(c.lead_id)?.includes(selectedLabelId));
    result.sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return quickFilter === "oldest" ? aTime - bTime : bTime - aTime;
    });
    return result;
  }, [conversations, quickFilter, selectedLabelId, leadLabelMap]);

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
        {/* Broker filter selector (admin/leader) — above tabs */}
        {onBrokerFilterChange && brokerOptions.length > 0 && (
          <Select value={brokerFilter || ""} onValueChange={onBrokerFilterChange}>
            <SelectTrigger className="h-8 bg-background border-border text-sm text-muted-foreground">
              <SelectValue placeholder="Selecionar corretor" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {brokerOptions.map((b) => (
                <SelectItem key={b.id} value={b.id} className="text-foreground text-sm">{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Plantão Tabs (Novos | Atendimento) */}
        {onTabChange && (
          <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
            <button
              onClick={() => onTabChange("novos")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                inboxTab === "novos"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Novos
              {novosCount > 0 && (
                <Badge variant={inboxTab === "novos" ? "secondary" : "destructive"} className="h-4 min-w-[16px] px-1 py-0 text-[10px]">
                  {novosCount}
                </Badge>
              )}
            </button>
            <button
              onClick={() => onTabChange("meus")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                inboxTab === "meus"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Headphones className="h-3.5 w-3.5" />
              Atendimento
              {totalUnread > 0 && inboxTab !== "meus" && (
                <Badge variant="destructive" className="h-4 min-w-[16px] px-1 py-0 text-[10px]">
                  {totalUnread}
                </Badge>
              )}
            </button>
          </div>
        )}

        {/* Personal Inbox Tabs (Novos | Atendimento) */}
        {onBrokerTabChange && (
          <div className="flex rounded-lg border border-border bg-muted/40 p-0.5 overflow-hidden">
            <button
              onClick={() => onBrokerTabChange("novos")}
              className={cn(
                "flex-1 min-w-0 flex items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-[11px] font-medium transition-colors truncate",
                brokerInboxTab === "novos"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <UserPlus className="h-3 w-3 shrink-0" />
              <span className="truncate">Novos</span>
              {brokerNovosCount > 0 && (
                <Badge variant={brokerInboxTab === "novos" ? "secondary" : "destructive"} className="h-4 min-w-[16px] px-1 py-0 text-[10px] shrink-0">
                  {brokerNovosCount}
                </Badge>
              )}
            </button>
            <button
              onClick={() => onBrokerTabChange("atendimento")}
              className={cn(
                "flex-1 min-w-0 flex items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-[11px] font-medium transition-colors truncate",
                brokerInboxTab === "atendimento"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Headphones className="h-3 w-3 shrink-0" />
              <span className="truncate">Atendimento</span>
              {brokerAtendimentoCount > 0 && (
                <Badge variant={brokerInboxTab === "atendimento" ? "secondary" : "outline"} className="h-4 min-w-[16px] px-1 py-0 text-[10px] shrink-0">
                  {brokerAtendimentoCount}
                </Badge>
              )}
            </button>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="h-9 pl-8 text-sm"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setQuickFilter(quickFilter === "unread" ? null : "unread")}
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors whitespace-nowrap shrink-0",
              quickFilter === "unread"
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground bg-muted/30 border border-transparent"
            )}
          >
            <Eye className="h-3 w-3" /> Não lidas
          </button>
          <Popover open={labelPopoverOpen} onOpenChange={setLabelPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors whitespace-nowrap shrink-0",
                  selectedLabelId
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground bg-muted/30 border border-transparent"
                )}
              >
                <Tag className="h-3 w-3" />
                {selectedLabelId
                  ? (brokerLabels.find(l => l.id === selectedLabelId)?.name || "Etiqueta")
                  : "Etiquetas"}
                <ChevronDown className="h-2.5 w-2.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-2">
              <div className="space-y-0.5">
                {selectedLabelId && (
                  <button
                    onClick={() => { setSelectedLabelId(null); setLabelPopoverOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/60"
                  >
                    Limpar filtro
                  </button>
                )}
                {brokerLabels.length === 0 ? (
                  <p className="px-2 py-3 text-xs text-muted-foreground text-center">Nenhuma etiqueta encontrada</p>
                ) : (
                  brokerLabels.map(label => (
                    <button
                      key={label.id}
                      onClick={() => {
                        setSelectedLabelId(selectedLabelId === label.id ? null : label.id);
                        setLabelPopoverOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                        selectedLabelId === label.id
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted/60"
                      )}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: label.color || 'hsl(var(--muted-foreground))' }}
                      />
                      <span className="truncate">{label.name}</span>
                      {selectedLabelId === label.id && <Check className="ml-auto h-3 w-3 flex-shrink-0" />}
                    </button>
                  ))
                )}
                <div className="border-t border-border mt-1 pt-1">
                  <button
                    onClick={handleSyncLabels}
                    disabled={isSyncingLabels}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/60 disabled:opacity-50"
                  >
                    <RefreshCw className={cn("h-3 w-3", isSyncingLabels && "animate-spin")} />
                    {isSyncingLabels ? "Atualizando..." : "Atualizar etiquetas"}
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <button
            onClick={() => setQuickFilter(quickFilter === "oldest" ? null : "oldest")}
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors whitespace-nowrap shrink-0",
              quickFilter === "oldest"
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground bg-muted/30 border border-transparent"
            )}
          >
            <Clock className="h-3 w-3" /> Mais antigas
          </button>
          {onBrokerTabChange && (
            <button
              onClick={() => {
                if (brokerInboxTab === "arquivados") {
                  onBrokerTabChange("novos");
                } else {
                  onBrokerTabChange("arquivados");
                }
              }}
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors whitespace-nowrap shrink-0",
                brokerInboxTab === "arquivados"
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground bg-muted/30 border border-transparent"
              )}
            >
              <Archive className="h-3 w-3" /> Arquivadas
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 px-2 pb-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : sortedConversations.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Inbox className="mx-auto mb-2 h-10 w-10 opacity-40" />
              <p className="text-sm">{emptyMessage || "Nenhuma conversa encontrada"}</p>
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
              const convLabelIds = conv.lead_id ? leadLabelMap.get(conv.lead_id) || [] : [];
              const convLabels = convLabelIds
                .map(lid => brokerLabels.find(bl => bl.id === lid))
                .filter((l): l is BrokerLabel => !!l);
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
                          "bg-purple-900/60 text-purple-400"
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
                          {/* Broker attribution badge for global or supervision conversations */}
                          {(conv as any).source_instance === "global" && (
                            (conv as any).attendance_started && (conv as any).broker?.name ? (
                              <Badge className="h-4 px-1.5 text-[10px] bg-emerald-600/20 text-emerald-400 border-emerald-500/30 border">
                                <User className="mr-1 h-3 w-3" /> {(conv as any).broker.name}
                              </Badge>
                            ) : !(conv as any).attendance_started ? (
                              <Badge className="h-4 px-1.5 text-[10px] bg-amber-600/20 text-amber-400 border-amber-500/30 border">
                                <Clock className="mr-1 h-3 w-3" /> Aguardando
                              </Badge>
                            ) : null
                          )}
                          {/* Show broker name when viewing another broker's conversations */}
                          {myBrokerId && brokerFilter && brokerFilter !== myBrokerId && (conv as any).broker?.name && (
                            <Badge className="h-4 px-1.5 text-[10px] bg-purple-600/20 text-purple-400 border-purple-500/30 border">
                              <User className="mr-1 h-3 w-3" /> {(conv as any).broker.name}
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
                          {convLabels.length > 0 && convLabels.slice(0, 2).map(label => (
                            <Badge
                              key={label.id}
                              variant="outline"
                              className="h-4 px-1.5 text-[10px] border-opacity-60"
                              style={{
                                backgroundColor: label.color ? `${label.color}18` : undefined,
                                borderColor: label.color ? `${label.color}50` : undefined,
                                color: label.color || undefined,
                              }}
                            >
                              <Tag className="mr-0.5 h-2.5 w-2.5" /> {label.name}
                            </Badge>
                          ))}
                          {convLabels.length > 2 && (
                            <Badge variant="outline" className="h-4 px-1 text-[10px]">
                              +{convLabels.length - 2}
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
