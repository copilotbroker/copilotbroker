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
      return <CheckCheck className="w-3 h-3" />;
    case "delivered":
      return <CheckCheck className="w-3 h-3" />;
    case "sent":
      return <Check className="w-3 h-3" />;
    default:
      return <Clock3 className="w-3 h-3" />;
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

function MessageMedia({ msg }: { msg: ConversationMessage }) {
  const metadata = (msg.metadata || {}) as Record<string, unknown>;
  const fileUrl = typeof metadata.file_url === "string" ? metadata.file_url : null;
  const fileName = typeof metadata.file_name === "string" ? metadata.file_name : getMessageTypeLabel(msg.message_type);
  const mimeType = typeof metadata.mime_type === "string" ? metadata.mime_type : "";

  if (!fileUrl) {
    return <p className="whitespace-pre-wrap break-words">{msg.content}</p>;
  }

  if (msg.message_type === "image") {
    return (
      <a href={fileUrl} target="_blank" rel="noreferrer" className="block space-y-2">
        <img src={fileUrl} alt={fileName} className="max-h-72 w-full rounded-xl object-cover" loading="lazy" />
        {msg.content && msg.content !== "[Mídia]" && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
      </a>
    );
  }

  if (msg.message_type === "audio") {
    return (
      <div className="space-y-2 min-w-[240px]">
        <audio controls className="w-full">
          <source src={fileUrl} type={mimeType || undefined} />
        </audio>
        {msg.content && msg.content !== "[Mídia]" && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
      </div>
    );
  }

  if (msg.message_type === "video") {
    return (
      <div className="space-y-2 min-w-[240px]">
        <video controls className="max-h-80 w-full rounded-xl bg-black">
          <source src={fileUrl} type={mimeType || undefined} />
        </video>
        {msg.content && msg.content !== "[Mídia]" && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
      </div>
    );
  }

  return (
    <a href={fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3 hover:bg-background/60 transition-colors">
      <FileText className="w-5 h-5 text-muted-foreground" />
      <div className="min-w-0">
        <p className="truncate font-medium">{fileName}</p>
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

  const leadName = (conversation.lead as any)?.name || conversation.phone;
  const isAiActive = conversation.ai_mode === "ai_active";
  const isCopilot = conversation.ai_mode === "copilot";
  const hasResolvedName = !!(conversation.lead as any)?.name && (conversation.lead as any)?.name !== conversation.phone;

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
      className="flex flex-col h-full bg-[#0F1117]"
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
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2A2D37] bg-[#151820]">
        <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden text-slate-400 h-8 w-8">
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <button onClick={onOpenLeadPanel} className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm flex-shrink-0">
            {leadName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{leadName}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[10px] text-slate-500">{conversation.phone}</p>
              <Badge variant="outline" className="h-4 text-[10px] px-1.5">
                {conversation.lead_id ? "Lead vinculado" : hasResolvedName ? "Nome identificado" : "WhatsApp direto"}
              </Badge>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1">
          {conversation.lead_id && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenLead ? onOpenLead(conversation.lead_id!) : navigate(`/corretor/lead/${conversation.lead_id}`)}
              className="text-slate-400 hover:text-indigo-400 h-8 w-8"
              title="Ver perfil do lead"
            >
              <UserRoundSearch className="w-4 h-4" />
            </Button>
          )}
          {conversation.is_archived && onUnarchive ? (
            <Button variant="ghost" size="icon" onClick={onUnarchive} className="text-slate-400 h-8 w-8" title="Desarquivar">
              <ArchiveRestore className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={onArchive} className="text-slate-400 h-8 w-8" title="Arquivar">
              <Archive className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {!conversation.lead_id && onCreateLead && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-orange-500/10 border-b border-orange-500/20">
          <span className="text-xs text-orange-400 flex items-center gap-1">
            <LayoutGrid className="w-3 h-3" /> Contato sem card no Kanban
          </span>
          <Button size="sm" className="h-6 text-xs bg-orange-500 hover:bg-orange-600 text-white" onClick={onCreateLead}>
            Criar Card
          </Button>
        </div>
      )}

      {isAiActive && (
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-green-500/15 via-green-500/10 to-emerald-500/15 border-b border-green-500/20 backdrop-blur-sm">
          <span className="text-xs text-green-400 flex items-center gap-1.5 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            <Zap className="w-3.5 h-3.5" /> Piloto Automático ativo
          </span>
          <Button size="sm" variant="outline" className="h-7 text-xs border-green-500/30 text-green-400 hover:bg-green-500/20 hover:text-green-300 transition-all rounded-full px-3 gap-1" onClick={() => onToggleAiMode("copilot")}>
            <User className="w-3 h-3" /> Desativar Piloto
          </Button>
        </div>
      )}
      {isCopilot && (
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-indigo-500/10 border-b border-blue-500/20 backdrop-blur-sm">
          <span className="text-xs text-blue-400 flex items-center gap-1.5 font-medium">
            <User className="w-3.5 h-3.5" /> Modo Copiloto
            <span className="text-blue-500/60 font-normal">(Humano no controle)</span>
          </span>
          <Button size="sm" className="h-7 text-xs bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white border-0 shadow-lg shadow-green-500/20 transition-all rounded-full px-3 gap-1" onClick={() => onToggleAiMode("ai_active")}>
            <Zap className="w-3 h-3" /> Ativar Piloto Automático
          </Button>
        </div>
      )}

      {conversation.lead_id && <CadenceCountdown leadId={conversation.lead_id} brokerId={conversation.broker_id} />}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">Nenhuma mensagem ainda. Envie a primeira!</div>
        ) : (
          messages.map((msg) => {
            const isOutbound = msg.direction === "outbound";
            const isAi = msg.sent_by === "ai";

            return (
              <div key={msg.id} className={cn("flex", isOutbound ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  isOutbound ? (isAi ? "bg-green-600/20 text-green-100 rounded-br-sm" : "bg-indigo-600/20 text-indigo-100 rounded-br-sm") : "bg-[#2A2D37] text-slate-200 rounded-bl-sm"
                )}>
                  {isAi && <span className="text-[10px] text-green-400 flex items-center gap-0.5 mb-0.5"><Bot className="w-3 h-3" /> Copiloto</span>}
                  {!isOutbound && msg.sender_name && <span className="text-[10px] text-slate-400 block mb-1">{msg.sender_name}</span>}
                  {msg.message_type === "text" ? <p className="whitespace-pre-wrap break-words">{msg.content}</p> : <MessageMedia msg={msg} />}
                  <span className="text-[10px] opacity-60 mt-1 flex items-center justify-end gap-1">
                    {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                    {isOutbound && getMessageStatusIcon(msg.status)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {copilotSuggestion && (
        <div className="mx-3 mb-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-[10px] text-blue-400 mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Sugestão do Copiloto</p>
          <p className="text-sm text-slate-200 whitespace-pre-wrap">{copilotSuggestion}</p>
          <div className="flex gap-2 mt-2">
            <Button size="sm" className="h-7 text-xs bg-indigo-500 text-white hover:bg-indigo-400" onClick={handleInsertSuggestion}>Inserir no campo</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-400" onClick={onDismissSuggestion}>Ignorar</Button>
          </div>
        </div>
      )}

      <div className="px-3 pb-3 pt-1 border-t border-[#2A2D37] pb-safe space-y-2">
        {pendingFile && pendingType && (
          <div className="flex items-center justify-between rounded-xl border border-[#2A2D37] bg-[#1A1D27] px-3 py-2 text-sm text-slate-300">
            <div className="flex items-center gap-2 min-w-0">
              {pendingType === "image" && <ImageIcon className="w-4 h-4" />}
              {pendingType === "audio" && <Mic className="w-4 h-4" />}
              {pendingType === "video" && <Video className="w-4 h-4" />}
              {pendingType === "document" && <FileText className="w-4 h-4" />}
              <span className="truncate">{pendingFile.name}</span>
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
          <Button variant="ghost" size="icon" className="text-blue-400 hover:text-blue-300 h-9 w-9 flex-shrink-0" onClick={onRequestSuggestion} disabled={isGeneratingSuggestion} title="Pedir sugestão ao Copiloto">
            {isGeneratingSuggestion ? <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" /> : <Sparkles className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white h-9 w-9 flex-shrink-0" onClick={() => fileInputRef.current?.click()} title="Anexar arquivo">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={pendingFile ? "Adicione uma legenda opcional..." : "Digite sua mensagem..."}
            className="min-h-[36px] max-h-[120px] resize-none bg-[#1A1D27] border-[#2A2D37] text-sm text-white placeholder:text-slate-500 py-2"
            rows={1}
          />
          <Button size="icon" className="bg-indigo-500 hover:bg-indigo-400 text-white h-9 w-9 flex-shrink-0" onClick={handleSend} disabled={(!inputValue.trim() && !pendingFile) || isSending}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
