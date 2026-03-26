import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ConversationList } from "@/components/inbox/ConversationList";
import { ConversationThread } from "@/components/inbox/ConversationThread";
import { LeadContextPanel } from "@/components/inbox/LeadContextPanel";
import { CreateLeadFromChatModal } from "@/components/inbox/CreateLeadFromChatModal";
import { TransferLeadDialog } from "@/components/crm/TransferLeadDialog";
import { useConversations, useConversationMessages, Conversation, InboxTab } from "@/hooks/use-conversations";
import { useCopilotSuggestion } from "@/hooks/use-copilot";
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showLeadPanel, setShowLeadPanel] = useState(false);
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [viewingLeadId, setViewingLeadId] = useState<string | null>(null);
  const [inboxTab, setInboxTab] = useState<InboxTab>("meus");
  const [isStartingAttendance, setIsStartingAttendance] = useState(false);

  const { role, isLeader } = useUserRole();
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

  const isArchived = statusFilter === "archived";
  const showOthersTab = role === "admin" || isLeader;

  // Main conversations (meus / outros)
  const {
    conversations, isLoading, totalUnread, markAsRead, archiveConversation,
    unarchiveConversation, updateAiMode, updateConversationState, fetchConversations,
  } = useConversations({
    brokerId: brokerId || undefined,
    search,
    statusFilter: isArchived ? "all" : statusFilter,
    isArchived,
    inboxTab,
    userRole: role as "admin" | "leader" | null,
  });

  // Novos conversations (separate query)
  const {
    conversations: novosConversations,
    isLoading: novosLoading,
    fetchConversations: fetchNovos,
  } = useConversations({
    brokerId: brokerId || undefined,
    search: inboxTab === "novos" ? search : "",
    statusFilter: "all",
    isArchived: false,
    inboxTab: "novos",
  });

  const activeConversations = inboxTab === "novos" ? novosConversations : conversations;
  const activeLoading = inboxTab === "novos" ? novosLoading : isLoading;

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
    });

  const { suggestion, isGenerating, generateSuggestion, setSuggestion } = useCopilotSuggestion();

  useEffect(() => {
    const convId = searchParams.get("conversationId");
    if (convId && activeConversations.length > 0 && !selectedConversation) {
      const target = activeConversations.find((c) => c.id === convId);
      if (target) { setSelectedConversation(target); setSearchParams({}, { replace: true }); }
    }
  }, [activeConversations, searchParams, selectedConversation, setSearchParams]);

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
    setSelectedConversation(null);
    setShowLeadPanel(false);
    setViewingLeadId(null);
  }, []);

  const handleOpenLead = useCallback((leadId: string) => setViewingLeadId(leadId), []);
  const handleBackFromLead = useCallback(() => setViewingLeadId(null), []);

  const handleTabChange = useCallback((tab: InboxTab) => {
    setInboxTab(tab);
    setSelectedConversation(null);
    setShowLeadPanel(false);
  }, []);

  // "Iniciar Atendimento" — claim a global conversation
  const handleStartAttendance = useCallback(async () => {
    if (!selectedConversation || !brokerId) return;
    setIsStartingAttendance(true);
    try {
      // 1. Mark attendance started and assign broker
      await supabase.from("conversations").update({ broker_id: brokerId, attendance_started: true } as any).eq("id", selectedConversation.id);

      // 2. Create lead in CRM
      const displayName = selectedConversation.display_name || selectedConversation.phone;
      const { data: newLead, error: leadError } = await supabase
        .from("leads")
        .insert({
          name: displayName,
          whatsapp: selectedConversation.phone.replace(/^\+/, ''),
          broker_id: brokerId,
          status: "new" as any,
          source: "whatsapp_global",
          lead_origin: "whatsapp_plantao",
        } as any)
        .select("id")
        .single();

      if (leadError || !newLead) {
        toast.error("Erro ao criar lead no CRM");
        return;
      }

      const leadId = (newLead as any).id;

      // 3. Unify lead (dedup)
      const { data: unifiedId } = await supabase.rpc("unify_lead", { _new_lead_id: leadId });
      const finalLeadId = unifiedId || leadId;

      // 4. Link lead to conversation
      await supabase.from("conversations").update({ lead_id: finalLeadId } as any).eq("id", selectedConversation.id);

      // 5. Register interaction
      await supabase.from("lead_interactions").insert({
        lead_id: finalLeadId,
        interaction_type: "status_change" as any,
        notes: "Atendimento iniciado via Inbox (WhatsApp Global)",
        broker_id: brokerId,
        channel: "whatsapp",
        new_status: "new",
      } as any);

      toast.success("Atendimento iniciado! Lead criado no Kanban.");

      // Move to "Meus" tab with the conversation
      setInboxTab("meus");
      setSelectedConversation({
        ...selectedConversation,
        broker_id: brokerId,
        lead_id: finalLeadId,
        lead: { id: finalLeadId, name: displayName, status: "new", project_id: null, notes: null, lead_origin: "whatsapp_plantao" },
      });

      // Refresh both lists
      fetchConversations();
      fetchNovos();
    } catch (error) {
      console.error("Erro ao iniciar atendimento:", error);
      toast.error("Erro ao iniciar atendimento");
    } finally {
      setIsStartingAttendance(false);
    }
  }, [selectedConversation, brokerId, fetchConversations, fetchNovos]);

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

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/auth"); };

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

  const isNewLeadConversation = inboxTab === "novos" && !!selectedConversation;
  const isReadOnlyConversation = inboxTab === "outros";
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
      <div className="flex h-[calc(100vh-64px)] lg:h-[calc(100vh-72px)] overflow-hidden -m-3 lg:-m-6 lg:ml-0">
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
              isLoading={activeLoading}
              totalUnread={totalUnread}
              onMarkAsRead={(id) => markAsRead(id)}
              onArchive={(id) => archiveConversation(id)}
              inboxTab={inboxTab}
              onTabChange={handleTabChange}
              showOthersTab={showOthersTab}
              novosCount={novosConversations.length}
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
                onCreateLead={!selectedConversation!.lead_id && !isNewLeadConversation ? handleOpenCreateLeadModal : undefined}
                onOpenLead={handleOpenLead}
                isNewLead={isNewLeadConversation}
                onStartAttendance={handleStartAttendance}
                isStartingAttendance={isStartingAttendance}
                isReadOnly={isReadOnlyConversation}
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
    </BrokerLayout>
  );
}
