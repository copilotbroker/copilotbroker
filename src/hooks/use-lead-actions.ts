import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cancelCadenciaForLead } from "@/hooks/use-cadencia-ativa";

/**
 * Centralized lead-mutation actions used by BOTH the Kanban and the Inbox.
 *
 * Goal: keep Kanban columns and Conversation list always in sync without polling.
 * - Every mutation invalidates the kanban-* React Query keys for the affected statuses.
 * - Realtime channel `kanban-realtime` (in KanbanBoard) propagates DB changes to other open tabs.
 */
export function useLeadActions() {
  const queryClient = useQueryClient();

  const invalidateStatuses = useCallback((...statuses: (string | undefined | null)[]) => {
    statuses.filter(Boolean).forEach((s) => {
      queryClient.invalidateQueries({ queryKey: ["kanban-column", s] });
      queryClient.invalidateQueries({ queryKey: ["kanban-count", s] });
    });
    queryClient.invalidateQueries({ queryKey: ["kanban-active-flow-ids"] });
  }, [queryClient]);

  /**
   * Move lead from "new" to "info_sent" (Iniciar Atendimento).
   * Optionally claims a conversation (sets broker_id + attendance_started).
   */
  const iniciarAtendimento = useCallback(async (
    leadId: string,
    options?: { conversationId?: string; brokerId?: string | null; silent?: boolean }
  ) => {
    try {
      const now = new Date().toISOString();
      const { data: leadRow } = await supabase
        .from("leads")
        .select("status, broker_id")
        .eq("id", leadId)
        .maybeSingle();

      const oldStatus = (leadRow as any)?.status || "new";
      const brokerId = options?.brokerId ?? (leadRow as any)?.broker_id ?? null;

      const updates: Record<string, any> = {
        status: "info_sent",
        atendimento_iniciado_em: now,
        status_distribuicao: "atendimento_iniciado",
        reserva_expira_em: null,
        updated_at: now,
      };
      if (options?.brokerId) updates.broker_id = options.brokerId;

      const { error } = await supabase.from("leads").update(updates as any).eq("id", leadId);
      if (error) throw error;

      // Claim conversation if provided
      if (options?.conversationId) {
        await supabase
          .from("conversations")
          .update({
            attendance_started: true,
            ...(options.brokerId ? { broker_id: options.brokerId } : {}),
            updated_at: now,
          } as any)
          .eq("id", options.conversationId);
      }

      // Audit
      const { data: { user } } = await supabase.auth.getUser();
      supabase.from("lead_interactions").insert({
        lead_id: leadId,
        interaction_type: "atendimento_iniciado" as any,
        old_status: oldStatus,
        new_status: "info_sent",
        broker_id: brokerId,
        notes: "Atendimento iniciado",
        created_by: user?.id,
      } as any).then(({ error: iErr }) => {
        if (iErr) console.error("lead_interactions insert error:", iErr);
      });

      invalidateStatuses(oldStatus, "info_sent");
      if (!options?.silent) toast.success("Atendimento iniciado!");
      return { success: true };
    } catch (err) {
      console.error("iniciarAtendimento error:", err);
      toast.error("Erro ao iniciar atendimento.");
      return { success: false };
    }
  }, [invalidateStatuses]);

  /**
   * Generic status advance (used by inbox "Avançar para X" button).
   */
  const advanceStatus = useCallback(async (
    leadId: string,
    newStatus: string,
    options?: { silent?: boolean }
  ) => {
    try {
      const { data: leadRow } = await supabase
        .from("leads")
        .select("status")
        .eq("id", leadId)
        .maybeSingle();
      const oldStatus = (leadRow as any)?.status || null;

      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus, updated_at: new Date().toISOString() } as any)
        .eq("id", leadId);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("lead_interactions").insert({
        lead_id: leadId,
        interaction_type: "status_change" as any,
        old_status: oldStatus,
        new_status: newStatus,
        created_by: user?.id,
      } as any);

      invalidateStatuses(oldStatus, newStatus);
      if (!options?.silent) toast.success("Status atualizado!");
      return true;
    } catch (err) {
      console.error("advanceStatus error:", err);
      toast.error("Erro ao atualizar status");
      return false;
    }
  }, [invalidateStatuses]);

  /**
   * Inactivate a lead — works the same whether triggered from Kanban or Inbox.
   * Cancels active cadence, archives linked conversations, cancels pending WhatsApp queue,
   * logs interaction, invalidates Kanban queries.
   */
  const inactivateLead = useCallback(async (leadId: string, reason: string) => {
    try {
      const { data: leadRow } = await supabase
        .from("leads")
        .select("status")
        .eq("id", leadId)
        .maybeSingle();
      const oldStatus = (leadRow as any)?.status || "new";

      await cancelCadenciaForLead(leadId);

      const now = new Date().toISOString();
      const { error } = await supabase
        .from("leads")
        .update({
          status: "inactive",
          inactivation_reason: reason,
          inactivated_at: now,
          data_perda: now,
          etapa_perda: oldStatus,
          updated_at: now,
        } as any)
        .eq("id", leadId);
      if (error) throw error;

      // Archive linked conversations
      await supabase
        .from("conversations")
        .update({ is_archived: true, status: "closed", updated_at: now } as any)
        .eq("lead_id", leadId);

      // Cancel pending WhatsApp messages
      await supabase
        .from("whatsapp_message_queue")
        .update({ status: "cancelled", updated_at: now } as any)
        .eq("lead_id", leadId)
        .in("status", ["queued", "scheduled"]);

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("lead_interactions").insert({
        lead_id: leadId,
        interaction_type: "lead_inativado" as any,
        old_status: oldStatus,
        new_status: "inactive",
        notes: `Lead inativado: ${reason}`,
        created_by: user?.id,
      } as any);

      invalidateStatuses(oldStatus, "inactive");
      toast.success("Lead inativado.");
      return true;
    } catch (err) {
      console.error("inactivateLead error:", err);
      toast.error("Erro ao inativar lead.");
      return false;
    }
  }, [invalidateStatuses]);

  return { iniciarAtendimento, advanceStatus, inactivateLead };
}
