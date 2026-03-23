import { useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarEvent } from "@/hooks/use-calendar-events";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Building2 } from "lucide-react";

const EVENT_TYPE_LABELS: Record<string, string> = {
  visit: "Visita",
  meeting: "Reunião",
  follow_up: "Retorno",
  scheduling: "Agendamento",
  task: "Tarefa",
  other: "Outro",
};

const EVENT_TYPE_BADGE: Record<string, string> = {
  visit: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  meeting: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  follow_up: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  scheduling: "bg-green-500/10 text-green-500 border-green-500/30",
  task: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  other: "bg-gray-500/10 text-gray-400 border-gray-500/30",
};

interface ListViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function ListView({ events, onEventClick }: ListViewProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach(e => {
      const key = format(new Date(e.start_at), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">Nenhum evento encontrado neste período.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(([dateKey, dayEvents]) => (
        <div key={dateKey}>
          <div className="text-sm font-medium text-muted-foreground mb-2">
            {format(new Date(dateKey), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </div>
          <div className="space-y-1.5">
            {dayEvents.map(evt => (
              <div
                key={evt.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onEventClick(evt)}
              >
                <div className="text-xs text-muted-foreground w-12 shrink-0 text-right">
                  {evt.all_day ? "Dia" : format(new Date(evt.start_at), "HH:mm")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{evt.title}</span>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${EVENT_TYPE_BADGE[evt.event_type] || ""}`}>
                      {EVENT_TYPE_LABELS[evt.event_type] || evt.event_type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    {evt.lead_name && <span className="flex items-center gap-1"><User className="h-3 w-3" />{evt.lead_name}</span>}
                    {evt.project_name && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{evt.project_name}</span>}
                    {evt.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{evt.location}</span>}
                  </div>
                </div>
                {evt.broker_name && (
                  <span className="text-xs text-muted-foreground shrink-0">{evt.broker_name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
