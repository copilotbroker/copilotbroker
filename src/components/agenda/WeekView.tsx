import { useMemo } from "react";
import { startOfWeek, addDays, isSameDay, isToday, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarEvent } from "@/hooks/use-calendar-events";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7h-20h
const EVENT_TYPE_COLORS: Record<string, string> = {
  visit: "bg-amber-400 text-black",
  meeting: "bg-violet-500 text-white",
  follow_up: "bg-sky-500 text-white",
  scheduling: "bg-emerald-500 text-white",
  task: "bg-zinc-500 text-white",
  other: "bg-stone-400 text-black",
};

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
}

export function WeekView({ currentDate, events, onEventClick, onDayClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    weekDays.forEach(d => {
      const key = format(d, "yyyy-MM-dd");
      map.set(key, events.filter(e => isSameDay(new Date(e.start_at), d)));
    });
    return map;
  }, [events, weekDays]);

  return (
    <div className="border rounded-lg overflow-auto max-h-[600px]">
      <div className="grid grid-cols-[60px_repeat(7,1fr)] sticky top-0 bg-background z-10 border-b">
        <div className="border-r" />
        {weekDays.map(d => (
          <div
            key={d.toISOString()}
            className={cn(
              "text-center py-2 border-r cursor-pointer hover:bg-muted/30",
              isToday(d) && "bg-primary/10"
            )}
            onClick={() => onDayClick(d)}
          >
            <div className="text-xs text-muted-foreground">{format(d, "EEE", { locale: ptBR })}</div>
            <div className={cn(
              "text-sm font-medium mx-auto h-7 w-7 flex items-center justify-center rounded-full",
              isToday(d) && "bg-primary text-primary-foreground"
            )}>
              {format(d, "d")}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[60px_repeat(7,1fr)]">
        {HOURS.map(hour => (
          <div key={hour} className="contents">
            <div className="text-[10px] text-muted-foreground text-right pr-2 py-3 border-r border-b h-12">
              {String(hour).padStart(2, "0")}:00
            </div>
            {weekDays.map(d => {
              const key = format(d, "yyyy-MM-dd");
              const hourEvents = (eventsByDay.get(key) || []).filter(e => {
                const h = new Date(e.start_at).getHours();
                return h === hour;
              });
              return (
                <div key={`${key}-${hour}`} className="border-r border-b h-12 relative p-0.5">
                  {hourEvents.map(evt => (
                    <div
                      key={evt.id}
                      className={cn(
                        "text-[10px] rounded px-1 py-0.5 truncate cursor-pointer",
                        EVENT_TYPE_COLORS[evt.event_type] || "bg-slate-500/80"
                      )}
                      onClick={() => onEventClick(evt)}
                      title={evt.title}
                    >
                      {evt.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
