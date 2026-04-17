import { useState } from "react";
import { format, subDays, startOfDay, startOfWeek, endOfWeek, startOfMonth, subWeeks, subMonths } from "date-fns";
import { Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const PERIOD_PRESETS = [
  { label: "Hoje", get: () => ({ start: startOfDay(new Date()), end: new Date() }) },
  { label: "Máximo", get: () => ({ start: new Date(2020, 0, 1), end: new Date() }) },
  { label: "Ontem", get: () => ({ start: startOfDay(subDays(new Date(), 1)), end: startOfDay(new Date()) }) },
  { label: "Últimos 7 dias", get: () => ({ start: startOfDay(subDays(new Date(), 7)), end: new Date() }) },
  { label: "Últimos 14 dias", get: () => ({ start: startOfDay(subDays(new Date(), 14)), end: new Date() }) },
  { label: "Últimos 28 dias", get: () => ({ start: startOfDay(subDays(new Date(), 28)), end: new Date() }) },
  { label: "Últimos 30 dias", get: () => ({ start: startOfDay(subDays(new Date(), 30)), end: new Date() }) },
  { label: "Esta semana", get: () => ({ start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: new Date() }) },
  { label: "Semana passada", get: () => {
    const s = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
    return { start: s, end: endOfWeek(s, { weekStartsOn: 1 }) };
  }},
  { label: "Este mês", get: () => ({ start: startOfMonth(new Date()), end: new Date() }) },
  { label: "Mês passado", get: () => {
    const s = startOfMonth(subMonths(new Date(), 1));
    return { start: s, end: startOfMonth(new Date()) };
  }},
] as const;

function MiniCalendar({ month, year, selectedStart, selectedEnd, onSelect, onMonthChange }: {
  month: number; year: number;
  selectedStart: Date | null; selectedEnd: Date | null;
  onSelect: (d: Date) => void;
  onMonthChange: (m: number, y: number) => void;
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDayOfWeek).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }

  const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

  const isInRange = (day: number) => {
    if (!selectedStart || !selectedEnd) return false;
    const d = new Date(year, month, day);
    return d >= selectedStart && d <= selectedEnd;
  };
  const isStart = (day: number) => selectedStart && day === selectedStart.getDate() && month === selectedStart.getMonth() && year === selectedStart.getFullYear();
  const isEnd = (day: number) => selectedEnd && day === selectedEnd.getDate() && month === selectedEnd.getMonth() && year === selectedEnd.getFullYear();
  const isToday = (day: number) => {
    const t = new Date();
    return day === t.getDate() && month === t.getMonth() && year === t.getFullYear();
  };
  const isFuture = (day: number) => {
    const d = new Date(year, month, day);
    return d > new Date();
  };

  return (
    <div className="w-[220px]">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => onMonthChange(month === 0 ? 11 : month - 1, month === 0 ? year - 1 : year)} className="text-slate-400 hover:text-white p-1">‹</button>
        <span className="text-xs font-medium text-white">{monthNames[month]} {year}</span>
        <button onClick={() => onMonthChange(month === 11 ? 0 : month + 1, month === 11 ? year + 1 : year)} className="text-slate-400 hover:text-white p-1">›</button>
      </div>
      <div className="grid grid-cols-7 gap-0 text-center">
        {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map(d => (
          <div key={d} className="text-[9px] text-slate-500 py-1">{d}</div>
        ))}
        {weeks.flat().map((day, i) => {
          const future = day ? isFuture(day) : false;
          return (
            <button
              key={i}
              disabled={!day || future}
              onClick={() => day && !future && onSelect(new Date(year, month, day))}
              className={cn(
                "text-[11px] h-7 w-full transition-colors",
                !day && "invisible",
                day && future && "text-slate-700 cursor-not-allowed",
                day && !future && "hover:bg-[#FFFF00]/20 text-slate-300",
                day && isInRange(day) && !future && "bg-[#FFFF00]/10",
                day && (isStart(day) || isEnd(day)) && !future && "bg-[#FFFF00] text-black font-bold rounded",
                day && isToday(day) && !isStart(day) && !isEnd(day) && "text-[#FFFF00] font-bold",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CustomDateRangePickerContent({ onApply, initialStart, initialEnd }: {
  onApply: (start: Date, end: Date) => void;
  initialStart?: Date; initialEnd?: Date;
}) {
  const now = new Date();
  const [selStart, setSelStart] = useState<Date | null>(initialStart || null);
  const [selEnd, setSelEnd] = useState<Date | null>(initialEnd || null);
  const [picking, setPicking] = useState<"start" | "end">("start");
  const [activePreset, setActivePreset] = useState<string | null>(initialStart ? null : "Últimos 30 dias");

  const [leftMonth, setLeftMonth] = useState(now.getMonth() === 0 ? 11 : now.getMonth() - 1);
  const [leftYear, setLeftYear] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
  const [rightMonth, setRightMonth] = useState(now.getMonth());
  const [rightYear, setRightYear] = useState(now.getFullYear());

  const handleDaySelect = (d: Date) => {
    setActivePreset(null);
    if (picking === "start") {
      setSelStart(d);
      setSelEnd(null);
      setPicking("end");
    } else {
      if (selStart && d < selStart) {
        setSelStart(d);
        setSelEnd(selStart);
      } else {
        setSelEnd(d);
      }
      setPicking("start");
    }
  };

  const handlePreset = (preset: typeof PERIOD_PRESETS[number]) => {
    const { start, end } = preset.get();
    setSelStart(start);
    setSelEnd(end);
    setActivePreset(preset.label);
    setPicking("start");
  };

  return (
    <div className="flex">
      <div className="border-r border-[#2a2a2e] pr-3 mr-3 space-y-0.5 min-w-[130px]">
        <p className="text-[10px] text-slate-500 font-medium mb-2 uppercase tracking-wider">Atalhos</p>
        {PERIOD_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePreset(p)}
            className={cn(
              "block w-full text-left text-[11px] px-2 py-1.5 rounded transition-colors",
              activePreset === p.label
                ? "bg-[#FFFF00]/15 text-[#FFFF00] font-medium"
                : "text-slate-400 hover:text-white hover:bg-[#2a2a2e]"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex gap-4">
          <MiniCalendar
            month={leftMonth} year={leftYear}
            selectedStart={selStart} selectedEnd={selEnd}
            onSelect={handleDaySelect}
            onMonthChange={(m, y) => { setLeftMonth(m); setLeftYear(y); }}
          />
          <MiniCalendar
            month={rightMonth} year={rightYear}
            selectedStart={selStart} selectedEnd={selEnd}
            onSelect={handleDaySelect}
            onMonthChange={(m, y) => { setRightMonth(m); setRightYear(y); }}
          />
        </div>

        <div className="flex items-center justify-between border-t border-[#2a2a2e] pt-3">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="bg-[#16161a] border border-[#2a2a2e] rounded px-2 py-1 text-slate-300">
              {selStart ? format(selStart, "dd/MM/yyyy") : "Início"}
            </span>
            <span className="text-slate-600">→</span>
            <span className="bg-[#16161a] border border-[#2a2a2e] rounded px-2 py-1 text-slate-300">
              {selEnd ? format(selEnd, "dd/MM/yyyy") : "Fim"}
            </span>
          </div>
          <Button
            size="sm"
            disabled={!selStart || !selEnd}
            onClick={() => selStart && selEnd && onApply(selStart, selEnd)}
            className="bg-[#FFFF00] text-black hover:bg-[#FFFF00]/90 text-xs h-7 px-4"
          >
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Period filter with Tabs (Hoje, 7d, 30d, Todo período) + Personalizado popover.
 * Accepts a generic Period type that includes "custom".
 */
export function PeriodFilterWithCustom({
  period,
  onPeriodChange,
  customRange,
  onCustomRangeApply,
  showAllPeriod = false,
}: {
  period: string;
  onPeriodChange: (p: string) => void;
  customRange: { start: Date; end: Date } | null;
  onCustomRangeApply: (start: Date, end: Date) => void;
  showAllPeriod?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isCustom = period === "custom";

  return (
    <div className="inline-flex items-center rounded-md bg-[#1e1e22] border border-[#2a2a2e] p-1 max-w-full overflow-x-auto whatsapp-scrollbar">
      <Tabs value={isCustom ? "" : period} onValueChange={(v) => { onPeriodChange(v); setOpen(false); }}>
        <TabsList className="bg-transparent border-0 p-0 h-auto gap-0">
          <TabsTrigger value="today" className="data-[state=active]:bg-[#FFFF00] data-[state=active]:text-black text-xs h-7 px-2.5 rounded-sm">Hoje</TabsTrigger>
          <TabsTrigger value="7d" className="data-[state=active]:bg-[#FFFF00] data-[state=active]:text-black text-xs h-7 px-2.5 rounded-sm">7 dias</TabsTrigger>
          <TabsTrigger value="30d" className="data-[state=active]:bg-[#FFFF00] data-[state=active]:text-black text-xs h-7 px-2.5 rounded-sm">30 dias</TabsTrigger>
          {showAllPeriod && (
            <TabsTrigger value="all" className="data-[state=active]:bg-[#FFFF00] data-[state=active]:text-black text-xs h-7 px-2.5 rounded-sm whitespace-nowrap">Todo período</TabsTrigger>
          )}
        </TabsList>
      </Tabs>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            onClick={() => setOpen(true)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm px-2.5 h-7 text-xs font-medium transition-colors whitespace-nowrap",
              isCustom
                ? "bg-[#FFFF00] text-black"
                : "bg-transparent text-slate-300 hover:bg-[#2a2a2e]"
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            {isCustom && customRange
              ? `${format(customRange.start, "dd/MM")} - ${format(customRange.end, "dd/MM")}`
              : "Personalizado"
            }
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-4 bg-[#1e1e22] border-[#2a2a2e]" sideOffset={8}>
          <CustomDateRangePickerContent
            initialStart={customRange?.start}
            initialEnd={customRange?.end}
            onApply={(start, end) => {
              onCustomRangeApply(start, end);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
