import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WhatsAppLabel {
  id: string;
  broker_id: string;
  external_id: string | null;
  name: string;
  color: string | null;
  source: string;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

interface LeadLabelLink {
  id: string;
  lead_id: string;
  label_id: string;
  broker_id: string;
  applied_via: string;
  external_chat_id: string | null;
  created_at: string;
  updated_at: string;
  label?: WhatsAppLabel | null;
}

interface UseLeadWhatsAppLabelsOptions {
  leadId: string;
  brokerId?: string | null;
  phone?: string | null;
  enabled?: boolean;
}

export function useLeadWhatsAppLabels({ leadId, brokerId, phone, enabled = true }: UseLeadWhatsAppLabelsOptions) {
  const queryClient = useQueryClient();

  const labelsQuery = useQuery({
    queryKey: ["whatsapp-labels", brokerId],
    enabled: !!brokerId && enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_labels")
        .select("*")
        .eq("broker_id", brokerId)
        .order("name");

      if (error) throw error;
      return (data || []) as WhatsAppLabel[];
    },
    staleTime: 30_000,
  });

  const leadLabelsQuery = useQuery({
    queryKey: ["lead-whatsapp-labels", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_whatsapp_labels")
        .select("*, label:whatsapp_labels(*)")
        .eq("lead_id", leadId);

      if (error) throw error;
      return (data || []) as LeadLabelLink[];
    },
    staleTime: 15_000,
  });

  const appliedLabelIds = useMemo(
    () => new Set((leadLabelsQuery.data || []).map((item) => item.label_id)),
    [leadLabelsQuery.data],
  );

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["whatsapp-labels", brokerId] }),
      queryClient.invalidateQueries({ queryKey: ["lead-whatsapp-labels", leadId] }),
    ]);
  };

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!leadId) throw new Error("Lead inválido");
      const { error } = await supabase.functions.invoke("whatsapp-labels", {
        body: {
          action: "sync",
          leadId,
          phone,
        },
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      await refresh();
    },
    onError: (error) => {
      console.error("Erro ao sincronizar etiquetas:", error);
      toast.error("Não foi possível sincronizar as etiquetas");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ labelId, shouldApply }: { labelId: string; shouldApply: boolean }) => {
      const { error } = await supabase.functions.invoke("whatsapp-labels", {
        body: {
          action: shouldApply ? "apply" : "remove",
          leadId,
          labelId,
          phone,
        },
      });

      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      await refresh();
      toast.success(variables.shouldApply ? "Etiqueta aplicada" : "Etiqueta removida");
    },
    onError: (error) => {
      console.error("Erro ao atualizar etiqueta:", error);
      toast.error("Não foi possível atualizar a etiqueta");
    },
  });

  return {
    labels: labelsQuery.data || [],
    leadLabels: leadLabelsQuery.data || [],
    appliedLabelIds,
    isLoading: labelsQuery.isLoading || leadLabelsQuery.isLoading,
    isSyncing: syncMutation.isPending,
    isToggling: toggleMutation.isPending,
    syncLabels: () => syncMutation.mutateAsync(),
    toggleLabel: (labelId: string, shouldApply: boolean) => toggleMutation.mutateAsync({ labelId, shouldApply }),
  };
}
