import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ConversationList } from "@/components/inbox/ConversationList";
import { ConversationThread } from "@/components/inbox/ConversationThread";
import { LeadContextPanel } from "@/components/inbox/LeadContextPanel";
import { CreateLeadFromChatModal } from "@/components/inbox/CreateLeadFromChatModal";
import { TransferLeadDialog } from "@/components/crm/TransferLeadDialog";
import { useConversations, useConversationMessages, Conversation, BrokerInboxTab } from "@/hooks/use-conversations";
import { useAutoCreateLead } from "@/hooks/use-auto-create-lead";
import { useInactivateLeadFromConversation } from "@/hooks/use-inactivate-lead-from-conversation";
import { useCopilotSuggestion } from "@/hooks/use-copilot";
import { useLogout } from "@/hooks/use-logout";
import { useBrokerFeatures } from "@/hooks/use-broker-features";
import { useUserRole } from "@/hooks/use-user-role";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Lock, Loader2 } from "lucide-react";
import { BrokerLayout } from "@/components/broker";

const LeadPage = lazy(() => import("@/pages/LeadPage"));

export default function BrokerInbox() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [brokerId, setBrokerId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<BrokerInboxTab>("novos");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showLeadPanel, setShowLeadPanel] = useState(false);
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [viewingLeadId, setViewingLeadId] = useState<string | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [allBrokers, setAllBrokers] = useState<{ id: string; name: string }[]>([]);
  const [activeRoletas, setActiveRoletas] = useState<{ id: string; nome: string }[]>([]);
  const [isStartingAttendance, setIsStartingAttendance] = useState(false);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string | null>(null);

  const { isLeader } = useUserRole();
  const { inboxEnabled, isLoading: featuresLoading } = useBrokerFeatures(brokerId);

  useEffect(() => {
    const getBrokerId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/auth"); return; }
      const { data } = await supabase.from("brokers").select("id").eq("user_id", session.user.id).maybeSingle();
      if (data) setBrokerId((data as any).id);
    };
    getBrokerId();
  }, [navigate]);

  useEffect(() => {
    const fetchBrokers = async () => {
      const { data } = await supabase.from("brokers").select("id, name").eq("is_active", true).order("name");
      if (data) setAllBrokers(data as any);
    };
    const fetchRoletas = async () => {
      const { data } = await supabase.from("roletas").select("id, nome").eq("ativa", true);
      if (data) setActiveRoletas(data as any);
    };
    fetchBrokers();
    fetchRoletas();
  }, []);

  // For leaders: fetch team members
  useEffect(() => {
    if (!isLeader || !brokerId) return;
    const fetchTeam = async () => {
      const { data } = await supabase.from("brokers").select("id, name").eq("lider_id", brokerId).eq("is_active", true).order("name");
      const members = (data || []) as { id: string; name: string }[];
      // Include self at the top
      const self = allBrokers.find(b => b.id === brokerId);
      if (self) setTeamMembers([self, ...members]);
      else setTeamMembers(members);
    };
    fetchTeam();
  }, [isLeader, brokerId, allBrokers]);

  // Default selectedBrokerId to own brokerId
  useEffect(() => {
    if (brokerId && !selectedBrokerId) setSelectedBrokerId(brokerId);
  }, [brokerId, selectedBrokerId]);

  const isArchived = activeTab === "arquivados";
  const effectiveBrokerId = isLeader ? (selectedBrokerId || brokerId) : brokerId;

  const {
    conversations: allPersonalConversations, isLoading, totalUnread, markAsRead, archiveConversation,
    unarchiveConversation, updateAiMode, updateConversationState, fetchConversations,
  } = useConversations({
    brokerId: effectiveBrokerId || undefined,
    search,
    statusFilter: "all",
    isArchived,
    sourceInstance: "personal",
    enabled: !!effectiveBrokerId,
  });

  const isViewingOtherBroker = isLeader && !!brokerId && !!selectedBrokerId && selectedBrokerId !== brokerId;
  // "Novos" (conversas pessoais não vinculadas a lead) é privado: apenas o próprio corretor pode ver.
  const novosConversations = isViewingOtherBroker
    ? []
    : allPersonalConversations.filter(c => !c.lead_id);
  const atendimentoConversations = allPersonalConversations.filter(c => !!c.lead_id);

  const activeConversations = activeTab === "novos"
    ? novosConversations
    : activeTab === "atendimento"
    ? atendimentoConversations
    : allPersonalConversations;

  const handleAutoLeadCreated = useCallback((conv: Conversation, leadId: string, leadName: string) => {
    setSelectedConversation((prev) => prev?.id === conv.id ? {
      ...prev, lead_id: leadId,
      lead: { id: leadId, name: leadName, status: "info_sent", project_id: null, notes: null, lead_origin: conv.source_instance === "global" ? "whatsapp_plantao" : "whatsapp_direto" },
    } : prev);
    setActiveTab("atendimento");
    fetchConversations();
  }, [fetchConversations]);

  const autoCreateLead = useAutoCreateLead({
    brokerId,
    sourceType: "personal",
    onLeadCreated: handleAutoLeadCreated,
  });

  const { messages, scheduledMessages, isLoading: messagesLoading, sendMessage, scheduleMessage, cancelScheduledMessage } =
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
  const inactivateLeadFromConv = useInactivateLeadFromConversation();

  useEffect(() => {
    const convId = searchParams.get("conversationId");
    if (convId && activeConversations.length > 0 && !selectedConversation) {
      const target = activeConversations.find((c) => c.id === convId);
      if (target) { setSelectedConversation(target); setSearchParams({}, { replace: true }); }
    }
  }, [activeConversations, searchParams, selectedConversation, setSearchParams]);

  useEffect(() => {
    if (!selectedConversation) return;
    const refreshed = allPersonalConversations.find((c) => c.id === selectedConversation.id);
    if (!refreshed) return;
    setSelectedConversation((current) => {
      if (!current) return current;
      return JSON.stringify(current) === JSON.stringify(refreshed) ? current : refreshed;
    });
  }, [allPersonalConversations, selectedConversation?.id]);

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setSelectedConversation(conv);
    if (isMobile) setShowLeadPanel(false);
  }, [isMobile]);

  const handleBack = useCallback(() => {
    setSelectedConversation(null);
    setShowLeadPanel(false);
    setViewingLeadId(null);
  }, []);

  const handleOpenLead = useCallback((leadId: string) => setViewingLeadId(leadId), []);
  const handleBackFromLead = useCallback(() => setViewingLeadId(null), []);

  const handleTabChange = useCallback((tab: BrokerInboxTab) => {
    setActiveTab(tab);
    setSelectedConversation(null);
    setShowLeadPanel(false);
  }, []);

  const handleTransferFromInbox = useCallback(() => {
    setShowTransferDialog(true);
  }, []);

  const handleTransferred = useCallback(() => {
    setShowTransferDialog(false);
    setSelectedConversation(null);
    fetchConversations();
  }, [fetchConversations]);

  const handleStartAttendance = useCallback(async () => {
    if (!selectedConversation || !brokerId) return;
    setIsStartingAttendance(true);
    try {
      const displayName = selectedConversation.display_name || selectedConversation.phone;

      const { data: newLead, error: leadError } = await supabase
        .from("leads").insert({
          name: displayName, whatsapp: selectedConversation.phone.replace(/^\+/, ''),
          broker_id: brokerId, status: "info_sent" as any,
          source: "whatsapp", lead_origin: "whatsapp_direto",
          atendimento_iniciado_em: new Date().toISOString(),
          status_distribuicao: "atendimento_iniciado" as any,
        } as any).select("id").single();

      if (leadError || !newLead) {
        toast.error("Erro ao criar card no Kanban");
        return;
      }

      const leadId = (newLead as any).id;
      const { data: unifiedId } = await supabase.rpc("unify_lead", { _new_lead_id: leadId });
      const finalLeadId = unifiedId || leadId;

      await supabase.from("conversations").update({ lead_id: finalLeadId } as any).eq("id", selectedConversation.id);
      await supabase.from("lead_interactions").insert({
        lead_id: finalLeadId, interaction_type: "atendimento_iniciado" as any,
        notes: "Atendimento iniciado via Inbox pessoal",
        broker_id: brokerId, channel: "whatsapp", new_status: "info_sent",
      } as any);

      setActiveTab("atendimento");
      setSelectedConversation({
        ...selectedConversation, lead_id: finalLeadId,
        lead: { id: finalLeadId, name: displayName, status: "info_sent", project_id: null, notes: null, lead_origin: "whatsapp_direto" },
      });

      toast.success("Atendimento iniciado! Card criado no Kanban.");
      fetchConversations();
    } catch (error) {
      console.error("Erro ao iniciar atendimento:", error);
      toast.error("Erro ao iniciar atendimento");
    } finally {
      setIsStartingAttendance(false);
    }
  }, [selectedConversation, brokerId, fetchConversations]);

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

  const handleOpenCreateLeadModal = useCallback(() => setShowCreateLeadModal(true), []);

  const handleLeadCreated = useCallback(async (leadName: string, _: string, projectId: string | null) => {
    if (!selectedConversation || !brokerId) return;
    const { data: newLead, error: leadError } = await supabase
      .from("leads").insert({
        name: leadName, whatsapp: selectedConversation.phone.replace(/^\+/, ''),
        broker_id: brokerId, project_id: projectId, status: "new" as any,
        source: "whatsapp", lead_origin: "whatsapp_direto",
      } as any).select("id").single();
    if (leadError || !newLead) { toast.error("Erro ao criar card no Kanban"); return; }
    await supabase.from("conversations").update({ lead_id: (newLead as any).id } as any).eq("id", selectedConversation.id);
    await supabase.from("lead_interactions").insert({
      lead_id: (newLead as any).id, interaction_type: "note" as any,
      notes: "Lead criado a partir da Inbox (WhatsApp direto)", broker_id: brokerId, channel: "system",
    } as any);
    toast.success("Card criado no Kanban!");
    setSelectedConversation({
      ...selectedConversation, lead_id: (newLead as any).id,
      lead: { id: (newLead as any).id, name: leadName, status: "new", project_id: projectId, notes: null, lead_origin: "whatsapp_direto" },
    });
  }, [selectedConversation, brokerId]);

  const handleAdvanceStatus = useCallback(async (newStatus: string) => {
    const lead = selectedConversation?.lead as any;
    if (!lead) return;
    const { error } = await supabase.from("leads").update({ status: newStatus } as any).eq("id", lead.id);
    if (error) toast.error("Erro ao atualizar status");
    else toast.success("Status atualizado!");
  }, [selectedConversation]);

  const [isReturningToGlobal, setIsReturningToGlobal] = useState(false);

  const handleReturnToGlobal = useCallback(async () => {
    if (!selectedConversation) return;
    setIsReturningToGlobal(true);
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ source_instance: "global" } as any)
        .eq("id", selectedConversation.id);
      if (error) throw error;
      toast.success("Conversa devolvida ao WhatsApp do Plantão!");
      setSelectedConversation(null);
      fetchConversations();
    } catch (err) {
      console.error("Erro ao devolver conversa:", err);
      toast.error("Erro ao devolver conversa");
    } finally {
      setIsReturningToGlobal(false);
    }
  }, [selectedConversation, fetchConversations]);

  const handleLogout = useLogout({ silent: true });

  if (featuresLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!inboxEnabled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Inbox não liberado</h2>
          <p className="text-sm text-muted-foreground">
            Esta funcionalidade não está habilitada para sua conta. Solicite ao administrador para liberar o acesso.
          </p>
          <button onClick={() => navigate("/corretor/crm")}
            className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all">
            Voltar ao CRM
          </button>
        </div>
      </div>
    );
  }

  const isNewConversation = activeTab === "novos" && !!selectedConversation && !selectedConversation.lead_id;
  const showList = !selectedConversation || !isMobile;
  const showThread = !!selectedConversation;
  const showContext = showLeadPanel && !isMobile;

  return (
    <BrokerLayout
      viewMode="kanban"
      onViewChange={(mode) => navigate(mode === "list" ? "/corretor/leads" : "/corretor/crm")}
      onLogout={handleLogout}
      inboxEnabled={inboxEnabled}
    >
      <div className="flex h-[calc(100vh-64px)] lg:h-[calc(100vh-72px)] overflow-hidden -m-3 lg:-m-6">
        {showList && (
          <div className={`${isMobile ? "w-full" : "w-80 border-r border-border"} flex-shrink-0`}>
            <ConversationList
              conversations={activeConversations}
              selectedId={selectedConversation?.id || null}
              onSelect={handleSelectConversation}
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              isLoading={isLoading}
              totalUnread={totalUnread}
              onMarkAsRead={(id) => markAsRead(id)}
              onArchive={(id) => archiveConversation(id)}
              brokerInboxTab={activeTab}
              onBrokerTabChange={handleTabChange}
              brokerNovosCount={novosConversations.length}
              brokerAtendimentoCount={atendimentoConversations.length}
              brokerId={effectiveBrokerId}
              brokerFilter={isLeader && activeTab === "atendimento" ? (selectedBrokerId || "") : undefined}
              onBrokerFilterChange={isLeader && activeTab === "atendimento" ? (id) => {
                const newId = id || brokerId;
                setSelectedBrokerId(newId);
                setSelectedConversation(null);
              } : undefined}
              brokerOptions={isLeader && activeTab === "atendimento" ? teamMembers : undefined}
              myBrokerId={brokerId}
            />
          </div>
        )}

        {showThread && (
          <div className={`flex-1 min-w-0 ${isMobile ? "animate-in slide-in-from-right-5 duration-200" : ""}`}>
            {viewingLeadId ? (
              <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                <LeadPage embeddedLeadId={viewingLeadId} onBack={handleBackFromLead} />
              </Suspense>
            ) : (
              <ConversationThread
                conversation={selectedConversation!}
                messages={messages}
                scheduledMessages={scheduledMessages}
                isLoading={messagesLoading}
                onSendMessage={sendMessage}
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
                onCreateLead={!selectedConversation!.lead_id ? handleOpenCreateLeadModal : undefined}
                onOpenLead={handleOpenLead}
                onTransfer={handleTransferFromInbox}
                onReturnToGlobal={handleReturnToGlobal}
                isReturningToGlobal={isReturningToGlobal}
                isNewLead={isNewConversation}
                onStartAttendance={handleStartAttendance}
                isStartingAttendance={isStartingAttendance}
                onInactivateLead={async (reason) => {
                  if (!selectedConversation?.lead_id) return;
                  await inactivateLeadFromConv(selectedConversation.lead_id, reason);
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
              onCreateLead={!selectedConversation.lead_id ? handleOpenCreateLeadModal : undefined}
              onOpenLead={handleOpenLead}
            />
          </div>
        )}
      </div>

      {selectedConversation && brokerId && (
        <CreateLeadFromChatModal
          open={showCreateLeadModal}
          onOpenChange={setShowCreateLeadModal}
          phone={selectedConversation.phone}
          suggestedName={(selectedConversation.lead as any)?.name || selectedConversation.phone}
          brokerId={brokerId}
          onCreated={handleLeadCreated}
        />
      )}

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
