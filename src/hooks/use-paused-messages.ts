import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PausedMessage {
  id: string;
  message: string;
  phone: string;
  scheduled_at: string;
  step_number: number | null;
  created_at: string;
  campaign_id: string | null;
  lead: { id: string; name: string; whatsapp: string } | null;
  campaign: { id: string; name: string } | null;
}

export function usePausedMessages(brokerId: string | undefined) {
  return useQuery({
    queryKey: ["paused-messages", brokerId],
    queryFn: async (): Promise<{ messages: PausedMessage[]; count: number }> => {
      if (!brokerId) return { messages: [], count: 0 };
      const { data, error } = await supabase.functions.invoke("whatsapp-paused-messages/list", {
        method: "GET",
      });
      if (error) throw error;
      return data as { messages: PausedMessage[]; count: number };
    },
    enabled: !!brokerId,
    refetchInterval: 30_000,
  });
}

export function useReschedulePausedMessages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      messageIds: string[];
      strategy: "now" | "spread" | "datetime";
      datetime?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "whatsapp-paused-messages/reschedule",
        { method: "POST", body: params },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paused-messages"] });
      qc.invalidateQueries({ queryKey: ["whatsapp-queue"] });
    },
  });
}

export function useDiscardPausedMessages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (messageIds: string[]) => {
      const { data, error } = await supabase.functions.invoke(
        "whatsapp-paused-messages/discard",
        { method: "POST", body: { messageIds } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paused-messages"] });
      qc.invalidateQueries({ queryKey: ["whatsapp-queue"] });
    },
  });
}
