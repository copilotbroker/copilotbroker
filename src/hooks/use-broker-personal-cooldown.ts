import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const PERSONAL_COOLDOWN_HOURS = 24;

export interface PersonalCooldownInfo {
  active: boolean;
  unlocksAt: Date | null;
  hoursRemaining: number;
  minutesRemaining: number;
  connectedAt: Date | null;
}

function compute(connectedAt: string | null | undefined): PersonalCooldownInfo {
  if (!connectedAt) return { active: false, unlocksAt: null, hoursRemaining: 0, minutesRemaining: 0, connectedAt: null };
  const ts = new Date(connectedAt);
  if (Number.isNaN(ts.getTime())) return { active: false, unlocksAt: null, hoursRemaining: 0, minutesRemaining: 0, connectedAt: null };
  const unlocksAt = new Date(ts.getTime() + PERSONAL_COOLDOWN_HOURS * 60 * 60 * 1000);
  const remainingMs = unlocksAt.getTime() - Date.now();
  return {
    active: remainingMs > 0,
    unlocksAt,
    hoursRemaining: Math.max(0, Math.ceil(remainingMs / (60 * 60 * 1000))),
    minutesRemaining: Math.max(0, Math.ceil(remainingMs / (60 * 1000))),
    connectedAt: ts,
  };
}

/**
 * Tracks the 24h post-connection cooldown for a broker's personal WhatsApp instance.
 * During cooldown, the broker can only REPLY (after lead inbound), not initiate contact.
 */
export function useBrokerPersonalCooldown(brokerId: string | undefined): PersonalCooldownInfo {
  const { data: connectedAt } = useQuery({
    queryKey: ["broker-personal-cooldown", brokerId],
    queryFn: async () => {
      if (!brokerId) return null;
      const { data } = await supabase
        .from("broker_whatsapp_instances")
        .select("connected_at, status")
        .eq("broker_id", brokerId)
        .maybeSingle();
      if (!data || data.status !== "connected") return null;
      return data.connected_at as string | null;
    },
    enabled: !!brokerId,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Tick every minute so countdown updates without refetching
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  return compute(connectedAt);
}
