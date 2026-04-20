import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Calendar, Loader2, Send, Trash2, Zap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  usePausedMessages,
  useReschedulePausedMessages,
  useDiscardPausedMessages,
  type PausedMessage,
} from "@/hooks/use-paused-messages";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brokerId: string | undefined;
}

export function PausedMessagesReviewModal({ open, onOpenChange, brokerId }: Props) {
  const { data, isLoading } = usePausedMessages(brokerId);
  const reschedule = useReschedulePausedMessages();
  const discard = useDiscardPausedMessages();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [datetime, setDatetime] = useState("");

  const messages = data?.messages ?? [];

  // Group by lead
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; items: PausedMessage[] }>();
    for (const m of messages) {
      const key = m.lead?.id || m.phone;
      const name = m.lead?.name || m.phone;
      if (!map.has(key)) map.set(key, { name, items: [] });
      map.get(key)!.items.push(m);
    }
    return Array.from(map.entries());
  }, [messages]);

  const allSelected = messages.length > 0 && selected.size === messages.length;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(messages.map((m) => m.id)));
  };

  const handleReschedule = async (
    strategy: "now" | "spread" | "datetime",
    ids?: string[],
    dt?: string,
  ) => {
    const messageIds = ids ?? Array.from(selected);
    if (!messageIds.length) {
      toast.error("Selecione ao menos uma mensagem");
      return;
    }
    try {
      await reschedule.mutateAsync({ messageIds, strategy, datetime: dt });
      toast.success(`${messageIds.length} mensagem(ns) reagendada(s)`);
      setSelected(new Set());
    } catch (e) {
      toast.error("Erro ao reagendar: " + (e as Error).message);
    }
  };

  const handleDiscard = async (ids?: string[]) => {
    const messageIds = ids ?? Array.from(selected);
    if (!messageIds.length) {
      toast.error("Selecione ao menos uma mensagem");
      return;
    }
    try {
      await discard.mutateAsync(messageIds);
      toast.success(`${messageIds.length} mensagem(ns) descartada(s)`);
      setSelected(new Set());
    } catch (e) {
      toast.error("Erro ao descartar: " + (e as Error).message);
    }
  };

  const isMutating = reschedule.isPending || discard.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col bg-[#0d0d0f] border-[#2a2a2e] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Mensagens pausadas durante a desconexão
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Estas mensagens automáticas ficaram aguardando porque seu WhatsApp esteve desconectado. Escolha quais reativar e quais descartar.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Send className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Nenhuma mensagem pausada por desconexão.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 px-1 py-2 border-b border-[#2a2a2e]">
              <div className="flex items-center gap-2">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                <span className="text-sm text-slate-300">
                  {selected.size > 0
                    ? `${selected.size} selecionada(s)`
                    : `${messages.length} mensagem(ns) pausada(s)`}
                </span>
              </div>
              <Badge variant="outline" className="border-amber-500/40 text-amber-300">
                {grouped.length} lead(s)
              </Badge>
            </div>

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-3">
                {grouped.map(([key, group]) => (
                  <div key={key} className="rounded-lg border border-[#2a2a2e] overflow-hidden">
                    <div className="bg-[#1a1a1d] px-3 py-2 text-sm font-medium text-slate-200">
                      {group.name}
                      <span className="text-xs text-slate-500 ml-2">
                        {group.items.length} mensagem(ns)
                      </span>
                    </div>
                    <div className="divide-y divide-[#2a2a2e]">
                      {group.items.map((m) => (
                        <div key={m.id} className="flex items-start gap-3 p-3">
                          <Checkbox
                            checked={selected.has(m.id)}
                            onCheckedChange={() => toggle(m.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                              {m.campaign && <span>{m.campaign.name}</span>}
                              {m.step_number && <span>· Etapa {m.step_number}</span>}
                              <span>· originalmente {format(new Date(m.scheduled_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                            </div>
                            <p className="text-sm text-slate-300 line-clamp-2">{m.message}</p>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              disabled={isMutating}
                              onClick={() => handleReschedule("now", [m.id])}
                            >
                              <Zap className="w-3 h-3 mr-1" /> Agora
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              disabled={isMutating}
                              onClick={() => handleDiscard([m.id])}
                            >
                              <Trash2 className="w-3 h-3 mr-1" /> Descartar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-[#2a2a2e]">
              <div className="text-xs text-slate-500">
                Reagendamento respeita seu horário comercial e aplica intervalos anti-spam.
              </div>
              <div className="flex flex-wrap gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="outline" disabled={isMutating || selected.size === 0}>
                      <Calendar className="w-3.5 h-3.5 mr-1" /> Agendar para...
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 bg-[#1a1a1d] border-[#2a2a2e]">
                    <Label className="text-xs text-slate-400">Data e hora</Label>
                    <Input
                      type="datetime-local"
                      value={datetime}
                      onChange={(e) => setDatetime(e.target.value)}
                      className="mt-1 bg-[#0d0d0f] border-[#2a2a2e]"
                    />
                    <Button
                      size="sm"
                      className="w-full mt-2"
                      disabled={!datetime}
                      onClick={() => handleReschedule("datetime", undefined, new Date(datetime).toISOString())}
                    >
                      Confirmar
                    </Button>
                  </PopoverContent>
                </Popover>
                <Button
                  size="sm"
                  variant="default"
                  disabled={isMutating || selected.size === 0}
                  onClick={() => handleReschedule("spread")}
                >
                  <Send className="w-3.5 h-3.5 mr-1" /> Reagendar selecionadas
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isMutating || selected.size === 0}
                  onClick={() => handleDiscard()}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Descartar selecionadas
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
