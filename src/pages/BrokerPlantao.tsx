import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ConversationList } from "@/components/inbox/ConversationList";
import { ConversationThread } from "@/components/inbox/ConversationThread";
import { LeadContextPanel } from "@/components/inbox/LeadContextPanel";
import { TransferLeadDialog } from "@/components/crm/TransferLeadDialog";
import { useConversations, useConversationMessages, Conversation, InboxTab } from "@/hooks/use-conversations";
import { useAutoCreateLead } from "@/hooks/use-auto-create-lead";
import { useLeadActions } from "@/hooks/use-lead-actions";
import { useCopilotSuggestion } from "@/hooks/use-copilot";
import { useUserRole } from "@/hooks/use-user-role";
import { toast } from "sonner";
import { useLogout } from "@/hooks/use-logout";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2 } from "lucide-react";
import { BrokerLayout } from "@/components/broker";
import { useBackHandler } from "@/hooks/use-back-handler";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LeadPage = lazy(() => import("@/pages/LeadPage"));

export default function BrokerPlantao() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [brokerId, setBrokerId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showLeadPanel, setShowLeadPanel] = useState(false);
  const [viewingLeadId, setViewingLeadId] = useState<string | null>(null);
  const [closingConv, setClosingConv] = useState(false);
  const [closingLead, setClosingLead] = useState(false);
  const [inboxTab, setInboxTab] = useState<InboxTab>("novos");
  const [isStartingAttendance, setIsStartingAttendance] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [allBrokers, setAllBrokers] = useState<{ id: string; name: string }[]>([]);
  const [activeRoletas, setActiveRoletas] = useState<{ id: string; nome: string }[]>([]);
  const [isCheckedInGlobal, setIsCheckedInGlobal] = useState<boolean | null>(null);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("");
  const [teamBrokers, setTeamBrokers] = useState<{ id: string; name: string }[]>([]);

  const { role, isLeader } = useUserRole();
  const leadActions = useLeadActions();

  useEffect(() => {
    const getBrokerId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/auth"); return; }
      const { data } = await supabase.from("brokers").select("id").eq("user_id", session.user.id).maybeSingle();
      if (data) {
        setBrokerId((data as any).id);
        setSelectedBrokerId((data as any).id);
      }
    };
    getBrokerId();
  }, [navigate]);

  useEffect(() => {
    const fetchBrokers = async () => {
      const { data } = await supabase.from("brokers").select("id, name").eq("is_active", true);
      if (data) setAllBrokers(data as any);
    };
    const fetchRoletas = async () => {
      const { data } = await supabase.from("roletas").select("id, nome").eq("ativa", true);
      if (data) setActiveRoletas(data as any);
    };
    fetchBrokers();
    fetchRoletas();
  }, []);

  // Fetch team brokers for leaders
  useEffect(() => {
    if (!brokerId || !isLeader) { setTeamBrokers([]); return; }
    const fetchTeam = async () => {
      const { data } = await supabase.from("brokers").select("id, name").eq("lider_id", brokerId).eq("is_active", true).order("name");
      if (data) setTeamBrokers(data as any);
    };
    fetchTeam();
  }, [brokerId, isLeader]);

  // Check if broker has active check-in in a whatsapp_global roulette
  useEffect(() => {
    if (!brokerId) return;
    const checkGlobalCheckin = async () => {
      // Considera check-in válido em:
      // - Roletas tipo whatsapp_global (legado)
      // - Roletas catch-all landing_page com escopo "todas_landing_pages_e_plantao" (Plantão unificado)
      const { data } = await (supabase
        .from("roletas_membros" as any)
        .select("id, roleta:roletas!inner(id, tipo_origem, escopo_empreendimentos, ativa)")
        .eq("corretor_id", brokerId)
        .eq("ativo", true)
        .eq("status_checkin", true)
        .eq("roleta.ativa", true) as any);
      const eligible = (data as any[] || []).filter((m) => {
        const r = m.roleta;
        if (!r) return false;
        return r.tipo_origem === "whatsapp_global"
          || r.escopo_empreendimentos === "todas_landing_pages_e_plantao";
      });
      setIsCheckedInGlobal(eligible.length > 0);
    };
    checkGlobalCheckin();
    const interval = setInterval(checkGlobalCheckin, 15000);
    return () => clearInterval(interval);
  }, [brokerId]);

  const isArchived = statusFilter === "archived";
  const canSelectBroker = role === "admin" || isLeader;
  const resolvedBrokerId = canSelectBroker
    ? (selectedBrokerId === "all" ? undefined : selectedBrokerId || brokerId)
    : brokerId;

  // Main conversations (meus / outros) — global only
  const {
    conversations, isLoading, totalUnread, markAsRead, archiveConversation,
    unarchiveConversation, updateAiMode, updateConversationState, fetchConversations,
  } = useConversations({
    brokerId: resolvedBrokerId || undefined,
    search,
    statusFilter: isArchived ? "all" : statusFilter,
    isArchived,
    inboxTab: inboxTab === "novos" ? "novos" : inboxTab,
    userRole: role as "admin" | "leader" | null,
    sourceInstance: "global",
    enabled: !!brokerId,
  });

  // Novos conversations (separate query) — only fetch if checked in to a whatsapp_global roulette
  // For leaders/admins: when viewing "all" OR their own card (default), don't filter by broker —
  // show all team queue + disputa. Only filter when a specific team member is picked.
  const novosResolvedBrokerId = canSelectBroker
    ? (selectedBrokerId === "all" || selectedBrokerId === brokerId ? undefined : selectedBrokerId || brokerId)
    : brokerId;

  const {
    conversations: novosConversations,
    isLoading: novosLoading,
    fetchConversations: fetchNovos,
  } = useConversations({
    brokerId: novosResolvedBrokerId || undefined,
    search: inboxTab === "novos" ? search : "",
    statusFilter: "all",
    isArchived: false,
    inboxTab: "novos",
    userRole: canSelectBroker ? (role as "admin" | "leader" | null) : null,
    sourceInstance: "global",
    enabled: !!brokerId && isCheckedInGlobal === true,
  });

  const activeConversations = inboxTab === "novos" ? novosConversations : conversations;
  const activeLoading = inboxTab === "novos" ? novosLoading : isLoading;

  const handleAutoLeadCreated = useCallback((conv: Conversation, leadId: string, leadName: string) => {
    setSelectedConversation((prev) => prev?.id === conv.id ? {
      ...prev, lead_id: leadId,
      lead: { id: leadId, name: leadName, status: "info_sent", project_id: null, notes: null, lead_origin: "whatsapp_plantao" },
    } : prev);
    setInboxTab("meus");
    fetchConversations();
    fetchNovos();
  }, [fetchConversations, fetchNovos]);

  const autoCreateLead = useAutoCreateLead({
    brokerId,
    sourceType: "global",
    onLeadCreated: handleAutoLeadCreated,
  });

  const { messages, scheduledMessages, isLoading: messagesLoading, sendMessage, resendMessage, scheduleMessage, cancelScheduledMessage } =
    useConversationMessages(selectedConversation, (update) => {
      if (!selectedConversation) return;
      updateConversationState(selectedConversation.id, (current) => ({
        ...current, status: "attending", last_message_at: update.timestamp,
        last_message_preview: update.preview, last_message_direction: "outbound",
        last_message_type: update.messageType, updated_at: update.timestamp,
      }));
      setSelectedConversation((prev) => prev ? {
        ...prev, status: "attending", last_message_at: update.timestamp,
        last_message_preview: update.preview, last_message_direction: "outbound",
        last_message_type: update.messageType, updated_at: update.timestamp,
      } : prev);
    }, autoCreateLead);

  const { suggestion, isGenerating, generateSuggestion, setSuggestion } = useCopilotSuggestion();

  const resolvedConvIdRef = useRef<string | null>(null);

  useEffect(() => {
    const convId = searchParams.get("conversationId");
    if (!convId) return;
    const inNovos = novosConversations.find((c) => c.id === convId);
    const inOthers = conversations.find((c) => c.id === convId);
    const target = inNovos || inOthers;
    if (!target) {
      if (novosLoading || isLoading) return;
      if (resolvedConvIdRef.current === convId) return;
      resolvedConvIdRef.current = convId;
      supabase
        .from("conversations")
        .select("attendance_started")
        .eq("id", convId)
        .maybeSingle()
        .then(({ data }) => {
          if (!data) return;
          const desired: InboxTab = (data as any).attendance_started === false ? "novos" : "meus";
          if (desired !== inboxTab) setInboxTab(desired);
        });
      return;
    }
    const desiredTab: InboxTab = inNovos ? "novos" : "meus";
    if (desiredTab !== inboxTab) {
      setInboxTab(desiredTab);
      return;
    }
    setSelectedConversation(target);
    setSearchParams({}, { replace: true });
  }, [novosConversations, conversations, novosLoading, isLoading, inboxTab, searchParams, setSearchParams]);

  useEffect(() => {
    if (!selectedConversation) return;
    const refreshed = activeConversations.find((c) => c.id === selectedConversation.id);
    if (!refreshed) return;
    setSelectedConversation((current) => {
      if (!current) return current;
      return JSON.stringify(current) === JSON.stringify(refreshed) ? current : refreshed;
    });
  }, [activeConversations, selectedConversation?.id]);

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setSelectedConversation(conv);
    if (isMobile) setShowLeadPanel(false);
  }, [isMobile]);

  const handleBack = useCallback(() => {
    if (isMobile) { setClosingConv(true); return; }
    setSelectedConversation(null);
    setShowLeadPanel(false);
    setViewingLeadId(null);
  }, [isMobile]);

  const handleOpenLead = useCallback((leadId: string) => setViewingLeadId(leadId), []);
  const handleBackFromLead = useCallback(() => {
    if (isMobile) { setClosingLead(true); return; }
    setViewingLeadId(null);
  }, [isMobile]);

  useBackHandler(() => { handleBackFromLead(); }, isMobile && !!viewingLeadId);
  useBackHandler(() => { handleBack(); }, isMobile && !!selectedConversation && !viewingLeadId);

  const handleTabChange = useCallback((tab: InboxTab) => {
    setInboxTab(tab);
    setSelectedConversation(null);
    setShowLeadPanel(false);
  }, []);

  // "Iniciar Atendimento" — claim a global conversation (lead already exists, created by webhook)
  const handleStartAttendance = useCallback(async () => {
    if (!selectedConversation || !brokerId) return;
    setIsStartingAttendance(true);
    try {
      // Step 1: Claim the conversation immediately so UI unlocks messaging
      const { error: convError } = await supabase
        .from("conversations")
        .update({ broker_id: brokerId, attendance_started: true } as any)
        .eq("id", selectedConversation.id);

      if (convError) {
        console.error("Erro ao atualizar conversa:", convError);
        toast.error("Erro ao iniciar atendimento");
        return;
      }

      // Switch tab and update local state immediately — broker can now type
      const displayName = selectedConversation.display_name || selectedConversation.phone;
      setInboxTab("meus");
      setSelectedConversation({
        ...selectedConversation,
        broker_id: brokerId,
        attendance_started: true,
      } as any);
      fetchConversations();
      fetchNovos();

      // Step 2: Update existing lead (created by webhook) — move to "info_sent"
      const existingLeadId = (selectedConversation as any).lead_id;
      if (existingLeadId) {
        await supabase
          .from("leads")
          .update({
            broker_id: brokerId,
            status: "info_sent" as any,
            atendimento_iniciado_em: new Date().toISOString(),
            status_distribuicao: "atendimento_iniciado" as any,
          } as any)
          .eq("id", existingLeadId);

        await supabase.from("lead_interactions").insert({
          lead_id: existingLeadId,
          interaction_type: "atendimento_iniciado" as any,
          notes: "Atendimento iniciado via Plantão (WhatsApp Global)",
          broker_id: brokerId,
          channel: "whatsapp",
          new_status: "info_sent",
        } as any);

        // Trilha explícita do claim manual (auditoria de quem assumiu)
        await supabase.from("lead_interactions").insert({
          lead_id: existingLeadId,
          interaction_type: "roleta_transferencia" as any,
          notes: "Lead assumido manualmente via Inbox (Plantão)",
          broker_id: brokerId,
          channel: "whatsapp",
        } as any);
      }

      // Get broker name for system message
      const { data: brokerData } = await supabase.from("brokers").select("name").eq("id", brokerId).maybeSingle();
      const brokerName = (brokerData as any)?.name || "Corretor";

      // Insert system message into conversation thread
      await supabase.from("conversation_messages").insert({
        conversation_id: selectedConversation.id,
        direction: "outbound",
        sent_by: "system",
        content: `✅ ${brokerName} iniciou o atendimento`,
        message_type: "text",
        metadata: { system_event: "attendance_started", broker_name: brokerName },
      } as any);

      toast.success("Atendimento iniciado!");
      fetchConversations();
    } catch (error) {
      console.error("Erro ao iniciar atendimento:", error);
      toast.error("Erro ao iniciar atendimento");
    } finally {
      setIsStartingAttendance(false);
    }
  }, [selectedConversation, brokerId, fetchConversations, fetchNovos]);

  const [isPullingToPersonal, setIsPullingToPersonal] = useState(false);

  const handlePullToPersonal = useCallback(async () => {
    if (!selectedConversation) return;
    setIsPullingToPersonal(true);
    try {
      const { data, error } = await supabase.rpc(
        "pull_global_conversation_to_personal" as any,
        { _conversation_id: selectedConversation.id } as any
      );
      if (error) throw error;
      const targetId = (data as any)?.conversation_id ?? selectedConversation.id;
      const merged = (data as any)?.merged;
      toast.success(merged
        ? "Conversa unificada com seu WhatsApp pessoal!"
        : "Conversa migrada para seu WhatsApp pessoal!");
      navigate(`/corretor/inbox?conversationId=${targetId}`);
    } catch (err) {
      console.error("Erro ao migrar conversa:", err);
      toast.error("Erro ao migrar conversa");
    } finally {
      setIsPullingToPersonal(false);
    }
  }, [selectedConversation, navigate]);

  const handleTransferFromInbox = useCallback(() => {
    setShowTransferDialog(true);
  }, []);

  const handleTransferred = useCallback(() => {
    setShowTransferDialog(false);
    setSelectedConversation(null);
    fetchConversations();
    fetchNovos();
  }, [fetchConversations, fetchNovos]);

  const handleRequestSuggestion = useCallback(async () => {
    if (!selectedConversation) return;
    const lead = selectedConversation.lead as any;
    const chatHistory = messages.slice(-10).map((m) => ({
      role: m.direction === "inbound" ? "user" : "assistant", content: m.content,
    }));
    await generateSuggestion({
      action: "suggest_response", conversation_id: selectedConversation.id,
      lead_context: { name: lead?.name, status: lead?.status, origin: lead?.lead_origin, notes: lead?.notes },
      messages: chatHistory,
    });
  }, [selectedConversation, messages, generateSuggestion]);

  const handleAdvanceStatus = useCallback(async (newStatus: string) => {
    const lead = selectedConversation?.lead as any;
    if (!lead) return;
    await leadActions.advanceStatus(lead.id, newStatus);
  }, [selectedConversation, leadActions]);

  const handleLogout = useLogout({ silent: true });

  if (!brokerId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isNewLeadConversation = inboxTab === "novos" && !!selectedConversation;
  const isReadOnlyConversation = false;
  const showList = !selectedConversation || !isMobile;
  const showThread = !!selectedConversation;
  const showContext = showLeadPanel && !isMobile;

  return (
    <BrokerLayout
      viewMode="kanban"
      onViewChange={(mode) => navigate(mode === "list" ? "/corretor/leads" : "/corretor/crm")}
      onLogout={handleLogout}
      hideMobileNav={isMobile && !!selectedConversation && !viewingLeadId}
    >
      <div className="flex h-full overflow-hidden -m-3 lg:-m-6">
        {showList && (
          <div className={`${isMobile ? "w-full" : "w-80 border-r border-border"} flex-shrink-0 flex flex-col`}>
            {canSelectBroker && (inboxTab === "novos" || inboxTab === "meus") && (
              <div className="px-3 pt-3 pb-1">
                <Select value={selectedBrokerId} onValueChange={setSelectedBrokerId}>
                  <SelectTrigger className="h-8 bg-background border-border text-sm text-muted-foreground">
                    <SelectValue placeholder="Selecionar corretor" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all" className="text-muted-foreground text-sm">Todas as conversas</SelectItem>
                    {brokerId && (
                      <SelectItem value={brokerId} className="text-foreground text-sm">
                        {allBrokers.find(b => b.id === brokerId)?.name || "Minhas conversas"}
                      </SelectItem>
                    )}
                    {teamBrokers.filter(b => b.id !== brokerId).map(b => (
                      <SelectItem key={b.id} value={b.id} className="text-foreground text-sm">{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex-1 min-h-0">
              <ConversationList
                conversations={activeConversations}
                selectedId={selectedConversation?.id || null}
                onSelect={handleSelectConversation}
                search={search}
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                isLoading={activeLoading}
                totalUnread={totalUnread}
                onMarkAsRead={(id) => markAsRead(id)}
                onArchive={(id) => archiveConversation(id)}
                inboxTab={inboxTab}
                onTabChange={handleTabChange}
                showOthersTab={false}
                novosCount={novosConversations.length}
                emptyMessage={
                  inboxTab === "novos" && isCheckedInGlobal === false
                    ? "Você precisa fazer check-in na roleta do Plantão para ver novos contatos."
                    : undefined
                }
                brokerId={resolvedBrokerId || brokerId}
              />
            </div>
          </div>
        )}

        {showThread && (
          <div
            className={`flex-1 min-w-0 ${isMobile ? (closingConv ? "ios-push-out" : "ios-push-in") : ""}`}
            onAnimationEnd={(e) => {
              if (e.animationName === "ios-push-out" && closingConv) {
                setClosingConv(false);
                setSelectedConversation(null);
                setShowLeadPanel(false);
                setViewingLeadId(null);
              }
            }}
          >
            {viewingLeadId ? (
              <div
                className={isMobile ? (closingLead ? "ios-push-out" : "ios-push-in") : ""}
                onAnimationEnd={(e) => {
                  if (e.animationName === "ios-push-out" && closingLead) {
                    setClosingLead(false);
                    setViewingLeadId(null);
                  }
                }}
              >
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                  <LeadPage embeddedLeadId={viewingLeadId} onBack={handleBackFromLead} />
                </Suspense>
              </div>
            ) : (
              <ConversationThread
                conversation={selectedConversation!}
                messages={messages}
                scheduledMessages={scheduledMessages}
                isLoading={messagesLoading}
                onSendMessage={sendMessage}
                onResendMessage={resendMessage}
                onScheduleMessage={scheduleMessage}
                onCancelScheduledMessage={cancelScheduledMessage}
                onBack={handleBack}
                onMarkAsRead={() => markAsRead(selectedConversation!.id)}
                onArchive={() => { archiveConversation(selectedConversation!.id); handleBack(); }}
                onUnarchive={() => { unarchiveConversation(selectedConversation!.id); handleBack(); }}
                onToggleAiMode={(mode) => {
                  updateAiMode(selectedConversation!.id, mode);
                  setSelectedConversation((prev) => (prev ? { ...prev, ai_mode: mode } : prev));
                }}
                copilotSuggestion={suggestion}
                isGeneratingSuggestion={isGenerating}
                onRequestSuggestion={handleRequestSuggestion}
                onInsertSuggestion={() => setSuggestion("")}
                onDismissSuggestion={() => setSuggestion("")}
                onOpenLeadPanel={() => setShowLeadPanel(!showLeadPanel)}
                onOpenLead={handleOpenLead}
                isNewLead={isNewLeadConversation}
                onStartAttendance={handleStartAttendance}
                isStartingAttendance={isStartingAttendance}
                isReadOnly={isReadOnlyConversation}
                onTransfer={handleTransferFromInbox}
                onPullToPersonal={handlePullToPersonal}
                isPullingToPersonal={isPullingToPersonal}
                onInactivateLead={async (reason) => {
                  if (!selectedConversation?.lead_id) return;
                  await leadActions.inactivateLead(selectedConversation.lead_id, reason);
                  fetchConversations();
                  handleBack();
                }}
              />
            )}
          </div>
        )}

        {showContext && selectedConversation && (
          <div className="w-72 flex-shrink-0">
            <LeadContextPanel
              conversation={selectedConversation}
              onClose={() => setShowLeadPanel(false)}
              onAdvanceStatus={handleAdvanceStatus}
              onOpenLead={handleOpenLead}
            />
          </div>
        )}
      </div>

      {selectedConversation && brokerId && (
        <TransferLeadDialog
          leadId={selectedConversation.lead_id || undefined}
          conversationId={selectedConversation.id}
          leadName={(selectedConversation.lead as any)?.name || selectedConversation.display_name || selectedConversation.phone}
          currentBrokerId={brokerId}
          brokers={allBrokers}
          roletas={activeRoletas}
          isOpen={showTransferDialog}
          onClose={() => setShowTransferDialog(false)}
          onTransferred={handleTransferred}
        />
      )}
    </BrokerLayout>
  );
}
