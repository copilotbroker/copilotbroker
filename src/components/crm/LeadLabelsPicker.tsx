import { useState } from "react";
import { Check, RefreshCw, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useLeadWhatsAppLabels } from "@/hooks/use-lead-whatsapp-labels";

interface PreloadedLabel {
  id: string;
  name: string;
  color: string | null;
}

interface LeadLabelsPickerProps {
  leadId: string;
  brokerId?: string | null;
  phone?: string | null;
  compact?: boolean;
  preloadedLabels?: PreloadedLabel[];
}

const chipClassName = "inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground";

export function LeadLabelsPicker({ leadId, brokerId, phone, compact = false, preloadedLabels }: LeadLabelsPickerProps) {
  const [open, setOpen] = useState(false);
  // Only fire queries when popover is open (lazy loading)
  const { labels, leadLabels, appliedLabelIds, isLoading, isSyncing, isToggling, syncLabels, toggleLabel } = useLeadWhatsAppLabels({
    leadId,
    brokerId,
    phone,
    enabled: open,
  });

  const visibleLeadLabels = leadLabels
    .map((item) => item.label)
    .filter((label): label is NonNullable<typeof label> => Boolean(label));

  const firstLabel = visibleLeadLabels[0];

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {!compact && (
        <div className="flex flex-wrap items-center gap-1">
          {visibleLeadLabels.slice(0, 3).map((label) => (
            <span key={label.id} className={chipClassName} title={label.name}>
              {label.name}
            </span>
          ))}
          {visibleLeadLabels.length > 3 && (
            <span className={chipClassName}>+{visibleLeadLabels.length - 3}</span>
          )}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {compact && firstLabel ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-7 gap-1 rounded-md px-2 text-[10px] font-medium border-border",
                firstLabel.color
                  ? "border-opacity-60"
                  : "bg-crm-warning/10 border-crm-warning/30 text-crm-warning hover:bg-crm-warning/20"
              )}
              style={firstLabel.color ? {
                backgroundColor: `${firstLabel.color}18`,
                borderColor: `${firstLabel.color}50`,
                color: firstLabel.color,
              } : undefined}
              title="Etiquetas do WhatsApp"
            >
              <Tags className="h-3 w-3" />
              <span className="max-w-[60px] truncate">{firstLabel.name}</span>
              {visibleLeadLabels.length > 1 && (
                <span className="text-[9px] opacity-70">+{visibleLeadLabels.length - 1}</span>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="warning"
              size="icon"
              className={cn(compact ? "h-7 w-7 rounded-md" : "h-8 w-8 rounded-md")}
              title="Etiquetas do WhatsApp"
            >
              <Tags className="h-3.5 w-3.5" />
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 border-border bg-popover p-3 text-popover-foreground">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Etiquetas</p>
              <p className="text-xs text-muted-foreground">Vinculadas ao WhatsApp do corretor.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => void syncLabels()}
              disabled={isSyncing}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
            </Button>
          </div>

          {isLoading ? (
            <p className="text-xs text-muted-foreground">Carregando etiquetas...</p>
          ) : labels.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma etiqueta disponível para este corretor ainda.</p>
          ) : (
            <div className="space-y-1">
              {labels.map((label) => {
                const selected = appliedLabelIds.has(label.id);
                return (
                  <button
                    key={label.id}
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      selected
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border bg-background text-foreground hover:bg-secondary",
                    )}
                    onClick={() => void toggleLabel(label.id, !selected)}
                    disabled={isToggling}
                  >
                    <span className="truncate">{label.name}</span>
                    {selected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
