import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cancelCadenciaForLead } from "@/hooks/use-cadencia-ativa";
import { toast } from "sonner";

/**
 * Inactivates a lead linked to a conversation, mirroring the Kanban "Inativar Lead" flow:
 * - Cancels active cadence
 * - Sets lead.status = 'inactive', stores reason + timestamp + previous etapa
 * - Logs lead_interactions entry
 */
export function useInactivateLeadFromConversation() {
  return useCallback(async (leadId: string, reason: string) => {
    try {
      // Get current status to record etapa_perda
      const { data: leadData } = await supabase
        .from("leads")
        .select("status")
        .eq("id", leadId)
        .single();

      const oldStatus = leadData?.status || "new";

      await cancelCadenciaForLead(leadId);

      const now = new Date().toISOString();
      const { error } = await supabase
        .from("leads")
        .update({
          status: "inactive" as any,
          inactivation_reason: reason,
          inactivated_at: now,
          data_perda: now,
          etapa_perda: oldStatus,
          updated_at: now,
        } as any)
        .eq("id", leadId);

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("lead_interactions").insert({
        lead_id: leadId,
        interaction_type: "lead_inativado" as any,
        old_status: oldStatus,
        new_status: "inactive",
        notes: `Lead inativado: ${reason}`,
        created_by: user?.id,
      });

      toast.success("Lead inativado com sucesso.");
    } catch (err: any) {
      console.error("Erro ao inativar lead:", err);
      toast.error("Erro ao inativar lead.");
      throw err;
    }
  }, []);
}
