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
import { useCopilotSuggestion } from "@/hooks/use-copilot";
import { toast } from "sonner";
import { useLogout } from "@/hooks/use-logout";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { MobileBottomNav } from "@/components/admin/MobileBottomNav";

const LeadPage = lazy(() => import("@/pages/LeadPage"));

export default function AdminInbox() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showLeadPanel, setShowLeadPanel] = useState(false);
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [viewingLeadId, setViewingLeadId] = useState<string | null>(null);
  const [myBrokerId, setMyBrokerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BrokerInboxTab>("novos");
  const [isStartingAttendance, setIsStartingAttendance] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [allBrokers, setAllBrokers] = useState<{ id: string; name: string }[]>([]);
  const [activeRoletas, setActiveRoletas] = useState<{ id: string; nome: string }[]>([]);
  const [isReturningToGlobal, setIsReturningToGlobal] = useState(false);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const [myBrokerRes, brokersRes, roletasRes] = await Promise.all([
        supabase.from("brokers").select("id").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("brokers").select("id, name").eq("is_active", true).order("name"),
        supabase.from("roletas").select("id, nome").eq("ativa", true),
      ]);

      const brokerIdFound = (myBrokerRes?.data as any)?.id || null;
      setMyBrokerId(brokerIdFound);
      setSelectedBrokerId(brokerIdFound);
      if (brokersRes.data) setAllBrokers(brokersRes.data as any);
      if (roletasRes.data) setActiveRoletas(roletasRes.data as any);
    };
    init();
  }, []);

  const isArchived = activeTab === "arquivados";

  const {
    conversations: allPersonalConversations, isLoading, totalUnread, markAsRead, archiveConversation,
    unarchiveConversation, updateAiMode, updateConversationState, fetchConversations,
  } = useConversations({
    brokerId: selectedBrokerId || undefined,
    search,
    statusFilter: "all",
    isArchived,
    sourceInstance: "personal",
    enabled: !!selectedBrokerId,
  });

  const isViewingOtherBroker = !!myBrokerId && !!selectedBrokerId && selectedBrokerId !== myBrokerId;
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
      lead: { id: leadId, name: leadName, status: "info_sent", project_id: null, notes: null, lead_origin: "whatsapp_direto" },
    } : prev);
    setActiveTab("atendimento");
    fetchConversations();
  }, [fetchConversations]);

  const autoCreateLead = useAutoCreateLead({
    brokerId: selectedBrokerId,
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

  useEffect(() => {
    const convId = searchParams.get("conversationId");
    if (convId && activeConversations.length > 0 && !selectedConversation) {
      const target = activeConversations.find(c => c.id === convId);
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
    // Reset broker filter to self when leaving "atendimento" tab
    if (tab !== "atendimento") {
      setSelectedBrokerId(myBrokerId);
    }
  }, [myBrokerId]);

  const handleBrokerFilterChange = useCallback((brokerId: string) => {
    const newBrokerId = brokerId || myBrokerId;
    setSelectedBrokerId(newBrokerId);
    setSelectedConversation(null);
    // "Novos" é privado por corretor — ao olhar outro corretor, mover para "Atendimento".
    if (newBrokerId !== myBrokerId && activeTab === "novos") {
      setActiveTab("atendimento");
    }
  }, [myBrokerId, activeTab]);

  const handleStartAttendance = useCallback(async () => {
    if (!selectedConversation || !myBrokerId) return;
    setIsStartingAttendance(true);
    try {
      const displayName = selectedConversation.display_name || selectedConversation.phone;

      const { data: newLead, error: leadError } = await supabase
        .from("leads").insert({
          name: displayName, whatsapp: selectedConversation.phone.replace(/^\+/, ''),
          broker_id: myBrokerId, status: "info_sent" as any,
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
        notes: "Atendimento iniciado via Inbox pessoal (Admin)",
        broker_id: myBrokerId, channel: "whatsapp", new_status: "info_sent",
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
  }, [selectedConversation, myBrokerId, fetchConversations]);

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

  const handleTransferFromInbox = useCallback(() => {
    setShowTransferDialog(true);
  }, []);

  const handleTransferred = useCallback(() => {
    setShowTransferDialog(false);
    setSelectedConversation(null);
    fetchConversations();
  }, [fetchConversations]);

  const handleRequestSuggestion = useCallback(async () => {
    if (!selectedConversation) return;
    const lead = selectedConversation.lead as any;
    const chatHistory = messages.slice(-10).map(m => ({
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
    if (!selectedConversation || !myBrokerId) return;
    const { data: newLead, error: leadError } = await supabase
      .from("leads").insert({
        name: leadName, whatsapp: selectedConversation.phone.replace(/^\+/, ''),
        broker_id: myBrokerId, project_id: projectId, status: "new" as any,
        source: "whatsapp", lead_origin: "whatsapp_direto",
      } as any).select("id").single();
    if (leadError || !newLead) { toast.error("Erro ao criar card no Kanban"); return; }
    await supabase.from("conversations").update({ lead_id: (newLead as any).id } as any).eq("id", selectedConversation.id);
    await supabase.from("lead_interactions").insert({
      lead_id: (newLead as any).id, interaction_type: "note" as any,
      notes: "Lead criado a partir da Inbox (WhatsApp direto)", broker_id: myBrokerId, channel: "system",
    } as any);
    toast.success("Card criado no Kanban!");
    setSelectedConversation({
      ...selectedConversation, lead_id: (newLead as any).id,
      lead: { id: (newLead as any).id, name: leadName, status: "new", project_id: projectId, notes: null, lead_origin: "whatsapp_direto" },
    });
  }, [selectedConversation, myBrokerId]);

  const handleAdvanceStatus = useCallback(async (newStatus: string) => {
    const lead = selectedConversation?.lead as any;
    if (!lead) return;
    const { error } = await supabase.from("leads").update({ status: newStatus } as any).eq("id", lead.id);
    if (error) toast.error("Erro ao atualizar status");
    else toast.success("Status atualizado!");
  }, [selectedConversation]);

  const handleLogout = useLogout({ silent: true });

  const isNewConversation = activeTab === "novos" && !!selectedConversation && !selectedConversation.lead_id;
  const showList = !selectedConversation || !isMobile;
  const showThread = !!selectedConversation;
  const showContext = showLeadPanel && !isMobile;

  return (
    <div className="min-h-screen bg-[#141417] pt-safe">
      <AdminSidebar activeTab="inbox" onLogout={handleLogout} />

      <div className="md:pl-16">
        <div className="flex h-[calc(100vh-64px)] md:h-screen overflow-hidden">
          {showList && (
            <div className={`${isMobile ? "w-full" : "w-80 border-r border-[#2a2a2e]"} flex-shrink-0`}>
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
                brokerId={selectedBrokerId}
                brokerFilter={selectedBrokerId || ""}
                onBrokerFilterChange={handleBrokerFilterChange}
                brokerOptions={allBrokers}
                myBrokerId={myBrokerId}
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
                    setSelectedConversation(prev => prev ? { ...prev, ai_mode: mode } : prev);
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
      </div>

      <MobileBottomNav activeTab="inbox" />

      {selectedConversation && myBrokerId && (
        <CreateLeadFromChatModal
          open={showCreateLeadModal}
          onOpenChange={setShowCreateLeadModal}
          phone={selectedConversation.phone}
          suggestedName={(selectedConversation.lead as any)?.name || selectedConversation.phone}
          brokerId={myBrokerId}
          onCreated={handleLeadCreated}
        />
      )}

      {selectedConversation && myBrokerId && (
        <TransferLeadDialog
          leadId={selectedConversation.lead_id || undefined}
          conversationId={selectedConversation.id}
          leadName={(selectedConversation.lead as any)?.name || selectedConversation.display_name || selectedConversation.phone}
          currentBrokerId={myBrokerId}
          brokers={allBrokers}
          roletas={activeRoletas}
          isOpen={showTransferDialog}
          onClose={() => setShowTransferDialog(false)}
          onTransferred={handleTransferred}
        />
      )}
    </div>
  );
}
