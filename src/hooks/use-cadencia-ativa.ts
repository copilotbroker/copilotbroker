import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CadenciaAtiva {
  isActive: boolean;
  campaignId: string | null;
  nextMessageAt: string | null;
  cancel: () => Promise<void>;
  isLoading: boolean;
}

export function useCadenciaAtiva(leadId: string | undefined): CadenciaAtiva {
  const queryClient = useQueryClient();
  const queryKey = ["cadencia-ativa", leadId];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!leadId) return null;

      // Find active cadence for this lead
      const { data: campaigns, error } = await (supabase
        .from("whatsapp_campaigns")
        .select("id, status") as any)
        .eq("lead_id", leadId)
        .eq("status", "running")
        .limit(1);

      if (error) throw error;
      if (!campaigns || campaigns.length === 0) return null;

      const campaign = campaigns[0];

      // Get next scheduled message
      const { data: nextMsg } = await supabase
        .from("whatsapp_message_queue")
        .select("scheduled_at")
        .eq("campaign_id", campaign.id)
        .eq("status", "scheduled")
        .order("scheduled_at", { ascending: true })
        .limit(1);

      return {
        campaignId: campaign.id,
        nextMessageAt: nextMsg?.[0]?.scheduled_at || null,
      };
    },
    enabled: !!leadId,
    refetchInterval: 60000, // Refetch every minute to update countdown
  });

  // Realtime subscription for campaign status changes
  useEffect(() => {
    if (!leadId) return;

    const channel = supabase
      .channel(`cadencia-${leadId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_campaigns" },
        (payload) => {
          const record = payload.new as any;
          if (record?.lead_id === leadId) {
            queryClient.invalidateQueries({ queryKey });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_message_queue" },
        () => {
          // Invalidate to refresh next message time
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, queryClient]);

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!data?.campaignId) return;

      // Fetch previous status before cancelling
      const { data: campaignInfo } = await (supabase
        .from("whatsapp_campaigns")
        .select("lead_previous_status") as any)
        .eq("id", data.campaignId)
        .maybeSingle();

      let restoreStatus = campaignInfo?.lead_previous_status || "info_sent";
      if (restoreStatus === "new") restoreStatus = "info_sent";

      // Cancel campaign
      const { error: campError } = await supabase
        .from("whatsapp_campaigns")
        .update({ status: "cancelled" })
        .eq("id", data.campaignId);

      if (campError) throw campError;

      // Cancel pending messages
      await supabase
        .from("whatsapp_message_queue")
        .update({ status: "cancelled" })
        .eq("campaign_id", data.campaignId)
        .in("status", ["scheduled", "queued", "paused_by_system"]);

      // Restore lead to previous status
      if (leadId) {
        const { data: lead } = await supabase
          .from("leads")
          .select("status")
          .eq("id", leadId)
          .single();

        if (lead && (lead as any).status === "awaiting_docs") {
          await supabase
            .from("leads")
            .update({ status: restoreStatus, updated_at: new Date().toISOString() })
            .eq("id", leadId);
        }
      }
    },
    onSuccess: () => {
      toast.success("Cadência cancelada");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      toast.error("Erro ao cancelar cadência");
    },
  });

  return {
    isActive: !!data?.campaignId,
    campaignId: data?.campaignId || null,
    nextMessageAt: data?.nextMessageAt || null,
    cancel: cancelMutation.mutateAsync,
    isLoading,
  };
}

// Utility to cancel all future flows for a lead (used by kanban hooks)
export async function cancelCadenciaForLead(leadId: string): Promise<void> {
  const nowIso = new Date().toISOString();

  const [{ data: campaigns }, { data: queuedMessages }, { data: lead }] = await Promise.all([
    (supabase
      .from("whatsapp_campaigns")
      .select("id, lead_previous_status") as any)
      .eq("lead_id", leadId)
      .eq("status", "running"),
    supabase
      .from("whatsapp_message_queue")
      .select("id")
      .eq("lead_id", leadId)
      .in("status", ["scheduled", "queued", "paused_by_system", "sending"]),
    supabase
      .from("leads")
      .select("status, broker_id")
      .eq("id", leadId)
      .maybeSingle(),
  ]);

  let restoreStatus = campaigns?.find((campaign) => campaign.lead_previous_status && campaign.lead_previous_status !== "awaiting_docs" && campaign.lead_previous_status !== "new")?.lead_previous_status || "info_sent";
  if (restoreStatus === "new") restoreStatus = "info_sent";

  if (campaigns && campaigns.length > 0) {
    await Promise.all(campaigns.map((campaign) => (
      Promise.all([
        supabase.from("whatsapp_campaigns").update({ status: "cancelled", updated_at: nowIso }).eq("id", campaign.id),
        supabase.from("whatsapp_message_queue").update({ status: "cancelled", updated_at: nowIso }).eq("campaign_id", campaign.id).in("status", ["scheduled", "queued", "paused_by_system", "sending"]),
      ])
    )));
  }

  if (queuedMessages && queuedMessages.length > 0) {
    await supabase
      .from("whatsapp_message_queue")
      .update({ status: "cancelled", updated_at: nowIso })
      .eq("lead_id", leadId)
      .in("status", ["scheduled", "queued", "paused_by_system", "sending"]);
  }

  const { data: remainingScheduled } = await supabase
    .from("whatsapp_message_queue")
    .select("id")
    .eq("lead_id", leadId)
    .in("status", ["scheduled", "queued", "paused_by_system", "sending"])
    .limit(1);

  if (lead && (lead as any).status === "awaiting_docs" && (!remainingScheduled || remainingScheduled.length === 0)) {
    await supabase
      .from("leads")
      .update({ status: restoreStatus, updated_at: nowIso })
      .eq("id", leadId);

    await supabase.from("lead_interactions").insert({
      lead_id: leadId,
      broker_id: (lead as any).broker_id,
      interaction_type: "status_change" as any,
      old_status: "awaiting_docs" as any,
      new_status: restoreStatus as any,
      channel: "whatsapp",
      notes: `Fluxos futuros cancelados — lead voltou para ${restoreStatus}`,
    });
  }
}
