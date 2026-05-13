// React Query cached broker features
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useBrokerFeatures(brokerId: string | null) {
  const { data, isLoading } = useQuery({
    queryKey: ["broker-features", brokerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("brokers")
        .select("copilot_enabled")
        .eq("id", brokerId!)
        .single();

      return {
        copilotEnabled: (data as any)?.copilot_enabled ?? false,
      };
    },
    enabled: !!brokerId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    copilotEnabled: data?.copilotEnabled ?? false,
    isLoading,
  };
}
