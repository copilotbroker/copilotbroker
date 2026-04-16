import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Conversation } from "@/hooks/use-conversations";

interface AutoCreateLeadOptions {
  brokerId: string | null;
  sourceType: "personal" | "global";
  onLeadCreated?: (conversation: Conversation, leadId: string, leadName: string) => void;
}

/**
 * Hook that auto-creates a Kanban card (lead) when a broker sends the first
 * outbound message to a conversation that has no lead_id yet.
 *
 * Returns a callback to be passed as `onAutoCreateLead` to `useConversationMessages`.
 */
export function useAutoCreateLead({ brokerId, sourceType, onLeadCreated }: AutoCreateLeadOptions) {
  const pendingRef = useRef<Set<string>>(new Set());

  const autoCreateLead = useCallback(async (conversation: Conversation) => {
    if (!brokerId) return;
    if (conversation.lead_id) return;
    if (pendingRef.current.has(conversation.id)) return;

    pendingRef.current.add(conversation.id);

    try {
      // Double-check in DB to prevent race conditions
      const { data: freshConv } = await supabase
        .from("conversations")
        .select("lead_id")
        .eq("id", conversation.id)
        .single();

      if (freshConv?.lead_id) {
        return; // Already has a lead
      }

      const displayName = conversation.display_name || conversation.phone;
      const isGlobal = sourceType === "global" || conversation.source_instance === "global";
      const source = isGlobal ? "whatsapp_global" : "whatsapp";
      const leadOrigin = isGlobal ? "whatsapp_plantao" : "whatsapp_direto";

      const { data: newLead, error: leadError } = await supabase
        .from("leads")
        .insert({
          name: displayName,
          whatsapp: conversation.phone.replace(/^\+/, ''),
          broker_id: brokerId,
          status: "info_sent" as any,
          source,
          lead_origin: leadOrigin,
          atendimento_iniciado_em: new Date().toISOString(),
          status_distribuicao: "atendimento_iniciado" as any,
        } as any)
        .select("id")
        .single();

      if (leadError || !newLead) {
        console.error("Auto-create lead error:", leadError);
        return;
      }

      const leadId = (newLead as any).id;
      const { data: unifiedId } = await supabase.rpc("unify_lead", { _new_lead_id: leadId });
      const finalLeadId = unifiedId || leadId;

      await supabase
        .from("conversations")
        .update({ lead_id: finalLeadId } as any)
        .eq("id", conversation.id);

      await supabase.from("lead_interactions").insert({
        lead_id: finalLeadId,
        interaction_type: "atendimento_iniciado" as any,
        notes: `Atendimento iniciado automaticamente ao responder via ${isGlobal ? "Plantão" : "Inbox pessoal"}`,
        broker_id: brokerId,
        channel: "whatsapp",
        new_status: "info_sent",
      } as any);

      toast.success("Card criado automaticamente no Kanban!");
      onLeadCreated?.(conversation, finalLeadId, displayName);
    } catch (error) {
      console.error("Erro ao auto-criar lead:", error);
    } finally {
      pendingRef.current.delete(conversation.id);
    }
  }, [brokerId, sourceType, onLeadCreated]);

  return autoCreateLead;
}
