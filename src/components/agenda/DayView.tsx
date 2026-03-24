import { useMemo } from "react";
import { isSameDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarEvent } from "@/hooks/use-calendar-events";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6h-21h
const EVENT_TYPE_COLORS: Record<string, string> = {
  visit: "bg-amber-400 text-black",
  meeting: "bg-violet-500 text-white",
  follow_up: "bg-sky-500 text-white",
  scheduling: "bg-emerald-500 text-white",
  task: "bg-zinc-500 text-white",
  other: "bg-stone-400 text-black",
};

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function DayView({ currentDate, events, onEventClick }: DayViewProps) {
  const dayEvents = useMemo(() => events.filter(e => isSameDay(new Date(e.start_at), currentDate)), [events, currentDate]);
  const allDayEvents = dayEvents.filter(e => e.all_day);
  const timedEvents = dayEvents.filter(e => !e.all_day);

  return (
    <div className="border rounded-lg overflow-auto max-h-[600px]">
      <div className="sticky top-0 bg-background z-10 border-b px-4 py-2">
        <h3 className="font-medium">{format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}</h3>
      </div>

      {allDayEvents.length > 0 && (
        <div className="px-4 py-2 border-b bg-muted/20 space-y-1">
          <span className="text-xs text-muted-foreground">Dia inteiro</span>
          {allDayEvents.map(evt => (
            <div
              key={evt.id}
className={cn("text-xs rounded px-2 py-1 cursor-pointer", EVENT_TYPE_COLORS[evt.event_type])}
              onClick={() => onEventClick(evt)}
            >
              {evt.title}
            </div>
          ))}
        </div>
      )}

      <div>
        {HOURS.map(hour => {
          const hourEvents = timedEvents.filter(e => new Date(e.start_at).getHours() === hour);
          return (
            <div key={hour} className="flex border-b min-h-[48px]">
              <div className="w-16 text-right pr-3 py-2 text-xs text-muted-foreground shrink-0">
                {String(hour).padStart(2, "0")}:00
              </div>
              <div className="flex-1 border-l p-1 space-y-0.5">
                {hourEvents.map(evt => (
                  <div
                    key={evt.id}
className={cn("text-xs rounded px-2 py-1 cursor-pointer", EVENT_TYPE_COLORS[evt.event_type])}
                    onClick={() => onEventClick(evt)}
                  >
                    <span className="font-medium">{format(new Date(evt.start_at), "HH:mm")}</span> {evt.title}
                    {evt.lead_name && <span className="opacity-70"> · {evt.lead_name}</span>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
