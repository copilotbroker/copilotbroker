import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Target, AlertCircle, TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInactivationReasonLabel, getOriginDisplayLabel } from "@/types/crm";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface Props {
  brokerId: string;
  projectId?: string | null;
  periodStart: Date;
  periodEnd: Date;
}

function MiniStat({ label, value, highlight, alert }: {
  label: string; value: string | number; highlight?: boolean; alert?: boolean;
}) {
  return (
    <div className={`rounded-lg p-2.5 border ${
      highlight ? "bg-emerald-500/5 border-emerald-500/30" :
      alert ? "bg-amber-500/5 border-amber-500/30" :
      "bg-[#16161a] border-[#2a2a2e]"
    }`}>
      <p className="text-[10px] text-slate-400 truncate">{label}</p>
      <p className={`text-sm font-bold ${highlight ? "text-emerald-400" : alert ? "text-amber-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

function fmtHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}min`;
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

const fmtPct = (v: number) => `${v.toFixed(1)}%`;

export function BrokerIndividualPerformance({ brokerId, projectId, periodStart, periodEnd }: Props) {
  // Fetch leads for this broker
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["broker-individual-perf", brokerId, projectId, periodStart.toISOString(), periodEnd.toISOString()],
    queryFn: async () => {
      let q = supabase.from("leads").select(
        "id, name, status, lead_origin, project_id, created_at, inactivation_reason, atendimento_iniciado_em, data_agendamento, comparecimento, data_envio_proposta, data_fechamento, last_interaction_at"
      )
        .eq("broker_id", brokerId)
        .gte("created_at", periodStart.toISOString())
        .lte("created_at", periodEnd.toISOString());
      if (projectId) q = q.eq("project_id", projectId);
      const { data } = await q.order("created_at", { ascending: false }).limit(5000);
      return data || [];
    },
    enabled: !!brokerId,
    staleTime: 60_000,
  });

  // Fetch interactions
  const { data: interactions = [] } = useQuery({
    queryKey: ["broker-individual-interactions", brokerId, periodStart.toISOString(), periodEnd.toISOString()],
    queryFn: async () => {
      const { data } = await supabase.from("lead_interactions")
        .select("id, interaction_type, broker_id")
        .eq("broker_id", brokerId)
        .gte("created_at", periodStart.toISOString())
        .lte("created_at", periodEnd.toISOString())
        .limit(5000);
      return data || [];
    },
    enabled: !!brokerId,
    staleTime: 60_000,
  });

  // Fetch stale leads
  const { data: staleLeads = [] } = useQuery({
    queryKey: ["broker-individual-stale", brokerId],
    queryFn: async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const { data } = await supabase.from("leads").select("id")
        .eq("broker_id", brokerId)
        .lt("last_interaction_at", cutoff.toISOString())
        .not("status", "in", '("inactive","registered")')
        .limit(5000);
      return data || [];
    },
    enabled: !!brokerId,
    staleTime: 60_000,
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ["broker-individual-projects"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("id, name").eq("is_active", true);
      return data || [];
    },
    staleTime: 5 * 60_000,
  });

  const projectMap = useMemo(() => {
    const m: Record<string, string> = {};
    (projects as any[]).forEach(p => { m[p.id] = p.name; });
    return m;
  }, [projects]);

  const individualData = useMemo(() => {
    if (leads.length === 0) return null;
    const leadsArr = leads as any[];
    const total = leadsArr.length;
    const att = leadsArr.filter((l) => l.atendimento_iniciado_em);
    const sched = leadsArr.filter((l) => l.data_agendamento);
    const vis = leadsArr.filter((l) => l.comparecimento === true);
    const prop = leadsArr.filter((l) => l.data_envio_proposta);
    const sale = leadsArr.filter((l) => l.data_fechamento);
    const lost = leadsArr.filter((l) => l.status === "inactive");
    const stale = staleLeads.length;

    const calcRate = (num: number, den: number) => den === 0 ? 0 : (num / den) * 100;
    const convVisit = calcRate(vis.length, att.length || total);
    const convSchedule = calcRate(sched.length, att.length || total);
    const convProposal = calcRate(prop.length, att.length || total);
    const convSale = calcRate(sale.length, att.length || total);

    // Calls & followups
    const calls = (interactions as any[]).filter((i) => i.interaction_type === "ligacao").length;
    const followups = (interactions as any[]).filter((i) =>
      i.interaction_type === "note_added" || i.interaction_type === "contact_attempt" || i.interaction_type === "whatsapp_manual"
    ).length;

    // Median response time
    const times: number[] = [];
    att.forEach((l: any) => {
      if (l.created_at && l.atendimento_iniciado_em) {
        const diff = (new Date(l.atendimento_iniciado_em).getTime() - new Date(l.created_at).getTime()) / 3600000;
        if (diff >= 0 && diff < 720) times.push(diff);
      }
    });
    times.sort((a, b) => a - b);
    const responseTime = times.length > 0 ? times[Math.floor(times.length / 2)] : null;

    // Best origins
    const originConv: Record<string, { total: number; sold: number }> = {};
    leadsArr.forEach((l) => {
      const o = l.lead_origin || "Não identificada";
      if (!originConv[o]) originConv[o] = { total: 0, sold: 0 };
      originConv[o].total++;
      if (l.data_fechamento) originConv[o].sold++;
    });
    const bestOrigins = Object.entries(originConv)
      .filter(([, v]) => v.total >= 2)
      .map(([key, v]) => ({ label: getOriginDisplayLabel(key), total: v.total, sold: v.sold, rate: (v.sold / v.total) * 100 }))
      .sort((a, b) => b.rate - a.rate).slice(0, 5);

    // Best projects
    const projConv: Record<string, { total: number; sold: number }> = {};
    leadsArr.forEach((l) => {
      if (!l.project_id || !projectMap[l.project_id]) return;
      const name = projectMap[l.project_id];
      if (!projConv[name]) projConv[name] = { total: 0, sold: 0 };
      projConv[name].total++;
      if (l.data_fechamento) projConv[name].sold++;
    });
    const bestProjects = Object.entries(projConv)
      .filter(([, v]) => v.total >= 2)
      .map(([name, v]) => ({ name, total: v.total, sold: v.sold, rate: (v.sold / v.total) * 100 }))
      .sort((a, b) => b.rate - a.rate).slice(0, 5);

    // Loss reasons
    const lossReasons: Record<string, number> = {};
    lost.forEach((l: any) => {
      const r = l.inactivation_reason || "sem_motivo";
      lossReasons[r] = (lossReasons[r] || 0) + 1;
    });
    const topLoss = Object.entries(lossReasons).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([key, count]) => ({ label: getInactivationReasonLabel(key), count }));

    // Radar
    const radarData = [
      { subject: "Conv. Venda", value: Math.min(convSale * 2, 100) },
      { subject: "Ligações", value: Math.min(calls * 5, 100) },
      { subject: "Vel. Resposta", value: responseTime !== null ? Math.max(100 - responseTime * 10, 0) : 50 },
      { subject: "Conv. Visita", value: Math.min(convVisit, 100) },
      { subject: "Conv. Proposta", value: Math.min(convProposal * 2, 100) },
    ];

    return {
      total, attended: att.length, responseTime, convVisit, convSchedule, convProposal, convSale,
      calls, followups, stale, lost: lost.length,
      bestOrigins, bestProjects, topLoss, radarData,
    };
  }, [leads, interactions, staleLeads, projectMap]);

  if (isLoading || !individualData) return null;

  return (
    <Card className="bg-[#1e1e22] border-[#2a2a2e]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-[#FFFF00]" /> Minha Performance Individual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <MiniStat label="Leads Recebidos" value={individualData.total} />
          <MiniStat label="Taxa de Atendimento" value={fmtPct(individualData.attended / Math.max(individualData.total, 1) * 100)} />
          <MiniStat label="Tempo Resposta" value={individualData.responseTime !== null ? fmtHours(individualData.responseTime) : "—"} />
          <MiniStat label="Conv. Visita" value={fmtPct(individualData.convVisit)} />
          <MiniStat label="Conv. Proposta" value={fmtPct(individualData.convProposal)} />
          <MiniStat label="Conv. Venda" value={fmtPct(individualData.convSale)} highlight />
          <MiniStat label="Ligações" value={individualData.calls} />
          <MiniStat label="Follow-ups" value={individualData.followups} />
          <MiniStat label="Leads Parados" value={individualData.stale} alert={individualData.stale > 5} />
          <MiniStat label="Leads Perdidos" value={individualData.lost} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Radar */}
          <Card className="bg-[#16161a] border-[#2a2a2e]">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-slate-400">Perfil de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={individualData.radarData}>
                  <PolarGrid stroke="#2a2a2e" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 9 }} />
                  <PolarRadiusAxis tick={false} domain={[0, 100]} />
                  <Radar dataKey="value" stroke="#FFFF00" fill="#FFFF00" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Best origins */}
          <Card className="bg-[#16161a] border-[#2a2a2e]">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-slate-400">Origens que Mais Convertem</CardTitle>
            </CardHeader>
            <CardContent>
              {individualData.bestOrigins.length === 0 ? <p className="text-xs text-slate-500">Sem dados suficientes</p> : (
                <div className="space-y-2">
                  {individualData.bestOrigins.map((o, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-slate-300 truncate flex-1">{o.label}</span>
                      <span className="text-xs font-bold text-emerald-400 ml-2">{o.rate.toFixed(0)}% <span className="text-slate-500 font-normal">({o.sold}/{o.total})</span></span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Best projects */}
          <Card className="bg-[#16161a] border-[#2a2a2e]">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-slate-400">Empreendimentos que Mais Performa</CardTitle>
            </CardHeader>
            <CardContent>
              {individualData.bestProjects.length === 0 ? <p className="text-xs text-slate-500">Sem dados suficientes</p> : (
                <div className="space-y-2">
                  {individualData.bestProjects.map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-slate-300 truncate flex-1">{p.name}</span>
                      <span className="text-xs font-bold text-emerald-400 ml-2">{p.rate.toFixed(0)}% <span className="text-slate-500 font-normal">({p.sold}/{p.total})</span></span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Loss reasons */}
        {individualData.topLoss.length > 0 && (
          <Card className="bg-[#16161a] border-[#2a2a2e]">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-slate-400 flex items-center gap-2">
                <TrendingDown className="w-3.5 h-3.5 text-red-400" /> Motivos de Perda Mais Comuns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {individualData.topLoss.map((r, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 truncate flex-1">{r.label}</span>
                    <span className="text-xs font-bold text-red-400 ml-2">{r.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
