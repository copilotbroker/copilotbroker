import { useState, useEffect } from "react";
import { CalendarClock, Timer, ShieldCheck, ShieldAlert, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ScheduledMessage {
  id: string;
  message: string;
  scheduled_at: string;
  status: string;
  step_number?: number | null;
  campaign_id?: string | null;
}

interface ScheduledMessagesPanelProps {
  scheduledMessages: ScheduledMessage[];
  onCancelScheduledMessage: (id: string) => void;
}

function formatScheduledAt(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return `Hoje ${format(d, "HH:mm", { locale: ptBR })}`;
  if (isTomorrow(d)) return `Amanhã ${format(d, "HH:mm", { locale: ptBR })}`;
  return format(d, "dd/MM HH:mm", { locale: ptBR });
}

function CountdownTimer({ scheduledAt }: { scheduledAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(scheduledAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Enviando...");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 0) setTimeLeft(`${h}h ${m}min`);
      else if (m > 0) setTimeLeft(`${m}min ${s}s`);
      else setTimeLeft(`${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [scheduledAt]);

  return (
    <span className="ml-auto text-[10px] font-mono font-bold text-primary tabular-nums whitespace-nowrap">
      <Timer className="inline w-3 h-3 mr-0.5 -mt-0.5" />
      {timeLeft}
    </span>
  );
}

function SendIfRepliedBadge({ campaignId, stepNumber }: { campaignId: string; stepNumber: number }) {
  const [sendIfReplied, setSendIfReplied] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("campaign_steps")
      .select("send_if_replied")
      .eq("campaign_id", campaignId)
      .eq("step_order", stepNumber)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setSendIfReplied(data.send_if_replied);
      });
    return () => { cancelled = true; };
  }, [campaignId, stepNumber]);

  if (sendIfReplied === null) return null;

  return sendIfReplied ? (
    <span className="flex items-center gap-1 text-[10px] text-amber-400">
      <ShieldAlert className="w-3 h-3 flex-shrink-0" /> Envia mesmo com resposta
    </span>
  ) : (
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <ShieldCheck className="w-3 h-3 flex-shrink-0" /> Só envia se não responder
    </span>
  );
}

export function ScheduledMessagesPanel({ scheduledMessages, onCancelScheduledMessage }: ScheduledMessagesPanelProps) {
  if (scheduledMessages.length === 0) return null;

  // Sort by scheduled_at ascending so first = next to send
  const sorted = [...scheduledMessages].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  );

  return (
    <div className="border-b border-border bg-card/60 px-3 py-2">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground">
        <CalendarClock className="h-3.5 w-3.5 text-primary" />
        Mensagens programadas ({sorted.length})
      </div>
      <div className="space-y-2">
        {sorted.map((item, index) => {
          const isNext = index === 0;
          const stepLabel = item.step_number ? `Etapa ${item.step_number}` : null;
          const preview = item.message.length > 140 ? item.message.substring(0, 140) + "…" : item.message;

          return (
            <div
              key={item.id}
              className={`flex flex-col gap-1.5 rounded-xl border px-3 py-2 ${
                isNext
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-background"
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px]">
                  {item.status}
                </Badge>
                {stepLabel && (
                  <span className="text-[10px] text-muted-foreground">{stepLabel}</span>
                )}
                <span className="text-[10px] text-muted-foreground">
                  {formatScheduledAt(item.scheduled_at)}
                </span>
                {isNext && <CountdownTimer scheduledAt={item.scheduled_at} />}
              </div>

              <div className="flex items-start gap-1.5">
                <MessageSquare className="w-3 h-3 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3 whitespace-pre-wrap break-words">
                  {preview}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2">
                {item.campaign_id && item.step_number ? (
                  <SendIfRepliedBadge campaignId={item.campaign_id} stepNumber={item.step_number} />
                ) : (
                  <div />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] text-muted-foreground hover:text-foreground px-2"
                  onClick={() => onCancelScheduledMessage(item.id)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
