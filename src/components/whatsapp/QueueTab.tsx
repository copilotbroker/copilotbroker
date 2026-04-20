import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Clock, 
  Loader2, 
  XCircle, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Timer,
  Phone,
  Hash,
  RotateCw,
  Calendar,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Pause,
  MessageSquare,
} from "lucide-react";
import { useWhatsAppQueue } from "@/hooks/use-whatsapp-queue";
import { useUserRole } from "@/hooks/use-user-role";
import { usePausedMessages } from "@/hooks/use-paused-messages";
import { PausedMessagesReviewModal } from "@/components/whatsapp/PausedMessagesReviewModal";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QueueStatus } from "@/types/whatsapp";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

const STATUS_BADGE: Record<QueueStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  queued: { label: "Na fila", variant: "secondary" },
  scheduled: { label: "Agendado", variant: "outline" },
  sending: { label: "Enviando", variant: "default" },
  sent: { label: "Enviado", variant: "default" },
  failed: { label: "Falhou", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "secondary" },
  paused_by_system: { label: "Pausado", variant: "outline" },
};

function truncateMessage(msg?: string, len = 40) {
  if (!msg) return "";
  return msg.length > len ? msg.slice(0, len) + "…" : msg;
}

function formatPhone(phone?: string) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span className="text-slate-500">{label}:</span>
      <span className="text-slate-300">{value}</span>
    </div>
  );
}

function QueueStats({ stats }: { stats: { queued: number; sent: number; failed: number; replies: number; paused: number } }) {
  const items = [
    { label: "Na fila", value: stats.queued, icon: Clock, accent: "text-slate-300" },
    { label: "Pausados", value: stats.paused, icon: Pause, accent: "text-orange-400" },
    { label: "Enviados", value: stats.sent, icon: Send, accent: "text-emerald-400" },
    { label: "Falhas", value: stats.failed, icon: AlertTriangle, accent: "text-red-400" },
    { label: "Respostas", value: stats.replies, icon: MessageSquare, accent: "text-blue-400" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
      {items.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-3 p-3 rounded-xl bg-[#111114] border border-[#1e1e22]"
        >
          <s.icon className={cn("w-4 h-4 shrink-0", s.accent)} />
          <div className="min-w-0">
            <p className={cn("text-lg font-bold leading-none", s.accent)}>{s.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PendingMessageCard({ message, onCancel }: { message: any; onCancel: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = STATUS_BADGE[message.status as QueueStatus];

  return (
    <div
      className="px-3 py-2.5 rounded-xl bg-[#111114] border border-[#1e1e22] cursor-pointer select-none transition-colors hover:bg-[#161619] overflow-hidden"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-slate-500 shrink-0">
          {message.status === "paused_by_system" ? (
            <>
              <AlertTriangle className="w-3 h-3 inline mr-0.5 text-orange-400" />
              Pausado
            </>
          ) : (
            <>
              <Clock className="w-3 h-3 inline mr-0.5" />
              {format(new Date(message.scheduled_at), "dd/MM HH:mm")}
            </>
          )}
        </span>
        <span className="text-sm text-slate-200 font-medium truncate min-w-0 flex-1">
          {message.lead?.name || message.phone}
        </span>
        <Badge variant={statusConfig.variant} className="text-[10px] shrink-0">
          {statusConfig.label}
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-slate-400 hover:text-red-400 shrink-0"
          onClick={(e) => { e.stopPropagation(); onCancel(message.id); }}
        >
          <XCircle className="w-3.5 h-3.5" />
        </Button>
      </div>
      {message.message && (
        <p className="text-xs text-slate-500 italic truncate mt-1">"{truncateMessage(message.message, 60)}"</p>
      )}

      {expanded && (
        <div className="mt-2 pt-2 border-t border-[#1e1e22] space-y-2" onClick={(e) => e.stopPropagation()}>
          {message.message && (
            <p className="text-xs text-slate-300 whitespace-pre-wrap">{message.message}</p>
          )}
          <div className="space-y-1">
            <DetailRow icon={Phone} label="Telefone" value={formatPhone(message.phone)} />
            <DetailRow icon={Send} label="Campanha" value={message.campaign?.name} />
            {message.step_number && (
              <DetailRow icon={Hash} label="Etapa" value={`Etapa ${message.step_number}`} />
            )}
            <DetailRow icon={RotateCw} label="Tentativas" value={`${message.attempts || 0}/${message.max_attempts || 3}`} />
            {message.status !== "paused_by_system" && (
              <DetailRow icon={Calendar} label="Envio programado" value={format(new Date(message.scheduled_at), "dd/MM/yyyy HH:mm:ss")} />
            )}
            {message.status === "paused_by_system" && (
              <p className="text-xs text-orange-400">Horário será recalculado quando a campanha for retomada</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryMessageCard({ message, onRetry }: { message: any; onRetry: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = STATUS_BADGE[message.status as QueueStatus];
  const isFailed = message.status === "failed";

  return (
    <div
      className={cn(
        "px-3 py-2.5 rounded-xl border cursor-pointer select-none transition-colors overflow-hidden",
        isFailed ? "bg-red-500/5 border-red-500/20 hover:bg-red-500/10" : "bg-[#111114] border-[#1e1e22] hover:bg-[#161619]"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="shrink-0">
          {message.status === "sent" ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : isFailed ? (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          ) : (
            <XCircle className="w-4 h-4 text-slate-400" />
          )}
        </div>
        <span className="text-sm text-slate-200 font-medium truncate min-w-0 flex-1">
          {message.lead?.name || message.phone}
        </span>
        {message.sent_at && (
          <span className="text-[10px] text-slate-500 shrink-0">
            {format(new Date(message.sent_at), "dd/MM HH:mm")}
          </span>
        )}
        <Badge variant={statusConfig.variant} className="text-[10px] shrink-0">
          {statusConfig.label}
        </Badge>
      </div>
      {message.message && (
        <p className="text-xs text-slate-500 italic truncate mt-1">"{truncateMessage(message.message, 60)}"</p>
      )}

      {expanded && (
        <div className="mt-2 pt-2 border-t border-[#1e1e22] space-y-2" onClick={(e) => e.stopPropagation()}>
          {message.message && (
            <p className="text-xs text-slate-300 whitespace-pre-wrap">{message.message}</p>
          )}
          
          <div className="space-y-1">
            <DetailRow icon={Phone} label="Telefone" value={formatPhone(message.phone)} />
            <DetailRow icon={Send} label="Campanha" value={message.campaign?.name} />
            {message.step_number && (
              <DetailRow icon={Hash} label="Etapa" value={`Etapa ${message.step_number}`} />
            )}
            <DetailRow icon={RotateCw} label="Tentativas" value={`${message.attempts || 0}/${message.max_attempts || 3}`} />
            <DetailRow icon={Calendar} label="Agendado em" value={format(new Date(message.scheduled_at), "dd/MM/yyyy HH:mm")} />
          </div>

          {isFailed && (
            <div className="space-y-1">
              {message.error_code && (
                <p className="text-xs text-red-400">Código: {message.error_code}</p>
              )}
              {message.error_message && (
                <p className="text-xs text-red-400">{message.error_message}</p>
              )}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-slate-400 hover:text-primary gap-1"
                  onClick={() => onRetry(message.id)}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="text-xs">Tentar novamente</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Section definitions ─── */
interface SectionDef {
  key: string;
  label: string;
  dotClass: string;
  defaultOpen: boolean;
  iconFallback: React.ComponentType<{ className?: string }>;
  accentClass: string;
}

const SECTIONS: SectionDef[] = [
  { key: "pending", label: "Pendentes", dotClass: "bg-orange-400", defaultOpen: true, iconFallback: Clock, accentClass: "text-orange-400" },
  { key: "sent", label: "Enviados", dotClass: "bg-emerald-400", defaultOpen: false, iconFallback: CheckCircle, accentClass: "text-emerald-400" },
  { key: "failed", label: "Cancelados / Falhas", dotClass: "bg-red-400", defaultOpen: false, iconFallback: XCircle, accentClass: "text-red-400" },
];

export function QueueTab() {
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const { role, brokerId: myBrokerId } = useUserRole();
  const { data: pausedData } = usePausedMessages(myBrokerId);
  const pausedCount = pausedData?.count ?? 0;

  const { data: brokersList = [] } = useQuery({
    queryKey: ["brokers-list-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brokers")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: role === "admin",
  });

  const isAdmin = role === "admin";
  const effectiveFilterId = isAdmin ? (selectedBrokerId === "all" ? undefined : selectedBrokerId || undefined) : undefined;
  const {
    pendingQueue,
    historyQueue,
    stats,
    isLoading,
    formatNextSendIn,
    nextScheduledAt,
    allPaused,
    cancelMessage,
    retryMessage,
    loadMorePending,
    loadMoreHistory,
    hasMorePending,
    hasMoreHistory,
  } = useWhatsAppQueue(effectiveFilterId, isAdmin);

  const sentMessages = useMemo(() => historyQueue.filter(m => m.status === "sent"), [historyQueue]);
  const cancelledAndFailedMessages = useMemo(() => historyQueue.filter(m => m.status === "failed" || m.status === "cancelled"), [historyQueue]);
  const isEmpty = pendingQueue.length === 0 && historyQueue.length === 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      {/* ── Header Row ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Send className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground leading-tight">Fila de Envio</h2>
            <p className="text-xs text-muted-foreground">
              {allPaused ? (
                <span className="text-orange-400">Campanha pausada</span>
              ) : (
                <>
                  Próximo envio em{" "}
                  <span className="font-mono text-primary font-medium">
                    {formatNextSendIn()}
                    {nextScheduledAt && ` (${format(new Date(nextScheduledAt), "HH:mm")})`}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <Select value={selectedBrokerId} onValueChange={setSelectedBrokerId}>
              <SelectTrigger className="w-full sm:w-[180px] bg-[#111114] border-[#1e1e22] text-slate-300 h-9 text-xs">
                <SelectValue placeholder="Todos os corretores" />
              </SelectTrigger>
              <SelectContent className="bg-[#111114] border-[#1e1e22]">
                <SelectItem value="all">Todos os corretores</SelectItem>
                {brokersList.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <QueueStats stats={stats} />

      {/* ── Content ── */}
      {isEmpty ? (
        <Card className="bg-[#111114] border-[#1e1e22]">
          <CardContent className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Send className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">Fila vazia</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
              Quando você iniciar uma campanha, as mensagens aparecerão aqui com o status de cada envio.
            </p>

            <div className="grid gap-3 sm:grid-cols-3 mt-10 text-left">
              {[
                { step: "1", title: "Crie uma campanha", desc: "Defina os leads alvo e monte as mensagens de cada etapa." },
                { step: "2", title: "Acompanhe a fila", desc: "Veja cada mensagem agendada, pausada ou pronta para envio." },
                { step: "3", title: "Monitore os resultados", desc: "Acompanhe envios, falhas e respostas em tempo real." },
              ].map((item) => (
                <div key={item.step} className="p-4 rounded-xl bg-[#0a0a0f] border border-[#1e1e22]">
                  <div className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mb-2.5">
                    {item.step}
                  </div>
                  <p className="text-xs font-medium text-slate-200 mb-1">{item.title}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Pausadas por desconexão */}
          {pausedCount > 0 && (
            <div className="flex items-center gap-3 w-full py-3 px-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-amber-200 leading-tight">
                  Pausadas por desconexão
                </p>
                <p className="text-[11px] text-amber-300/70 mt-0.5">
                  {pausedCount} mensagem{pausedCount > 1 ? "ns" : ""} aguardando sua decisão após reconexão do WhatsApp
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setReviewOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-black font-medium h-8 text-xs shrink-0"
              >
                Revisar
              </Button>
            </div>
          )}

          {/* Pendentes */}
          {pendingQueue.length > 0 && (
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center gap-3 w-full group py-3 px-4 rounded-xl bg-[#111114] hover:bg-[#161619] border border-[#1e1e22] transition-all">
                <ChevronRight className="w-4 h-4 text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="text-sm font-medium text-slate-200">Pendentes</span>
                <Badge
                  variant="secondary"
                  className="ml-auto text-[10px] px-2 py-0 h-5 font-semibold bg-[#1e1e22] text-slate-300"
                >
                  {stats.queued + stats.paused}
                </Badge>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 pl-4 space-y-1.5">
                {pendingQueue.map((message) => (
                  <PendingMessageCard key={message.id} message={message} onCancel={cancelMessage} />
                ))}
                {hasMorePending && (
                  <Button
                    variant="ghost"
                    onClick={loadMorePending}
                    className="w-full text-slate-400 hover:text-white gap-2 mt-1"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Carregar mais pendentes...
                  </Button>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Enviados */}
          {sentMessages.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-3 w-full group py-3 px-4 rounded-xl bg-[#111114] hover:bg-[#161619] border border-[#1e1e22] transition-all">
                <ChevronRight className="w-4 h-4 text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-sm font-medium text-slate-200">Enviados</span>
                <Badge
                  variant="secondary"
                  className="ml-auto text-[10px] px-2 py-0 h-5 font-semibold bg-[#1e1e22] text-slate-300"
                >
                  {stats.sent}
                </Badge>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 pl-4 space-y-1.5">
                {sentMessages.map((message) => (
                  <HistoryMessageCard key={message.id} message={message} onRetry={retryMessage} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Cancelados / Falhas */}
          {cancelledAndFailedMessages.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-3 w-full group py-3 px-4 rounded-xl bg-[#111114] hover:bg-[#161619] border border-[#1e1e22] transition-all">
                <ChevronRight className="w-4 h-4 text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-sm font-medium text-slate-200">Cancelados / Falhas</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-auto text-[10px] px-2 py-0 h-5 font-semibold",
                    cancelledAndFailedMessages.length > 0 ? "bg-[#1e1e22] text-slate-300" : "bg-[#1e1e22]/50 text-slate-600"
                  )}
                >
                  {cancelledAndFailedMessages.length}
                </Badge>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 pl-4 space-y-1.5">
                {cancelledAndFailedMessages.map((message) => (
                  <HistoryMessageCard key={message.id} message={message} onRetry={retryMessage} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {hasMoreHistory && (
            <Button
              variant="ghost"
              onClick={loadMoreHistory}
              className="w-full text-slate-400 hover:text-white gap-2"
            >
              <ChevronDown className="w-4 h-4" />
              Carregar mais histórico...
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
