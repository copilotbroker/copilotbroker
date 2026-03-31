import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useInboxUnread() {
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["inbox-unread"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data: broker } = await supabase
        .from("brokers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let query = supabase
        .from("conversations")
        .select("unread_count")
        .gt("unread_count", 0)
        .eq("is_archived", false);

      if (broker) {
        query = query.eq("broker_id", broker.id);
      }

      const { data } = await query;
      return data?.reduce((sum, c) => sum + (c.unread_count || 0), 0) ?? 0;
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("inbox-unread")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["inbox-unread"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return { unreadCount };
}
