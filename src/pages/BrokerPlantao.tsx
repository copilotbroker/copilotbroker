import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ConversationList } from "@/components/inbox/ConversationList";
import { ConversationThread } from "@/components/inbox/ConversationThread";
import { LeadContextPanel } from "@/components/inbox/LeadContextPanel";
import { TransferLeadDialog } from "@/components/crm/TransferLeadDialog";
import { useConversations, useConversationMessages, Conversation, InboxTab } from "@/hooks/use-conversations";
import { useCopilotSuggestion } from "@/hooks/use-copilot";
import { useUserRole } from "@/hooks/use-user-role";
import { toast } from "sonner";
import { useLogout } from "@/hooks/use-logout";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2 } from "lucide-react";
import { BrokerLayout } from "@/components/broker";

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
  const [inboxTab, setInboxTab] = useState<InboxTab>("novos");
  const [isStartingAttendance, setIsStartingAttendance] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [allBrokers, setAllBrokers] = useState<{ id: string; name: string }[]>([]);
  const [activeRoletas, setActiveRoletas] = useState<{ id: string; nome: string }[]>([]);
  const [isCheckedInGlobal, setIsCheckedInGlobal] = useState<boolean | null>(null);

  const { role, isLeader } = useUserRole();

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

  // Check if broker has active check-in in a whatsapp_global roulette
  useEffect(() => {
    if (!brokerId) return;
    const checkGlobalCheckin = async () => {
      const { data } = await (supabase
        .from("roletas_membros" as any)
        .select("id, roleta:roletas!inner(id, tipo_origem)")
        .eq("corretor_id", brokerId)
        .eq("ativo", true)
        .eq("status_checkin", true)
        .eq("roleta.tipo_origem", "whatsapp_global") as any);
      setIsCheckedInGlobal((data as any[] || []).length > 0);
    };
    checkGlobalCheckin();
    const interval = setInterval(checkGlobalCheckin, 15000);
    return () => clearInterval(interval);
  }, [brokerId]);

  const isArchived = statusFilter === "archived";
  const showOthersTab = role === "admin" || isLeader;

  // Main conversations (meus / outros) — global only
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
    sourceInstance: "global",
  });

  // Novos conversations (separate query) — only fetch if checked in to a whatsapp_global roulette
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
    sourceInstance: "global",
    enabled: isCheckedInGlobal === true,
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
      await supabase.from("conversations").update({ broker_id: brokerId, attendance_started: true } as any).eq("id", selectedConversation.id);

      const displayName = selectedConversation.display_name || selectedConversation.phone;
      const { data: newLead, error: leadError } = await supabase
        .from("leads")
        .insert({
          name: displayName,
          whatsapp: selectedConversation.phone.replace(/^\+/, ''),
          broker_id: brokerId,
          status: "info_sent" as any,
          source: "whatsapp_global",
          lead_origin: "whatsapp_plantao",
          atendimento_iniciado_em: new Date().toISOString(),
          status_distribuicao: "atendimento_iniciado" as any,
        } as any)
        .select("id")
        .single();

      if (leadError || !newLead) {
        toast.error("Erro ao criar lead no CRM");
        return;
      }

      const leadId = (newLead as any).id;
      const { data: unifiedId } = await supabase.rpc("unify_lead", { _new_lead_id: leadId });
      const finalLeadId = unifiedId || leadId;

      await supabase.from("conversations").update({ lead_id: finalLeadId } as any).eq("id", selectedConversation.id);

      await supabase.from("lead_interactions").insert({
        lead_id: finalLeadId,
        interaction_type: "atendimento_iniciado" as any,
        notes: "Atendimento iniciado via Plantão (WhatsApp Global)",
        broker_id: brokerId,
        channel: "whatsapp",
        new_status: "info_sent",
      } as any);

      toast.success("Atendimento iniciado! Lead criado no Kanban.");

      setInboxTab("meus");
      setSelectedConversation({
        ...selectedConversation,
        broker_id: brokerId,
        lead_id: finalLeadId,
        lead: { id: finalLeadId, name: displayName, status: "info_sent", project_id: null, notes: null, lead_origin: "whatsapp_plantao" },
      });

      fetchConversations();
      fetchNovos();
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
      const { error } = await supabase
        .from("conversations")
        .update({ source_instance: "personal" } as any)
        .eq("id", selectedConversation.id);

      if (error) throw error;

      toast.success("Conversa migrada para seu WhatsApp pessoal!");
      navigate(`/corretor/inbox?conversationId=${selectedConversation.id}`);
    } catch (err) {
      console.error("Erro ao migrar conversa:", err);
      toast.error("Erro ao migrar conversa");
    } finally {
      setIsPullingToPersonal(false);
    }
  }, [selectedConversation, navigate]);

  const handleTransferFromInbox = useCallback(() => {
    if (selectedConversation?.lead_id) setShowTransferDialog(true);
  }, [selectedConversation]);

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
    const { error } = await supabase.from("leads").update({ status: newStatus } as any).eq("id", lead.id);
    if (error) toast.error("Erro ao atualizar status");
    else toast.success("Status atualizado!");
  }, [selectedConversation]);

  const handleLogout = useLogout({ silent: true });

  if (!brokerId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
              emptyMessage={
                inboxTab === "novos" && isCheckedInGlobal === false
                  ? "Você precisa fazer check-in na roleta do Plantão para ver novos contatos."
                  : undefined
              }
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
                onOpenLead={handleOpenLead}
                isNewLead={isNewLeadConversation}
                onStartAttendance={handleStartAttendance}
                isStartingAttendance={isStartingAttendance}
                isReadOnly={isReadOnlyConversation}
                onTransfer={selectedConversation!.lead_id ? handleTransferFromInbox : undefined}
                onPullToPersonal={handlePullToPersonal}
                isPullingToPersonal={isPullingToPersonal}
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

      {selectedConversation?.lead_id && brokerId && (
        <TransferLeadDialog
          leadId={selectedConversation.lead_id}
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
