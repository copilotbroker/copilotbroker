import { useState } from "react";
import { ArrowRightLeft, RotateCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TransferLeadDialogProps {
  leadId: string;
  leadName: string;
  currentBrokerId?: string | null;
  brokers: { id: string; name: string }[];
  roletas?: { id: string; nome: string }[];
  isOpen: boolean;
  onClose: () => void;
  onTransferred: () => void;
}

export function TransferLeadDialog({
  leadId,
  leadName,
  currentBrokerId,
  brokers,
  roletas = [],
  isOpen,
  onClose,
  onTransferred,
}: TransferLeadDialogProps) {
  const [mode, setMode] = useState<"corretor" | "roleta">("corretor");
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("");
  const [selectedRoletaId, setSelectedRoletaId] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);

  const availableBrokers = brokers.filter(b => b.id !== currentBrokerId);

  const handleTransfer = async () => {
    if (mode === "corretor" && !selectedBrokerId) return;
    if (mode === "roleta" && !selectedRoletaId) return;

    setIsTransferring(true);
    try {
      if (mode === "corretor") {
        const { error } = await supabase.rpc("transfer_lead", {
          _lead_id: leadId,
          _new_broker_id: selectedBrokerId,
        });
        if (error) throw error;

        // Notify new broker via WhatsApp (non-blocking)
        try {
          await supabase.functions.invoke("notify-transfer", {
            body: { lead_id: leadId, new_broker_id: selectedBrokerId },
          });
        } catch (notifyErr) {
          console.error("Notify transfer failed (non-critical):", notifyErr);
        }

        const targetBroker = brokers.find(b => b.id === selectedBrokerId);
        toast.success(`Lead transferido para ${targetBroker?.name || "corretor"}`);
      } else {
        // Transfer to roleta: find the first empreendimento linked to this roleta
        const { data: empreendimentos, error: empError } = await (supabase
          .from("roletas_empreendimentos" as any)
          .select("empreendimento_id")
          .eq("roleta_id", selectedRoletaId)
          .eq("ativo", true)
          .limit(1) as any);

        if (empError) throw empError;

        const projectId = empreendimentos?.[0]?.empreendimento_id || null;

        // Clear broker assignment and reset distribution status
        const { error: updateError } = await supabase
          .from("leads")
          .update({
            broker_id: null,
            roleta_id: null,
            status_distribuicao: null,
            reserva_expira_em: null,
            corretor_atribuido_id: null,
            atribuido_em: null,
            ...(projectId ? { project_id: projectId } : {}),
          })
          .eq("id", leadId);

        if (updateError) throw updateError;

        // Log interaction
        const userId = (await supabase.auth.getUser()).data.user?.id;
        const targetRoleta = roletas.find(r => r.id === selectedRoletaId);
        await supabase.from("lead_interactions").insert({
          lead_id: leadId,
          interaction_type: "roleta_transferencia" as any,
          notes: `Lead enviado para roleta "${targetRoleta?.nome || "Roleta"}" para redistribuição`,
          created_by: userId,
        });

        // Invoke roleta-distribuir to trigger round-robin
        if (projectId) {
          try {
            await supabase.functions.invoke("roleta-distribuir", {
              body: { lead_id: leadId, project_id: projectId },
            });
          } catch (roletaErr) {
            console.error("Roleta distribuir invoke failed:", roletaErr);
          }
        }

        toast.success(`Lead enviado para roleta "${targetRoleta?.nome || "Roleta"}"`);
      }

      onTransferred();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao transferir lead");
    } finally {
      setIsTransferring(false);
      setSelectedBrokerId("");
      setSelectedRoletaId("");
    }
  };

  const hasRoletas = roletas.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="bg-[#1e1e22] border-[#2a2a2e] text-slate-200 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <ArrowRightLeft className="w-5 h-5" />
            Transferir Lead
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Transferir <span className="text-slate-200 font-medium">{leadName}</span> para outro corretor ou roleta.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {hasRoletas ? (
            <Tabs value={mode} onValueChange={(v) => setMode(v as "corretor" | "roleta")} className="w-full">
              <TabsList className="w-full bg-[#0f0f12] border border-[#2a2a2e]">
                <TabsTrigger value="corretor" className="flex-1 data-[state=active]:bg-[#2a2a2e] data-[state=active]:text-white text-slate-400">
                  <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" />
                  Corretor
                </TabsTrigger>
                <TabsTrigger value="roleta" className="flex-1 data-[state=active]:bg-[#2a2a2e] data-[state=active]:text-white text-slate-400">
                  <RotateCw className="w-3.5 h-3.5 mr-1.5" />
                  Roleta
                </TabsTrigger>
              </TabsList>

              <TabsContent value="corretor" className="mt-4">
                <Select value={selectedBrokerId} onValueChange={setSelectedBrokerId}>
                  <SelectTrigger className="bg-[#0f0f12] border-[#3a3a3e] text-slate-200">
                    <SelectValue placeholder="Selecione o corretor destino..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1e22] border-[#3a3a3e]">
                    {availableBrokers.map(broker => (
                      <SelectItem
                        key={broker.id}
                        value={broker.id}
                        className="text-slate-200 focus:bg-[#2a2a2e] focus:text-white"
                      >
                        {broker.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>

              <TabsContent value="roleta" className="mt-4 space-y-3">
                <Select value={selectedRoletaId} onValueChange={setSelectedRoletaId}>
                  <SelectTrigger className="bg-[#0f0f12] border-[#3a3a3e] text-slate-200">
                    <SelectValue placeholder="Selecione a roleta..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1e22] border-[#3a3a3e]">
                    {roletas.map(roleta => (
                      <SelectItem
                        key={roleta.id}
                        value={roleta.id}
                        className="text-slate-200 focus:bg-[#2a2a2e] focus:text-white"
                      >
                        {roleta.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  O lead será distribuído automaticamente para o próximo corretor da vez na roleta selecionada.
                </p>
              </TabsContent>
            </Tabs>
          ) : (
            <Select value={selectedBrokerId} onValueChange={setSelectedBrokerId}>
              <SelectTrigger className="bg-[#0f0f12] border-[#3a3a3e] text-slate-200">
                <SelectValue placeholder="Selecione o corretor destino..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1e22] border-[#3a3a3e]">
                {availableBrokers.map(broker => (
                  <SelectItem
                    key={broker.id}
                    value={broker.id}
                    className="text-slate-200 focus:bg-[#2a2a2e] focus:text-white"
                  >
                    {broker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter className="flex flex-col items-center gap-2 sm:flex-col sm:items-center">
          <Button
            onClick={handleTransfer}
            disabled={
              (mode === "corretor" && !selectedBrokerId) ||
              (mode === "roleta" && !selectedRoletaId) ||
              isTransferring
            }
            className="bg-[#FFFF00] text-black hover:bg-[#FFFF00]/90 font-semibold w-full"
          >
            {isTransferring
              ? "Transferindo..."
              : mode === "roleta"
                ? "Enviar para Roleta"
                : "Confirmar Transferência"}
          </Button>
          <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-[#2a2a2e] w-full">
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
