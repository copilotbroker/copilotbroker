import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  Archive,
  ArchiveRestore,
  Sparkles,
  Zap,
  LayoutGrid,
  UserRoundSearch,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Mic,
  Video,
  Check,
  CheckCheck,
  Clock3,
} from "lucide-react";
import { CadenceCountdown } from "./CadenceCountdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Conversation, ConversationMessage, OutboundMessagePayload } from "@/hooks/use-conversations";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConversationThreadProps {
  conversation: Conversation;
  messages: ConversationMessage[];
  isLoading: boolean;
  onSendMessage: (payload: string | OutboundMessagePayload, sentBy?: string) => Promise<unknown>;
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
}

const getMessageStatusIcon = (status?: string) => {
  switch (status) {
    case "read":
      return <CheckCheck className="h-3 w-3 text-primary" />;
    case "delivered":
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    case "sent":
      return <Check className="h-3 w-3 text-muted-foreground" />;
    default:
      return <Clock3 className="h-3 w-3 text-muted-foreground" />;
  }
};

const getMessageTypeLabel = (type: string) => {
  switch (type) {
    case "image": return "Imagem";
    case "audio": return "Áudio";
    case "video": return "Vídeo";
    case "document": return "Documento";
    default: return "Mídia";
  }
};

const formatMessageDay = (date: string) => format(new Date(date), "d 'de' MMMM", { locale: ptBR });

function MessageMedia({ msg }: { msg: ConversationMessage }) {
  const metadata = (msg.metadata || {}) as Record<string, unknown>;
  const fileUrl = typeof metadata.file_url === "string" ? metadata.file_url : null;
  const thumbnailUrl = typeof metadata.thumbnail_url === "string" ? metadata.thumbnail_url : null;
  const fileName = typeof metadata.file_name === "string" ? metadata.file_name : getMessageTypeLabel(msg.message_type);
  const mimeType = typeof metadata.mime_type === "string" ? metadata.mime_type : "";

  if (!fileUrl) return <p className="whitespace-pre-wrap break-words">{msg.content}</p>;

  if (msg.message_type === "image") {
    return (
      <a href={fileUrl} target="_blank" rel="noreferrer" className="block space-y-2">
        <img src={fileUrl} alt={fileName} className="max-h-72 w-full rounded-xl object-cover" loading="lazy" />
        {msg.content && msg.content !== "Foto" && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
      </a>
    );
  }

  if (msg.message_type === "audio") {
    return (
      <div className="min-w-[240px] space-y-2">
        <audio controls className="w-full">
          <source src={fileUrl} type={mimeType || undefined} />
        </audio>
        {msg.content && msg.content !== "Áudio" && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
      </div>
    );
  }

  if (msg.message_type === "video") {
    return (
      <div className="min-w-[240px] space-y-2">
        {thumbnailUrl ? <img src={thumbnailUrl} alt={fileName} className="max-h-56 w-full rounded-xl object-cover" loading="lazy" /> : null}
        <video controls className="max-h-80 w-full rounded-xl bg-black">
          <source src={fileUrl} type={mimeType || undefined} />
        </video>
        {msg.content && msg.content !== "Vídeo" && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
      </div>
    );
  }

  return (
    <a href={fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/40">
      <FileText className="h-5 w-5 text-muted-foreground" />
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{fileName}</p>
        <p className="text-xs text-muted-foreground">{mimeType || "Abrir arquivo"}</p>
      </div>
    </a>
  );
}

export function ConversationThread({
  conversation,
  messages,
  isLoading,
  onSendMessage,
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
}: ConversationThreadProps) {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const leadName = conversation.display_name || (conversation.lead as any)?.name || conversation.phone;
  const isAiActive = conversation.ai_mode === "ai_active";
  const isCopilot = conversation.ai_mode === "copilot";
  const hasResolvedName = !!conversation.display_name && conversation.display_name !== conversation.phone;

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

  const handleSend = async () => {
    const text = inputValue.trim();
    if ((!text && !pendingFile) || isSending) return;

    setIsSending(true);
    try {
      if (pendingFile && pendingType) {
        const ext = pendingFile.name.split(".").pop() || "bin";
        const path = `inbox/${conversation.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("project-media").upload(path, pendingFile, {
          contentType: pendingFile.type,
          cacheControl: "3600",
          upsert: false,
        });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("project-media").getPublicUrl(path);
        await onSendMessage({
          content: text || `📎 ${pendingFile.name}`,
          messageType: pendingType,
          metadata: {
            file_url: urlData.publicUrl,
            file_name: pendingFile.name,
            mime_type: pendingFile.type,
            storage_path: path,
            size_bytes: pendingFile.size,
          },
        });
      } else {
        await onSendMessage(text);
      }

      setInputValue("");
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      inputRef.current?.focus();
    } catch (error) {
      console.error("Erro ao enviar mídia:", error);
      toast.error("Não foi possível enviar o anexo");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
              {leadName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{leadName}</p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] text-muted-foreground">{conversation.phone}</p>
                <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                  {conversation.lead_id ? "Lead vinculado" : hasResolvedName ? "Nome identificado" : "WhatsApp direto"}
                </Badge>
                {conversation.status && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px] capitalize">
                    {conversation.status}
                  </Badge>
                )}
              </div>
            </div>
          </button>

          <div className="flex items-center gap-1">
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
            ) : (
              <Button variant="ghost" size="icon" onClick={onArchive} className="h-8 w-8 text-muted-foreground" title="Arquivar">
                <Archive className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {!conversation.lead_id && onCreateLead && (
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <LayoutGrid className="h-3 w-3" /> Contato sem card no Kanban
          </span>
          <Button size="sm" className="h-7 text-xs" onClick={onCreateLead}>
            Criar Card
          </Button>
        </div>
      )}

      {isAiActive && (
        <div className="flex items-center justify-between border-b border-border bg-card px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <Zap className="h-3.5 w-3.5" /> Piloto Automático ativo
          </span>
          <Button size="sm" variant="outline" className="h-7 gap-1 rounded-full px-3 text-xs" onClick={() => onToggleAiMode("copilot")}>
            <User className="h-3 w-3" /> Desativar Piloto
          </Button>
        </div>
      )}
      {isCopilot && (
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <User className="h-3.5 w-3.5" /> Modo Copiloto
          </span>
          <Button size="sm" className="h-7 gap-1 rounded-full px-3 text-xs" onClick={() => onToggleAiMode("ai_active")}>
            <Zap className="h-3 w-3" /> Ativar Piloto
          </Button>
        </div>
      )}

      {conversation.lead_id && <CadenceCountdown leadId={conversation.lead_id} brokerId={conversation.broker_id} />}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma mensagem ainda. Envie a primeira!</div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, index) => {
              const isOutbound = msg.direction === "outbound";
              const isAi = msg.sent_by === "ai";
              const previousMessage = messages[index - 1];
              const showDayDivider = !previousMessage || formatMessageDay(previousMessage.created_at) !== formatMessageDay(msg.created_at);

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

                  <div className={cn("flex", isOutbound ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                      isOutbound
                        ? isAi
                          ? "rounded-br-sm border border-border bg-card text-foreground"
                          : "rounded-br-sm border border-border bg-muted text-foreground"
                        : "rounded-bl-sm border border-border bg-card text-card-foreground"
                    )}>
                      {isAi && <span className="mb-1 flex items-center gap-0.5 text-[10px] text-muted-foreground"><Bot className="h-3 w-3" /> Copiloto</span>}
                      {!isOutbound && msg.sender_name && <span className="mb-1 block text-[10px] text-muted-foreground">{msg.sender_name}</span>}
                      {msg.message_type === "text" ? <p className="whitespace-pre-wrap break-words">{msg.content}</p> : <MessageMedia msg={msg} />}
                      <span className={cn(
                        "mt-1 flex items-center justify-end gap-1 text-[10px]",
                        "text-muted-foreground"
                      )}>
                        {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                        {isOutbound && getMessageStatusIcon(msg.status)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {copilotSuggestion && (
        <div className="mx-3 mb-2 rounded-lg border border-border bg-card p-3">
          <p className="mb-1 flex items-center gap-1 text-[10px] text-muted-foreground"><Sparkles className="h-3 w-3" /> Sugestão do Copiloto</p>
          <p className="whitespace-pre-wrap text-sm text-foreground">{copilotSuggestion}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={handleInsertSuggestion}>Inserir no campo</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onDismissSuggestion}>Ignorar</Button>
          </div>
        </div>
      )}

      <div className="space-y-2 border-t border-border px-3 pb-3 pt-2 pb-safe">
        {pendingFile && pendingType && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground">
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
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setPendingFile(null)}>Remover</Button>
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
          <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-foreground" onClick={onRequestSuggestion} disabled={isGeneratingSuggestion} title="Pedir sugestão ao Copiloto">
            {isGeneratingSuggestion ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Sparkles className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-foreground" onClick={() => fileInputRef.current?.click()} title="Anexar arquivo">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={pendingFile ? "Adicione uma legenda opcional..." : "Digite sua mensagem..."}
            className="max-h-[120px] min-h-[36px] resize-none py-2 text-sm"
            rows={1}
          />
          <Button size="icon" className="h-9 w-9 flex-shrink-0" onClick={handleSend} disabled={(!inputValue.trim() && !pendingFile) || isSending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
