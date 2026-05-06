import { useMemo, useState } from "react";
import { ArrowRightLeft, RotateCw, Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
  leadId?: string | null;
  conversationId?: string | null;
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
  conversationId,
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
  const [brokerSearch, setBrokerSearch] = useState("");

  const availableBrokers = useMemo(
    () => brokers.filter(b => b.id !== currentBrokerId),
    [brokers, currentBrokerId],
  );
  const filteredBrokers = useMemo(() => {
    const q = brokerSearch.trim().toLowerCase();
    if (!q) return availableBrokers;
    return availableBrokers.filter(b => b.name.toLowerCase().includes(q));
  }, [availableBrokers, brokerSearch]);

  const handleTransfer = async () => {
    if (mode === "corretor" && !selectedBrokerId) return;
    if (mode === "roleta" && !selectedRoletaId) return;

    setIsTransferring(true);
    try {
      if (mode === "corretor") {
        if (leadId) {
          // RPC handles lead transfer + conversation unification automatically
          const { error } = await supabase.rpc("transfer_lead", {
            _lead_id: leadId,
            _new_broker_id: selectedBrokerId,
          });
          if (error) throw error;
        } else if (conversationId) {
          // Conversation-only transfer (no lead yet)
          await supabase
            .from("conversations")
            .update({
              broker_id: selectedBrokerId,
              reserva_expira_em: null,
              attendance_started: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", conversationId);
        }

        // Notify new broker via WhatsApp (non-blocking)
        if (leadId) {
          try {
            await supabase.functions.invoke("notify-transfer", {
              body: { lead_id: leadId, new_broker_id: selectedBrokerId },
            });
          } catch (notifyErr) {
            console.error("Notify transfer failed (non-critical):", notifyErr);
          }
        }

        const targetBroker = brokers.find(b => b.id === selectedBrokerId);
        toast.success(`Lead transferido para ${targetBroker?.name || "corretor"}`);
      } else {
        if (leadId) {
          // Existing roleta transfer flow for leads
          const { data: currentLead, error: leadError } = await supabase
            .from("leads")
            .select("project_id")
            .eq("id", leadId)
            .single();

          if (leadError) throw leadError;

          let projectId = currentLead?.project_id || null;

          if (!projectId) {
            const { data: empreendimentos, error: empError } = await (supabase
              .from("roletas_empreendimentos" as any)
              .select("empreendimento_id")
              .eq("roleta_id", selectedRoletaId)
              .eq("ativo", true)
              .limit(1) as any);

            if (empError) throw empError;
            projectId = empreendimentos?.[0]?.empreendimento_id || null;
          }

          const updatePayload: any = {
            broker_id: null,
            roleta_id: null,
            status_distribuicao: null,
            reserva_expira_em: null,
            corretor_atribuido_id: null,
            atribuido_em: null,
          };
          if (!currentLead?.project_id && projectId) {
            updatePayload.project_id = projectId;
          }

          const { error: updateError } = await supabase
            .from("leads")
            .update(updatePayload)
            .eq("id", leadId);

          if (updateError) throw updateError;

          const userId = (await supabase.auth.getUser()).data.user?.id;
          const targetRoleta = roletas.find(r => r.id === selectedRoletaId);
          await supabase.from("lead_interactions").insert({
            lead_id: leadId,
            interaction_type: "roleta_transferencia" as any,
            notes: `Lead enviado para roleta "${targetRoleta?.nome || "Roleta"}" para redistribuição`,
            created_by: userId,
          });

          if (projectId) {
            try {
              await supabase.functions.invoke("roleta-distribuir", {
                body: { lead_id: leadId, project_id: projectId },
              });
            } catch (roletaErr) {
              console.error("Roleta distribuir invoke failed:", roletaErr);
            }
          }

          // Also clear timeout on conversation
          if (conversationId) {
            await supabase
              .from("conversations")
              .update({ reserva_expira_em: null, updated_at: new Date().toISOString() })
              .eq("id", conversationId);
          }

          toast.success(`Lead enviado para roleta "${targetRoleta?.nome || "Roleta"}"`);
        } else if (conversationId) {
          // Conversation-only roleta transfer: clear broker, invoke roleta-distribuir
          const { error: convError } = await supabase
            .from("conversations")
            .update({
              broker_id: null as any,
              reserva_expira_em: null,
              attendance_started: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", conversationId);

          if (convError) throw convError;

          // Try to invoke roleta for redistribution
          try {
            await supabase.functions.invoke("roleta-distribuir", {
              body: { conversation_id: conversationId, roleta_id: selectedRoletaId },
            });
          } catch (roletaErr) {
            console.error("Roleta distribuir for conversation failed:", roletaErr);
          }

          const targetRoleta = roletas.find(r => r.id === selectedRoletaId);
          toast.success(`Conversa enviada para roleta "${targetRoleta?.nome || "Roleta"}"`);
        }
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
                <BrokerPicker
                  brokers={filteredBrokers}
                  totalCount={availableBrokers.length}
                  selectedId={selectedBrokerId}
                  onSelect={setSelectedBrokerId}
                  search={brokerSearch}
                  onSearchChange={setBrokerSearch}
                />
              </TabsContent>

              <TabsContent value="roleta" className="mt-4 space-y-3">
                <Select value={selectedRoletaId} onValueChange={setSelectedRoletaId}>
                  <SelectTrigger className="bg-[#0f0f12] border-[#3a3a3e] text-slate-200">
                    <SelectValue placeholder="Selecione a roleta..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1e22] border-[#3a3a3e] max-h-72">
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
            <BrokerPicker
              brokers={filteredBrokers}
              totalCount={availableBrokers.length}
              selectedId={selectedBrokerId}
              onSelect={setSelectedBrokerId}
              search={brokerSearch}
              onSearchChange={setBrokerSearch}
            />
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

interface BrokerPickerProps {
  brokers: { id: string; name: string }[];
  totalCount: number;
  selectedId: string;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
}

function BrokerPicker({ brokers, totalCount, selectedId, onSelect, search, onSearchChange }: BrokerPickerProps) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`Buscar entre ${totalCount} corretor(es)...`}
          className="pl-8 bg-[#0f0f12] border-[#3a3a3e] text-slate-200 placeholder:text-slate-500 h-9"
        />
      </div>
      <div className="max-h-64 overflow-y-auto rounded-md border border-[#3a3a3e] bg-[#0f0f12] divide-y divide-[#1e1e22]">
        {brokers.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-slate-500">
            Nenhum corretor encontrado.
          </div>
        ) : (
          brokers.map((b) => {
            const isSelected = b.id === selectedId;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onSelect(b.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors",
                  "text-slate-200 hover:bg-[#2a2a2e]",
                  isSelected && "bg-[#2a2a2e] text-white",
                )}
              >
                <span className="truncate">{b.name}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-[#FFFF00] shrink-0 ml-2" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
