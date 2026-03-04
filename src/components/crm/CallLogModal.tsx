import { useState } from "react";
import { Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-blue-400" />
            Registrar Ligação
          </DialogTitle>
          <DialogDescription>
            {leadName ? `Registre o resultado da ligação para ${leadName}` : "Registre o resultado da ligação"}
          </DialogDescription>
        </DialogHeader>

        <Textarea
          placeholder="Ex: Cliente atendeu, demonstrou interesse no apto 302. Vai analisar proposta até sexta.&#10;&#10;Ou: Não atendeu, caixa postal."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="resize-none"
          autoFocus
        />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!notes.trim() || loading}>
            {loading ? "Salvando..." : "Registrar Ligação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
