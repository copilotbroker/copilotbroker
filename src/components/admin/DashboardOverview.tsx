import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, TrendingUp, AlertTriangle, Clock, BarChart3, Globe,
  Eye, Trophy, Timer, ArrowDownRight, UserCheck, UserPlus, Loader2
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInactivationReasonLabel, getOriginDisplayLabel } from "@/types/crm";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

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

const CHART_COLORS = ["#FFFF00", "#22d3ee", "#a78bfa", "#f97316", "#34d399", "#f472b6", "#60a5fa", "#fbbf24"];

const chartTooltipStyle = {
  contentStyle: { background: "#1e1e22", border: "1px solid #2a2a2e", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "#fff" },
  itemStyle: { color: "#e2e8f0" },
};

export default function DashboardOverview() {
  const [period, setPeriod] = useState<Period>("30d");
  const dateFrom = getDateFrom(period);

  const { data: brokers = [] } = useQuery<BrokerRow[]>({
    queryKey: ["dash-brokers"],
    queryFn: async () => {
      const { data } = await supabase.from("brokers").select("id, name").eq("is_active", true).not("lider_id", "is", null).order("name");
      return (data || []) as BrokerRow[];
    },
    staleTime: 5 * 60_000,
  });

  const brokerMap = useMemo(() => {
    const m: Record<string, string> = {};
    brokers.forEach(b => { m[b.id] = b.name; });
    return m;
  }, [brokers]);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["dash-leads", period],
    queryFn: async () => {
      let q = supabase.from("leads").select(
        "id, name, status, broker_id, project_id, lead_origin, source, created_at, inactivation_reason, atendimento_iniciado_em, data_agendamento, tipo_agendamento, comparecimento, data_envio_proposta, data_fechamento, data_perda, last_interaction_at, registered_by"
      );
      if (dateFrom) q = q.gte("created_at", dateFrom);
      const { data } = await q.order("created_at", { ascending: false }).limit(5000);
      return data || [];
    },
    staleTime: 30_000,
  });

  const { data: staleLeads = [] } = useQuery({
    queryKey: ["dash-stale-leads"],
    queryFn: async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const { data } = await supabase.from("leads").select("id, broker_id")
        .lt("last_interaction_at", cutoff.toISOString())
        .not("status", "in", '("inactive","registered")').limit(5000);
      return data || [];
    },
    staleTime: 60_000,
  });

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

  const { data: attributions = [] } = useQuery({
    queryKey: ["dash-attributions"],
    queryFn: async () => {
      const { data } = await supabase.from("lead_attribution").select("lead_id, landing_page")
        .in("landing_page", ["admin_manual", "csv_import"]);
      return data || [];
    },
    staleTime: 5 * 60_000,
  });

  const manualLeadIds = useMemo(() => {
    const s = new Set<string>();
    (attributions as any[]).forEach(a => { if (a.lead_id) s.add(a.lead_id); });
    return s;
  }, [attributions]);

  const metrics = useMemo(() => {
    const totalLeads = leads.length;

    const isManual = (l: any) => l.source === "manual" || l.source === "csv" || !!l.registered_by || manualLeadIds.has(l.id);
    const byBroker: Record<string, number> = {};
    const manualByBroker: Record<string, number> = {};
    const receivedByBroker: Record<string, number> = {};
    leads.forEach((l: any) => {
      const bid = l.broker_id || "_enove";
      byBroker[bid] = (byBroker[bid] || 0) + 1;
      if (isManual(l)) {
        manualByBroker[bid] = (manualByBroker[bid] || 0) + 1;
      } else {
        receivedByBroker[bid] = (receivedByBroker[bid] || 0) + 1;
      }
    });

    const inactive = leads.filter((l: any) => l.status === "inactive");
    const inactiveCount = inactive.length;
    const reasonCount: Record<string, number> = {};
    inactive.forEach((l: any) => {
      const r = l.inactivation_reason || "sem_motivo";
      reasonCount[r] = (reasonCount[r] || 0) + 1;
    });
    const topReasons = Object.entries(reasonCount)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([key, count]) => ({ key, label: getInactivationReasonLabel(key), count }));

    const byOrigin: Record<string, number> = {};
    leads.forEach((l: any) => {
      const o = l.lead_origin || "Não identificada";
      byOrigin[o] = (byOrigin[o] || 0) + 1;
    });
    const originRanking = Object.entries(byOrigin)
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([key, count]) => ({ label: getOriginDisplayLabel(key), count }));

    const byProject: Record<string, number> = {};
    const byProjectNonManual: Record<string, number> = {};
    leads.forEach((l: any) => {
      if (l.project_id) {
        byProject[l.project_id] = (byProject[l.project_id] || 0) + 1;
        if (!isManual(l)) byProjectNonManual[l.project_id] = (byProjectNonManual[l.project_id] || 0) + 1;
      }
    });
    const projectRanking = Object.entries(byProject)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([id, count]) => ({ name: projectMap[id] || id, count }));

    const pvByProject: Record<string, number> = {};
    (pageViews as any[]).forEach((pv: any) => {
      if (pv.project_id) pvByProject[pv.project_id] = (pvByProject[pv.project_id] || 0) + 1;
    });
    const pvRanking = Object.entries(pvByProject)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([id, count]) => ({ name: projectMap[id] || id, count, id }));

    const convByProject = pvRanking.map(pv => {
      const leadsCount = byProjectNonManual[pv.id] || 0;
      return { name: pv.name, views: pv.count, leads: leadsCount, rate: pv.count > 0 ? ((leadsCount / pv.count) * 100) : 0 };
    }).sort((a, b) => b.rate - a.rate);

    // Funnel: agendamento = data_agendamento (visita e agendamento são o mesmo)
    const attended = leads.filter((l: any) => l.atendimento_iniciado_em || !["new"].includes(l.status));

    const calcFunnel = (subset: any[]) => {
      const total = subset.length;
      if (total === 0) return { agendamento: 0, proposta: 0, venda: 0 };
      const agendamento = subset.filter((l: any) => l.data_agendamento).length;
      const proposta = subset.filter((l: any) => l.data_envio_proposta).length;
      const venda = subset.filter((l: any) => l.data_fechamento).length;
      return {
        agendamento: (agendamento / total) * 100,
        proposta: (proposta / total) * 100,
        venda: (venda / total) * 100,
      };
    };

    const generalFunnel = calcFunnel(attended);

    const brokerFunnels: { name: string; id: string; total: number; funnel: ReturnType<typeof calcFunnel> }[] = [];
    const attendedByBroker: Record<string, any[]> = {};
    attended.forEach((l: any) => {
      const bid = l.broker_id;
      if (!bid) return;
      if (!attendedByBroker[bid]) attendedByBroker[bid] = [];
      attendedByBroker[bid].push(l);
    });
    Object.entries(attendedByBroker).forEach(([bid, arr]) => {
      if (!brokerMap[bid]) return;
      brokerFunnels.push({ name: brokerMap[bid] || bid, id: bid, total: arr.length, funnel: calcFunnel(arr) });
    });
    brokerFunnels.sort((a, b) => b.funnel.venda - a.funnel.venda);

    const calcAvgDays = (subset: any[], fromField: string, toField: string) => {
      const diffs: number[] = [];
      subset.forEach((l: any) => {
        const from = l[fromField]; const to = l[toField];
        if (from && to) { const d = (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000; if (d >= 0) diffs.push(d); }
      });
      return diffs.length === 0 ? null : diffs.reduce((a, b) => a + b, 0) / diffs.length;
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
      totalLeads, byBroker, manualByBroker, receivedByBroker,
      inactiveCount, topReasons, staleCount: staleLeads.length,
      originRanking, projectRanking, pvRanking, convByProject,
      generalFunnel, brokerFunnels,
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

  // Chart data
  const brokerLeadsChart = Object.entries(metrics.byBroker)
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([id, count]) => ({ name: brokerName(id), total: count, manual: metrics.manualByBroker[id] || 0, recebidos: metrics.receivedByBroker[id] || 0 }));

  const originPieData = metrics.originRanking.map((o, i) => ({ name: o.label, value: o.count, fill: CHART_COLORS[i % CHART_COLORS.length] }));

  const funnelChartData = [
    { name: "Agendamento", geral: metrics.generalFunnel.agendamento },
    { name: "Proposta", geral: metrics.generalFunnel.proposta },
    { name: "Venda", geral: metrics.generalFunnel.venda },
  ];

  const projectLeadsChart = metrics.projectRanking.slice(0, 8).map(p => ({ name: p.name.length > 15 ? p.name.slice(0, 15) + "…" : p.name, leads: p.count }));

  const brokerFunnelChart = metrics.brokerFunnels.slice(0, 8).map(bf => ({
    name: bf.name.split(" ")[0],
    agendamento: +bf.funnel.agendamento.toFixed(1),
    proposta: +bf.funnel.proposta.toFixed(1),
    venda: +bf.funnel.venda.toFixed(1),
  }));

  const timeChartData = metrics.timeToAgendamento.slice(0, 8).map(t => ({
    name: t.name.split(" ")[0],
    agendamento: +(metrics.timeToAgendamento.find(x => x.name === t.name)?.avgDays || 0).toFixed(1),
    proposta: +(metrics.timeToProposta.find(x => x.name === t.name)?.avgDays || 0).toFixed(1),
    venda: +(metrics.timeToVenda.find(x => x.name === t.name)?.avgDays || 0).toFixed(1),
  }));

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
        <KpiCard icon={TrendingUp} label="Conv. Venda" value={fmtPct(metrics.generalFunnel.venda)} color="text-emerald-400" />
      </div>

      {/* Row 1: Funnel + Origin pie */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-[#1e1e22] border-[#2a2a2e]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#FFFF00]" /> Funil de Conversão Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnelChartData} layout="vertical">
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} domain={[0, "auto"]} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fill: "#e2e8f0", fontSize: 11 }} width={90} />
                <Tooltip {...chartTooltipStyle} formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Bar dataKey="geral" fill="#FFFF00" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#1e1e22] border-[#2a2a2e]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#FFFF00]" /> Leads por Origem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={originPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={2} strokeWidth={0}>
                  {originPieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip {...chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Leads by broker (stacked bar) */}
      <Card className="bg-[#1e1e22] border-[#2a2a2e]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#FFFF00]" /> Leads por Corretor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(200, brokerLeadsChart.length * 36)}>
            <BarChart data={brokerLeadsChart} layout="vertical">
              <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#e2e8f0", fontSize: 11 }} width={100} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="recebidos" stackId="a" fill="#FFFF00" name="Recebidos" radius={[0, 0, 0, 0]} />
              <Bar dataKey="manual" stackId="a" fill="#a78bfa" name="Manual" radius={[0, 4, 4, 0]} />
              <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Row 3: Inactivation reasons + Project leads */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-[#1e1e22] border-[#2a2a2e]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-red-400" /> Motivos de Inativação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.topReasons.length === 0 ? <p className="text-xs text-slate-500">Sem dados</p> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={metrics.topReasons.map(r => ({ name: r.label.length > 18 ? r.label.slice(0, 18) + "…" : r.label, count: r.count }))} layout="vertical">
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#e2e8f0", fontSize: 10 }} width={130} />
                  <Tooltip {...chartTooltipStyle} />
                  <Bar dataKey="count" fill="#f87171" radius={[0, 4, 4, 0]} barSize={18} name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#1e1e22] border-[#2a2a2e]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#FFFF00]" /> Empreendimentos com mais Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectLeadsChart.length === 0 ? <p className="text-xs text-slate-500">Sem dados</p> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={projectLeadsChart} layout="vertical">
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#e2e8f0", fontSize: 10 }} width={120} />
                  <Tooltip {...chartTooltipStyle} />
                  <Bar dataKey="leads" fill="#22d3ee" radius={[0, 4, 4, 0]} barSize={18} name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Page views + Conversion leads/views */}
      <div className="grid md:grid-cols-2 gap-4">
        <RankingCard title="Visualizações por Empreendimento" icon={Eye} items={
          metrics.pvRanking.map(p => ({ label: p.name, value: p.count }))
        } />
        <RankingCard title="Conversão Leads/Acessos" icon={TrendingUp} items={
          metrics.convByProject.map(p => ({ label: p.name, value: `${p.rate.toFixed(1)}%`, subtext: `${p.leads} leads / ${p.views} views` }))
        } />
      </div>

      {/* Row 5: Broker funnel chart */}
      {brokerFunnelChart.length > 0 && (
        <Card className="bg-[#1e1e22] border-[#2a2a2e]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#FFFF00]" /> Conversão por Corretor (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(220, brokerFunnelChart.length * 40)}>
              <BarChart data={brokerFunnelChart} layout="vertical">
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fill: "#e2e8f0", fontSize: 11 }} width={80} />
                <Tooltip {...chartTooltipStyle} formatter={(v: number) => `${v}%`} />
                <Bar dataKey="agendamento" fill="#FFFF00" name="Agendamento" barSize={10} radius={[0, 4, 4, 0]} />
                <Bar dataKey="proposta" fill="#22d3ee" name="Proposta" barSize={10} radius={[0, 4, 4, 0]} />
                <Bar dataKey="venda" fill="#34d399" name="Venda" barSize={10} radius={[0, 4, 4, 0]} />
                <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Row 6: Conversion time by broker */}
      {timeChartData.length > 0 && (
        <Card className="bg-[#1e1e22] border-[#2a2a2e]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <Timer className="w-4 h-4 text-[#FFFF00]" /> Tempo Médio de Conversão por Corretor (dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(220, timeChartData.length * 40)}>
              <BarChart data={timeChartData} layout="vertical">
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} unit="d" />
                <YAxis type="category" dataKey="name" tick={{ fill: "#e2e8f0", fontSize: 11 }} width={80} />
                <Tooltip {...chartTooltipStyle} formatter={(v: number) => `${v} dias`} />
                <Bar dataKey="agendamento" fill="#FFFF00" name="→ Agendamento" barSize={10} radius={[0, 4, 4, 0]} />
                <Bar dataKey="proposta" fill="#22d3ee" name="→ Proposta" barSize={10} radius={[0, 4, 4, 0]} />
                <Bar dataKey="venda" fill="#34d399" name="→ Venda" barSize={10} radius={[0, 4, 4, 0]} />
                <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
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
