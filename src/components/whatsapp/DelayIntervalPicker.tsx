import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TimeUnit = "minutes" | "hours" | "days" | "weeks" | "months";

const UNIT_TO_MINUTES: Record<TimeUnit, number> = {
  minutes: 1,
  hours: 60,
  days: 1440,
  weeks: 10080,
  months: 43200,
};

const UNIT_LABELS: Record<TimeUnit, string> = {
  minutes: "Minutos",
  hours: "Horas",
  days: "Dias",
  weeks: "Semanas",
  months: "Meses",
};

function decomposeMinutes(totalMinutes: number): { value: number; unit: TimeUnit } {
  if (totalMinutes === 0) return { value: 0, unit: "minutes" };
  if (totalMinutes % 43200 === 0 && totalMinutes >= 43200) return { value: totalMinutes / 43200, unit: "months" };
  if (totalMinutes % 10080 === 0 && totalMinutes >= 10080) return { value: totalMinutes / 10080, unit: "weeks" };
  if (totalMinutes % 1440 === 0 && totalMinutes >= 1440) return { value: totalMinutes / 1440, unit: "days" };
  if (totalMinutes % 60 === 0 && totalMinutes >= 60) return { value: totalMinutes / 60, unit: "hours" };
  return { value: totalMinutes, unit: "minutes" };
}

export function formatDelayHuman(minutes: number): string {
  if (minutes === 0) return "Imediato";
  const { value, unit } = decomposeMinutes(minutes);
  const labels: Record<TimeUnit, [string, string]> = {
    minutes: ["minuto", "minutos"],
    hours: ["hora", "horas"],
    days: ["dia", "dias"],
    weeks: ["semana", "semanas"],
    months: ["mês", "meses"],
  };
  const [singular, plural] = labels[unit];
  return `${value} ${value === 1 ? singular : plural}`;
}

interface DelayIntervalPickerProps {
  valueInMinutes: number;
  onChange: (minutes: number) => void;
  className?: string;
}

export function DelayIntervalPicker({ valueInMinutes, onChange, className }: DelayIntervalPickerProps) {
  const { value, unit } = decomposeMinutes(valueInMinutes);

  const handleValueChange = (newValue: number) => {
    const clamped = Math.max(1, newValue);
    onChange(clamped * UNIT_TO_MINUTES[unit]);
  };

  const handleUnitChange = (newUnit: TimeUnit) => {
    const currentValue = value || 1;
    onChange(currentValue * UNIT_TO_MINUTES[newUnit]);
  };

  return (
    <div className={`flex gap-2 ${className || ""}`}>
      <Input
        type="number"
        min={1}
        value={value || ""}
        onChange={(e) => handleValueChange(Number(e.target.value) || 1)}
        className="w-20 bg-[#0f0f11] border-[#2a2a2e] text-white h-9 text-sm"
      />
      <Select value={unit} onValueChange={(v) => handleUnitChange(v as TimeUnit)}>
        <SelectTrigger className="bg-[#0f0f11] border-[#2a2a2e] text-white h-9 text-sm flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#1a1a1d] border-[#2a2a2e]">
          {(Object.keys(UNIT_LABELS) as TimeUnit[]).map((u) => (
            <SelectItem key={u} value={u}>{UNIT_LABELS[u]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
