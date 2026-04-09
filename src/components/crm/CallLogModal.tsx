import { useState } from "react";
import { Phone, Loader2, CalendarIcon, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Step = "answered" | "notes" | "not_answered" | "reschedule";

interface CallLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName?: string;
  leadId?: string;
  brokerId?: string | null;
  onConfirm: (notes: string) => Promise<void>;
}


export function CallLogModal({ open, onOpenChange, leadName, leadId, brokerId, onConfirm }: CallLogModalProps) {
  const [step, setStep] = useState<Step>("answered");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date>();
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const reset = () => {
    setStep("answered");
    setNotes("");
    setRescheduleDate(undefined);
    setRescheduleTime("");
    setLoading(false);
  };

  const handleClose = (v: boolean) => {
    if (loading) return;
    if (!v) reset();
    onOpenChange(v);
  };

  const handleAnswered = () => setStep("notes");

  const handleNotAnswered = () => setStep("not_answered");

  const handleConfirmNotes = async () => {
    if (!notes.trim()) return;
    setLoading(true);
    try {
      await onConfirm(notes.trim());
      reset();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleNotAnsweredConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm("Lead não atendeu a ligação.");
      reset();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleWantsReschedule = () => setStep("reschedule");

  const handleRescheduleConfirm = async () => {
    if (!rescheduleDate || !rescheduleTime) return;
    setLoading(true);
    try {
      // Register call as not answered
      await onConfirm("Lead não atendeu. Ligação reagendada.");

      // Create calendar event for the reschedule
      if (brokerId && leadId) {
        const [hours, minutes] = rescheduleTime.split(":").map(Number);
        const eventDate = new Date(rescheduleDate);
        eventDate.setHours(hours, minutes, 0, 0);
        const endDate = new Date(eventDate);
        endDate.setHours(hours + 1);

        const { error } = await supabase.from("calendar_events").insert({
          broker_id: brokerId,
          lead_id: leadId,
          title: `Retornar ligação - ${leadName || "Lead"}`,
          event_type: "follow_up",
          start_at: eventDate.toISOString(),
          end_at: endDate.toISOString(),
        });
        if (error) {
          console.error("Erro ao criar evento:", error);
          toast.error("Ligação registrada, mas erro ao criar evento na agenda.");
        } else {
          toast.success("Retorno agendado na agenda!");
        }
      }

      reset();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="bg-[#1e1e22] border-[#2a2a2e] text-slate-200 sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/15">
              <Phone className="w-4 h-4 text-blue-400" />
            </div>
            Registrar Ligação
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {leadName ? `Ligação para ${leadName}` : "Registre o resultado da ligação"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Answered or not? */}
        {step === "answered" && (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-slate-300 text-center">O lead atendeu a ligação?</p>
            <div className="flex gap-3">
              <button
                onClick={handleAnswered}
                className="flex-1 flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-[#2a2a2e] hover:border-emerald-500 hover:bg-emerald-500/10 transition-all"
              >
                <CheckCircle className="w-10 h-10 text-emerald-500" />
                <span className="text-sm font-medium text-white">Sim, atendeu</span>
              </button>
              <button
                onClick={handleNotAnswered}
                className="flex-1 flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-[#2a2a2e] hover:border-red-500 hover:bg-red-500/10 transition-all"
              >
                <XCircle className="w-10 h-10 text-red-500" />
                <span className="text-sm font-medium text-white">Não atendeu</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2a: Notes (answered) */}
        {step === "notes" && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="call-notes" className="text-slate-300">
                O que foi conversado? <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="call-notes"
                placeholder="Ex: Cliente demonstrou interesse no apto 302. Vai analisar proposta até sexta."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="resize-none bg-[#141417] border-[#2a2a2e] text-slate-200 placeholder:text-slate-500"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("answered")} disabled={loading}
                className="flex-1 border-[#2a2a2e] text-slate-300 hover:bg-[#2a2a2e]">
                Voltar
              </Button>
              <Button onClick={handleConfirmNotes} disabled={!notes.trim() || loading} className="flex-1">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Registrar"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2b: Not answered - ask reschedule */}
        {step === "not_answered" && (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-slate-300 text-center">Deseja reagendar a ligação?</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleNotAnsweredConfirm} disabled={loading}
                className="flex-1 border-[#2a2a2e] text-slate-300 hover:bg-[#2a2a2e]">
                {loading ? "Salvando..." : "Não, apenas registrar"}
              </Button>
              <Button onClick={handleWantsReschedule} className="flex-1">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Sim, reagendar
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Reschedule picker */}
        {step === "reschedule" && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Data do retorno *</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn(
                    "w-full justify-start text-left font-normal bg-[#0f0f12] border-[#2a2a2e]",
                    !rescheduleDate && "text-muted-foreground"
                  )}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {rescheduleDate ? format(rescheduleDate, "dd/MM/yyyy") : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#1e1e22] border-[#2a2a2e]" align="start">
                  <Calendar
                    mode="single"
                    selected={rescheduleDate}
                    onSelect={(d) => { setRescheduleDate(d); setCalendarOpen(false); }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Horário *</Label>
              <Input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="bg-[#0f0f12] border-[#2a2a2e]"
                placeholder="HH:MM"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("not_answered")} disabled={loading}
                className="flex-1 border-[#2a2a2e] text-slate-300 hover:bg-[#2a2a2e]">
                Voltar
              </Button>
              <Button onClick={handleRescheduleConfirm} disabled={!rescheduleDate || !rescheduleTime || loading} className="flex-1">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Agendar retorno"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
