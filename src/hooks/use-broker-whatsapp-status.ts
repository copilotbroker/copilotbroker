import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useBrokerWhatsAppStatus(brokerId: string | undefined) {
  return useQuery({
    queryKey: ["broker-whatsapp-status", brokerId],
    queryFn: async () => {
      if (!brokerId) return null;
      const { data } = await supabase
        .from("broker_whatsapp_instances")
        .select("status")
        .eq("broker_id", brokerId)
        .maybeSingle();
      return data;
    },
    enabled: !!brokerId,
    refetchInterval: 60_000,
  });
}
