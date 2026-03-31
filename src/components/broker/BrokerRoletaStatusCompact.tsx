import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface RoletaStatus {
  id: string;
  nome: string;
  myCheckin: boolean;
  onlineCount: number;
}

export function BrokerRoletaStatusCompact({ brokerId }: { brokerId: string }) {
  const [statuses, setStatuses] = useState<RoletaStatus[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const { data: myMembros, error: e1 } = await (supabase
        .from("roletas_membros" as any)
        .select("roleta_id, status_checkin")
        .eq("corretor_id", brokerId)
        .eq("ativo", true) as any);
      if (e1 || !myMembros?.length) { setStatuses([]); return; }

      const roletaIds = (myMembros as any[]).map((m) => m.roleta_id);

      const [roletasRes, allMembrosRes] = await Promise.all([
        (supabase.from("roletas" as any).select("id, nome").in("id", roletaIds) as any),
        (supabase.from("roletas_membros" as any).select("roleta_id, status_checkin").in("roleta_id", roletaIds).eq("ativo", true) as any),
      ]);

      if (roletasRes.error || allMembrosRes.error) return;

      const namesMap = new Map<string, string>();
      ((roletasRes.data || []) as any[]).forEach((r: any) => namesMap.set(r.id, r.nome));

      const onlineMap = new Map<string, number>();
      ((allMembrosRes.data || []) as any[]).forEach((m: any) => {
        if (m.status_checkin) onlineMap.set(m.roleta_id, (onlineMap.get(m.roleta_id) || 0) + 1);
      });

      const myCheckinMap = new Map<string, boolean>();
      (myMembros as any[]).forEach((m: any) => myCheckinMap.set(m.roleta_id, m.status_checkin));

      setStatuses(roletaIds.map((rid: string) => ({
        id: rid,
        nome: namesMap.get(rid) || "",
        myCheckin: myCheckinMap.get(rid) || false,
        onlineCount: onlineMap.get(rid) || 0,
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

  const allOnline = statuses.every((s) => s.myCheckin);
  const onlineCount = statuses.filter((s) => s.myCheckin).length;
  const offlineCount = statuses.length - onlineCount;

  return (
    <div className="flex items-center gap-1.5">
      {allOnline ? (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-emerald-400">Online</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-red-400">
            {offlineCount === statuses.length ? "Offline" : `${offlineCount} offline`}
          </span>
        </div>
      )}
    </div>
  );
}
