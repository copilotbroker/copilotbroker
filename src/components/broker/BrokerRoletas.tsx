import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RotateCw, LogIn, LogOut, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RoletaMembroFull {
  id: string;
  ordem: number;
  status_checkin: boolean;
  checkin_em: string | null;
  checkout_em: string | null;
  corretor_id: string;
  roleta_id: string;
  ativo: boolean;
  corretor?: { id: string; name: string } | null;
}

interface RoletaData {
  id: string;
  nome: string;
  ativa: boolean;
  tempo_reserva_minutos: number;
  ultimo_membro_ordem_atribuida: number;
}

interface RoletaGroup {
  roleta: RoletaData;
  myMembro: RoletaMembroFull;
  allMembros: RoletaMembroFull[];
}

function getNextMembro(membros: RoletaMembroFull[], ultimaOrdem: number): string | null {
  const online = membros.filter((m) => m.status_checkin).sort((a, b) => a.ordem - b.ordem);
  if (online.length === 0) return null;
  const next = online.find((m) => m.ordem > ultimaOrdem);
  return (next || online[0])?.id || null;
}

export function BrokerRoletas({ brokerId }: { brokerId: string }) {
  const [groups, setGroups] = useState<RoletaGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [expandedRoletas, setExpandedRoletas] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: myMembros, error: e1 } = await (supabase
        .from("roletas_membros" as any)
        .select("*")
        .eq("corretor_id", brokerId)
        .eq("ativo", true) as any);
      if (e1) throw e1;
      if (!myMembros || myMembros.length === 0) {
        setGroups([]);
        return;
      }

      const roletaIds = (myMembros as any[]).map((m) => m.roleta_id);

      const [roletasRes, allMembrosRes] = await Promise.all([
        (supabase
          .from("roletas" as any)
          .select("id, nome, ativa, tempo_reserva_minutos, ultimo_membro_ordem_atribuida")
          .in("id", roletaIds) as any),
        (supabase
          .from("roletas_membros" as any)
          .select("*, corretor:brokers(id, name)")
          .in("roleta_id", roletaIds)
          .eq("ativo", true)
          .order("ordem", { ascending: true }) as any),
      ]);

      if (roletasRes.error) throw roletasRes.error;
      if (allMembrosRes.error) throw allMembrosRes.error;

      const roletasMap = new Map<string, RoletaData>();
      ((roletasRes.data || []) as RoletaData[]).forEach((r) => roletasMap.set(r.id, r));

      const membrosMap = new Map<string, RoletaMembroFull[]>();
      ((allMembrosRes.data || []) as RoletaMembroFull[]).forEach((m) => {
        const list = membrosMap.get(m.roleta_id) || [];
        list.push(m);
        membrosMap.set(m.roleta_id, list);
      });

      const result: RoletaGroup[] = [];
      for (const myM of myMembros as RoletaMembroFull[]) {
        const roleta = roletasMap.get(myM.roleta_id);
        if (!roleta) continue;
        result.push({
          roleta,
          myMembro: myM,
          allMembros: membrosMap.get(myM.roleta_id) || [],
        });
      }
      setGroups(result);
    } catch (error) {
      console.error("Erro ao buscar roletas:", error);
    } finally {
      setIsLoading(false);
    }
  }, [brokerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (groups.length === 0) return;
    const roletaIds = groups.map((g) => g.roleta.id);
    const channels = roletaIds.map((rid) =>
      supabase
        .channel(`roleta-membros-${rid}`)
        .on(
          "postgres_changes" as any,
          { event: "*", schema: "public", table: "roletas_membros", filter: `roleta_id=eq.${rid}` },
          () => fetchData()
        )
        .subscribe()
    );
    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [groups.length, fetchData]);

  const handleToggleCheckin = async (membro: RoletaMembroFull) => {
    setTogglingId(membro.id);
    try {
      const newCheckin = !membro.status_checkin;
      const updates: any = {
        status_checkin: newCheckin,
        ...(newCheckin
          ? { checkin_em: new Date().toISOString() }
          : { checkout_em: new Date().toISOString() }),
      };
      const { error } = await (supabase
        .from("roletas_membros" as any)
        .update(updates)
        .eq("id", membro.id) as any);
      if (error) throw error;
      toast.success(newCheckin ? "Check-in realizado!" : "Check-out realizado!");
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar check-in.");
    } finally {
      setTogglingId(null);
    }
  };

  const toggleExpanded = (roletaId: string) => {
    setExpandedRoletas((prev) => {
      const next = new Set(prev);
      next.has(roletaId) ? next.delete(roletaId) : next.add(roletaId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-2 flex items-center justify-center">
        <RotateCw className="w-4 h-4 animate-spin text-primary" />
      </div>
    );
  }

  if (groups.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="flex flex-col divide-y divide-border">
        {groups.map(({ roleta, myMembro, allMembros }) => {
          const onlineCount = allMembros.filter((m) => m.status_checkin).length;
          const isExpanded = expandedRoletas.has(roleta.id);
          const nextId = getNextMembro(allMembros, roleta.ultimo_membro_ordem_atribuida);
          const isNext = myMembro.id === nextId;

          return (
            <div key={myMembro.id}>
              <div className="px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleExpanded(roleta.id)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors min-w-0"
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        myMembro.status_checkin ? "bg-emerald-400" : "bg-red-400"
                      )}
                    />
                    <span className="font-medium text-foreground truncate">{roleta.nome}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">({onlineCount})</span>
                    {isNext && myMembro.status_checkin && (
                      <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[9px] px-1 py-0 leading-tight shrink-0">
                        Próximo
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3 h-3 shrink-0" />
                    )}
                  </button>
                  <Button
                    size="sm"
                    variant={myMembro.status_checkin ? "destructive" : "default"}
                    disabled={togglingId === myMembro.id}
                    onClick={() => handleToggleCheckin(myMembro)}
                    className={cn(
                      "h-6 text-[10px] px-2 shrink-0",
                      !myMembro.status_checkin && "bg-emerald-600 hover:bg-emerald-700"
                    )}
                  >
                    {myMembro.status_checkin ? (
                      <><LogOut className="w-3 h-3 mr-1" />Out</>
                    ) : (
                      <><LogIn className="w-3 h-3 mr-1" />In</>
                    )}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border px-3 py-2">
                  <p className="text-[10px] text-muted-foreground mb-1">
                    Fila: {roleta.nome} — {onlineCount} online
                  </p>
                  <div className="space-y-0.5">
                    {allMembros.filter((m) => m.status_checkin).map((m) => {
                      const isMe = m.corretor_id === brokerId;
                      const isMNext = m.id === nextId;
                      const corretorName = (m.corretor as any)?.name || "Corretor";

                      return (
                        <div
                          key={m.id}
                          className={cn(
                            "flex items-center justify-between py-0.5 px-1.5 rounded text-[11px]",
                            isMe && "bg-accent/50"
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <span className="text-muted-foreground w-4">#{m.ordem}</span>
                            <span className={cn("text-foreground", isMe && "font-semibold")}>
                              {isMe ? "Você" : corretorName}
                            </span>
                          </div>
                          {isMNext && (
                            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[9px] px-1 py-0">
                              Próximo
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
