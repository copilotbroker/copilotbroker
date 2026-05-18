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
      // Silently degrade when the logged-in user isn't a broker (admins/leaders
      // viewing broker routes). Avoid throwing so React Query doesn't crash the layout.
      if (error) {
        console.warn("[usePausedMessages] skipped:", (error as Error).message || error);
        return { messages: [], count: 0 };
      }
      return data as { messages: PausedMessage[]; count: number };
    },
    enabled: !!brokerId,
    refetchInterval: 30_000,
    retry: false,
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
    mutationFn: async (input: string[] | { all: true }) => {
      const body = Array.isArray(input) ? { messageIds: input } : { all: true };
      const { data, error } = await supabase.functions.invoke(
        "whatsapp-paused-messages/discard",
        { method: "POST", body },
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
