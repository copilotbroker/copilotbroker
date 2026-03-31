import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePlantaoNovosCount() {
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    const { count: total } = await supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("source_instance", "global")
      .eq("attendance_started", false)
      .eq("is_archived", false);

    setCount(total ?? 0);
  };

  useEffect(() => {
    fetchCount();

    const channel = supabase
      .channel("plantao-novos-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        fetchCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { count };
}
