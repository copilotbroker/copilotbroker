import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, MessageCircle, Send, CalendarClock, Plus, UserX, Trash2, Mail, Phone, CheckCircle2, Lock, RotateCw, AlertTriangle, Play, Calendar, FileText, Trophy, Square } from "lucide-react";
import { CRMLead, LeadStatus, STATUS_CONFIG, getOriginDisplayLabel, getOriginType } from "@/types/crm";
import { cn } from "@/lib/utils";

import { OriginCombobox } from "./OriginCombobox";
import { LeadLabelsPicker } from "./LeadLabelsPicker";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface KanbanCardProps {
  lead: CRMLead;
  isNew?: boolean;
  hasAutomacaoAtiva?: boolean;
  hasCadenciaAtiva?: boolean;
  onCancelCadencia?: (leadId: string) => void;
  onClick: () => void;
  onUpdateOrigin?: (leadId: string, origin: string) => Promise<void>;
  onDelete?: (leadId: string) => Promise<void>;
  onIniciarAtendimento?: (leadId: string) => Promise<void>;
  onOpenAgendamento?: (leadId: string) => void;
  onOpenComparecimento?: (leadId: string) => void;
  onOpenVenda?: (leadId: string) => void;
  onOpenPerda?: (leadId: string, currentStatus: LeadStatus) => void;
  onOpenProposta?: (leadId: string) => void;
  onOpenReagendamento?: (leadId: string) => void;
  onSendWhatsAppNow?: (leadId: string, content: string) => Promise<void>;
  onScheduleWhatsApp?: (leadId: string, content: string, scheduledAt: string) => Promise<void>;
  onCallClick?: (leadId: string) => void;
}

// Vibrant dark theme colors for origin types
const ORIGIN_COLORS: Record<string, string> = {
  paid: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  organic: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  referral: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  manual: "bg-enove-yellow/20 text-enove-yellow border-enove-yellow/40",
  unknown: "bg-slate-500/20 text-slate-400 border-slate-500/40",
};

// Progress percentage by status
const STATUS_PROGRESS: Record<string, number> = {
  new: 10,
  info_sent: 25,
  awaiting_docs: 35,
  scheduling: 50,
  docs_received: 75,
  registered: 100,
  inactive: 0
};

const PROGRESS_COLORS: Record<string, string> = {
  new: "bg-blue-500",
  info_sent: "bg-enove-yellow",
  awaiting_docs: "bg-lime-500",
  scheduling: "bg-orange-500",
  docs_received: "bg-emerald-500",
  registered: "bg-slate-400",
  inactive: "bg-red-500"
};

// Contextual action button config per status
const ACTION_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string } | null> = {
  new: { label: "Iniciar Atendimento", icon: Play, color: "bg-primary text-primary-foreground hover:opacity-90" },
  info_sent: { label: "Agendar", icon: Calendar, color: "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground" },
  awaiting_docs: { label: "Agendar", icon: Calendar, color: "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground" },
  scheduling: { label: "Comparecimento", icon: FileText, color: "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground" },
  docs_received: { label: "Confirmar Venda", icon: Trophy, color: "bg-primary text-primary-foreground hover:opacity-90" },
  registered: null,
};

// Stable animation style to prevent re-render resets
const RING_PULSE_STYLE: React.CSSProperties = {
  animation: "ring-pulse 3s ease-in-out infinite",
};
const RING_PULSE_GLOW_STYLE: React.CSSProperties = {
  animation: "ring-pulse 3s ease-in-out infinite",
  boxShadow: "0 0 20px rgba(52,211,153,0.3)",
};

export function KanbanCard({ lead, isNew, hasAutomacaoAtiva, hasCadenciaAtiva, onCancelCadencia, onClick, onUpdateOrigin, onDelete, onIniciarAtendimento, onOpenAgendamento, onOpenComparecimento, onOpenVenda, onOpenPerda, onOpenProposta, onOpenReagendamento, onSendWhatsAppNow, onScheduleWhatsApp, onCallClick }: KanbanCardProps) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(new Date());
  const [scheduleTime, setScheduleTime] = useState(() => format(new Date(Date.now() + 60 * 60 * 1000), "HH:mm"));
  const [isSendingNow, setIsSendingNow] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  const actionConfig = useMemo(() => {
    if (lead.status === "scheduling") {
      if (lead.comparecimento === true) {
        return { label: "Fazer Proposta", icon: FileText, color: "bg-primary text-primary-foreground hover:opacity-90" };
      }
      if (lead.comparecimento === false) {
        return { label: "Reagendar", icon: Calendar, color: "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground" };
      }
    }
    return ACTION_CONFIG[lead.status];
  }, [lead.status, lead.comparecimento]);

  const animationStyle = useMemo(() => {
    if (isNew) return RING_PULSE_GLOW_STYLE;
    if (hasAutomacaoAtiva) return RING_PULSE_STYLE;
    return undefined;
  }, [isNew, hasAutomacaoAtiva]);

  const timeSinceInteraction = useMemo(() => {
    const date = lead.last_interaction_at ? new Date(lead.last_interaction_at) : new Date(lead.created_at);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return "Agora";
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1 dia";
    if (diffDays < 7) return `${diffDays} dias`;
    return new Date(lead.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }, [lead.last_interaction_at, lead.created_at]);

  const createdAtWithTime = useMemo(() => {
    const date = new Date(lead.created_at);
    const day = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return `${day} ${time}`;
  }, [lead.created_at]);

  const formatPhone = (phone: string) => {
    const clean = phone.replace(/\D/g, "");
    if (clean.length === 11) return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    if (clean.length === 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    return phone;
  };

  const isStale = useMemo(() => {
    const date = lead.last_interaction_at ? new Date(lead.last_interaction_at) : new Date(lead.created_at);
    const now = new Date();
    return (now.getTime() - date.getTime()) / (1000 * 60 * 60) > 48;
  }, [lead.last_interaction_at, lead.created_at]);

  const cleanPhone = lead.whatsapp.replace(/\D/g, "");
  const originType = getOriginType(lead.lead_origin);
  const progress = STATUS_PROGRESS[lead.status] || 0;
  const canSubmitMessage = !!messageText.trim();

  const buildScheduledDateTime = () => {
    if (!scheduleDate || !scheduleTime) return null;
    const [hours, minutes] = scheduleTime.split(":").map(Number);
    const nextDate = new Date(scheduleDate);
    nextDate.setHours(hours || 0, minutes || 0, 0, 0);
    return nextDate;
  };

  const handleOriginSelect = async (origin: string) => {
    if (onUpdateOrigin) await onUpdateOrigin(lead.id, origin);
  };

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    switch (lead.status) {
      case "new":
        onIniciarAtendimento?.(lead.id);
        break;
      case "info_sent":
      case "awaiting_docs":
        onOpenAgendamento?.(lead.id);
        break;
      case "scheduling":
        if (lead.comparecimento === true) {
          onOpenProposta?.(lead.id);
        } else if (lead.comparecimento === false) {
          onOpenReagendamento?.(lead.id);
        } else {
          onOpenComparecimento?.(lead.id);
        }
        break;
      case "docs_received":
        onOpenVenda?.(lead.id);
        break;
    }
  };

  const handleSendNow = async () => {
    const text = messageText.trim();
    if (!text || !onSendWhatsAppNow || isSendingNow) return;
    setIsSendingNow(true);
    try {
      await onSendWhatsAppNow(lead.id, text);
      setMessageText("");
      setComposerOpen(false);
    } finally {
      setIsSendingNow(false);
    }
  };

  const handleScheduleMessage = async () => {
    const text = messageText.trim();
    const scheduledDate = buildScheduledDateTime();
    if (!text || !scheduledDate || !onScheduleWhatsApp || isScheduling) return;
    if (scheduledDate.getTime() <= Date.now()) return;
    setIsScheduling(true);
    try {
      await onScheduleWhatsApp(lead.id, text, scheduledDate.toISOString());
      setMessageText("");
      setScheduleOpen(false);
      setComposerOpen(false);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div
      style={animationStyle}
      onClick={onClick}
      className={cn(
        "relative rounded-xl cursor-pointer",
        "bg-[#1e1e22] border border-[#2a2a2e]",
        "hover:border-primary/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)]",
        "transition-[border-color,transform,opacity] duration-200 ease-out",
        "group overflow-hidden",
        isStale && !hasAutomacaoAtiva && "ring-2 ring-red-400/50",
        isNew && "shadow-[0_0_20px_rgba(52,211,153,0.3)]",
      )}
    >
      <div className="p-3">
        {/* Row 1: Project Name + Date/Time */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          {lead.project ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-primary/20 text-primary border border-primary/40">
              {lead.project.name}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-500 border border-dashed border-slate-600">
              Sem projeto
            </span>
          )}
          <span className="text-[10px] text-slate-500 shrink-0">{createdAtWithTime}</span>
        </div>

        {/* Row 2: Contextual badges */}
        {(lead.roleta_id || lead.status_distribuicao === 'fallback_lider' || lead.auto_first_message_sent || lead.attribution?.landing_page === "admin_manual" || isStale) && (
          <div className="flex flex-wrap items-center gap-1 mb-2">
            {lead.roleta_id && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                <RotateCw className="w-2.5 h-2.5" />Roleta
              </span>
            )}
            {lead.status_distribuicao === 'fallback_lider' && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <AlertTriangle className="w-2.5 h-2.5" />Fallback
              </span>
            )}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  {lead.auto_first_message_sent ? (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-medium">
                      <CheckCircle2 className="w-3 h-3" />1ª msg
                    </span>
                  ) : lead.attribution?.landing_page === "admin_manual" ? (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-400 text-[9px] font-medium">
                      <Lock className="w-3 h-3" />Manual
                    </span>
                  ) : null}
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-[#1e1e22] border-[#2a2a2e] text-xs">
                  {lead.auto_first_message_sent ? (
                    <span className="text-emerald-300">Primeira mensagem automática enviada</span>
                  ) : lead.attribution?.landing_page === "admin_manual" ? (
                    <span className="text-slate-300">Origem manual - sem automação</span>
                  ) : null}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isStale && (
              <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-red-500 text-white rounded-full">!</span>
            )}
            {hasCadenciaAtiva && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-dot-pulse" />
                      <button
                        onClick={(e) => { e.stopPropagation(); onCancelCadencia?.(lead.id); }}
                        className="p-0.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Parar cadência"
                      >
                        <Square className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-[#1e1e22] border-[#2a2a2e] text-xs">
                    <span className="text-emerald-300">Cadência 10D™ ativa</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}

        {/* Lead Name */}
        <h4 className="font-semibold text-white text-sm leading-snug line-clamp-1 mb-2 group-hover:text-primary transition-colors">
          {lead.name}
        </h4>

        {/* Contact Info */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Phone className="w-3 h-3 text-slate-500" />
            <span>{formatPhone(lead.whatsapp)}</span>
          </div>
          {lead.email && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Mail className="w-3 h-3 text-slate-500" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          <LeadLabelsPicker leadId={lead.id} brokerId={lead.broker_id} phone={lead.whatsapp} compact />
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="h-1 w-full bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", PROGRESS_COLORS[lead.status])}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Action buttons row */}
        <div className="flex items-center gap-2 mb-3">
          {/* Contextual action button */}
          {actionConfig && (
            <button
              onClick={handleAction}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 min-h-[40px] md:min-h-0 md:py-1.5",
                "rounded-lg font-medium text-xs transition-all duration-150",
                "hover:scale-[1.02] active:scale-[0.98] shadow-sm",
                actionConfig.color
              )}
            >
              <actionConfig.icon className="w-4 h-4 md:w-3.5 md:h-3.5" />
              <span>{actionConfig.label}</span>
            </button>
          )}

          {/* WhatsApp composer */}
          {lead.status !== "new" && (
            <Popover open={composerOpen} onOpenChange={setComposerOpen}>
              <PopoverTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "flex items-center justify-center p-2 min-h-[40px] md:min-h-0 md:p-1.5",
                    "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg",
                    "transition-all duration-150"
                  )}
                  title="Enviar ou programar WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 md:w-3.5 md:h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80 space-y-3 p-3" onClick={(e) => e.stopPropagation()}>
                <div>
                  <p className="text-sm font-medium text-foreground">Mensagem para {lead.name}</p>
                  <p className="text-xs text-muted-foreground">Escreva aqui e escolha entre enviar agora ou programar.</p>
                </div>
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="min-h-[96px] resize-none"
                />
                <div className="flex items-end gap-2">
                  <Popover open={scheduleOpen} onOpenChange={setScheduleOpen}>
                    <PopoverTrigger asChild>
                      <Button size="icon" variant="outline" className="h-9 w-9 flex-shrink-0" disabled={!canSubmitMessage || isScheduling || isSendingNow}>
                        <CalendarClock className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-80 space-y-3 p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">Programar mensagem</p>
                        <p className="text-xs text-muted-foreground">Use o mesmo padrão do Inbox para escolher dia e horário.</p>
                      </div>
                      <DatePickerCalendar mode="single" selected={scheduleDate} onSelect={setScheduleDate} className="rounded-md border border-border" />
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Horário</label>
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                        />
                      </div>
                      <div className="rounded-lg border border-border bg-muted/40 p-2 text-xs text-muted-foreground">
                        {buildScheduledDateTime()
                          ? `Envio para ${format(buildScheduledDateTime()!, "dd/MM 'às' HH:mm", { locale: ptBR })}`
                          : "Selecione uma data e horário válidos."}
                      </div>
                      <Button className="w-full" onClick={handleScheduleMessage} disabled={!canSubmitMessage || isScheduling || !buildScheduledDateTime()}>
                        {isScheduling ? "Programando..." : "Confirmar agendamento"}
                      </Button>
                    </PopoverContent>
                  </Popover>
                  <Button size="icon" className="h-9 w-9 flex-shrink-0" onClick={(e) => { e.stopPropagation(); void handleSendNow(); }} disabled={!canSubmitMessage || isSendingNow || isScheduling}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Call button */}
          {lead.status !== "new" && onCallClick && (
            <button
              onClick={(e) => { e.stopPropagation(); onCallClick(lead.id); }}
              className={cn(
                "flex items-center justify-center p-2 min-h-[40px] md:min-h-0 md:p-1.5",
                "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg",
                "transition-all duration-150"
              )}
              title="Registrar ligação"
            >
              <Phone className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </button>
          )}

          {/* Perda + Delete buttons */}
          <div className="flex items-center gap-1 ml-auto">
            {lead.status !== "registered" && onOpenPerda && (
              <button
                onClick={(e) => { e.stopPropagation(); onOpenPerda(lead.id, lead.status); }}
                className={cn(
                  "p-2 md:p-1.5 rounded-md min-w-[40px] min-h-[40px] md:min-w-0 md:min-h-0",
                  "flex items-center justify-center",
                  "text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                )}
                title="Inativar lead"
              >
                <UserX className="w-4 h-4 md:w-3.5 md:h-3.5" />
              </button>
            )}

            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "p-2 md:p-1.5 rounded-md min-w-[40px] min-h-[40px] md:min-w-0 md:min-h-0",
                      "flex items-center justify-center",
                      "text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    )}
                    title="Excluir lead"
                  >
                    <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. O lead <strong>{lead.name}</strong> e todos os dados relacionados serão excluídos permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(lead.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Footer with avatar, time and origin */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
          <div className="flex items-center gap-2">
            <Avatar className="w-5 h-5 border border-[#2a2a2e]">
              <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-[9px] font-medium">
                {lead.broker?.name?.charAt(0) || (lead.source === "enove" ? "E" : "?")}
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px] text-slate-400 max-w-[70px] truncate" title={lead.broker?.name || "Enove"}>
              {lead.broker?.name || "Enove"}
            </span>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-1 text-[10px] text-slate-500" title="Última interação">
              <Clock className="w-3 h-3" />
              <span>{timeSinceInteraction}</span>
            </div>
          </div>

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <OriginCombobox
                    currentOrigin={lead.lead_origin}
                    onSelect={handleOriginSelect}
                    trigger={
                      lead.lead_origin ? (
                        <button className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide hover:opacity-80 transition-opacity border", ORIGIN_COLORS[originType])}>
                          {getOriginDisplayLabel(lead.lead_origin)}
                        </button>
                      ) : (
                        <button className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-500 hover:text-slate-300 border border-dashed border-slate-600 hover:border-slate-400 transition-colors")}>
                          <Plus className="w-2.5 h-2.5" />Origem
                        </button>
                      )
                    }
                  />
                </div>
              </TooltipTrigger>
              {(lead as any).lead_origin_detail && (
                <TooltipContent side="top" className="bg-[#1e1e22] border-[#2a2a2e] text-xs max-w-[250px]">
                  <span className="text-slate-300">{(lead as any).lead_origin_detail}</span>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
