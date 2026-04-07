import { useState, useMemo, useEffect } from "react";
import {
  Search, Inbox, MessageSquare, Clock, Flame,
  ArrowUpDown, AlertTriangle, MoreVertical, Check,
  Target, ChevronDown, Archive, Eye, EyeOff, Zap,
  LayoutGrid, UserPlus, Headphones,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Conversation } from "@/hooks/use-conversations";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type BrokerInboxTab = "novos" | "atendimento" | "arquivados";

interface BrokerConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  search: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  totalUnread: number;
  onMarkAsRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  activeTab: BrokerInboxTab;
  onTabChange: (tab: BrokerInboxTab) => void;
  novosCount: number;
  atendimentoCount: number;
}

type SortMode = "recent" | "unread" | "idle";

const SORT_OPTIONS: { id: SortMode; label: string; icon: typeof Clock }[] = [
  { id: "recent", label: "Mais recentes", icon: Clock },
  { id: "unread", label: "Não lidas primeiro", icon: MessageSquare },
  { id: "idle", label: "Mais tempo parado", icon: Clock },
];

const formatLastInteraction = (value: string | null) => {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  if (isToday(date)) return format(date, "HH:mm", { locale: ptBR });
  if (isYesterday(date)) return "Ontem";
  return format(date, "dd/MM", { locale: ptBR });
};

const getLastPreview = (conv: Conversation) => {
  const preview = conv.last_message_preview || "Sem mensagens";
  switch (conv.last_message_type) {
    case "image": return preview === "Sem mensagens" ? "📷 Foto" : `📷 ${preview}`;
    case "audio": return preview === "Sem mensagens" ? "🎙️ Áudio" : `🎙️ ${preview}`;
    case "video": return preview === "Sem mensagens" ? "🎬 Vídeo" : `🎬 ${preview}`;
    case "document": return preview === "Sem mensagens" ? "📄 Documento" : `📄 ${preview}`;
    default: return preview;
  }
};

const RING_PULSE_STYLE: React.CSSProperties = {
  animation: "ring-pulse 3s ease-in-out infinite",
};

export function BrokerConversationList({
  conversations, selectedId, onSelect, search, onSearchChange,
  isLoading, totalUnread, onMarkAsRead, onArchive,
  activeTab, onTabChange, novosCount, atendimentoCount,
}: BrokerConversationListProps) {
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [cadenciaLeadIds, setCadenciaLeadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const leadIds = conversations.filter(c => c.lead_id).map(c => c.lead_id!);
    if (leadIds.length === 0) { setCadenciaLeadIds(new Set()); return; }
    const fetchCadencias = async () => {
      const { data } = await supabase
        .from("whatsapp_message_queue")
        .select("lead_id")
        .in("lead_id", leadIds)
        .in("status", ["queued", "scheduled"]);
      if (data) setCadenciaLeadIds(new Set(data.map((d: any) => d.lead_id)));
    };
    fetchCadencias();
  }, [conversations]);

  const sortedConversations = useMemo(() => {
    const sorted = [...conversations];
    switch (sortMode) {
      case "recent":
        sorted.sort((a, b) => {
          const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
          const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
          return bTime - aTime;
        });
        break;
      case "unread":
        sorted.sort((a, b) => (b.unread_count || 0) - (a.unread_count || 0));
        break;
      case "idle":
        sorted.sort((a, b) => {
          const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
          const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
          return aTime - bTime;
        });
        break;
    }
    return sorted;
  }, [conversations, sortMode]);

  const tabs: { id: BrokerInboxTab; label: string; icon: typeof UserPlus; count?: number }[] = [
    { id: "novos", label: "Novos", icon: UserPlus, count: novosCount },
    { id: "atendimento", label: "Em atendimento", icon: Headphones, count: atendimentoCount },
    { id: "arquivados", label: "Arquivados", icon: Archive },
  ];

  return (
    <div className="flex h-full flex-col bg-[#0f0a1a]">
      <div className="space-y-2 px-3 pb-1 pt-3">
        {/* Tab bar - purple theme */}
        <div className="flex rounded-lg border border-purple-500/20 bg-purple-950/30 p-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-purple-600 text-white shadow-sm shadow-purple-500/25"
                    : "text-purple-300/70 hover:text-purple-200"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {(tab.count ?? 0) > 0 && (
                  <Badge
                    className={cn(
                      "h-4 min-w-[16px] px-1 py-0 text-[10px] border-0",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-purple-500/30 text-purple-300"
                    )}
                  >
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-purple-100">
            <Inbox className="h-5 w-5 text-purple-400" />
            {activeTab === "novos" ? "Novos" : activeTab === "atendimento" ? "Em atendimento" : "Arquivados"}
            {totalUnread > 0 && activeTab !== "arquivados" && (
              <Badge className="min-w-[20px] px-1.5 py-0 text-xs h-5 bg-purple-500 text-white border-0">
                {totalUnread}
              </Badge>
            )}
          </h2>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-purple-300/70 hover:text-purple-200 hover:bg-purple-500/10">
                <ArrowUpDown className="h-3 w-3" />
                Ordenar
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1028] border-purple-500/20">
              {SORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <DropdownMenuItem
                    key={opt.id}
                    onClick={() => setSortMode(opt.id)}
                    className={cn("gap-2 text-xs", sortMode === opt.id && "text-purple-400")}
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
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400/50" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="h-9 pl-8 text-sm bg-purple-950/40 border-purple-500/20 text-purple-100 placeholder:text-purple-400/40 focus:border-purple-500/40 focus:ring-purple-500/20"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 px-2 pb-2 pt-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            </div>
          ) : sortedConversations.length === 0 ? (
            <div className="py-12 text-center text-purple-300/50">
              <Inbox className="mx-auto mb-2 h-10 w-10 opacity-40" />
              <p className="text-sm">
                {activeTab === "novos" ? "Nenhuma conversa nova" :
                 activeTab === "atendimento" ? "Nenhum atendimento em andamento" :
                 "Nenhuma conversa arquivada"}
              </p>
            </div>
          ) : (
            sortedConversations.map((conv) => {
              const leadName = conv.display_name || (conv.lead as any)?.name || conv.phone;
              const isSelected = selectedId === conv.id;
              const isUnread = conv.unread_count > 0;
              const isHot = (conv.temperature || 0) >= 8;
              const hasCopilot = conv.ai_mode === "ai_active";
              const hasCadenciaAtiva = conv.lead_id ? cadenciaLeadIds.has(conv.lead_id) : false;
              const preview = getLastPreview(conv);
              const idleHours = conv.last_message_at
                ? (Date.now() - new Date(conv.last_message_at).getTime()) / (1000 * 60 * 60)
                : 0;

              return (
                <div key={conv.id} className="group relative">
                  <button
                    onClick={() => onSelect(conv)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-3 text-left transition-colors",
                      isSelected
                        ? "border-purple-500/40 bg-purple-900/30"
                        : isUnread
                        ? "border-purple-500/20 bg-purple-950/40 hover:bg-purple-900/20"
                        : "border-transparent hover:bg-purple-950/30"
                    )}
                    style={hasCadenciaAtiva ? RING_PULSE_STYLE : undefined}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        isUnread ? "bg-purple-600/30 text-purple-300" : "bg-purple-900/40 text-purple-400/70"
                      )}>
                        {leadName.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="flex items-start justify-between gap-2">
                          <span className={cn(
                            "min-w-0 flex-1 truncate text-sm leading-none",
                            isUnread ? "font-bold text-purple-100" : "font-medium text-purple-200/80"
                          )}>
                            {leadName}
                          </span>
                          <span className="flex-shrink-0 text-right text-[10px] leading-none text-purple-400/50">
                            {formatLastInteraction(conv.last_message_at)}
                          </span>
                        </div>

                        <p className={cn(
                          "mt-1.5 truncate pr-1 text-xs",
                          isUnread ? "text-purple-200/70" : "text-purple-400/50"
                        )}>
                          {conv.last_message_direction === "outbound" && "Você: "}
                          {preview}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          {isUnread && conv.unread_count > 0 && (
                            <Badge className="h-4 px-1 py-0 text-[10px] bg-purple-500 text-white border-0">
                              {conv.unread_count}
                            </Badge>
                          )}
                          {activeTab === "novos" && (
                            <Badge className="h-4 px-1.5 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              <UserPlus className="mr-1 h-3 w-3" /> Novo contato
                            </Badge>
                          )}
                          {activeTab === "atendimento" && conv.lead_id && (
                            <Badge className="h-4 px-1.5 text-[10px] bg-purple-600/20 text-purple-300 border border-purple-500/30">
                              <LayoutGrid className="mr-1 h-3 w-3" /> No Kanban
                            </Badge>
                          )}
                          {isHot && (
                            <Badge className="h-4 px-1.5 text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30">
                              <Flame className="mr-1 h-3 w-3" /> Quente
                            </Badge>
                          )}
                          {hasCopilot && (
                            <Badge className="h-4 px-1.5 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              <Zap className="mr-1 h-3 w-3" /> Piloto Auto
                            </Badge>
                          )}
                          {idleHours > 24 && (
                            <Badge className="h-4 px-1.5 text-[10px] bg-purple-900/40 text-purple-400/60 border border-purple-500/20">
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
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-purple-400/50 hover:text-purple-200 hover:bg-purple-500/10">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1a1028] border-purple-500/20">
                          {isUnread && onMarkAsRead && (
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); onMarkAsRead(conv.id); }}
                              className="gap-2 text-xs"
                            >
                              <Eye className="h-3 w-3" /> Marcar como lida
                            </DropdownMenuItem>
                          )}
                          {onArchive && activeTab !== "arquivados" && (
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
