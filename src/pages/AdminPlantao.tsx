import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ConversationList } from "@/components/inbox/ConversationList";
import { ConversationThread } from "@/components/inbox/ConversationThread";
import { LeadContextPanel } from "@/components/inbox/LeadContextPanel";
import { TransferLeadDialog } from "@/components/crm/TransferLeadDialog";
import { useConversations, useConversationMessages, Conversation, InboxTab } from "@/hooks/use-conversations";
import { useCopilotSuggestion } from "@/hooks/use-copilot";
import { toast } from "sonner";
import { useLogout } from "@/hooks/use-logout";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { MobileBottomNav } from "@/components/admin/MobileBottomNav";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LeadPage = lazy(() => import("@/pages/LeadPage"));

export default function AdminPlantao() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("_loading");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showLeadPanel, setShowLeadPanel] = useState(false);
  const [brokers, setBrokers] = useState<{ id: string; name: string }[]>([]);
  const [viewingLeadId, setViewingLeadId] = useState<string | null>(null);
  const [myBrokerId, setMyBrokerId] = useState<string | null>(null);
  const [inboxTab, setInboxTab] = useState<InboxTab>("novos");
  const [isStartingAttendance, setIsStartingAttendance] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [allBrokers, setAllBrokers] = useState<{ id: string; name: string }[]>([]);
  const [activeRoletas, setActiveRoletas] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const [brokersRes, myBrokerRes, rolesRes] = await Promise.all([
        supabase.from("brokers").select("id, name").eq("is_active", true).order("name"),
        supabase.from("brokers").select("id").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", session.user.id),
      ]);

      const roles = (rolesRes.data || []).map((r: any) => r.role);
      const userIsAdmin = roles.includes("admin");
      if (!userIsAdmin) { navigate("/auth"); return; }

      const brokerIdFound = (myBrokerRes?.data as any)?.id || null;
      setMyBrokerId(brokerIdFound);
      if (brokersRes.data) {
        setBrokers(brokersRes.data as any);
        setAllBrokers(brokersRes.data as any);
      }
      setSelectedBrokerId(brokerIdFound || "all");
      setIsInitialized(true);
    };
    init();
  }, [navigate]);

  useEffect(() => {
    const fetchRoletas = async () => {
      const { data } = await supabase.from("roletas").select("id, nome").eq("ativa", true);
      if (data) setActiveRoletas(data as any);
    };
    fetchRoletas();
  }, []);

  const isArchived = statusFilter === "archived";
  const effectiveBrokerId = selectedBrokerId === "_loading" ? "__skip__" : (selectedBrokerId !== "all" ? selectedBrokerId : undefined);

  const {
    conversations, isLoading, totalUnread, markAsRead, archiveConversation,
    unarchiveConversation, updateAiMode, updateConversationState, fetchConversations,
  } = useConversations({
    brokerId: effectiveBrokerId === "__skip__" ? "00000000-0000-0000-0000-000000000000" : effectiveBrokerId,
    search,
    statusFilter: isArchived ? "all" : statusFilter,
    isArchived,
    inboxTab,
    userRole: "admin",
    sourceInstance: "global",
    enabled: selectedBrokerId !== "_loading",
  });

  const {
    conversations: novosConversations,
    fetchConversations: fetchNovos,
  } = useConversations({
    brokerId: myBrokerId || undefined,
    search: inboxTab === "novos" ? search : "",
    statusFilter: "all",
    isArchived: false,
    inboxTab: "novos",
    sourceInstance: "global",
    enabled: isInitialized,
  });

  const activeConversations = inboxTab === "novos" ? novosConversations : conversations;
  const activeLoading = isLoading;

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
      const target = activeConversations.find(c => c.id === convId);
      if (target) { setSelectedConversation(target); setSearchParams({}, { replace: true }); }
    }
  }, [activeConversations, searchParams, selectedConversation, setSearchParams]);

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

  const handleStartAttendance = useCallback(async () => {
    if (!selectedConversation || !myBrokerId) return;
    setIsStartingAttendance(true);
    try {
      await supabase.from("conversations").update({ broker_id: myBrokerId, attendance_started: true } as any).eq("id", selectedConversation.id);

      const displayName = selectedConversation.display_name || selectedConversation.phone;
      const { data: newLead, error: leadError } = await supabase
        .from("leads").insert({
          name: displayName, whatsapp: selectedConversation.phone.replace(/^\+/, ''),
          broker_id: myBrokerId, status: "info_sent" as any,
          source: "whatsapp_global", lead_origin: "whatsapp_plantao",
          atendimento_iniciado_em: new Date().toISOString(),
          status_distribuicao: "atendimento_iniciado" as any,
        } as any).select("id").single();

      if (leadError || !newLead) { toast.error("Erro ao criar lead no CRM"); return; }
      const leadId = (newLead as any).id;
      const { data: unifiedId } = await supabase.rpc("unify_lead", { _new_lead_id: leadId });
      const finalLeadId = unifiedId || leadId;

      await supabase.from("conversations").update({ lead_id: finalLeadId } as any).eq("id", selectedConversation.id);
      await supabase.from("lead_interactions").insert({
        lead_id: finalLeadId, interaction_type: "atendimento_iniciado" as any,
        notes: "Atendimento iniciado via Plantão Admin (WhatsApp Global)",
        broker_id: myBrokerId, channel: "whatsapp", new_status: "info_sent",
      } as any);

      toast.success("Atendimento iniciado! Lead criado no Kanban.");
      setInboxTab("meus");
      setSelectedConversation({
        ...selectedConversation, broker_id: myBrokerId, lead_id: finalLeadId,
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
  }, [selectedConversation, myBrokerId, fetchConversations, fetchNovos]);

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
    const chatHistory = messages.slice(-10).map(m => ({
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

  const isNewLeadConversation = inboxTab === "novos" && !!selectedConversation;
  const isReadOnlyConversation = inboxTab === "outros";
  const showList = !selectedConversation || !isMobile;
  const showThread = !!selectedConversation;
  const showContext = showLeadPanel && !isMobile;

  return (
    <div className="min-h-screen bg-[#141417] pt-safe">
      <AdminSidebar activeTab="plantao" onLogout={handleLogout} />

      <div className="md:pl-16">
        <div className="flex h-[calc(100vh-64px)] md:h-screen overflow-hidden">
          {showList && (
            <div className={`${isMobile ? "w-full" : "w-80 border-r border-[#2a2a2e]"} flex-shrink-0 flex flex-col`}>
              {inboxTab === "meus" && (
                <div className="px-3 pt-3 pb-1">
                  <Select value={selectedBrokerId} onValueChange={setSelectedBrokerId}>
                    <SelectTrigger className="h-8 bg-card border-border text-sm text-foreground">
                      <SelectValue placeholder="Todos os corretores" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all" className="text-muted-foreground text-sm">Todos os corretores</SelectItem>
                      {brokers.map(b => (
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
                  isAdminView
                  inboxTab={inboxTab}
                  onTabChange={handleTabChange}
                  showOthersTab={true}
                  novosCount={novosConversations.length}
                />
              </div>
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
                  onOpenLead={handleOpenLead}
                  isNewLead={isNewLeadConversation}
                  onStartAttendance={handleStartAttendance}
                  isStartingAttendance={isStartingAttendance}
                  isReadOnly={isReadOnlyConversation}
                  onTransfer={selectedConversation!.lead_id ? handleTransferFromInbox : undefined}
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
      </div>

      <MobileBottomNav activeTab="plantao" />

      {selectedConversation?.lead_id && myBrokerId && (
        <TransferLeadDialog
          leadId={selectedConversation.lead_id}
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
