import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Building2, Users, Search, MapPin, X, Tags } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { CRMLead, LeadStatus, STATUS_CONFIG, LEAD_ORIGINS } from "@/types/crm";
import { useCustomOrigins } from "@/hooks/use-custom-origins";
import { useKanbanLeads } from "@/hooks/use-kanban-leads";
import { useActiveFlowLeads } from "@/hooks/use-active-flow-reconciliation";
import { KanbanColumn } from "./KanbanColumn";
import { LeadDetailSheet } from "./LeadDetailSheet";
import { AgendamentoModal } from "./AgendamentoModal";
import { ComparecimentoModal } from "./ComparecimentoModal";
import { PropostaModal } from "./PropostaModal";
import { VendaModal } from "./VendaModal";
import { PerdaModal } from "./PerdaModal";
import { CallLogModal } from "./CallLogModal";
import { TransferLeadDialog } from "./TransferLeadDialog";
import { NewCampaignSheet } from "@/components/whatsapp/NewCampaignSheet";
import { supabase } from "@/integrations/supabase/client";
import { cancelCadenciaForLead } from "@/hooks/use-cadencia-ativa";
import { usePropostas } from "@/hooks/use-propostas";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import type { KanbanColumnFilters } from "@/hooks/use-kanban-column";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Project {
  id: string;
  name: string;
  slug: string;
  city_slug: string;
}

interface KanbanBoardProps {
  brokerId?: string | null;
  isAdmin?: boolean;
  brokers?: { id: string; name: string; slug: string }[];
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  onAddLead?: () => void;
  hideToolbarMobile?: boolean;
}

const STATUSES: LeadStatus[] = ['new', 'info_sent', 'awaiting_docs', 'scheduling', 'docs_received', 'registered'];
const STATUS_ORDER: LeadStatus[] = ['new', 'info_sent', 'awaiting_docs', 'scheduling', 'docs_received', 'registered'];

export function KanbanBoard({ brokerId, isAdmin = false, brokers: brokersProp = [], searchTerm = "", onSearchChange, onAddLead, hideToolbarMobile = false }: KanbanBoardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedBroker, setSelectedBroker] = useState<string>(isAdmin && brokerId ? brokerId : "all");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const { data: customOrigins = [] } = useCustomOrigins();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);
  
  const [whatsappCampaignOpen, setWhatsappCampaignOpen] = useState(false);
  const [whatsappPreselectedStatus, setWhatsappPreselectedStatus] = useState<LeadStatus | undefined>();
  const [localBrokers, setLocalBrokers] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Determine effective broker ID for label filtering
  const effectiveLabelBrokerId = isAdmin
    ? (selectedBroker !== "all" && selectedBroker !== "enove" ? selectedBroker : null)
    : brokerId;

  // Fetch available WhatsApp labels for filter (scoped to selected broker)
  const { data: availableLabels = [] } = useQuery({
    queryKey: ["whatsapp-labels-for-filter", effectiveLabelBrokerId],
    enabled: !!effectiveLabelBrokerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_labels")
        .select("id, name, color, broker_id")
        .eq("broker_id", effectiveLabelBrokerId!)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  // Clear selected labels when broker changes
  useEffect(() => {
    setSelectedLabelIds([]);
  }, [selectedBroker]);

  // Fetch lead IDs matching selected labels
  const { data: labelFilteredLeadIds } = useQuery({
    queryKey: ["label-filtered-lead-ids", selectedLabelIds],
    enabled: selectedLabelIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_whatsapp_labels")
        .select("lead_id")
        .in("label_id", selectedLabelIds);
      if (error) throw error;
      return [...new Set((data || []).map(d => d.lead_id))];
    },
    staleTime: 10_000,
  });

  // Lead lookup map populated by columns
  const allLeadsRef = useRef<Map<string, CRMLead>>(new Map());

  // Modal states
  const [agendamentoModal, setAgendamentoModal] = useState<{ open: boolean; leadId: string | null; isReagendamento?: boolean }>({ open: false, leadId: null });
  const [comparecimentoModal, setComparecimentoModal] = useState<{ open: boolean; leadId: string | null }>({ open: false, leadId: null });
  const [propostaModal, setPropostaModal] = useState<{ open: boolean; leadId: string | null; leadProjectId?: string | null; leadBrokerId?: string | null }>({ open: false, leadId: null });
  const [vendaModal, setVendaModal] = useState<{ open: boolean; leadId: string | null }>({ open: false, leadId: null });
  const [perdaModal, setPerdaModal] = useState<{ open: boolean; leadId: string | null; currentStatus: LeadStatus }>({ open: false, leadId: null, currentStatus: "new" });
  const [newLeadIds, setNewLeadIds] = useState<Set<string>>(new Set());
  const [callModal, setCallModal] = useState<{ open: boolean; leadId: string | null }>({ open: false, leadId: null });
  const [cardTransferModal, setCardTransferModal] = useState<{ open: boolean; leadId: string | null; leadName: string; currentBrokerId: string | null }>({ open: false, leadId: null, leadName: "", currentBrokerId: null });
  const newLeadTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const { criarProposta } = usePropostas(propostaModal.leadId || "");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(1320, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Browser may block audio before user interaction
    }
  }, []);

  const handleNewLead = useCallback((leadId: string, leadName: string) => {
    playNotificationSound();
    toast.success(`🆕 Novo lead: ${leadName}`);
    setNewLeadIds(prev => new Set(prev).add(leadId));

    const existing = newLeadTimeoutsRef.current.get(leadId);
    if (existing) clearTimeout(existing);

    const timeout = setTimeout(() => {
      setNewLeadIds(prev => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
      newLeadTimeoutsRef.current.delete(leadId);
    }, 5000);
    newLeadTimeoutsRef.current.set(leadId, timeout);
  }, [playNotificationSound]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      newLeadTimeoutsRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    if (brokersProp.length > 0) return;
    const fetchBrokers = async () => {
      const { data } = await supabase
        .from("brokers")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");
      if (data) setLocalBrokers(data);
    };
    fetchBrokers();
  }, [brokersProp.length]);

  const brokers = brokersProp.length > 0 ? brokersProp : localBrokers;

  // Fetch active roletas for transfer dialog
  const { data: activeRoletas = [] } = useQuery({
    queryKey: ["active-roletas-transfer"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("roletas" as any)
        .select("id, nome")
        .eq("ativa", true)
        .order("nome") as any);
      if (error) throw error;
      return (data || []) as { id: string; nome: string }[];
    },
  });
  const {
    invalidateAll, updateLeadStatus, updateLead, inactivateLead, deleteLead,
    iniciarAtendimento, registrarAgendamento, registrarComparecimento, registrarProposta,
    registrarComparecimentoEProposta, registrarNaoComparecimento, reagendarLead, confirmarVenda,
  } = useKanbanLeads({
    brokerId,
    isAdmin,
    projectId: selectedProject === "all" ? null : selectedProject,
  });

  useEffect(() => {
    const fetchProjects = async () => {
      if (isAdmin) {
        const { data } = await supabase
          .from("projects")
          .select("id, name, slug, city_slug")
          .eq("is_active", true)
          .order("name");
        if (data) setProjects(data);
      } else if (brokerId) {
        const { data } = await supabase
          .from("broker_projects")
          .select("project:projects(id, name, slug, city_slug)")
          .eq("broker_id", brokerId)
          .eq("is_active", true);
        if (data) {
          const brokerProjects = data.map(bp => bp.project).filter((p): p is Project => p !== null);
          setProjects(brokerProjects);
        }
      }
    };
    fetchProjects();
  }, [isAdmin, brokerId]);

  const { activeFlowLeadIds, activeFlowIdList, activeFlowSignature } = useActiveFlowLeads({
    brokerId,
    isAdmin,
    selectedBroker,
  });

  const activeFlow = useMemo(() => ({
    activeFlowLeadIds,
    activeFlowIdList,
    activeFlowSignature,
  }), [activeFlowLeadIds, activeFlowIdList, activeFlowSignature]);

  // Realtime subscription for lead changes → invalidate column queries
  useEffect(() => {
    const channel = supabase
      .channel('kanban-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        const newRecord = payload.new as any;
        const oldRecord = payload.old as any;

        const affectedStatuses = new Set<string>();
        if (newRecord?.status) affectedStatuses.add(newRecord.status);
        if (oldRecord?.status) affectedStatuses.add(oldRecord.status);

        affectedStatuses.forEach(s => {
          queryClient.invalidateQueries({ queryKey: ["kanban-column", s] });
          queryClient.invalidateQueries({ queryKey: ["kanban-count", s] });
        });

        if (payload.eventType === 'INSERT' && newRecord?.status === 'new') {
          if (!isAdmin && brokerId && newRecord.broker_id !== brokerId) return;
          handleNewLead(newRecord.id, newRecord.name || 'Novo lead');
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient, brokerId, isAdmin, handleNewLead]);

  // Column filters
  const columnFilters: KanbanColumnFilters = useMemo(() => ({
    brokerId,
    isAdmin,
    projectId: selectedProject === "all" ? null : selectedProject,
    selectedBroker,
    selectedOrigins,
    searchTerm: debouncedSearch,
    selectedLabelIds: selectedLabelIds.length > 0
      ? (labelFilteredLeadIds && labelFilteredLeadIds.length > 0 ? labelFilteredLeadIds : ["00000000-0000-0000-0000-000000000000"])
      : undefined,
  }), [brokerId, isAdmin, selectedProject, selectedBroker, selectedOrigins, debouncedSearch, selectedLabelIds, labelFilteredLeadIds]);

  // Lead lookup callback
  const handleLeadsLoaded = useCallback((leads: CRMLead[]) => {
    leads.forEach(l => allLeadsRef.current.set(l.id, l));
  }, []);


  const handleCardClick = (lead: CRMLead) => {
    navigate(`/corretor/lead/${lead.id}`);
  };

  const handleLeadUpdate = async (leadId: string, updates: Partial<CRMLead>) => {
    const success = await updateLead(leadId, updates);
    if (success && selectedLead?.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleStatusUpdate = async (leadId: string, oldStatus: LeadStatus, newStatus: LeadStatus) => {
    const success = await updateLeadStatus(leadId, oldStatus, newStatus);
    if (success && selectedLead?.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleUpdateOrigin = async (leadId: string, origin: string) => {
    const lead = allLeadsRef.current.get(leadId);
    await updateLead(leadId, { lead_origin: origin }, {
      logOriginChange: true,
      oldOrigin: lead?.lead_origin
    });
  };

  const handleIniciarAtendimento = async (leadId: string) => {
    const lead = allLeadsRef.current.get(leadId);
    const result = await iniciarAtendimento(leadId);
    if (result.success) {
      toast.success("Atendimento iniciado!");
      const userId = result.userId;
      supabase.from("lead_interactions").insert({
        lead_id: leadId,
        interaction_type: "whatsapp_manual" as any,
        notes: "Atendimento iniciado — redirecionado para WhatsApp",
        channel: "whatsapp",
        created_by: userId,
      });
      if (lead) {
        const cleanPhone = lead.whatsapp.replace(/\D/g, "");
        window.open(`https://wa.me/55${cleanPhone}`, "_blank");
      }
    }
  };

  const handleOpenAgendamento = (leadId: string) => {
    setAgendamentoModal({ open: true, leadId });
  };

  const handleOpenComparecimento = (leadId: string) => {
    setComparecimentoModal({ open: true, leadId });
  };

  const handleOpenVenda = (leadId: string) => {
    setVendaModal({ open: true, leadId });
  };

  const handleOpenPerda = (leadId: string, currentStatus: LeadStatus) => {
    setPerdaModal({ open: true, leadId, currentStatus });
  };

  const handleDeleteLead = async (leadId: string) => {
    await deleteLead(leadId);
  };

  const handleCardTransfer = useCallback((leadId: string) => {
    const lead = allLeadsRef.current.get(leadId);
    setCardTransferModal({
      open: true,
      leadId,
      leadName: lead?.name || "Lead",
      currentBrokerId: lead?.broker_id || null,
    });
  }, []);

  const handleDispatchWhatsApp = (status: LeadStatus) => {
    setWhatsappPreselectedStatus(status);
    setWhatsappCampaignOpen(true);
  };

  const handleCancelCadencia = async (leadId: string) => {
    await cancelCadenciaForLead(leadId);
    invalidateAll();
  };

  const ensureConversationForLead = useCallback(async (leadId: string) => {
    const lead = allLeadsRef.current.get(leadId);
    if (!lead?.broker_id) throw new Error("Lead sem corretor vinculado");

    const digits = lead.whatsapp.replace(/\D/g, "");
    const canonicalPhone = digits.startsWith("55") ? digits : `55${digits}`;
    const canonicalNormalized = canonicalPhone.replace(/\D/g, "");
    const basePhone = canonicalNormalized.startsWith("55") ? canonicalNormalized.slice(2) : canonicalNormalized;
    const phoneVariants = [...new Set([
      canonicalNormalized,
      basePhone,
      basePhone.length === 10 ? `${basePhone.slice(0, 2)}9${basePhone.slice(2)}` : null,
      basePhone.length === 11 && basePhone[2] === "9" ? `${basePhone.slice(0, 2)}${basePhone.slice(3)}` : null,
    ].filter(Boolean) as string[])];

    const { data: existingConversations, error: findError } = await supabase
      .from("conversations")
      .select("id, broker_id, lead_id, phone, phone_normalized, status, ai_mode, is_archived, last_message_at, last_message_preview, last_message_direction, last_message_type, display_name, display_name_source, unread_count, opportunity_score, temperature, copilot_suggestions_count, created_at, updated_at")
      .eq("broker_id", lead.broker_id)
      .in("phone_normalized", phoneVariants)
      .order("created_at", { ascending: true });

    if (findError) throw findError;

    const primary = existingConversations?.[0];
    if (primary) {
      await supabase
        .from("conversations")
        .update({
          phone: canonicalPhone,
          phone_normalized: canonicalNormalized,
          lead_id: primary.lead_id || leadId,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", primary.id);
      return primary.id;
    }

    const { data: created, error: createError } = await supabase
      .from("conversations")
      .insert({
        broker_id: lead.broker_id,
        lead_id: leadId,
        phone: canonicalPhone,
        phone_normalized: canonicalNormalized,
        status: "active",
        ai_mode: "copilot",
        display_name: lead.name,
        display_name_source: "lead",
        is_archived: false,
      } as any)
      .select("id")
      .single();

    if (createError) throw createError;
    return created.id as string;
  }, []);

  const handleSendWhatsAppNow = useCallback(async (leadId: string, content: string) => {
    // If lead is "new", initiate attendance (moves to info_sent + logs timeline)
    const lead = allLeadsRef.current.get(leadId);
    if (lead && lead.status === "new") {
      await iniciarAtendimento(leadId);
    }

    const conversationId = await ensureConversationForLead(leadId);
    const { error } = await supabase.functions.invoke("inbox-send-message", {
      body: {
        conversation_id: conversationId,
        content,
        sent_by: "human",
        message_type: "text",
      },
    });

    if (error) {
      console.error("Erro ao enviar mensagem do Kanban:", error);
      toast.error("Não foi possível enviar a mensagem");
      throw error;
    }

    toast.success("Mensagem enviada");
    queryClient.invalidateQueries({ queryKey: ["lead-interactions"] });
  }, [ensureConversationForLead, queryClient, iniciarAtendimento]);

  const handleScheduleWhatsApp = useCallback(async (leadId: string, content: string, scheduledAt: string) => {
    const conversationId = await ensureConversationForLead(leadId);
    const lead = allLeadsRef.current.get(leadId);
    if (!lead?.broker_id) throw new Error("Lead sem corretor vinculado");

    const nowIso = new Date().toISOString();
    const { data: queueItem, error } = await supabase
      .from("whatsapp_message_queue")
      .insert({
        broker_id: lead.broker_id,
        lead_id: leadId,
        phone: lead.whatsapp,
        message: content.trim(),
        scheduled_at: scheduledAt,
        status: "scheduled",
      } as any)
      .select("id")
      .single();

    if (error) {
      console.error("Erro ao programar mensagem do Kanban:", error);
      toast.error("Não foi possível programar a mensagem");
      throw error;
    }

    let previousStatus = lead.status || "info_sent";
    if (previousStatus === "awaiting_docs") {
      const { data: interactions } = await supabase
        .from("lead_interactions")
        .select("notes, created_at")
        .eq("lead_id", leadId)
        .eq("interaction_type", "whatsapp_manual")
        .order("created_at", { ascending: false })
        .limit(100);

      const preservedStatus = (interactions || []).find((interaction) => {
        try {
          const parsed = JSON.parse(interaction.notes || "{}");
          return parsed?.kind === "scheduled_message" && typeof parsed?.previousStatus === "string" && parsed.previousStatus !== "awaiting_docs";
        } catch {
          return false;
        }
      });

      if (preservedStatus) {
        try {
          const parsed = JSON.parse(preservedStatus.notes || "{}");
          previousStatus = parsed.previousStatus;
        } catch {
          previousStatus = lead.status || "info_sent";
        }
      }
    }

    if ((lead.status || "info_sent") !== "awaiting_docs") {
      await supabase
        .from("leads")
        .update({
          status: "awaiting_docs",
          atendimento_iniciado_em: nowIso,
          status_distribuicao: "atendimento_iniciado",
          reserva_expira_em: null,
          updated_at: nowIso,
        } as any)
        .eq("id", leadId);

      await supabase.from("lead_interactions").insert({
        lead_id: leadId,
        interaction_type: "status_change" as any,
        old_status: previousStatus as any,
        new_status: "awaiting_docs" as any,
        channel: "whatsapp",
        broker_id: lead.broker_id,
        notes: `Lead movido para Copiloto Ativo por mensagem programada (${new Date(scheduledAt).toLocaleString("pt-BR")})`,
      } as any);
    }

    toast.success("Mensagem programada");
    queryClient.invalidateQueries({ queryKey: ["lead-interactions"] });
    invalidateAll();
  }, [ensureConversationForLead, queryClient, invalidateAll]);

  const handleCallClick = (leadId: string) => {
    setCallModal({ open: true, leadId });
  };

  const handleCallConfirm = async (notes: string) => {
    if (!callModal.leadId) return;

    // If lead is "new", initiate attendance (moves to info_sent + logs timeline)
    const lead = allLeadsRef.current.get(callModal.leadId);
    if (lead && lead.status === "new") {
      await iniciarAtendimento(callModal.leadId);
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("lead_interactions").insert({
      lead_id: callModal.leadId,
      interaction_type: "ligacao" as any,
      notes,
      channel: "ligacao",
      created_by: user?.id,
    });
    if (error) {
      console.error("Erro ao registrar ligação:", error);
      toast.error("Erro ao registrar ligação.");
    } else {
      toast.success("Ligação registrada!");
      queryClient.invalidateQueries({ queryKey: ["lead-interactions"] });
    }
  };

  // Portal target for mobile filters when toolbar is hidden
  const [mobileFilterPortal, setMobileFilterPortal] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (hideToolbarMobile) {
      // Poll briefly for portal target (may mount after us)
      const check = () => document.getElementById('kanban-mobile-filters');
      const el = check();
      if (el) { setMobileFilterPortal(el); return; }
      const t = setTimeout(() => setMobileFilterPortal(check()), 100);
      return () => clearTimeout(t);
    } else {
      setMobileFilterPortal(null);
    }
  }, [hideToolbarMobile]);

  // Filter buttons JSX (reused for portal and inline)
  const filterButtonsJsx = (
    <div className="flex items-center gap-2 overflow-x-auto">
      {(isAdmin || projects.length > 1) && projects.length > 0 && (
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-auto max-w-[140px] md:max-w-none h-9 bg-transparent border-none text-slate-400 hover:text-slate-200 text-sm gap-1 md:gap-2 px-2">
            <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
            <SelectValue placeholder="Empreend." className="truncate" />
          </SelectTrigger>
          <SelectContent className="bg-[#1e1e22] border-[#2a2a2e]">
            <SelectItem value="all">Todos</SelectItem>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1 md:gap-2 h-9 px-2 text-sm text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-[#2a2a2e]">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-[100px] md:max-w-none">
              {selectedOrigins.length === 0 ? "Todas origens" : `${selectedOrigins.length} origem${selectedOrigins.length > 1 ? "s" : ""}`}
            </span>
            {selectedOrigins.length > 0 && (
              <X className="w-3.5 h-3.5 ml-0.5 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setSelectedOrigins([]); }} />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2 bg-[#1e1e22] border-[#2a2a2e]" align="start">
          <ScrollArea className="h-[256px]">
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2a2a2e] cursor-pointer text-sm">
                <Checkbox checked={selectedOrigins.includes("sem_origem")} onCheckedChange={() => setSelectedOrigins(prev => prev.includes("sem_origem") ? prev.filter(o => o !== "sem_origem") : [...prev, "sem_origem"])} />
                Sem origem
              </label>
              {LEAD_ORIGINS.filter(o => o.key !== 'outro').map(origin => (
                <label key={origin.key} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2a2a2e] cursor-pointer text-sm">
                  <Checkbox checked={selectedOrigins.includes(origin.key)} onCheckedChange={() => setSelectedOrigins(prev => prev.includes(origin.key) ? prev.filter(o => o !== origin.key) : [...prev, origin.key])} />
                  {origin.label}
                </label>
              ))}
              {customOrigins.map(origin => (
                <label key={origin} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2a2a2e] cursor-pointer text-sm">
                  <Checkbox checked={selectedOrigins.includes(origin)} onCheckedChange={() => setSelectedOrigins(prev => prev.includes(origin) ? prev.filter(o => o !== origin) : [...prev, origin])} />
                  {origin}
                </label>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {isAdmin && brokers.length > 0 && (
        <Select value={selectedBroker} onValueChange={setSelectedBroker}>
          <SelectTrigger className="w-auto h-9 bg-transparent border-none text-slate-400 hover:text-slate-200 text-sm gap-2 px-2">
            <Users className="w-4 h-4 text-slate-500" />
            <SelectValue placeholder="Corretor" />
          </SelectTrigger>
          <SelectContent className="bg-[#1e1e22] border-[#2a2a2e]">
            <SelectItem value="all">Corretor</SelectItem>
            <SelectItem value="enove">Enove (Direto)</SelectItem>
            {brokers.map(broker => (
              <SelectItem key={broker.id} value={broker.id}>{broker.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {effectiveLabelBrokerId && availableLabels.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1 md:gap-2 h-9 px-2 text-sm text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-[#2a2a2e]">
              <Tags className="w-4 h-4 shrink-0" />
              <span className="truncate max-w-[100px] md:max-w-none">
                {selectedLabelIds.length === 0 ? "Etiquetas" : `${selectedLabelIds.length} etiqueta${selectedLabelIds.length > 1 ? "s" : ""}`}
              </span>
              {selectedLabelIds.length > 0 && (
                <X className="w-3.5 h-3.5 ml-0.5 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setSelectedLabelIds([]); }} />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 bg-[#1e1e22] border-[#2a2a2e]" align="start">
            <ScrollArea className="h-[256px]">
              <div className="flex flex-col gap-1">
                {availableLabels.map(label => (
                  <label key={label.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2a2a2e] cursor-pointer text-sm">
                    <Checkbox
                      checked={selectedLabelIds.includes(label.id)}
                      onCheckedChange={() => setSelectedLabelIds(prev =>
                        prev.includes(label.id) ? prev.filter(id => id !== label.id) : [...prev, label.id]
                      )}
                    />
                    <span className="flex items-center gap-1.5 truncate">
                      {label.color && (
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                      )}
                      {label.name}
                    </span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Portal mobile filters into header collapsible area */}
      {hideToolbarMobile && mobileFilterPortal && createPortal(filterButtonsJsx, mobileFilterPortal)}

      {/* Toolbar - Filters */}
      <div className={cn("flex flex-col gap-2 md:gap-0 mb-4 md:mb-6 px-1", hideToolbarMobile && "hidden md:flex")}>
        {/* Mobile search */}
        <div className="md:hidden relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou WhatsApp..."
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className={cn(
              "w-full pl-9 pr-3 py-2 rounded-lg text-sm",
              "bg-[#1e1e22] border border-[#2a2a2e]",
              "text-slate-200 placeholder:text-slate-500",
              "focus:outline-none focus:ring-2 focus:ring-primary/50",
              "transition-all duration-200"
            )}
          />
        </div>
        {/* Filters row + desktop search */}
        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto">
          {filterButtonsJsx}
          {/* Desktop search */}
          <div className="hidden md:block relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className={cn(
                "w-48 pl-9 pr-3 py-2 rounded-lg text-sm",
                "bg-[#1e1e22] border border-[#2a2a2e]",
                "text-slate-200 placeholder:text-slate-500",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                "transition-all duration-200"
              )}
            />
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden scrollbar-subtle pb-4 -mx-3 px-3 md:mx-0 md:px-0">
          <div className="flex gap-3 md:gap-4 min-w-max h-full">
            {STATUSES.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                filters={columnFilters}
                activeFlow={activeFlow}
                newLeadIds={newLeadIds}
                activeFlowLeadIds={activeFlowLeadIds}
                onCancelCadencia={handleCancelCadencia}
                onCardClick={handleCardClick}
                onUpdateOrigin={handleUpdateOrigin}
                onDelete={isAdmin ? handleDeleteLead : undefined}
                onIniciarAtendimento={handleIniciarAtendimento}
                onOpenAgendamento={handleOpenAgendamento}
                onOpenComparecimento={handleOpenComparecimento}
                onOpenVenda={handleOpenVenda}
                onOpenPerda={handleOpenPerda}
                onDispatchWhatsApp={handleDispatchWhatsApp}
                onAddLead={onAddLead}
                onOpenProposta={(lead) => {
                  setPropostaModal({ open: true, leadId: lead.id, leadProjectId: lead.project_id, leadBrokerId: lead.broker_id });
                }}
                onOpenReagendamento={(leadId) => setAgendamentoModal({ open: true, leadId, isReagendamento: true })}
                onLeadsLoaded={handleLeadsLoaded}
                onSendWhatsAppNow={handleSendWhatsAppNow}
                onScheduleWhatsApp={handleScheduleWhatsApp}
                onCallClick={handleCallClick}
                onTransfer={handleCardTransfer}
              />
            ))}
          </div>
      </div>

      {/* Lead Detail Sheet */}
      <LeadDetailSheet
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdate={handleLeadUpdate}
        onStatusChange={handleStatusUpdate}
        brokers={brokers}
        roletas={activeRoletas}
        onTransferred={() => {
          setSelectedLead(null);
          invalidateAll();
        }}
      />

      {/* Modals */}
      <AgendamentoModal
        open={agendamentoModal.open}
        onOpenChange={(v) => setAgendamentoModal(prev => ({ ...prev, open: v }))}
        title={agendamentoModal.isReagendamento ? "Reagendar" : "Registrar Agendamento"}
        leadId={agendamentoModal.leadId || undefined}
        leadName={agendamentoModal.leadId ? allLeadsRef.current.get(agendamentoModal.leadId)?.name : undefined}
        brokerId={agendamentoModal.leadId ? allLeadsRef.current.get(agendamentoModal.leadId)?.broker_id : brokerId}
        onConfirm={async (data, tipo) => {
          if (!agendamentoModal.leadId) return;
          if (agendamentoModal.isReagendamento) {
            const success = await reagendarLead(agendamentoModal.leadId, data, tipo);
            if (success) toast.success("Reagendamento registrado!");
          } else {
            const success = await registrarAgendamento(agendamentoModal.leadId, data, tipo);
            if (success) toast.success("Agendamento registrado!");
          }
        }}
      />

      <ComparecimentoModal
        open={comparecimentoModal.open}
        onOpenChange={(v) => setComparecimentoModal(prev => ({ ...prev, open: v }))}
        onCompareceu={async () => {
          if (!comparecimentoModal.leadId) return;
          const success = await registrarComparecimento(comparecimentoModal.leadId);
          if (success) {
            toast.success("Comparecimento registrado!");
          }
        }}
        onNaoCompareceu={() => {
          if (!comparecimentoModal.leadId) return;
          registrarNaoComparecimento(comparecimentoModal.leadId);
        }}
      />

      <PropostaModal
        open={propostaModal.open}
        onOpenChange={(v) => setPropostaModal(prev => ({ ...prev, open: v }))}
        leadProjectId={propostaModal.leadProjectId}
        leadBrokerId={propostaModal.leadBrokerId}
        projects={projects}
        onConfirm={async (data) => {
          if (!propostaModal.leadId) return false;
          const success = await criarProposta({
            ...data,
            lead_id: propostaModal.leadId,
          });
          if (success) {
            toast.success("Proposta registrada!");
          }
          return !!success;
        }}
      />

      <VendaModal
        open={vendaModal.open}
        onOpenChange={(v) => setVendaModal(prev => ({ ...prev, open: v }))}
        onConfirm={async (valorFinal, dataFechamento) => {
          if (!vendaModal.leadId) return;
          const success = await confirmarVenda(vendaModal.leadId, valorFinal, dataFechamento);
          if (success) toast.success("Venda confirmada! 🎉");
        }}
      />

      <PerdaModal
        open={perdaModal.open}
        onOpenChange={(v) => setPerdaModal(prev => ({ ...prev, open: v }))}
        onConfirm={async (reason) => {
          if (!perdaModal.leadId) return;
          const success = await inactivateLead(perdaModal.leadId, reason, perdaModal.currentStatus);
          if (success) toast.success("Lead inativado com sucesso.");
        }}
      />

      <NewCampaignSheet
        open={whatsappCampaignOpen}
        onOpenChange={setWhatsappCampaignOpen}
        preselectedStatus={whatsappPreselectedStatus}
      />

      <CallLogModal
        open={callModal.open}
        onOpenChange={(v) => setCallModal(prev => ({ ...prev, open: v }))}
        leadName={callModal.leadId ? allLeadsRef.current.get(callModal.leadId)?.name : undefined}
        leadId={callModal.leadId || undefined}
        brokerId={callModal.leadId ? allLeadsRef.current.get(callModal.leadId)?.broker_id : brokerId}
        onConfirm={handleCallConfirm}
      />

      {/* Card-level Transfer Dialog */}
      {cardTransferModal.open && cardTransferModal.leadId && (
        <TransferLeadDialog
          leadId={cardTransferModal.leadId}
          leadName={cardTransferModal.leadName}
          currentBrokerId={cardTransferModal.currentBrokerId}
          brokers={brokers}
          roletas={activeRoletas}
          isOpen={cardTransferModal.open}
          onClose={() => setCardTransferModal({ open: false, leadId: null, leadName: "", currentBrokerId: null })}
          onTransferred={() => {
            setCardTransferModal({ open: false, leadId: null, leadName: "", currentBrokerId: null });
            invalidateAll();
          }}
        />
      )}
    </div>
  );
}
