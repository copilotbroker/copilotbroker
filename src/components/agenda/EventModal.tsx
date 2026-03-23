import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CalendarEvent, CalendarEventType } from "@/hooks/use-calendar-events";
import { format } from "date-fns";

const EVENT_TYPES: { value: CalendarEventType; label: string }[] = [
  { value: "visit", label: "Visita" },
  { value: "meeting", label: "Reunião" },
  { value: "follow_up", label: "Retorno" },
  { value: "scheduling", label: "Agendamento" },
  { value: "task", label: "Tarefa" },
  { value: "other", label: "Outro" },
];

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  defaultDate?: Date;
  brokerId: string;
  onSave: (event: any) => Promise<any>;
  onDelete?: (id: string) => Promise<boolean>;
}

export function EventModal({ open, onClose, event, defaultDate, brokerId, onSave, onDelete }: EventModalProps) {
  const isEditing = !!event;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<CalendarEventType>("task");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
      setEventType(event.event_type);
      setStartAt(format(new Date(event.start_at), "yyyy-MM-dd'T'HH:mm"));
      setEndAt(event.end_at ? format(new Date(event.end_at), "yyyy-MM-dd'T'HH:mm") : "");
      setAllDay(event.all_day);
      setLocation(event.location || "");
    } else {
      const d = defaultDate || new Date();
      setTitle("");
      setDescription("");
      setEventType("task");
      setStartAt(format(d, "yyyy-MM-dd'T'HH:mm"));
      setEndAt("");
      setAllDay(false);
      setLocation("");
    }
  }, [event, defaultDate, open]);

  const handleSubmit = async () => {
    if (!title.trim() || !startAt) return;
    setSaving(true);
    try {
      const payload = {
        ...(isEditing ? {} : { broker_id: brokerId }),
        title: title.trim(),
        description: description.trim() || null,
        event_type: eventType,
        start_at: new Date(startAt).toISOString(),
        end_at: endAt ? new Date(endAt).toISOString() : null,
        all_day: allDay,
        location: location.trim() || null,
      };

      if (isEditing && event) {
        await onSave({ id: event.id, ...payload });
      } else {
        await onSave(payload);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !onDelete) return;
    setSaving(true);
    try {
      await onDelete(event.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Evento" : "Novo Evento"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do evento" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={eventType} onValueChange={(v) => setEventType(v as CalendarEventType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-2">
                <Switch checked={allDay} onCheckedChange={setAllDay} />
                <Label className="text-sm">Dia inteiro</Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início *</Label>
              <Input type={allDay ? "date" : "datetime-local"} value={allDay ? startAt.split("T")[0] : startAt} onChange={(e) => setStartAt(e.target.value)} />
            </div>
            <div>
              <Label>Fim</Label>
              <Input type={allDay ? "date" : "datetime-local"} value={allDay ? (endAt ? endAt.split("T")[0] : "") : endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Local</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Stand do empreendimento" />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes do evento" rows={3} />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {isEditing && onDelete && (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={saving}>
              Excluir
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
              {saving ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
