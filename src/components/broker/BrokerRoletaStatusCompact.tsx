import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { LogIn, LogOut } from "lucide-react";

interface RoletaStatus {
  id: string;
  nome: string;
  myCheckin: boolean;
  myMembroId: string;
  onlineCount: number;
  totalCount: number;
}

export function BrokerRoletaStatusCompact({ brokerId }: { brokerId: string }) {
  const [statuses, setStatuses] = useState<RoletaStatus[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data: myMembros, error: e1 } = await (supabase
        .from("roletas_membros" as any)
        .select("id, roleta_id, status_checkin")
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

      const statsMap = new Map<string, { online: number; total: number }>();
      ((allMembrosRes.data || []) as any[]).forEach((m: any) => {
        const s = statsMap.get(m.roleta_id) || { online: 0, total: 0 };
        s.total++;
        if (m.status_checkin) s.online++;
        statsMap.set(m.roleta_id, s);
      });

      const myMap = new Map<string, { checkin: boolean; membroId: string }>();
      (myMembros as any[]).forEach((m: any) => myMap.set(m.roleta_id, { checkin: m.status_checkin, membroId: m.id }));

      setStatuses(roletaIds.map((rid: string) => {
        const my = myMap.get(rid)!;
        const s = statsMap.get(rid) || { online: 0, total: 0 };
        return {
          id: rid,
          nome: namesMap.get(rid) || "",
          myCheckin: my.checkin,
          myMembroId: my.membroId,
          onlineCount: s.online,
          totalCount: s.total,
        };
      }));
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

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handleToggle = async (s: RoletaStatus) => {
    setTogglingId(s.myMembroId);
    try {
      const newCheckin = !s.myCheckin;
      const updates: any = {
        status_checkin: newCheckin,
        ...(newCheckin ? { checkin_em: new Date().toISOString() } : { checkout_em: new Date().toISOString() }),
      };
      const { error } = await (supabase
        .from("roletas_membros" as any)
        .update(updates)
        .eq("id", s.myMembroId) as any);
      if (error) throw error;
      toast.success(newCheckin ? "Check-in realizado!" : "Check-out realizado!");
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar check-in.");
    } finally {
      setTogglingId(null);
    }
  };

  if (statuses.length === 0) return null;

  const onlineCount = statuses.filter((s) => s.myCheckin).length;
  const offlineCount = statuses.length - onlineCount;

  return (
    <div ref={ref} className="relative flex items-center gap-1">
      {/* Dots */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 p-1 rounded-md active:bg-white/5 transition-colors"
      >
        {onlineCount > 0 && (
          <span className="relative flex items-center justify-center w-4 h-4">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            {onlineCount > 1 && (
              <span className="absolute -top-1 -right-1 min-w-[12px] h-[12px] rounded-full bg-emerald-500 text-[8px] font-bold text-white flex items-center justify-center">
                {onlineCount}
              </span>
            )}
          </span>
        )}
        {offlineCount > 0 && (
          <span className="relative flex items-center justify-center w-4 h-4">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
            {offlineCount > 1 && (
              <span className="absolute -top-1 -right-1 min-w-[12px] h-[12px] rounded-full bg-red-500 text-[8px] font-bold text-white flex items-center justify-center">
                {offlineCount}
              </span>
            )}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-[#1e1e22] border border-[#2a2a2e] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 border-b border-[#2a2a2e]">
            <span className="text-[11px] font-medium text-slate-400">Minhas Roletas</span>
          </div>
          {statuses.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  s.myCheckin ? "bg-emerald-400" : "bg-red-400"
                )} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">{s.nome}</p>
                  <p className="text-[10px] text-slate-500">{s.onlineCount}/{s.totalCount} online</p>
                </div>
              </div>
              <button
                disabled={togglingId === s.myMembroId}
                onClick={() => handleToggle(s)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors",
                  s.myCheckin
                    ? "bg-red-500/15 text-red-400 active:bg-red-500/25"
                    : "bg-emerald-500/15 text-emerald-400 active:bg-emerald-500/25"
                )}
              >
                {s.myCheckin ? <LogOut className="w-3 h-3" /> : <LogIn className="w-3 h-3" />}
                {s.myCheckin ? "Sair" : "Entrar"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
