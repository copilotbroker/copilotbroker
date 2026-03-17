import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface KanbanCardComposerProps {
  leadId: string;
  leadName: string;
  onSendWhatsAppNow?: (leadId: string, content: string) => Promise<void>;
  onScheduleWhatsApp?: (leadId: string, content: string, scheduledAt: string) => Promise<void>;
  onClose: () => void;
}

export default function KanbanCardComposer({
  leadId,
  leadName,
  onSendWhatsAppNow,
  onScheduleWhatsApp,
  onClose,
}: KanbanCardComposerProps) {
  const [messageText, setMessageText] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(new Date());
  const [scheduleTime, setScheduleTime] = useState(() => format(new Date(Date.now() + 60 * 60 * 1000), "HH:mm"));
  const [isSendingNow, setIsSendingNow] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  const canSubmitMessage = !!messageText.trim();

  const buildScheduledDateTime = () => {
    if (!scheduleDate || !scheduleTime) return null;
    const [hours, minutes] = scheduleTime.split(":").map(Number);
    const nextDate = new Date(scheduleDate);
    nextDate.setHours(hours || 0, minutes || 0, 0, 0);
    return nextDate;
  };

  const handleSendNow = async () => {
    const text = messageText.trim();
    if (!text || !onSendWhatsAppNow || isSendingNow) return;

    setIsSendingNow(true);
    try {
      await onSendWhatsAppNow(leadId, text);
      setMessageText("");
      onClose();
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
      await onScheduleWhatsApp(leadId, text, scheduledDate.toISOString());
      setMessageText("");
      setScheduleOpen(false);
      onClose();
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <>
      <div>
        <p className="text-sm font-medium text-foreground">Mensagem para {leadName}</p>
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
            <Button size="icon" variant="success" className="h-9 w-9 flex-shrink-0 rounded-lg" disabled={!canSubmitMessage || isScheduling || isSendingNow}>
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
    </>
  );
}
