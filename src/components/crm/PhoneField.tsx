import { useEffect, useState } from "react";
import { Pencil, Check, X, Phone, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const onlyDigits = (s: string) => (s ?? "").replace(/\D/g, "");

/** Normalize to digits-only with country code 55 (Brazil). */
export function normalizePhoneBR(input?: string | null): string {
  let d = onlyDigits(input ?? "");
  if (!d) return "";
  if (d.length === 10 || d.length === 11) d = "55" + d;
  // Already has 55 prefix
  return d;
}

/** Format normalized digits to +55 (11) 98765-4321 */
export function formatPhoneBR(input?: string | null): string {
  const d = onlyDigits(input ?? "");
  if (!d) return "";
  let rest = d;
  let cc = "55";
  if (d.length > 11) {
    cc = d.slice(0, d.length - 11);
    rest = d.slice(-11);
  } else if (d.length === 11 || d.length === 10) {
    rest = d;
  }
  if (rest.length === 11) {
    return `+${cc} (${rest.slice(0, 2)}) ${rest.slice(2, 7)}-${rest.slice(7)}`;
  }
  if (rest.length === 10) {
    return `+${cc} (${rest.slice(0, 2)}) ${rest.slice(2, 6)}-${rest.slice(6)}`;
  }
  // Partial typing
  if (rest.length > 7) return `+${cc} (${rest.slice(0, 2)}) ${rest.slice(2, 7)}-${rest.slice(7)}`;
  if (rest.length > 2) return `+${cc} (${rest.slice(0, 2)}) ${rest.slice(2)}`;
  if (rest.length > 0) return `+${cc} (${rest}`;
  return `+${cc}`;
}

export function isValidPhoneBR(input?: string | null): boolean {
  const d = onlyDigits(input ?? "");
  if (d.length === 11 || d.length === 10) return true;
  if (d.length === 13 || d.length === 12) return d.startsWith("55");
  return false;
}

interface PhoneFieldProps {
  label: string;
  value: string;
  onChange: (normalized: string) => void;
  aiFilled?: boolean;
}

export function PhoneField({ label, value, onChange, aiFilled }: PhoneFieldProps) {
  const hasValue = !!value && onlyDigits(value).length > 0;
  const [editing, setEditing] = useState(!hasValue);
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);

  const invalid = draft.length > 0 && !isValidPhoneBR(draft);

  const save = () => {
    if (invalid) return;
    onChange(normalizePhoneBR(draft));
    setEditing(false);
  };
  const cancel = () => {
    setDraft(value ?? "");
    setEditing(false);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium text-slate-300">{label}</Label>
        {aiFilled && (
          <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#FFFF00]/40 text-[#FFFF00] bg-[#FFFF00]/5">
            IA · revisar
          </span>
        )}
      </div>

      {!editing && hasValue ? (
        <div className="flex items-center gap-2 bg-[#0f0f12] border border-[#1e1e22] rounded-lg h-11 sm:h-10 px-3">
          <Phone className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="flex-1 text-base sm:text-sm text-slate-100 truncate font-mono tracking-tight">
            {formatPhoneBR(value)}
          </span>
          <button
            type="button"
            onClick={() => { setDraft(value); setEditing(true); }}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-[#1a1a1e] transition-colors"
            aria-label="Editar telefone"
            title="Editar telefone"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Input
              type="tel"
              inputMode="tel"
              value={formatPhoneBR(draft)}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="+55 (11) 98765-4321"
              className={cn(
                "bg-[#0f0f12] border-[#1e1e22] text-slate-100 h-11 sm:h-10 rounded-lg text-base sm:text-sm font-mono",
                "focus-visible:ring-[#FFFF00]/30 focus-visible:border-[#FFFF00]/40",
                invalid && "border-red-500/60 focus-visible:ring-red-500/30",
              )}
              autoFocus={hasValue}
            />
            {hasValue && (
              <>
                <Button type="button" size="icon" variant="ghost"
                  className="h-9 w-9 shrink-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                  onClick={save} disabled={invalid} title="Confirmar">
                  <Check className="w-4 h-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost"
                  className="h-9 w-9 shrink-0 text-slate-400 hover:text-white hover:bg-[#1a1a1e]"
                  onClick={cancel} title="Cancelar">
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
          {!hasValue && draft && (
            <Button type="button" size="sm" onClick={save} disabled={invalid}
              className="h-8 bg-[#FFFF00] text-black hover:bg-[#FFFF00]/90 font-semibold">
              <Check className="w-3.5 h-3.5 mr-1" /> Confirmar telefone
            </Button>
          )}
          {invalid && (
            <p className="text-[10px] text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Telefone inválido (DDD + número)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
