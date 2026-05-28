import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WhatsAppInput } from "@/components/ui/whatsapp-input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserPlus, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Broker {
  id: string;
  name: string;
  slug: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (info?: { conversationId?: string; sourceInstance?: "global" | "personal" }) => void;
  defaultBrokerId?: string;
  hideBrokerSelect?: boolean;
}

type InstanceChoice = "global" | "personal";

const ORIGIN_OPTIONS = [
  { value: "meta_ads", label: "Meta ADS" },
  { value: "google_ads", label: "Google ADS" },
  { value: "instagram_organic", label: "Instagram Orgânico" },
  { value: "facebook_organic", label: "Facebook Orgânico" },
  { value: "indicacao", label: "Indicação" },
  { value: "plantao", label: "Plantão" },
  { value: "site", label: "Site" },
  { value: "whatsapp_direto", label: "WhatsApp Direto" },
  { value: "outro", label: "Outro" },
];

export function AddLeadModal({ isOpen, onClose, onSuccess, defaultBrokerId, hideBrokerSelect }: AddLeadModalProps) {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [brokerId, setBrokerId] = useState<string>(defaultBrokerId || "enove");
  const [origin, setOrigin] = useState<string>("");
  const [customOrigin, setCustomOrigin] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  // Instance selection (mandatory). Defaults to personal when a broker is in context.
  const [instance, setInstance] = useState<InstanceChoice>(defaultBrokerId ? "personal" : "global");

  // Duplicate-global alert state
  const [duplicateAlert, setDuplicateAlert] = useState<{ brokerName: string } | null>(null);

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setInstance(defaultBrokerId ? "personal" : "global");
  }, [isOpen, defaultBrokerId]);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const brokersRes = await supabase
        .from("brokers")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");

      if (brokersRes.data) setBrokers(brokersRes.data);

      let finalProjects: Project[] = [];

      if (hideBrokerSelect && defaultBrokerId) {
        const [companyRes, ownRes, assignedRes] = await Promise.all([
          supabase.from("projects").select("id, name, slug").eq("is_active", true).is("created_by_broker_id", null).order("name"),
          supabase.from("projects").select("id, name, slug").eq("is_active", true).eq("created_by_broker_id", defaultBrokerId).order("name"),
          supabase.from("broker_projects").select("project:projects(id, name, slug)").eq("broker_id", defaultBrokerId).eq("is_active", true),
        ]);

        const projectMap = new Map<string, Project>();
        companyRes.data?.forEach((p: any) => projectMap.set(p.id, p));
        ownRes.data?.forEach((p: any) => projectMap.set(p.id, p));
        (assignedRes.data as any[])?.forEach((bp: any) => {
          if (bp.project) projectMap.set(bp.project.id, bp.project);
        });
        finalProjects = Array.from(projectMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      } else {
        const projectsRes = await supabase.from("projects").select("id, name, slug").eq("is_active", true).order("name");
        finalProjects = (projectsRes.data || []) as Project[];
      }

      setProjects(finalProjects);
      if (finalProjects.length === 1) setProjectId(finalProjects[0].id);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const resetForm = () => {
    setName("");
    setWhatsapp("");
    setBrokerId(defaultBrokerId || "enove");
    setOrigin("");
    setCustomOrigin("");
    setProjectId(projects.length === 1 ? projects[0].id : "");
    setInstance(defaultBrokerId ? "personal" : "global");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const computeFinalOrigin = () => {
    if (!origin) return "Cadastrado manualmente";
    if (origin === "outro") return customOrigin || "Manual";
    return ORIGIN_OPTIONS.find((o) => o.value === origin)?.label || origin;
  };

  const resolveBrokerForInstance = (chosen: InstanceChoice): string | null => {
    if (chosen === "global") return brokerId === "enove" ? null : brokerId;
    // personal: prefer defaultBrokerId, fallback to selected broker if not "enove"
    if (defaultBrokerId) return defaultBrokerId;
    return brokerId && brokerId !== "enove" ? brokerId : null;
  };

  const callRpc = async (chosen: InstanceChoice) => {
    const finalBroker = resolveBrokerForInstance(chosen);
    const { data, error } = await (supabase.rpc as any)("create_manual_lead_with_conversation", {
      _name: name.trim(),
      _whatsapp: whatsapp,
      _project_id: projectId,
      _instance: chosen,
      _broker_id: finalBroker,
      _origin: computeFinalOrigin(),
    });
    if (error) throw error;
    return data as {
      action: "created" | "opened_existing" | "blocked_global";
      conversation_id?: string;
      lead_id?: string;
      existing_broker_name?: string;
      source_instance?: "global" | "personal";
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return toast.error("Nome é obrigatório");
    if (!whatsapp || whatsapp.replace(/\D/g, "").length < 10) return toast.error("WhatsApp inválido (mínimo 10 dígitos)");
    if (!projectId) return toast.error("Projeto é obrigatório");
    if (instance === "personal" && !resolveBrokerForInstance("personal")) {
      return toast.error("Selecione um corretor para usar a instância pessoal");
    }

    setIsLoading(true);
    try {
      const result = await callRpc(instance);

      if (result.action === "blocked_global") {
        setDuplicateAlert({ brokerName: result.existing_broker_name || "outro corretor" });
        return;
      }

      // Best-effort notification
      if (result.action === "created") {
        try {
          await supabase.functions.invoke("notify-new-lead", {
            body: {
              leadId: result.lead_id,
              leadName: name.trim(),
              leadWhatsapp: whatsapp,
              brokerId: resolveBrokerForInstance(instance),
            },
          });
        } catch (notifyError) {
          console.warn("Notificação WhatsApp falhou:", notifyError);
        }
      }

      toast.success(
        result.action === "opened_existing"
          ? "Lead já existente — abrindo conversa"
          : `Lead adicionado em ${result.source_instance === "global" ? "Plantão" : "instância pessoal"}`,
      );

      handleClose();
      onSuccess?.({ conversationId: result.conversation_id, sourceInstance: result.source_instance });
    } catch (error) {
      console.error("Erro ao adicionar lead:", error);
      toast.error("Erro ao adicionar lead");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsePersonal = async () => {
    setDuplicateAlert(null);
    if (!resolveBrokerForInstance("personal")) {
      toast.error("Sem corretor associado para usar instância pessoal");
      return;
    }
    setIsLoading(true);
    try {
      const result = await callRpc("personal");
      toast.success("Conversa criada na sua instância pessoal");
      handleClose();
      onSuccess?.({ conversationId: result.conversation_id, sourceInstance: "personal" });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar lead pessoal");
    } finally {
      setIsLoading(false);
    }
  };

  const canChoosePersonal = Boolean(resolveBrokerForInstance("personal"));

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="bg-[#1e1e22] border-[#2a2a2e] text-slate-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <UserPlus className="w-5 h-5 text-primary" />
              Adicionar Lead
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Cadastre um novo lead manualmente no sistema
            </DialogDescription>
          </DialogHeader>

          {isLoadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Instância de atendimento */}
              <div className="space-y-2">
                <Label className="text-slate-300">
                  Atender por <span className="text-red-400">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInstance("global")}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors",
                      instance === "global"
                        ? "border-purple-500/60 bg-purple-500/10 text-purple-200"
                        : "border-[#2a2a2e] bg-[#141417] text-slate-300 hover:border-purple-500/40",
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      <Building2 className="w-4 h-4" /> Plantão
                    </div>
                    <span className="text-[11px] text-slate-400">WhatsApp do Plantão (global da imobiliária)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => canChoosePersonal && setInstance("personal")}
                    disabled={!canChoosePersonal}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors",
                      !canChoosePersonal && "opacity-50 cursor-not-allowed",
                      instance === "personal"
                        ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
                        : "border-[#2a2a2e] bg-[#141417] text-slate-300 hover:border-emerald-500/40",
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      <User className="w-4 h-4" /> Pessoal
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {canChoosePersonal ? "Meu WhatsApp pessoal" : "Selecione um corretor primeiro"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">
                  Nome <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome completo"
                  className="bg-[#141417] border-[#2a2a2e] text-slate-200 placeholder:text-slate-500"
                  autoFocus
                />
              </div>

              {/* WhatsApp */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-slate-300">
                  WhatsApp <span className="text-red-400">*</span>
                </Label>
                <WhatsAppInput
                  id="whatsapp"
                  value={whatsapp}
                  onChange={setWhatsapp}
                  className="bg-[#141417] border-[#2a2a2e] text-slate-200"
                />
              </div>

              {/* Empreendimento */}
              <div className="space-y-2">
                <Label className="text-slate-300">
                  Empreendimento <span className="text-red-400">*</span>
                </Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className="bg-[#141417] border-[#2a2a2e] text-slate-200">
                    <SelectValue placeholder="Selecione o empreendimento" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1e22] border-[#2a2a2e]">
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id} className="text-slate-200 focus:bg-[#2a2a2e] focus:text-slate-100">
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Corretor (admin) */}
              {!hideBrokerSelect && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Corretor</Label>
                  <Select value={brokerId} onValueChange={setBrokerId}>
                    <SelectTrigger className="bg-[#141417] border-[#2a2a2e] text-slate-200">
                      <SelectValue placeholder="Selecione o corretor" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1e22] border-[#2a2a2e]">
                      <SelectItem value="enove" className="text-slate-200 focus:bg-[#2a2a2e] focus:text-slate-100">
                        Enove (Sem corretor)
                      </SelectItem>
                      {brokers.map((broker) => (
                        <SelectItem key={broker.id} value={broker.id} className="text-slate-200 focus:bg-[#2a2a2e] focus:text-slate-100">
                          {broker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Origem */}
              <div className="space-y-2">
                <Label className="text-slate-300">Origem</Label>
                <Select value={origin} onValueChange={setOrigin}>
                  <SelectTrigger className="bg-[#141417] border-[#2a2a2e] text-slate-200">
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1e22] border-[#2a2a2e]">
                    {ORIGIN_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-slate-200 focus:bg-[#2a2a2e] focus:text-slate-100">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {origin === "outro" && (
                <div className="space-y-2">
                  <Label htmlFor="customOrigin" className="text-slate-300">
                    Especifique a origem
                  </Label>
                  <Input
                    id="customOrigin"
                    value={customOrigin}
                    onChange={(e) => setCustomOrigin(e.target.value)}
                    placeholder="Ex: Evento XYZ"
                    className="bg-[#141417] border-[#2a2a2e] text-slate-200 placeholder:text-slate-500"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading} className="flex-1 border-[#2a2a2e] text-slate-300 hover:bg-[#2a2a2e] hover:text-slate-100">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                    </>
                  ) : (
                    "Adicionar Lead"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!duplicateAlert} onOpenChange={(open) => !open && setDuplicateAlert(null)}>
        <AlertDialogContent className="bg-[#1e1e22] border-[#2a2a2e] text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">Lead já em atendimento</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Este lead já está sendo atendido por <span className="text-slate-200 font-medium">{duplicateAlert?.brokerName}</span> na instância
              do Plantão. Deseja chamar este cliente pela sua instância pessoal?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[#2a2a2e] text-slate-300 hover:bg-[#2a2a2e]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUsePersonal}
              disabled={!canChoosePersonal}
              className="bg-emerald-500/90 text-white hover:bg-emerald-500"
            >
              Sim, usar minha instância pessoal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
