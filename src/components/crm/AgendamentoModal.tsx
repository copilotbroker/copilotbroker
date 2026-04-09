import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TIPO_AGENDAMENTO } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AgendamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: Date, tipo: string) => Promise<void>;
  title?: string;
  leadId?: string;
  leadName?: string;
  brokerId?: string | null;
}


const TIPO_TO_EVENT_TYPE: Record<string, string> = {
  visita: "visit",
  reuniao: "meeting",
  videochamada: "meeting",
  ligacao: "follow_up",
};

export function AgendamentoModal({ open, onOpenChange, onConfirm, title = "Registrar Agendamento", leadId, leadName, brokerId }: AgendamentoModalProps) {
  const [date, setDate] = useState<Date>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [time, setTime] = useState<string>("");
  const [tipo, setTipo] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!date || !tipo || !time) return;
    setLoading(true);
    try {
      // Combine date + time
      const [hours, minutes] = time.split(":").map(Number);
      const fullDate = new Date(date);
      fullDate.setHours(hours, minutes, 0, 0);

      await onConfirm(fullDate, tipo);

      // Create calendar event
      if (brokerId) {
        const endDate = new Date(fullDate);
        endDate.setHours(hours + 1);

        const tipoLabel = TIPO_AGENDAMENTO.find(t => t.key === tipo)?.label || tipo;
        const eventType = TIPO_TO_EVENT_TYPE[tipo] || "scheduling";

        const { error } = await supabase.from("calendar_events").insert({
          broker_id: brokerId,
          lead_id: leadId || null,
          title: `${tipoLabel} - ${leadName || "Lead"}`,
          event_type: eventType,
          start_at: fullDate.toISOString(),
          end_at: endDate.toISOString(),
        });
        if (error) {
          console.error("Erro ao criar evento na agenda:", error);
          toast.error("Agendamento salvo, mas erro ao criar evento na agenda.");
        } else {
          toast.success("Evento adicionado à agenda!");
        }
      }

      onOpenChange(false);
      setDate(undefined);
      setTime("");
      setTipo("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e1e22] border-[#2a2a2e] sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Data do Agendamento *</label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-[#0f0f12] border-[#2a2a2e]",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy") : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#1e1e22] border-[#2a2a2e]" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => { setDate(d); setCalendarOpen(false); }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-400">Horário *</label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-[#0f0f12] border-[#2a2a2e]"
              placeholder="HH:MM"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-400">Tipo de Agendamento *</label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="bg-[#0f0f12] border-[#2a2a2e]">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1e22] border-[#2a2a2e]">
                {TIPO_AGENDAMENTO.map(t => (
                  <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!date || !tipo || !time || loading}>
            {loading ? "Salvando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
