import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useBrokerFeatures(brokerId: string | null) {
  const [inboxEnabled, setInboxEnabled] = useState(false);
  const [copilotEnabled, setCopilotEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!brokerId) { setIsLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from("brokers")
        .select("inbox_enabled, copilot_enabled")
        .eq("id", brokerId)
        .single();

      if (data) {
        setInboxEnabled((data as any).inbox_enabled ?? false);
        setCopilotEnabled((data as any).copilot_enabled ?? false);
      }
      setIsLoading(false);
    };

    fetch();
  }, [brokerId]);

  return { inboxEnabled, copilotEnabled, isLoading };
}
