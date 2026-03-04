import { useState } from "react";
import { Phone, Loader2 } from "lucide-react";
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

interface CallLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName?: string;
  onConfirm: (notes: string) => Promise<void>;
}

export function CallLogModal({ open, onOpenChange, leadName, onConfirm }: CallLogModalProps) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!notes.trim()) return;
    setLoading(true);
    try {
      await onConfirm(notes.trim());
      setNotes("");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) { onOpenChange(v); if (!v) setNotes(""); } }}>
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
            {leadName
              ? `Registre o resultado da ligação para ${leadName}`
              : "Registre o resultado da ligação"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="call-notes" className="text-slate-300">
              Anotações da ligação <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="call-notes"
              placeholder="Ex: Cliente atendeu, demonstrou interesse no apto 302. Vai analisar proposta até sexta.&#10;&#10;Ou: Não atendeu, caixa postal."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none bg-[#141417] border-[#2a2a2e] text-slate-200 placeholder:text-slate-500"
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 border-[#2a2a2e] text-slate-300 hover:bg-[#2a2a2e] hover:text-slate-100"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!notes.trim() || loading}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Registrar Ligação"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
