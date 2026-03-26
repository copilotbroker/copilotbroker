import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CONVERSATION_FETCH_LIMIT = 100;
const MESSAGE_FETCH_LIMIT = 200;
const INBOX_POLL_INTERVAL_MS = 12000;
const THREAD_POLL_INTERVAL_MS = 6000;
const SCHEDULED_QUEUE_ACTIVE_STATUSES = ["queued", "scheduled", "sending", "paused_by_system"] as const;

export interface Conversation {
  id: string;
  broker_id: string;
  lead_id: string | null;
  phone: string;
  phone_normalized: string;
  status: string;
  ai_mode: string;
  is_archived: boolean;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_direction: string | null;
  last_message_type?: string | null;
  display_name?: string | null;
  display_name_source?: string | null;
  source_instance?: string | null;
  unread_count: number;
  opportunity_score: number;
  temperature: number;
  copilot_suggestions_count: number;
  created_at: string;
  updated_at: string;
  lead?: { id: string; name: string; status: string; project_id: string | null; notes: string | null; lead_origin: string | null } | null;
  project?: { id: string; name: string } | null;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  direction: string;
  content: string;
  message_type: string;
  sender_name: string | null;
  sent_by: string;
  status: string;
  uazapi_message_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ScheduledConversationMessage {
  id: string;
  broker_id: string;
  lead_id: string | null;
  phone: string;
  message: string;
  scheduled_at: string;
  created_at: string;
  status: string;
}

export interface OutboundMessagePayload {
  content: string;
  sentBy?: string;
  messageType?: "text" | "image" | "audio" | "video" | "document";
  metadata?: Record<string, unknown>;
}

export type InboxTab = "novos" | "meus" | "outros";

interface UseConversationsOptions {
  brokerId?: string;
  statusFilter?: string;
  search?: string;
  isArchived?: boolean;
  inboxTab?: InboxTab;
  /** For "outros" tab: role of the current user */
  userRole?: "admin" | "leader" | null;
}

const sortMessagesAsc = (items: ConversationMessage[]) => (
  [...items].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
);

const getMessageClientId = (message: ConversationMessage) => {
  const metadata = (message.metadata || {}) as Record<string, unknown>;
  return typeof metadata.client_id === "string" ? metadata.client_id : null;
};

const getMessageMergeKey = (message: ConversationMessage) => getMessageClientId(message) || message.id;

const mergeMessages = (current: ConversationMessage[], incoming: ConversationMessage[]) => {
  const byKey = new Map(current.map((message) => [getMessageMergeKey(message), message]));

  for (const message of incoming) {
    const key = getMessageMergeKey(message);
    const existing = byKey.get(key);
    byKey.set(key, existing ? { ...existing, ...message } : message);
  }

  return sortMessagesAsc([...byKey.values()]);
};

export function useConversations(options: UseConversationsOptions = {}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  const getPhoneSearchVariants = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const withoutCountry = cleaned.startsWith("55") ? cleaned.slice(2) : cleaned;
    const withCountry = withoutCountry.startsWith("55") ? withoutCountry : `55${withoutCountry}`;
    const tenDigits = withoutCountry.length === 10 ? withoutCountry : null;
    const elevenDigits = withoutCountry.length === 11 ? withoutCountry : null;
    const withNinthDigit = tenDigits ? `${tenDigits.slice(0, 2)}9${tenDigits.slice(2)}` : null;
    const withoutNinthDigit = elevenDigits ? `${elevenDigits.slice(0, 2)}${elevenDigits.slice(3)}` : null;

    return [...new Set([
      cleaned,
      withoutCountry,
      withCountry,
      tenDigits,
      elevenDigits,
      withNinthDigit,
      withoutNinthDigit,
      tenDigits ? `55${tenDigits}` : null,
      elevenDigits ? `55${elevenDigits}` : null,
      withNinthDigit ? `55${withNinthDigit}` : null,
      withoutNinthDigit ? `55${withoutNinthDigit}` : null,
    ].filter(Boolean) as string[])];
  };

  const resolveConversationIdentity = (conversation: Conversation, matchedLead?: any) => {
    const leadData = conversation.lead || (matchedLead ? {
      id: matchedLead.id,
      name: matchedLead.name,
      status: matchedLead.status,
      project_id: matchedLead.project_id,
      notes: matchedLead.notes,
      lead_origin: matchedLead.lead_origin,
    } : null);

    const resolvedName = leadData?.name || conversation.display_name || conversation.phone;
    const resolvedSource = leadData?.name
      ? "lead"
      : (conversation.display_name_source || (conversation.display_name ? "conversation" : "phone"));

    return {
      ...conversation,
      lead: leadData,
      display_name: resolvedName,
      display_name_source: resolvedSource,
    };
  };

  const fetchConversations = useCallback(async () => {
    try {
      let query: any = supabase
        .from("conversations")
        .select(`
          *,
          lead:leads!conversations_lead_id_fkey(id, name, status, project_id, notes, lead_origin)
        `)
        .eq("is_archived", options.isArchived ?? false)
        .order("last_message_at", { ascending: false });

      if (options.inboxTab === "novos") {
        // Global conversations pending attendance
        query = query.eq("source_instance", "global").eq("attendance_started", false);
      } else if (options.inboxTab === "outros") {
        // Team conversations (exclude own)
        if (options.brokerId) {
          query = query.neq("broker_id", options.brokerId);
        }
        // RLS will handle visibility (admin sees all, leader sees team)
      } else {
        // "meus" or default — own conversations
        if (options.brokerId) query = query.eq("broker_id", options.brokerId);
      }

      if (options.statusFilter && options.statusFilter !== "all") query = query.eq("status", options.statusFilter);

      const { data, error } = await query.limit(CONVERSATION_FETCH_LIMIT);
      if (error) throw error;

      let filtered = (data || []) as unknown as Conversation[];
      const conversationIds = filtered.map((conversation) => conversation.id);
      const missingLastMessageIds = filtered
        .filter((conversation) => !conversation.last_message_at)
        .map((conversation) => conversation.id);

      const [latestMessagesResult, fallbackMessagesResult] = await Promise.all([
        conversationIds.length > 0
          ? supabase
              .from("conversation_messages")
              .select("conversation_id, created_at")
              .in("conversation_id", conversationIds)
              .order("created_at", { ascending: false })
              .limit(1000)
          : Promise.resolve({ data: [], error: null }),
        missingLastMessageIds.length > 0
          ? supabase
              .from("conversation_messages")
              .select("conversation_id, sender_name, created_at")
              .in("conversation_id", missingLastMessageIds)
              .eq("direction", "inbound")
              .not("sender_name", "is", null)
              .order("created_at", { ascending: false })
              .limit(500)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (latestMessagesResult.error) throw latestMessagesResult.error;
      if (fallbackMessagesResult.error) throw fallbackMessagesResult.error;

      const lastMessageAtByConversation = new Map<string, string>();
      for (const row of latestMessagesResult.data || []) {
        if (!lastMessageAtByConversation.has(row.conversation_id)) {
          lastMessageAtByConversation.set(row.conversation_id, row.created_at);
        }
      }

      const senderNameByConversation = new Map<string, string>();
      for (const row of fallbackMessagesResult.data || []) {
        if (!senderNameByConversation.has(row.conversation_id) && row.sender_name) {
          senderNameByConversation.set(row.conversation_id, row.sender_name);
        }
      }

      filtered = filtered.map((conversation) => ({
        ...conversation,
        last_message_at:
          conversation.last_message_at ||
          lastMessageAtByConversation.get(conversation.id) ||
          conversation.updated_at ||
          null,
      }));

      const conversationsByPhone = new Map<string, Conversation>();
      for (const conversation of filtered) {
        const canonicalPhone = conversation.phone_normalized.replace(/\D/g, "").slice(-13);
        const current = conversationsByPhone.get(canonicalPhone);

        if (!current) {
          conversationsByPhone.set(canonicalPhone, conversation);
          continue;
        }

        const currentTime = current.last_message_at ? new Date(current.last_message_at).getTime() : 0;
        const nextTime = conversation.last_message_at ? new Date(conversation.last_message_at).getTime() : 0;
        const primary = nextTime > currentTime ? conversation : current;
        const secondary = primary.id === current.id ? conversation : current;

        conversationsByPhone.set(canonicalPhone, {
          ...primary,
          lead_id: primary.lead_id || secondary.lead_id,
          lead: primary.lead || secondary.lead || null,
          display_name: primary.display_name || secondary.display_name,
          display_name_source: primary.display_name_source || secondary.display_name_source,
          last_message_type: primary.last_message_type || secondary.last_message_type,
          last_message_at: primary.last_message_at || secondary.last_message_at,
          unread_count: Math.max(primary.unread_count || 0, secondary.unread_count || 0),
          ai_mode: primary.ai_mode === "ai_active" || secondary.ai_mode === "ai_active" ? "ai_active" : primary.ai_mode,
        });
      }

      filtered = [...conversationsByPhone.values()];

      const noLeadConvs = filtered.filter((c) => !c.lead_id && !c.lead && c.phone_normalized);
      if (noLeadConvs.length > 0) {
        const allVariants = [...new Set(noLeadConvs.flatMap((c) => getPhoneSearchVariants(c.phone_normalized)))];

        const { data: matchedLeads, error: leadsError } = await supabase
          .from("leads")
          .select("id, name, whatsapp, status, project_id, notes, lead_origin")
          .in("whatsapp", allVariants.slice(0, 100));

        if (leadsError) throw leadsError;

        const phoneToLead = new Map<string, any>();
        for (const lead of matchedLeads || []) {
          for (const variant of getPhoneSearchVariants(lead.whatsapp || "")) {
            if (!phoneToLead.has(variant)) phoneToLead.set(variant, lead);
          }
        }

        filtered = filtered.map((conversation) => {
          if (conversation.lead_id || conversation.lead) {
            return resolveConversationIdentity(conversation);
          }

          const normalizedVariants = getPhoneSearchVariants(conversation.phone_normalized);
          const match = normalizedVariants.map((variant) => phoneToLead.get(variant)).find(Boolean);
          if (match) return resolveConversationIdentity(conversation, match);

          const senderName = senderNameByConversation.get(conversation.id)?.trim();
          if (senderName && (!conversation.display_name || ["phone", "sender_name"].includes(conversation.display_name_source || ""))) {
            return resolveConversationIdentity({
              ...conversation,
              display_name: senderName,
              display_name_source: "sender_name",
            });
          }

          return resolveConversationIdentity(conversation);
        });
      } else {
        filtered = filtered.map((conversation) => {
          const senderName = senderNameByConversation.get(conversation.id)?.trim();
          if (senderName && (!conversation.display_name || ["phone", "sender_name"].includes(conversation.display_name_source || ""))) {
            return resolveConversationIdentity({
              ...conversation,
              display_name: senderName,
              display_name_source: "sender_name",
            });
          }

          return resolveConversationIdentity(conversation);
        });
      }

      if (options.search) {
        const s = options.search.toLowerCase();
        filtered = filtered.filter((c) =>
          c.phone.includes(s) ||
          c.phone_normalized.includes(s) ||
          c.display_name?.toLowerCase().includes(s) ||
          c.last_message_preview?.toLowerCase().includes(s)
        );
      }

      setConversations(filtered);
      setTotalUnread(filtered.reduce((acc, c) => acc + (c.unread_count || 0), 0));
    } catch (error) {
      console.error("Erro ao buscar conversas:", error);
    } finally {
      setIsLoading(false);
    }
  }, [options.brokerId, options.statusFilter, options.search, options.isArchived, options.inboxTab, options.userRole]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const channel = supabase
      .channel("conversations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchConversations]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      fetchConversations();
    }, INBOX_POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [fetchConversations]);

  const markAsRead = useCallback(async (conversationId: string) => {
    await supabase
      .from("conversations")
      .update({ unread_count: 0, status: "attending" } as any)
      .eq("id", conversationId);
  }, []);

  const archiveConversation = useCallback(async (conversationId: string) => {
    await supabase
      .from("conversations")
      .update({ is_archived: true, status: "closed" } as any)
      .eq("id", conversationId);
    toast.success("Conversa arquivada");
    fetchConversations();
  }, [fetchConversations]);

  const unarchiveConversation = useCallback(async (conversationId: string) => {
    await supabase
      .from("conversations")
      .update({ is_archived: false, status: "active" } as any)
      .eq("id", conversationId);
    toast.success("Conversa desarquivada");
    fetchConversations();
  }, [fetchConversations]);

  const updateAiMode = useCallback(async (conversationId: string, mode: string) => {
    await supabase
      .from("conversations")
      .update({ ai_mode: mode } as any)
      .eq("id", conversationId);

    const { data: conv } = await supabase
      .from("conversations")
      .select("lead_id, broker_id")
      .eq("id", conversationId)
      .single();

    if (conv?.lead_id) {
      if (mode === "copilot") {
        await supabase
          .from("whatsapp_message_queue")
          .update({
            status: "cancelled",
            error_message: "Handoff manual: corretor assumiu atendimento",
            updated_at: new Date().toISOString(),
          } as any)
          .eq("lead_id", conv.lead_id)
          .in("status", ["queued", "scheduled"]);

        await supabase.from("lead_interactions").insert({
          lead_id: conv.lead_id,
          interaction_type: "note_added" as any,
          notes: "🔄 Handoff: Corretor assumiu atendimento (modo Copiloto ativado)",
          broker_id: conv.broker_id,
          channel: "system",
        } as any);
      } else {
        await supabase.from("lead_interactions").insert({
          lead_id: conv.lead_id,
          interaction_type: "note_added" as any,
          notes: "🤖 Piloto Automático reativado",
          broker_id: conv.broker_id,
          channel: "system",
        } as any);
      }
    }
  }, []);

  const updateConversationState = useCallback((conversationId: string, updater: (current: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((conversation) => (
      conversation.id === conversationId ? updater(conversation) : conversation
    )));
  }, []);

  return {
    conversations,
    isLoading,
    totalUnread,
    fetchConversations,
    markAsRead,
    archiveConversation,
    unarchiveConversation,
    updateAiMode,
    updateConversationState,
  };
}

export function useConversationMessages(
  conversation: Conversation | null,
  onConversationPreviewUpdate?: (update: { preview: string; messageType: string; timestamp: string }) => void,
) {
  const conversationId = conversation?.id || null;
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("conversation_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(MESSAGE_FETCH_LIMIT);

      if (error) throw error;
      setMessages(sortMessagesAsc((data || []) as unknown as ConversationMessage[]));
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const fetchScheduledMessages = useCallback(async () => {
    if (!conversation) {
      setScheduledMessages([]);
      return;
    }

    try {
      let query = supabase
        .from("whatsapp_message_queue")
        .select("id, broker_id, lead_id, phone, message, scheduled_at, created_at, status")
        .eq("broker_id", conversation.broker_id)
        .in("status", [...SCHEDULED_QUEUE_ACTIVE_STATUSES])
        .order("scheduled_at", { ascending: true })
        .limit(50);

      if (conversation.lead_id) {
        query = query.eq("lead_id", conversation.lead_id);
      } else {
        query = query.eq("phone", conversation.phone);
      }

      const { data, error } = await query;
      if (error) throw error;
      setScheduledMessages((data || []) as ScheduledConversationMessage[]);
    } catch (error) {
      console.error("Erro ao buscar mensagens programadas:", error);
    }
  }, [conversation]);

  const fetchNewMessages = useCallback(async () => {
    if (!conversationId) return;

    const lastLoadedAt = messages[messages.length - 1]?.created_at;
    if (!lastLoadedAt) {
      await fetchMessages();
      return;
    }

    try {
      const { data, error } = await supabase
        .from("conversation_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .gt("created_at", lastLoadedAt)
        .order("created_at", { ascending: true })
        .limit(MESSAGE_FETCH_LIMIT);

      if (error) throw error;
      if (!data?.length) return;

      setMessages((prev) => mergeMessages(prev, data as unknown as ConversationMessage[]));
    } catch (error) {
      console.error("Erro ao buscar novas mensagens:", error);
    }
  }, [conversationId, fetchMessages, messages]);

  useEffect(() => {
    fetchMessages();
    fetchScheduledMessages();
  }, [fetchMessages, fetchScheduledMessages]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`conv-messages-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "conversation_messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const newMsg = payload.new as unknown as ConversationMessage;
        setMessages((prev) => mergeMessages(prev, [newMsg]));
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "conversation_messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const updatedMsg = payload.new as unknown as ConversationMessage;
        setMessages((prev) => mergeMessages(prev, [updatedMsg]));
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "whatsapp_message_queue",
      }, () => {
        void fetchScheduledMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, fetchScheduledMessages]);

  useEffect(() => {
    if (!conversationId) return;

    const intervalId = window.setInterval(() => {
      fetchNewMessages();
      void fetchScheduledMessages();
    }, THREAD_POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [conversationId, fetchNewMessages, fetchScheduledMessages]);

  const sendMessage = useCallback(async (payload: string | OutboundMessagePayload, sentBy = "human") => {
    if (!conversationId) return null;

    const normalizedPayload: OutboundMessagePayload = typeof payload === "string"
      ? { content: payload, sentBy, messageType: "text" }
      : {
          content: payload.content,
          sentBy: payload.sentBy || sentBy,
          messageType: payload.messageType || "text",
          metadata: payload.metadata,
        };

    const createdAt = new Date().toISOString();
    const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const optimisticMetadata: Record<string, unknown> = {
      ...(normalizedPayload.metadata || {}),
      client_id: clientId,
    };
    const optimisticMessage: ConversationMessage = {
      id: `temp:${clientId}`,
      conversation_id: conversationId,
      direction: "outbound",
      content: normalizedPayload.content,
      sent_by: normalizedPayload.sentBy || "human",
      message_type: normalizedPayload.messageType || "text",
      metadata: optimisticMetadata,
      sender_name: null,
      status: "pending",
      uazapi_message_id: null,
      created_at: createdAt,
    };

    setMessages((prev) => mergeMessages(prev, [optimisticMessage]));
    onConversationPreviewUpdate?.({
      preview: normalizedPayload.messageType === "text"
        ? normalizedPayload.content
        : (typeof optimisticMetadata.file_name === "string" ? `📎 ${optimisticMetadata.file_name}` : "[Mídia]"),
      messageType: normalizedPayload.messageType || "text",
      timestamp: createdAt,
    });

    void (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("inbox-send-message", {
          body: {
            conversation_id: conversationId,
            content: normalizedPayload.content,
            sent_by: normalizedPayload.sentBy,
            message_type: normalizedPayload.messageType,
            metadata: optimisticMetadata,
          },
        });

        if (error) throw error;

        if (data?.message_id) {
          setMessages((prev) => mergeMessages(prev, [{
            ...optimisticMessage,
            id: data.message_id,
            status: "sent",
            uazapi_message_id: data.uazapi_message_id || null,
          }]));
          return;
        }

        setMessages((prev) => mergeMessages(prev, [{ ...optimisticMessage, status: "sent" }]));
      } catch (err) {
        console.error("Erro ao enviar mensagem:", err);
        setMessages((prev) => mergeMessages(prev, [{ ...optimisticMessage, status: "failed" }]));
        toast.error("Falha ao enviar mensagem");
      }
    })();

    return optimisticMessage;
  }, [conversationId, onConversationPreviewUpdate]);

  const scheduleMessage = useCallback(async (content: string, scheduledAt: string) => {
    if (!conversation) return null;

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      toast.error("Digite uma mensagem antes de programar");
      return null;
    }

    const nowIso = new Date().toISOString();
    const { data: queueItem, error } = await supabase
      .from("whatsapp_message_queue")
      .insert({
        broker_id: conversation.broker_id,
        lead_id: conversation.lead_id,
        phone: conversation.phone,
        message: trimmedContent,
        scheduled_at: scheduledAt,
        status: "scheduled",
      } as any)
      .select("id, broker_id, lead_id, phone, message, scheduled_at, created_at, status")
      .single();

    if (error) {
      console.error("Erro ao programar mensagem:", error);
      toast.error("Não foi possível programar a mensagem");
      throw error;
    }

    if (conversation.lead_id) {
      let previousStatus = conversation.lead?.status || "info_sent";

      if (previousStatus === "awaiting_docs") {
        const { data: interactions } = await supabase
          .from("lead_interactions")
          .select("notes, created_at")
          .eq("lead_id", conversation.lead_id)
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
            previousStatus = conversation.lead?.status || "info_sent";
          }
        }
      }

      if ((conversation.lead?.status || "info_sent") !== "awaiting_docs") {
        const { error: leadUpdateError } = await supabase
          .from("leads")
          .update({
            status: "awaiting_docs",
            atendimento_iniciado_em: nowIso,
            status_distribuicao: "atendimento_iniciado",
            reserva_expira_em: null,
            updated_at: nowIso,
          } as any)
          .eq("id", conversation.lead_id);

        if (leadUpdateError) {
          console.error("Erro ao mover lead para Copiloto Ativo:", leadUpdateError);
        } else {
          await supabase.from("lead_interactions").insert({
            lead_id: conversation.lead_id,
            interaction_type: "status_change" as any,
            old_status: previousStatus as any,
            new_status: "awaiting_docs" as any,
            channel: "whatsapp",
            broker_id: conversation.broker_id,
            notes: `Lead movido para Copiloto Ativo por mensagem programada (${new Date(scheduledAt).toLocaleString("pt-BR")})`,
          } as any);
        }
      }

      await supabase.from("lead_interactions").insert({
        lead_id: conversation.lead_id,
        interaction_type: "whatsapp_manual" as any,
        channel: "whatsapp",
        broker_id: conversation.broker_id,
        notes: JSON.stringify({
          kind: "scheduled_message",
          action: "scheduled",
          queueId: (queueItem as ScheduledConversationMessage).id,
          previousStatus,
          scheduledAt,
          message: trimmedContent,
        }),
      } as any);
    }

    setScheduledMessages((prev) => {
      const next = [queueItem as ScheduledConversationMessage, ...prev];
      return next.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    });

    onConversationPreviewUpdate?.({
      preview: trimmedContent,
      messageType: "text",
      timestamp: nowIso,
    });

    toast.success("Mensagem programada");
    return queueItem as ScheduledConversationMessage;
  }, [conversation, onConversationPreviewUpdate]);

  const cancelScheduledMessage = useCallback(async (queueId: string) => {
    const target = scheduledMessages.find((item) => item.id === queueId);

    const { error } = await supabase
      .from("whatsapp_message_queue")
      .update({ status: "cancelled", updated_at: new Date().toISOString() } as any)
      .eq("id", queueId);

    if (error) {
      console.error("Erro ao cancelar mensagem programada:", error);
      toast.error("Não foi possível cancelar a mensagem");
      throw error;
    }

    if (conversation?.lead_id && target) {
      const { data: interactions } = await supabase
        .from("lead_interactions")
        .select("notes, created_at")
        .eq("lead_id", conversation.lead_id)
        .eq("interaction_type", "whatsapp_manual")
        .order("created_at", { ascending: false })
        .limit(50);

      const scheduledEvent = (interactions || []).find((interaction) => {
        try {
          const parsed = JSON.parse(interaction.notes || "{}");
          return parsed?.kind === "scheduled_message" && parsed?.queueId === queueId;
        } catch {
          return false;
        }
      });

      let restoreStatus: string | null = null;
      try {
        const parsed = JSON.parse(scheduledEvent?.notes || "{}");
        restoreStatus = typeof parsed?.previousStatus === "string" ? parsed.previousStatus : null;
      } catch {
        restoreStatus = null;
      }

      if (restoreStatus && restoreStatus !== "awaiting_docs") {
        const { data: remainingScheduled } = await supabase
          .from("whatsapp_message_queue")
          .select("id")
          .eq("lead_id", conversation.lead_id)
          .in("status", [...SCHEDULED_QUEUE_ACTIVE_STATUSES])
          .neq("id", queueId)
          .limit(1);

        if (!remainingScheduled?.length) {
          await supabase
            .from("leads")
            .update({ status: restoreStatus as any, updated_at: new Date().toISOString() } as any)
            .eq("id", conversation.lead_id);

          await supabase.from("lead_interactions").insert({
            lead_id: conversation.lead_id,
            interaction_type: "status_change" as any,
            old_status: "awaiting_docs" as any,
            new_status: restoreStatus as any,
            channel: "whatsapp",
            broker_id: conversation.broker_id,
            notes: `Lead voltou para ${restoreStatus} após cancelamento da mensagem programada`,
          } as any);
        }
      }

      await supabase.from("lead_interactions").insert({
        lead_id: conversation.lead_id,
        interaction_type: "note_added" as any,
        channel: "whatsapp",
        broker_id: conversation.broker_id,
        notes: `Mensagem programada cancelada (${new Date(target.scheduled_at).toLocaleString("pt-BR")}):\n\n${target.message}`,
      } as any);
    }

    setScheduledMessages((prev) => prev.filter((item) => item.id !== queueId));
    toast.success("Mensagem programada cancelada");
  }, [conversation, scheduledMessages]);

  return { messages, scheduledMessages, isLoading, fetchMessages, sendMessage, scheduleMessage, cancelScheduledMessage };
}
