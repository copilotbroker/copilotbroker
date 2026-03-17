import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Clock,
  MessageCircle,
  Send,
  CalendarClock,
  Plus,
  UserX,
  Trash2,
  Mail,
  Phone,
  CheckCircle2,
  Lock,
  RotateCw,
  AlertTriangle,
  Play,
  Calendar,
  FileText,
  Trophy,
  Square,
} from "lucide-react";
import { CRMLead, LeadStatus, getOriginDisplayLabel } from "@/types/crm";
import { cn } from "@/lib/utils";

import { OriginCombobox } from "./OriginCombobox";
import { LeadLabelsPicker } from "./LeadLabelsPicker";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, type ButtonProps } from "@/components/ui/button";
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

type KanbanActionConfig = {
  label: string;
  icon: React.ElementType;
  variant: NonNullable<ButtonProps["variant"]>;
} | null;

const ACTION_CONFIG: Record<string, KanbanActionConfig> = {
  new: { label: "Iniciar Atendimento", icon: Play, variant: "default" },
  info_sent: { label: "Agendar", icon: Calendar, variant: "secondary" },
  awaiting_docs: { label: "Agendar", icon: Calendar, variant: "secondary" },
  scheduling: { label: "Comparecimento", icon: FileText, variant: "secondary" },
  docs_received: { label: "Confirmar Venda", icon: Trophy, variant: "default" },
  registered: null,
};

const RING_PULSE_STYLE: React.CSSProperties = {
  animation: "ring-pulse 3s ease-in-out infinite",
};

const RING_PULSE_GLOW_STYLE: React.CSSProperties = {
  animation: "ring-pulse 3s ease-in-out infinite",
  boxShadow: "0 0 24px hsl(var(--primary) / 0.18)",
};

export function KanbanCard({
  lead,
  isNew,
  hasAutomacaoAtiva,
  hasCadenciaAtiva,
  onCancelCadencia,
  onClick,
  onUpdateOrigin,
  onDelete,
  onIniciarAtendimento,
  onOpenAgendamento,
  onOpenComparecimento,
  onOpenVenda,
  onOpenPerda,
  onOpenProposta,
  onOpenReagendamento,
  onSendWhatsAppNow,
  onScheduleWhatsApp,
  onCallClick,
}: KanbanCardProps) {
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
        return { label: "Fazer Proposta", icon: FileText, variant: "outline" as const };
      }
      if (lead.comparecimento === false) {
        return { label: "Reagendar", icon: Calendar, variant: "outline" as const };
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

  const canSubmitMessage = !!messageText.trim();
  const brokerLabel = lead.broker?.name || "Enove";
  const showMetaBadges = !!(
    lead.roleta_id ||
    lead.status_distribuicao === "fallback_lider" ||
    lead.auto_first_message_sent ||
    lead.attribution?.landing_page === "admin_manual" ||
    isStale ||
    hasAutomacaoAtiva
  );

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
        "group relative cursor-pointer overflow-hidden rounded-xl border bg-card text-card-foreground",
        "transition-[border-color,transform,opacity,box-shadow] duration-200 ease-out",
        "hover:border-primary/50 hover:shadow-[0_8px_30px_hsl(240_10%_3%_/_0.35)]",
        isStale && !hasAutomacaoAtiva && "opacity-60",
        hasAutomacaoAtiva && "border-primary/40",
        isNew && "ring-1 ring-primary/40"
      )}
    >
      <div className="p-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              {lead.project ? (
                <Badge variant="secondary" className="max-w-[140px] truncate border border-border/70 bg-muted/60 text-[10px] font-semibold uppercase tracking-wide text-foreground">
                  {lead.project.name}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-dashed text-[10px] uppercase tracking-wide text-muted-foreground">
                  Sem projeto
                </Badge>
              )}

              {isNew && (
                <Badge className="bg-primary/15 text-primary hover:bg-primary/15 text-[10px] uppercase tracking-wide">
                  Novo
                </Badge>
              )}
            </div>

            <h4 className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
              {lead.name}
            </h4>
          </div>

          <span className="shrink-0 text-[10px] text-muted-foreground">{createdAtWithTime}</span>
        </div>

        {showMetaBadges && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {lead.roleta_id && (
              <Badge variant="outline" className="gap-1 border-border bg-muted/40 text-[10px] text-muted-foreground">
                <RotateCw className="h-3 w-3" />
                Roleta
              </Badge>
            )}

            {lead.status_distribuicao === "fallback_lider" && (
              <Badge variant="outline" className="gap-1 border-destructive/30 bg-destructive/10 text-[10px] text-destructive">
                <AlertTriangle className="h-3 w-3" />
                Fallback
              </Badge>
            )}

            {lead.auto_first_message_sent && (
              <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/10 text-[10px] text-primary">
                <CheckCircle2 className="h-3 w-3" />
                1ª msg
              </Badge>
            )}

            {lead.attribution?.landing_page === "admin_manual" && !lead.auto_first_message_sent && (
              <Badge variant="outline" className="gap-1 border-border bg-muted/40 text-[10px] text-muted-foreground">
                <Lock className="h-3 w-3" />
                Manual
              </Badge>
            )}

            {isStale && !hasAutomacaoAtiva && (
              <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-[10px] text-destructive">
                Sem interação
              </Badge>
            )}

            {hasAutomacaoAtiva && (
              <TooltipProvider delayDuration={250}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5">
                      <span className="h-2 w-2 rounded-full bg-primary animate-dot-pulse" />
                      <span className="text-[10px] font-medium text-primary">Copiloto ativo</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelCadencia?.(lead.id);
                        }}
                        className="rounded p-0.5 text-primary/80 transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Parar fluxo"
                      >
                        <Square className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {hasCadenciaAtiva ? "Cadência ativa — clique para parar tudo" : "Fluxo futuro ativo — clique para parar tudo"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{formatPhone(lead.whatsapp)}</span>
          </div>

          {lead.email && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
        </div>

        {lead.broker_id && (
          <div className="mt-2">
            <LeadLabelsPicker leadId={lead.id} brokerId={lead.broker_id} phone={lead.whatsapp} compact />
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {actionConfig && (
            <Button
              size="sm"
              variant={actionConfig.variant}
              onClick={handleAction}
              className="h-8 gap-1.5 rounded-lg px-3.5 text-xs font-semibold"
            >
              <actionConfig.icon className="h-3.5 w-3.5" />
              <span>{actionConfig.label}</span>
            </Button>
          )}

          {lead.status !== "new" && (
            <Popover open={composerOpen} onOpenChange={setComposerOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8 rounded-lg px-0"
                  title="Enviar ou programar WhatsApp"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </Button>
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
                      <Button size="icon" variant="accent" className="h-9 w-9 flex-shrink-0 rounded-lg" disabled={!canSubmitMessage || isScheduling || isSendingNow}>
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

                      <Button variant="accent" className="w-full" onClick={handleScheduleMessage} disabled={!canSubmitMessage || isScheduling || !buildScheduledDateTime()}>
                        {isScheduling ? "Programando..." : "Confirmar agendamento"}
                      </Button>
                    </PopoverContent>
                  </Popover>

                  <Button size="icon" variant="success" className="h-9 w-9 flex-shrink-0 rounded-lg" onClick={(e) => { e.stopPropagation(); void handleSendNow(); }} disabled={!canSubmitMessage || isSendingNow || isScheduling}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {lead.status !== "new" && onCallClick && (
            <Button
              size="sm"
              variant="accent"
              onClick={(e) => {
                e.stopPropagation();
                onCallClick(lead.id);
              }}
              className="h-8 w-8 rounded-lg px-0"
              title="Registrar ligação"
            >
              <Phone className="h-3.5 w-3.5" />
            </Button>
          )}

          <div className="ml-auto flex items-center gap-1">
            {lead.status !== "registered" && onOpenPerda && (
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPerda(lead.id, lead.status);
                }}
                className="h-8 w-8 rounded-lg p-0"
                title="Inativar lead"
              >
                <UserX className="h-4 w-4" />
              </Button>
            )}

            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => e.stopPropagation()}
                    className="h-8 w-8 rounded-lg p-0"
                    title="Excluir lead"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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

        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="h-5 w-5 border border-border/60">
              <AvatarFallback className="bg-muted text-[9px] font-medium text-foreground">
                {lead.broker?.name?.charAt(0) || (lead.source === "enove" ? "E" : "?")}
              </AvatarFallback>
            </Avatar>

            <span className="max-w-[84px] truncate text-[10px] text-muted-foreground" title={brokerLabel}>
              {brokerLabel}
            </span>

            <span className="text-muted-foreground/50">•</span>

            <div className="flex items-center gap-1 text-[10px] text-muted-foreground" title="Última interação">
              <Clock className="h-3 w-3" />
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
                        <button className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary">
                          {getOriginDisplayLabel(lead.lead_origin)}
                        </button>
                      ) : (
                        <button className="rounded-md border border-dashed border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                          <span className="flex items-center gap-1">
                            <Plus className="h-2.5 w-2.5" />
                            Origem
                          </span>
                        </button>
                      )
                    }
                  />
                </div>
              </TooltipTrigger>

              {(lead as any).lead_origin_detail && (
                <TooltipContent side="top" className="max-w-[250px] text-xs">
                  <span>{(lead as any).lead_origin_detail}</span>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
