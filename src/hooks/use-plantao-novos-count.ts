import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/use-user-role";

export function usePlantaoNovosCount() {
  const [count, setCount] = useState(0);
  const { role, brokerId } = useUserRole();

  useEffect(() => {
    const fetchCount = async () => {
      // Admins/leaders see total queue; brokers see only their own unattended
      let query = supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("source_instance", "global")
        .eq("attendance_started", false)
        .eq("is_archived", false);

      if (role === "broker" && brokerId) {
        query = query.eq("broker_id", brokerId);
      }

      const { count: total } = await query;
      setCount(total ?? 0);
    };

    fetchCount();

    const channel = supabase
      .channel("plantao-novos-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        fetchCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [role, brokerId]);

  return { count };
}
