import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, TrendingUp, AlertTriangle, Clock, BarChart3, Globe,
  Eye, Trophy, Timer, ArrowDownRight, UserCheck, UserPlus, Loader2
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getInactivationReasonLabel, getOriginDisplayLabel } from "@/types/crm";

type Period = "today" | "7d" | "30d" | "all";

function getDateFrom(period: Period): string | null {
  if (period === "all") return null;
  const d = new Date();
  if (period === "today") d.setHours(0, 0, 0, 0);
  else if (period === "7d") d.setDate(d.getDate() - 7);
  else if (period === "30d") d.setDate(d.getDate() - 30);
  return d.toISOString();
}

interface BrokerRow { id: string; name: string }

export default function DashboardOverview() {
  const [period, setPeriod] = useState<Period>("30d");
  const dateFrom = getDateFrom(period);

  // ── Brokers ──
  const { data: brokers = [] } = useQuery<BrokerRow[]>({
    queryKey: ["dash-brokers"],
    queryFn: async () => {
      const { data } = await supabase.from("brokers").select("id, name").eq("is_active", true).order("name");
      return (data || []) as BrokerRow[];
    },
    staleTime: 5 * 60_000,
  });

  const brokerMap = useMemo(() => {
    const m: Record<string, string> = {};
    brokers.forEach(b => { m[b.id] = b.name; });
    return m;
  }, [brokers]);

  // ── All leads (with period filter) ──
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["dash-leads", period],
    queryFn: async () => {
      let q = supabase.from("leads").select(
        "id, name, status, broker_id, project_id, lead_origin, source, created_at, inactivation_reason, atendimento_iniciado_em, data_agendamento, tipo_agendamento, comparecimento, data_envio_proposta, data_fechamento, data_perda, last_interaction_at"
      );
      if (dateFrom) q = q.gte("created_at", dateFrom);
      const { data } = await q.order("created_at", { ascending: false }).limit(5000);
      return data || [];
    },
    staleTime: 30_000,
  });

  // ── Stale leads (always full period) ──
  const { data: staleLeads = [] } = useQuery({
    queryKey: ["dash-stale-leads"],
    queryFn: async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const { data } = await supabase
        .from("leads")
        .select("id, broker_id")
        .lt("last_interaction_at", cutoff.toISOString())
        .not("status", "in", '("inactive","registered")')
        .limit(5000);
      return data || [];
    },
    staleTime: 60_000,
  });

  // ── Projects ──
  const { data: projects = [] } = useQuery({
    queryKey: ["dash-projects"],
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

  // ── Page views ──
  const { data: pageViews = [] } = useQuery({
    queryKey: ["dash-pageviews", period],
    queryFn: async () => {
      let q = supabase.from("page_views").select("id, project_id, created_at");
      if (dateFrom) q = q.gte("created_at", dateFrom);
      const { data } = await q.limit(5000);
      return data || [];
    },
    staleTime: 60_000,
  });

  // ── Computed metrics ──
  const metrics = useMemo(() => {
    const totalLeads = leads.length;

    // Leads by broker
    const byBroker: Record<string, number> = {};
    const manualByBroker: Record<string, number> = {};
    const receivedByBroker: Record<string, number> = {};
    leads.forEach((l: any) => {
      const bid = l.broker_id || "_enove";
      byBroker[bid] = (byBroker[bid] || 0) + 1;
      if (l.source === "manual" || l.source === "csv") {
        manualByBroker[bid] = (manualByBroker[bid] || 0) + 1;
      } else {
        receivedByBroker[bid] = (receivedByBroker[bid] || 0) + 1;
      }
    });

    // Inactive leads + reasons
    const inactive = leads.filter((l: any) => l.status === "inactive");
    const inactiveCount = inactive.length;
    const reasonCount: Record<string, number> = {};
    inactive.forEach((l: any) => {
      const r = l.inactivation_reason || "sem_motivo";
      reasonCount[r] = (reasonCount[r] || 0) + 1;
    });
    const topReasons = Object.entries(reasonCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => ({ key, label: getInactivationReasonLabel(key), count }));

    // Leads by origin
    const byOrigin: Record<string, number> = {};
    leads.forEach((l: any) => {
      const o = l.lead_origin || "Não identificada";
      byOrigin[o] = (byOrigin[o] || 0) + 1;
    });
    const originRanking = Object.entries(byOrigin)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({ label: getOriginDisplayLabel(key), count }));

    // Leads by project
    const byProject: Record<string, number> = {};
    leads.forEach((l: any) => {
      if (l.project_id) byProject[l.project_id] = (byProject[l.project_id] || 0) + 1;
    });
    const projectRanking = Object.entries(byProject)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ name: projectMap[id] || id, count }));

    // Page views by project
    const pvByProject: Record<string, number> = {};
    (pageViews as any[]).forEach((pv: any) => {
      if (pv.project_id) pvByProject[pv.project_id] = (pvByProject[pv.project_id] || 0) + 1;
    });
    const pvRanking = Object.entries(pvByProject)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ name: projectMap[id] || id, count }));

    // Conversion rate leads/views per project
    const convByProject = pvRanking.map(pv => {
      const leadsCount = byProject[Object.keys(projectMap).find(k => projectMap[k] === pv.name) || ""] || 0;
      return { name: pv.name, views: pv.count, leads: leadsCount, rate: pv.count > 0 ? ((leadsCount / pv.count) * 100) : 0 };
    }).sort((a, b) => b.rate - a.rate);

    // ── Conversion funnel (general + per broker) ──
    // Only leads that reached at least "info_sent" (atendimento)
    const attended = leads.filter((l: any) => l.atendimento_iniciado_em || !["new"].includes(l.status));
    
    const calcFunnel = (subset: any[]) => {
      const total = subset.length;
      if (total === 0) return { visita: 0, agendamento: 0, proposta: 0, venda: 0 };
      const visita = subset.filter((l: any) => l.comparecimento === true).length;
      const agendamento = subset.filter((l: any) => l.data_agendamento).length;
      const proposta = subset.filter((l: any) => l.data_envio_proposta).length;
      const venda = subset.filter((l: any) => l.data_fechamento).length;
      return {
        visita: (visita / total) * 100,
        agendamento: (agendamento / total) * 100,
        proposta: (proposta / total) * 100,
        venda: (venda / total) * 100,
      };
    };

    const generalFunnel = calcFunnel(attended);

    // Per broker funnel
    const brokerFunnels: { name: string; id: string; total: number; funnel: ReturnType<typeof calcFunnel> }[] = [];
    const attendedByBroker: Record<string, any[]> = {};
    attended.forEach((l: any) => {
      const bid = l.broker_id;
      if (!bid) return;
      if (!attendedByBroker[bid]) attendedByBroker[bid] = [];
      attendedByBroker[bid].push(l);
    });
    Object.entries(attendedByBroker).forEach(([bid, arr]) => {
      brokerFunnels.push({ name: brokerMap[bid] || bid, id: bid, total: arr.length, funnel: calcFunnel(arr) });
    });
    brokerFunnels.sort((a, b) => b.funnel.venda - a.funnel.venda);

    // ── Conversion time rankings (avg days) ──
    const calcAvgDays = (subset: any[], fromField: string, toField: string) => {
      const diffs: number[] = [];
      subset.forEach((l: any) => {
        const from = l[fromField];
        const to = l[toField];
        if (from && to) {
          const days = (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000;
          if (days >= 0) diffs.push(days);
        }
      });
      if (diffs.length === 0) return null;
      return diffs.reduce((a, b) => a + b, 0) / diffs.length;
    };

    const convTimeByBroker = (toField: string) => {
      const results: { name: string; avgDays: number; count: number }[] = [];
      Object.entries(attendedByBroker).forEach(([bid, arr]) => {
        const relevant = arr.filter((l: any) => l.atendimento_iniciado_em && l[toField]);
        if (relevant.length === 0) return;
        const avg = calcAvgDays(relevant, "atendimento_iniciado_em", toField);
        if (avg !== null) results.push({ name: brokerMap[bid] || bid, avgDays: avg, count: relevant.length });
      });
      return results.sort((a, b) => a.avgDays - b.avgDays);
    };

    return {
      totalLeads,
      byBroker,
      manualByBroker,
      receivedByBroker,
      inactiveCount,
      topReasons,
      staleCount: staleLeads.length,
      originRanking,
      projectRanking,
      pvRanking,
      convByProject,
      generalFunnel,
      brokerFunnels,
      timeToAgendamento: convTimeByBroker("data_agendamento"),
      timeToProposta: convTimeByBroker("data_envio_proposta"),
      timeToVenda: convTimeByBroker("data_fechamento"),
    };
  }, [leads, staleLeads, brokerMap, projectMap, pageViews]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFFF00]" />
      </div>
    );
  }

  const fmtPct = (v: number) => `${v.toFixed(1)}%`;
  const fmtDays = (v: number) => v < 1 ? `${Math.round(v * 24)}h` : `${v.toFixed(1)}d`;

  const brokerName = (id: string) => id === "_enove" ? "Enove" : (brokerMap[id] || id.slice(0, 8));

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <TabsList className="bg-[#1e1e22] border border-[#2a2a2e]">
          <TabsTrigger value="today" className="data-[state=active]:bg-[#FFFF00] data-[state=active]:text-black text-xs">Hoje</TabsTrigger>
          <TabsTrigger value="7d" className="data-[state=active]:bg-[#FFFF00] data-[state=active]:text-black text-xs">7 dias</TabsTrigger>
          <TabsTrigger value="30d" className="data-[state=active]:bg-[#FFFF00] data-[state=active]:text-black text-xs">30 dias</TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-[#FFFF00] data-[state=active]:text-black text-xs">Todo período</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Users} label="Total de Leads" value={metrics.totalLeads} />
        <KpiCard icon={AlertTriangle} label="Inativados" value={metrics.inactiveCount} color="text-red-400" />
        <KpiCard icon={Clock} label="Parados +30d" value={metrics.staleCount} color="text-amber-400" />
        <KpiCard icon={TrendingUp} label="Conv. Geral (Venda)" value={fmtPct(metrics.generalFunnel.venda)} color="text-emerald-400" />
      </div>

      {/* General funnel */}
      <Card className="bg-[#1e1e22] border-[#2a2a2e]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#FFFF00]" /> Taxa de Conversão Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FunnelBar label="Visita" value={metrics.generalFunnel.visita} />
            <FunnelBar label="Agendamento" value={metrics.generalFunnel.agendamento} />
            <FunnelBar label="Proposta" value={metrics.generalFunnel.proposta} />
            <FunnelBar label="Venda" value={metrics.generalFunnel.venda} />
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Leads by broker */}
        <RankingCard title="Leads por Corretor" icon={UserCheck} items={
          Object.entries(metrics.byBroker)
            .sort((a, b) => b[1] - a[1])
            .map(([id, count]) => ({ label: brokerName(id), value: count }))
        } />

        {/* Inactivation reasons */}
        <RankingCard title="Motivos de Inativação" icon={ArrowDownRight} items={
          metrics.topReasons.map(r => ({ label: r.label, value: r.count }))
        } />

        {/* Manual leads by broker */}
        <RankingCard title="Leads Cadastrados (Manual)" icon={UserPlus} items={
          Object.entries(metrics.manualByBroker)
            .sort((a, b) => b[1] - a[1])
            .map(([id, count]) => ({ label: brokerName(id), value: count }))
        } />

        {/* Received leads by broker */}
        <RankingCard title="Leads Recebidos" icon={Users} items={
          Object.entries(metrics.receivedByBroker)
            .sort((a, b) => b[1] - a[1])
            .map(([id, count]) => ({ label: brokerName(id), value: count }))
        } />

        {/* Origin */}
        <RankingCard title="Leads por Origem" icon={Globe} items={
          metrics.originRanking.map(o => ({ label: o.label, value: o.count }))
        } />

        {/* Project ranking */}
        <RankingCard title="Empreendimentos com mais Leads" icon={Trophy} items={
          metrics.projectRanking.map(p => ({ label: p.name, value: p.count }))
        } />

        {/* Page views ranking */}
        <RankingCard title="Visualizações por Empreendimento" icon={Eye} items={
          metrics.pvRanking.map(p => ({ label: p.name, value: p.count }))
        } />

        {/* Conversion rate leads/views */}
        <RankingCard title="Conversão Leads/Acessos" icon={TrendingUp} items={
          metrics.convByProject.map(p => ({ label: p.name, value: `${p.rate.toFixed(1)}%`, subtext: `${p.leads} leads / ${p.views} views` }))
        } />
      </div>

      {/* Conversion funnel per broker */}
      <Card className="bg-[#1e1e22] border-[#2a2a2e]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#FFFF00]" /> Conversão por Corretor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.brokerFunnels.length === 0 && <p className="text-xs text-slate-500">Sem dados no período</p>}
            {metrics.brokerFunnels.map(bf => (
              <div key={bf.id} className="bg-[#16161a] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white">{bf.name}</span>
                  <span className="text-[10px] text-slate-500">{bf.total} leads atendidos</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <MiniStat label="Visita" value={fmtPct(bf.funnel.visita)} />
                  <MiniStat label="Agend." value={fmtPct(bf.funnel.agendamento)} />
                  <MiniStat label="Proposta" value={fmtPct(bf.funnel.proposta)} />
                  <MiniStat label="Venda" value={fmtPct(bf.funnel.venda)} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion time rankings */}
      <div className="grid md:grid-cols-3 gap-4">
        <TimeRankingCard title="Atend. → Agendamento" items={metrics.timeToAgendamento} fmtDays={fmtDays} />
        <TimeRankingCard title="Atend. → Proposta" items={metrics.timeToProposta} fmtDays={fmtDays} />
        <TimeRankingCard title="Atend. → Venda" items={metrics.timeToVenda} fmtDays={fmtDays} />
      </div>
    </div>
  );
}

// ── Sub-components ──

function KpiCard({ icon: Icon, label, value, color = "text-white" }: { icon: any; label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-[#1e1e22] border border-[#2a2a2e] rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#FFFF00]/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[#FFFF00]" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-slate-400 truncate">{label}</p>
          <p className={`text-lg sm:text-xl font-bold ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function FunnelBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400">{label}</span>
        <span className="text-xs font-bold text-white">{value.toFixed(1)}%</span>
      </div>
      <Progress value={Math.min(value, 100)} className="h-2 bg-[#2a2a2e] [&>div]:bg-[#FFFF00]" />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="text-xs font-bold text-white">{value}</p>
    </div>
  );
}

function RankingCard({ title, icon: Icon, items }: { title: string; icon: any; items: { label: string; value: string | number; subtext?: string }[] }) {
  return (
    <Card className="bg-[#1e1e22] border-[#2a2a2e]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#FFFF00]" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 && <p className="text-xs text-slate-500">Sem dados</p>}
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] text-slate-500 w-4 text-right shrink-0">{i + 1}.</span>
                <span className="text-xs text-slate-300 truncate">{item.label}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-white">{item.value}</span>
                {item.subtext && <p className="text-[10px] text-slate-500">{item.subtext}</p>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TimeRankingCard({ title, items, fmtDays }: { title: string; items: { name: string; avgDays: number; count: number }[]; fmtDays: (v: number) => string }) {
  return (
    <Card className="bg-[#1e1e22] border-[#2a2a2e]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <Timer className="w-4 h-4 text-[#FFFF00]" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 && <p className="text-xs text-slate-500">Sem dados</p>}
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] text-slate-500 w-4 text-right shrink-0">{i + 1}.</span>
                <span className="text-xs text-slate-300 truncate">{item.name}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-emerald-400">{fmtDays(item.avgDays)}</span>
                <p className="text-[10px] text-slate-500">{item.count} leads</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
