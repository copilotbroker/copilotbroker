import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightLeft,
  ArrowLeft,
  Send,
  Bot,
  User,
  Archive,
  ArchiveRestore,
  Sparkles,
  Zap,
  LayoutGrid,
  Smartphone,
  UserRoundSearch,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Mic,
  Video,
  Check,
  CheckCheck,
  Clock3,
  CalendarClock,
  X,
  Square,
  Wifi,
  ShieldAlert,
  AlertCircle,
  RotateCw,
} from "lucide-react";

import { ScheduledMessagesPanel } from "./ScheduledMessagesPanel";
import { AdReferralCard } from "./AdReferralCard";
import { MessageMedia } from "./MessageMedia";
import { PerdaModal } from "@/components/crm/PerdaModal";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Conversation, ConversationMessage, OutboundMessagePayload, ScheduledConversationMessage } from "@/hooks/use-conversations";
import { cn } from "@/lib/utils";
import { useBrokerPersonalCooldown } from "@/hooks/use-broker-personal-cooldown";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
// supabase import removed — file uploads moved to use-conversations hook
import { toast } from "sonner";

interface ConversationThreadProps {
  conversation: Conversation;
  messages: ConversationMessage[];
  scheduledMessages: ScheduledConversationMessage[];
  isLoading: boolean;
  onSendMessage: (payload: string | OutboundMessagePayload, sentBy?: string) => Promise<unknown>;
  onResendMessage?: (clientMessageId: string) => Promise<unknown>;

  onScheduleMessage: (content: string, scheduledAt: string) => Promise<unknown>;
  onCancelScheduledMessage: (queueId: string) => Promise<unknown>;
  onBack: () => void;
  onMarkAsRead: () => void;
  onArchive: () => void;
  onUnarchive?: () => void;
  onToggleAiMode: (mode: string) => void;
  copilotSuggestion: string;
  isGeneratingSuggestion: boolean;
  onRequestSuggestion: () => void;
  onInsertSuggestion: () => void;
  onDismissSuggestion: () => void;
  onOpenLeadPanel: () => void;
  onCreateLead?: () => void;
  onOpenLead?: (leadId: string) => void;
  /** When true, the conversation is from "Novos" tab — read-only until claimed */
  isNewLead?: boolean;
  onStartAttendance?: () => void;
  isStartingAttendance?: boolean;
  /** Read-only supervision mode (Outros tab) */
  isReadOnly?: boolean;
  /** Transfer lead to another broker */
  onTransfer?: () => void;
  /** Pull conversation from global to personal instance */
  onPullToPersonal?: () => void;
  isPullingToPersonal?: boolean;
  /** Return conversation from personal back to global instance */
  onReturnToGlobal?: () => void;
  isReturningToGlobal?: boolean;
  /** Inactivate the linked lead with reason */
  onInactivateLead?: (reason: string) => Promise<void>;
}

const getMessageStatusIcon = (status?: string) => {
  switch (status) {
    case "read":
      return <CheckCheck className="h-3 w-3 text-sky-400" />;
    case "delivered":
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    case "sent":
      return <Check className="h-3 w-3 text-muted-foreground" />;
    case "failed":
      return <AlertCircle className="h-3 w-3 text-destructive" />;
    case "queued":
    case "sending":
    case "pending":
    default:
      return <Check className="h-3 w-3 text-muted-foreground/50" />;
  }
};


const formatMessageDay = (date: string) => format(new Date(date), "d 'de' MMMM", { locale: ptBR });
const formatScheduledAt = (date: string) => format(new Date(date), "dd/MM 'às' HH:mm", { locale: ptBR });

export function ConversationThread({
  conversation,
  messages,
  scheduledMessages,
  isLoading,
  onSendMessage,
  onResendMessage,

  onScheduleMessage,
  onCancelScheduledMessage,
  onBack,
  onMarkAsRead,
  onArchive,
  onUnarchive,
  onToggleAiMode,
  copilotSuggestion,
  isGeneratingSuggestion,
  onRequestSuggestion,
  onInsertSuggestion,
  onDismissSuggestion,
  onOpenLeadPanel,
  onCreateLead,
  onOpenLead,
  isNewLead,
  onStartAttendance,
  isStartingAttendance,
  isReadOnly,
  onTransfer,
  onPullToPersonal,
  isPullingToPersonal,
  onReturnToGlobal,
  isReturningToGlobal,
  onInactivateLead,
}: ConversationThreadProps) {
  const [inputValue, setInputValue] = useState("");
  const [perdaModalOpen, setPerdaModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(new Date());
  const [scheduleTime, setScheduleTime] = useState(() => format(new Date(Date.now() + 60 * 60 * 1000), "HH:mm"));
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Anti-block protection: 24h cooldown after broker connects personal WhatsApp.
  // During cooldown the broker can only REPLY (after lead inbound), never initiate cold contact.
  const personalCooldown = useBrokerPersonalCooldown((conversation as any).broker_id);
  const sourceInstance = (conversation as any).source_instance || "personal";
  const hasInboundFromLead = useMemo(
    () => messages.some((m) => m.direction === "inbound"),
    [messages]
  );
  const isPersonalLocked =
    sourceInstance !== "global" && personalCooldown.active && !hasInboundFromLead;
  const cooldownTooltip = isPersonalLocked
    ? `Proteção anti-bloqueio: aguarde ${personalCooldown.hoursRemaining}h após conectar para iniciar contatos pelo seu WhatsApp pessoal. Você pode responder normalmente assim que o cliente enviar a primeira mensagem.`
    : undefined;

  // Fetch lead attribution for the linked lead (shows ad tracking info)
  const { data: leadAttribution } = useQuery({
    queryKey: ["lead-attribution-chat", conversation.lead_id],
    queryFn: async () => {
      if (!conversation.lead_id) return null;
      const { data } = await supabase
        .from("lead_attribution")
        .select("utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing_page, ad_referral, created_at")
        .eq("lead_id", conversation.lead_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data) return null;
      const hasAdRef = !!data.ad_referral;
      if (!hasAdRef && !data.utm_source && !data.utm_campaign && !data.utm_medium && !data.landing_page) return null;
      return data;
    },
    enabled: !!conversation.lead_id,
    staleTime: 5 * 60_000,
  });

  const cleanupRecording = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch {
      toast.error("Não foi possível acessar o microfone");
    }
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    cleanupRecording();
  }, [cleanupRecording]);

  const stopAndSendRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    recorder.onstop = () => {
      const mimeType = recorder.mimeType || "audio/webm";
      const ext = mimeType.includes("ogg") ? "ogg" : "webm";
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      const file = new File([blob], `audio-${Date.now()}.${ext}`, { type: mimeType });

      cleanupRecording();

      // Fire-and-forget: hook handles upload + optimistic display
      onSendMessage({
        content: "",
        messageType: "audio",
        file,
      });
    };

    recorder.stop();
  }, [onSendMessage, cleanupRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const leadName = conversation.display_name || (conversation.lead as any)?.name || conversation.phone;
  const isAiActive = conversation.ai_mode === "ai_active";
  const isCopilot = conversation.ai_mode === "copilot";
  const hasResolvedName = !!conversation.display_name && conversation.display_name !== conversation.phone;
  const canScheduleText = !!inputValue.trim() && !pendingFile;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (conversation.unread_count > 0) {
      onMarkAsRead();
    }
  }, [conversation.id]);

  const pendingType = useMemo(() => {
    if (!pendingFile) return null;
    if (pendingFile.type.startsWith("image/")) return "image" as const;
    if (pendingFile.type.startsWith("audio/")) return "audio" as const;
    if (pendingFile.type.startsWith("video/")) return "video" as const;
    return "document" as const;
  }, [pendingFile]);

  const buildScheduledDateTime = () => {
    if (!scheduleDate || !scheduleTime) return null;
    const [hours, minutes] = scheduleTime.split(":").map(Number);
    const nextDate = new Date(scheduleDate);
    nextDate.setHours(hours || 0, minutes || 0, 0, 0);
    return nextDate;
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if ((!text && !pendingFile) || isSending) return;

    const fileToSend = pendingFile;
    const fileTypeToSend = pendingType;

    setInputValue("");
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (inputRef.current) inputRef.current.style.height = "auto";
    inputRef.current?.focus();

    if (fileToSend && fileTypeToSend) {
      // Pass file to hook — it handles optimistic + background upload
      onSendMessage({
        content: text || "",
        messageType: fileTypeToSend,
        file: fileToSend,
      });
    } else {
      // Text-only: fire-and-forget (hook handles optimistic)
      onSendMessage(text);
    }
  };

  const handleSchedule = async () => {
    const text = inputValue.trim();
    const scheduledDate = buildScheduledDateTime();

    if (!text || !scheduledDate) return;
    if (scheduledDate.getTime() <= Date.now()) {
      toast.error("Escolha uma data e horário no futuro");
      return;
    }

    setIsScheduling(true);
    try {
      await onScheduleMessage(text, scheduledDate.toISOString());
      setInputValue("");
      setScheduleOpen(false);
      inputRef.current?.focus();
    } finally {
      setIsScheduling(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      if (isTouchDevice) {
        // Mobile: Enter = newline, Ctrl/Meta+Enter = send
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleSend();
        }
      } else {
        // Desktop: Enter = send, Shift+Enter = newline
        if (e.shiftKey) return; // allow newline
        e.preventDefault();
        handleSend();
      }
    }
  };

  const handleInsertSuggestion = () => {
    setInputValue(copilotSuggestion);
    onInsertSuggestion();
    inputRef.current?.focus();
  };

  return (
    <div
      className="flex h-full flex-col bg-background"
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null || touchStartY.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
        touchStartX.current = null;
        touchStartY.current = null;
        if (dx > 80 && dy < 60) onBack();
      }}
    >
      <div className="border-b border-border bg-card px-3 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden h-8 w-8 text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <button onClick={onOpenLeadPanel} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            {(conversation as any).source_instance === "global" ? (
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-purple-900/60 text-purple-400">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              </div>
            ) : (
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
                {leadName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{leadName}</p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] text-muted-foreground">{conversation.phone}</p>
                <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                  {conversation.lead_id ? "Lead vinculado" : hasResolvedName ? "Nome identificado" : "WhatsApp direto"}
                </Badge>
                {(conversation as any).source_instance === "global" && (conversation as any).attendance_started && (conversation as any).broker?.name && (
                  <Badge className="h-4 px-1.5 text-[10px] bg-purple-600/20 text-purple-400 border-purple-500/30 border">
                    Atribuído a: {(conversation as any).broker.name}
                  </Badge>
                )}
                {conversation.status && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px] capitalize">
                    {conversation.status}
                  </Badge>
                )}
              </div>
            </div>
          </button>

          <div className="flex items-center gap-1">
            {onPullToPersonal && (conversation as any).source_instance === "global" && (conversation as any).attendance_started && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPullToPersonal}
                disabled={isPullingToPersonal}
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                title="Puxar para meu WhatsApp pessoal"
              >
                <Smartphone className="h-4 w-4" />
                <span className="hidden sm:inline">Meu WhatsApp</span>
              </Button>
            )}
            {onReturnToGlobal && (conversation as any).source_instance === "personal" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReturnToGlobal}
                disabled={isReturningToGlobal}
                className="h-8 gap-1.5 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                title="Devolver ao WhatsApp do Plantão"
              >
                <Wifi className="h-4 w-4" />
                <span className="hidden sm:inline">Plantão</span>
              </Button>
            )}
            {onTransfer && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onTransfer}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Transferir lead"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
            )}
            {conversation.lead_id && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenLead ? onOpenLead(conversation.lead_id!) : navigate(`/corretor/lead/${conversation.lead_id}`)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Ver perfil do lead"
              >
                <UserRoundSearch className="h-4 w-4" />
              </Button>
            )}
            {conversation.is_archived && onUnarchive ? (
              <Button variant="ghost" size="icon" onClick={onUnarchive} className="h-8 w-8 text-muted-foreground" title="Desarquivar">
                <ArchiveRestore className="h-4 w-4" />
              </Button>
            ) : conversation.lead_id && onInactivateLead ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPerdaModalOpen(true)}
                className="h-8 w-8 text-muted-foreground hover:text-red-400"
                title="Inativar Lead"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={onArchive} className="h-8 w-8 text-muted-foreground" title="Arquivar">
                <Archive className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Banner de "Iniciar Atendimento" movido para o rodapé do chat */}

      {!isNewLead && !conversation.lead_id && onCreateLead && (
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <LayoutGrid className="h-3 w-3" /> Contato sem card no Kanban
          </span>
          <Button size="sm" className="h-7 text-xs" onClick={onCreateLead}>
            Criar Card
          </Button>
        </div>
      )}

      {(conversation as any).attendance_started && isAiActive && (
        <div className="flex items-center justify-between border-b border-border bg-card px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <Zap className="h-3.5 w-3.5" /> Piloto Automático ativo
          </span>
          <Button size="sm" variant="outline" className="h-7 gap-1 rounded-full border-border bg-card px-3 text-xs hover:bg-muted/40" onClick={() => onToggleAiMode("copilot")}>
            <User className="h-3 w-3" /> Desativar Piloto
          </Button>
        </div>
      )}
      {(conversation as any).attendance_started && isCopilot && (
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <User className="h-3.5 w-3.5" /> Modo Copiloto
          </span>
          <Button size="sm" className="h-7 gap-1 rounded-full px-3 text-xs" onClick={() => onToggleAiMode("ai_active")}>
            <Zap className="h-3 w-3" /> Ativar Piloto
          </Button>
        </div>
      )}

      <ScheduledMessagesPanel
        scheduledMessages={scheduledMessages}
        onCancelScheduledMessage={onCancelScheduledMessage}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma mensagem ainda. Envie a primeira!</div>
        ) : (
          <div className="space-y-3">
            {/* Lead attribution card from CRM data */}
            {leadAttribution && (() => {
              const ar = (leadAttribution as any).ad_referral as Record<string, string> | null | undefined;
              return (
                <AdReferralCard
                  referral={{
                    source: ar?.source ?? leadAttribution.utm_source ?? undefined,
                    campaign: ar?.campaign ?? leadAttribution.utm_campaign ?? undefined,
                    headline: ar?.headline ?? leadAttribution.utm_content ?? undefined,
                    medium: ar?.medium ?? leadAttribution.utm_medium ?? undefined,
                    source_url: ar?.source_url ?? leadAttribution.landing_page ?? undefined,
                    source_id: ar?.source_id ?? undefined,
                    source_type: ar?.source_type ?? undefined,
                    thumbnail_url: ar?.thumbnail_url ?? undefined,
                  }}
                  timestamp={leadAttribution.created_at}
                />
              );
            })()}
            {messages.map((msg, index) => {
              const isOutbound = msg.direction === "outbound";
              const isAi = msg.sent_by === "ai";
              const isSystemMessage = msg.sent_by === "system";
              const previousMessage = messages[index - 1];
              const showDayDivider = !previousMessage || formatMessageDay(previousMessage.created_at) !== formatMessageDay(msg.created_at);

              // Detect source instance from metadata
              const msgInstance = (msg.metadata as any)?.source_instance as string | undefined;
              const prevInstance = previousMessage ? (previousMessage.metadata as any)?.source_instance as string | undefined : undefined;
              const instanceChanged = !!msgInstance && !!prevInstance && msgInstance !== prevInstance && !showDayDivider;
              const isGlobalInstance = msgInstance === "global";

              const adReferral = (msg.metadata as any)?.ad_referral as Record<string, string> | undefined;

              return (
                <div key={msg.id}>
                  {showDayDivider && (
                    <div className="my-4 flex items-center gap-3">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {formatMessageDay(msg.created_at)}
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  )}

                  {instanceChanged && (
                    <div className="my-3 flex items-center gap-2">
                      <div className={cn("h-px flex-1", isGlobalInstance ? "bg-purple-500/30" : "bg-emerald-500/30")} />
                      <span className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-medium",
                        isGlobalInstance
                          ? "border-purple-500/30 bg-purple-500/10 text-purple-400"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      )}>
                        {isGlobalInstance ? (
                          <>
                            <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                            Plantão (Instância Global)
                          </>
                        ) : (
                          <>
                            <Smartphone className="h-3 w-3" />
                            WhatsApp Pessoal
                          </>
                        )}
                      </span>
                      <div className={cn("h-px flex-1", isGlobalInstance ? "bg-purple-500/30" : "bg-emerald-500/30")} />
                    </div>
                  )}

                  {isSystemMessage ? (
                    <div className="my-2 flex items-center gap-3">
                      <div className="h-px flex-1 bg-border" />
                      <span className="rounded-full bg-muted/60 border border-border px-3 py-1 text-[11px] text-muted-foreground">
                        {msg.content}
                        <span className="ml-2 text-[10px] opacity-70">
                          {format(new Date(msg.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  ) : (
                    <div className={cn("flex", isOutbound ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                      isOutbound
                        ? isAi
                          ? "rounded-br-sm border border-border bg-card text-foreground"
                          : isGlobalInstance
                            ? "rounded-br-sm border border-purple-500/30 bg-purple-900/20 text-foreground"
                            : "rounded-br-sm border border-emerald-500/30 bg-emerald-900/20 text-foreground"
                        : "rounded-bl-sm border border-border bg-card text-card-foreground"
                    )}>
                      {isAi && <span className="mb-1 flex items-center gap-0.5 text-[10px] text-muted-foreground"><Bot className="h-3 w-3" /> Copiloto</span>}
                      {isOutbound && !isAi && msg.sender_name && isGlobalInstance && (
                        <span className="mb-1 block text-[10px] font-semibold text-purple-400">
                          {msg.sender_name}
                        </span>
                      )}
                      {isOutbound && msgInstance && (
                        <span className={cn(
                          "mb-1 flex items-center gap-1 text-[10px]",
                          isGlobalInstance ? "text-purple-400" : "text-emerald-400"
                        )}>
                          {isGlobalInstance ? (
                            <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                          ) : (
                            <Smartphone className="h-2.5 w-2.5" />
                          )}
                          {isGlobalInstance ? "Plantão" : "Pessoal"}
                        </span>
                      )}
                      {!isOutbound && msg.sender_name && <span className="mb-1 block text-[10px] text-muted-foreground">{msg.sender_name}</span>}
                      {msg.message_type === "text" ? (
                        msg.content?.startsWith("[Undecryptable]") ? (
                          <p className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[12px] text-amber-300">
                            <span aria-hidden>🔒</span>
                            <span>
                              O WhatsApp do remetente não conseguiu descriptografar esta mensagem.
                              Peça para ele reenviá-la.
                            </span>
                          </p>
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        )
                      ) : <MessageMedia msg={msg} />}
                      <span className={cn(
                        "mt-1 flex items-center justify-end gap-1 text-[10px]",
                        msg.status === "failed" ? "text-destructive" : "text-muted-foreground"
                      )}>
                        {msg.status === "failed" ? "Falhou" : format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                        {isOutbound && msg.status === "failed" && onResendMessage && (() => {
                          const cid = (msg as any).client_message_id || (msg.metadata as any)?.client_id;
                          if (!cid) return null;
                          return (
                            <button
                              type="button"
                              onClick={() => onResendMessage(String(cid))}
                              className="ml-1 inline-flex items-center gap-0.5 text-destructive underline-offset-2 hover:underline"
                              title="Reenviar mensagem"
                            >
                              <RotateCw className="h-3 w-3" /> Reenviar
                            </button>
                          );
                        })()}
                        {isOutbound && getMessageStatusIcon(msg.status)}
                      </span>
                    </div>
                  </div>
                  )}


                  {adReferral && !isOutbound && (
                    <AdReferralCard referral={adReferral} timestamp={msg.created_at} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {copilotSuggestion && !isNewLead && !isReadOnly && (
        <div className="mx-3 mb-2 rounded-lg border border-border bg-card/90 p-3">
          <p className="mb-1 flex items-center gap-1 text-[10px] text-muted-foreground"><Sparkles className="h-3 w-3" /> Sugestão do Copiloto</p>
          <p className="whitespace-pre-wrap text-sm text-foreground">{copilotSuggestion}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={handleInsertSuggestion}>Inserir no campo</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onDismissSuggestion}>Ignorar</Button>
          </div>
        </div>
      )}

      {(isNewLead || isReadOnly) ? (
        <div className="sticky bottom-0 z-20 border-t border-border bg-background px-4 py-3 pb-safe">
          {isNewLead && onStartAttendance ? (
            <Button
              size="lg"
              className="w-full h-12 gap-2 text-sm font-semibold"
              onClick={onStartAttendance}
              disabled={isStartingAttendance}
            >
              {isStartingAttendance ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <UserRoundSearch className="h-4 w-4" />
              )}
              Iniciar atendimento para enviar mensagens
            </Button>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Modo supervisão — somente leitura
            </p>
          )}
        </div>
      ) : (
        <div className="sticky bottom-0 z-20 space-y-2 border-t border-border bg-background px-3 pt-2 pb-3 pb-safe">
          {pendingFile && pendingType && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-card/90 px-3 py-2 text-sm text-foreground">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {pendingType === "image" && <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                  {pendingType === "audio" && <Mic className="h-4 w-4 text-muted-foreground" />}
                  {pendingType === "video" && <Video className="h-4 w-4 text-muted-foreground" />}
                  {pendingType === "document" && <FileText className="h-4 w-4 text-muted-foreground" />}
                  <span className="truncate">{pendingFile.name}</span>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {pendingType === "image" && "Imagem pronta para envio com legenda opcional."}
                  {pendingType === "audio" && "Áudio pronto para envio."}
                  {pendingType === "video" && "Vídeo pronto para envio."}
                  {pendingType === "document" && "Documento pronto para envio."}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => setPendingFile(null)}>Remover</Button>
            </div>
          )}

          {isPersonalLocked && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <p className="leading-snug">
                <span className="font-semibold">Proteção anti-bloqueio ativa.</span>{" "}
                Para preservar seu número, novos contatos pelo seu WhatsApp pessoal serão liberados em{" "}
                <span className="font-semibold tabular-nums">{personalCooldown.hoursRemaining}h</span>.
                Você pode responder normalmente assim que o cliente enviar a primeira mensagem ou usar o WhatsApp da imobiliária.
              </p>
            </div>
          )}

          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={(e) => setPendingFile(e.target.files?.[0] || null)}
            />
            <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-foreground" onClick={onRequestSuggestion} disabled={isGeneratingSuggestion || isPersonalLocked} title={cooldownTooltip || "Pedir sugestão ao Copiloto"}>
              {isGeneratingSuggestion ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Sparkles className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-foreground" onClick={() => fileInputRef.current?.click()} disabled={isPersonalLocked} title={cooldownTooltip || "Anexar arquivo"}>
              <Paperclip className="h-4 w-4" />
            </Button>
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                const el = e.target;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
              }}
              onKeyDown={handleKeyDown}
              disabled={isPersonalLocked}
              title={cooldownTooltip}
              placeholder={
                isPersonalLocked
                  ? `Aguarde ${personalCooldown.hoursRemaining}h para iniciar contato pelo seu WhatsApp pessoal`
                  : pendingFile
                  ? "Adicione uma legenda opcional..."
                  : "Digite sua mensagem... (Enter para enviar, Shift+Enter para quebrar linha)"
              }
              className={cn(
                "max-h-[160px] min-h-[36px] resize-none overflow-y-auto py-2 text-sm",
                (conversation as any).source_instance === "global"
                  ? "border-purple-500/40 focus-visible:ring-purple-500/30"
                  : "border-emerald-500/40 focus-visible:ring-emerald-500/30",
                isPersonalLocked && "opacity-60 cursor-not-allowed"
              )}
              rows={1}
            />
            <Popover open={scheduleOpen} onOpenChange={setScheduleOpen}>
              <PopoverTrigger asChild>
                <Button size="icon" variant="outline" className="h-9 w-9 flex-shrink-0" disabled={!canScheduleText || isScheduling || isSending || isPersonalLocked} title={cooldownTooltip || "Programar envio"}>
                  <CalendarClock className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 space-y-3 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Programar mensagem</p>
                  <p className="text-xs text-muted-foreground">Use o texto digitado no campo e escolha dia e horário.</p>
                </div>
                <Calendar mode="single" selected={scheduleDate} onSelect={setScheduleDate} className="rounded-md border border-border" />
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
                  {buildScheduledDateTime() ? `Envio para ${formatScheduledAt(buildScheduledDateTime()!.toISOString())}` : "Selecione uma data e horário válidos."}
                </div>
                <Button className="w-full" onClick={handleSchedule} disabled={!canScheduleText || isScheduling || isPersonalLocked}>
                  {isScheduling ? "Programando..." : "Confirmar agendamento"}
                </Button>
              </PopoverContent>
            </Popover>
            {isRecording ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                  </span>
                  <span className="text-xs font-medium text-foreground tabular-nums">
                    {Math.floor(recordingDuration / 60).toString().padStart(2, "0")}:{(recordingDuration % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <Button size="icon" variant="ghost" className="h-9 w-9 flex-shrink-0 text-destructive hover:text-destructive" onClick={cancelRecording} title="Cancelar gravação">
                  <X className="h-4 w-4" />
                </Button>
                <Button size="icon" className="h-9 w-9 flex-shrink-0" onClick={stopAndSendRecording} title="Enviar áudio">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            ) : (!inputValue.trim() && !pendingFile) ? (
              <Button size="icon" variant="ghost" className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-foreground" onClick={startRecording} disabled={isSending || isPersonalLocked} title={cooldownTooltip || "Gravar áudio"}>
                <Mic className="h-5 w-5" />
              </Button>
            ) : (
              <Button size="icon" className="h-9 w-9 flex-shrink-0" onClick={handleSend} disabled={(!inputValue.trim() && !pendingFile) || isSending || isPersonalLocked} title={cooldownTooltip}>
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {onInactivateLead && (
        <PerdaModal
          open={perdaModalOpen}
          onOpenChange={setPerdaModalOpen}
          onConfirm={async (reason) => {
            await onInactivateLead(reason);
          }}
        />
      )}
    </div>
  );
}
