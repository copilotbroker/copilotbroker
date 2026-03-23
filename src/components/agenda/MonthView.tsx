import { useMemo } from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarEvent } from "@/hooks/use-calendar-events";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const EVENT_TYPE_COLORS: Record<string, string> = {
  visit: "bg-blue-500",
  meeting: "bg-purple-500",
  follow_up: "bg-amber-500",
  scheduling: "bg-green-500",
  task: "bg-slate-500",
  other: "bg-gray-500",
};

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function MonthView({ currentDate, events, onDayClick, onEventClick }: MonthViewProps) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((e) => {
      const key = format(new Date(e.start_at), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return map;
  }, [events]);

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 bg-muted/50">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2 border-b">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) || [];
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          return (
            <div
              key={key}
              className={cn(
                "min-h-[100px] border-b border-r p-1 cursor-pointer hover:bg-muted/30 transition-colors",
                !inMonth && "bg-muted/10 opacity-50"
              )}
              onClick={() => onDayClick(day)}
            >
              <div className={cn(
                "text-xs font-medium mb-1 h-6 w-6 flex items-center justify-center rounded-full",
                today && "bg-primary text-primary-foreground"
              )}>
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((evt) => (
                  <div
                    key={evt.id}
                    className={cn(
                      "text-[10px] leading-tight px-1 py-0.5 rounded truncate text-white cursor-pointer",
                      EVENT_TYPE_COLORS[evt.event_type] || "bg-slate-500"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(evt);
                    }}
                    title={evt.title}
                  >
                    {!evt.all_day && format(new Date(evt.start_at), "HH:mm") + " "}{evt.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} mais</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
