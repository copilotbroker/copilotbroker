import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface RoletaStatus {
  id: string;
  myCheckin: boolean;
}

interface Props {
  brokerId: string;
  onDotsClick?: () => void;
}

export function BrokerRoletaStatusCompact({ brokerId, onDotsClick }: Props) {
  const [statuses, setStatuses] = useState<RoletaStatus[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const { data: myMembros, error } = await (supabase
        .from("roletas_membros" as any)
        .select("roleta_id, status_checkin")
        .eq("corretor_id", brokerId)
        .eq("ativo", true) as any);
      if (error || !myMembros?.length) { setStatuses([]); return; }

      setStatuses((myMembros as any[]).map((m: any) => ({
        id: m.roleta_id,
        myCheckin: m.status_checkin,
      })));
    } catch { setStatuses([]); }
  }, [brokerId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (statuses.length === 0) return;
    const channels = statuses.map((s) =>
      supabase
        .channel(`roleta-status-compact-${s.id}`)
        .on("postgres_changes" as any, { event: "*", schema: "public", table: "roletas_membros", filter: `roleta_id=eq.${s.id}` }, () => fetchData())
        .subscribe()
    );
    return () => { channels.forEach((ch) => supabase.removeChannel(ch)); };
  }, [statuses.length, fetchData]);

  if (statuses.length === 0) return null;

  const onlineCount = statuses.filter((s) => s.myCheckin).length;
  const offlineCount = statuses.length - onlineCount;

  return (
    <button
      onClick={onDotsClick}
      className="flex items-center gap-1.5 p-1.5 rounded-md active:bg-white/5 transition-colors"
    >
      <span className="relative flex items-center justify-center w-4 h-4">
        <span className={cn(
          "w-2.5 h-2.5 rounded-full",
          onlineCount > 0 ? "bg-emerald-400" : "bg-emerald-400/20 border border-emerald-400/30"
        )} />
        {onlineCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[12px] h-[12px] rounded-full bg-emerald-500 text-[8px] font-bold text-white flex items-center justify-center">
            {onlineCount}
          </span>
        )}
      </span>
      {offlineCount > 0 && (
        <span className="relative flex items-center justify-center w-4 h-4">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
          <span className="absolute -top-1 -right-1 min-w-[12px] h-[12px] rounded-full bg-red-500 text-[8px] font-bold text-white flex items-center justify-center">
            {offlineCount}
          </span>
        </span>
      )}
    </button>
  );
}
