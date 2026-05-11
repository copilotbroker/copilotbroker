import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/use-user-role";
import { AdminScopeToggle, type AdminScope } from "@/components/admin/AdminScopeToggle";
import {
  Users, TrendingUp, AlertTriangle, Clock, BarChart3, Trophy, Timer,
  ArrowDownRight, UserCheck, Loader2, Phone, CalendarCheck, FileText,
  Handshake, Eye, AlertCircle, Target, Zap, ChevronDown, ChevronUp,
  Award, TrendingDown, Activity, PieChart as PieIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodFilterWithCustom } from "@/components/ui/custom-date-range-picker";
import { getInactivationReasonLabel, getOriginDisplayLabel } from "@/types/crm";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Legend
} from "recharts";

type Period = "today" | "7d" | "30d" | "all" | "custom";

function getDateRange(period: Period): { from: Date | null; to: Date } {
  const now = new Date();
  if (period === "today") return { from: new Date(now.getFullYear(), now.getMonth(), now.getDate()), to: now };
  if (period === "7d") { const d = new Date(); d.setDate(d.getDate() - 7); d.setHours(0, 0, 0, 0); return { from: d, to: now }; }
  if (period === "30d") { const d = new Date(); d.setDate(d.getDate() - 30); d.setHours(0, 0, 0, 0); return { from: d, to: now }; }
  return { from: null, to: now };
}

interface BrokerRow { id: string; name: string; lider_id: string | null }

const CHART_COLORS = ["#FFFF00", "#22d3ee", "#a78bfa", "#f97316", "#34d399", "#f472b6", "#60a5fa", "#fbbf24"];

const chartTooltipStyle = {
  contentStyle: { background: "#1e1e22", border: "1px solid #2a2a2e", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "#fff" },
  itemStyle: { color: "#e2e8f0" },
};

export default function PerformanceDashboard() {
  const [period, setPeriod] = useState<Period>("30d");
  const [selectedBrokerId, setSelectedBrokerId] = useState<string | null>(null);
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | null>(null);
  const { from: dateFrom } = period === "custom" && customRange
    ? { from: customRange.start }
    : getDateRange(period as "today" | "7d" | "30d" | "all");

  // Fetch brokers
  const { data: allBrokersRaw = [] } = useQuery<BrokerRow[]>({
    queryKey: ["perf-brokers"],
    queryFn: async () => {
      const { data } = await supabase.from("brokers").select("id, name, lider_id").eq("is_active", true).order("name");
      return (data || []) as BrokerRow[];
    },
    staleTime: 5 * 60_000,
  });

  // Include brokers who belong to a team (have lider_id) AND leaders who manage a team
  const brokers = useMemo(() => {
    const leaderIds = new Set(allBrokersRaw.filter(b => b.lider_id).map(b => b.lider_id!));
    return allBrokersRaw.filter(b => b.lider_id !== null || leaderIds.has(b.id));
  }, [allBrokersRaw]);

  const brokerMap = useMemo(() => {
    const m: Record<string, string> = {};
    brokers.forEach(b => { m[b.id] = b.name; });
    return m;
  }, [brokers]);

  // Fetch leads
  const { data: allLeads = [], isLoading } = useQuery({
    queryKey: ["perf-leads", period],
    queryFn: async () => {
      let q = supabase.from("leads").select(
        "id, name, status, broker_id, project_id, lead_origin, source, created_at, inactivation_reason, atendimento_iniciado_em, data_agendamento, tipo_agendamento, comparecimento, data_envio_proposta, data_fechamento, data_perda, etapa_perda, last_interaction_at, registered_by, roleta_id, valor_proposta, valor_final_venda"
      );
      if (dateFrom) q = q.gte("created_at", dateFrom.toISOString());
      const { data } = await q.order("created_at", { ascending: false }).limit(10000);
      return data || [];
    },
    staleTime: 30_000,
  });

  // Fetch interactions
  const { data: interactions = [] } = useQuery({
    queryKey: ["perf-interactions", period],
    queryFn: async () => {
      let q = supabase.from("lead_interactions").select("id, lead_id, broker_id, interaction_type, channel, created_at, notes");
      if (dateFrom) q = q.gte("created_at", dateFrom.toISOString());
      const { data } = await q.limit(10000);
      return data || [];
    },
    staleTime: 30_000,
  });

  // Fetch stale leads
  const { data: staleLeads = [] } = useQuery({
    queryKey: ["perf-stale-leads"],
    queryFn: async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const { data } = await supabase.from("leads").select("id, broker_id")
        .lt("last_interaction_at", cutoff.toISOString())
        .not("status", "in", '("inactive","registered")').limit(10000);
      return data || [];
    },
    staleTime: 60_000,
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ["perf-projects"],
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

  // Fetch attributions
  const { data: attributions = [] } = useQuery({
    queryKey: ["perf-attributions"],
    queryFn: async () => {
      const { data } = await supabase.from("lead_attribution").select("lead_id, landing_page");
      return data || [];
    },
    staleTime: 5 * 60_000,
  });

  const manualLeadIds = useMemo(() => {
    const s = new Set<string>();
    (attributions as any[]).forEach(a => {
      if (a.lead_id && (a.landing_page === "admin_manual" || a.landing_page === "csv_import")) s.add(a.lead_id);
    });
    return s;
  }, [attributions]);

  // ── Computed metrics ──
  const metrics = useMemo(() => {
    const calcRate = (num: number, den: number) => den === 0 ? 0 : (num / den) * 100;
    const isManual = (l: any) => l.source === "manual" || l.source === "csv" || !!l.registered_by || manualLeadIds.has(l.id);

    // Stale by broker
    const staleByBroker: Record<string, number> = {};
    (staleLeads as any[]).forEach((l: any) => {
      if (l.broker_id) staleByBroker[l.broker_id] = (staleByBroker[l.broker_id] || 0) + 1;
    });

    // Interactions by broker
    const callsByBroker: Record<string, number> = {};
    const contactsByBroker: Record<string, number> = {};
    const followupsByBroker: Record<string, number> = {};
    (interactions as any[]).forEach((i: any) => {
      if (!i.broker_id) return;
      if (i.interaction_type === "ligacao") callsByBroker[i.broker_id] = (callsByBroker[i.broker_id] || 0) + 1;
      if (i.interaction_type === "contact_attempt") contactsByBroker[i.broker_id] = (contactsByBroker[i.broker_id] || 0) + 1;
      if (i.interaction_type === "note_added" || i.interaction_type === "contact_attempt" || i.interaction_type === "whatsapp_manual") {
        followupsByBroker[i.broker_id] = (followupsByBroker[i.broker_id] || 0) + 1;
      }
    });

    // Aggregate totals
    const totalLeads = allLeads.length;
    const attended = allLeads.filter((l: any) => l.atendimento_iniciado_em);
    const scheduled = allLeads.filter((l: any) => l.data_agendamento);
    const visited = allLeads.filter((l: any) => l.comparecimento === true);
    const proposals = allLeads.filter((l: any) => l.data_envio_proposta);
    const sales = allLeads.filter((l: any) => l.data_fechamento);
    const lost = allLeads.filter((l: any) => l.status === "inactive");
    const totalCalls = Object.values(callsByBroker).reduce((a, b) => a + b, 0);
    const totalStale = staleLeads.length;

    // Avg response time (median)
    const responseTimes: number[] = [];
    attended.forEach((l: any) => {
      if (l.created_at && l.atendimento_iniciado_em) {
        const diff = (new Date(l.atendimento_iniciado_em).getTime() - new Date(l.created_at).getTime()) / 3600000;
        if (diff >= 0 && diff < 720) responseTimes.push(diff);
      }
    });
    responseTimes.sort((a, b) => a - b);
    const medianResponseHours = responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length / 2)] : null;
    const responseRate = calcRate(attended.length, totalLeads);

    // Broker performance table
    const byBroker: Record<string, any[]> = {};
    allLeads.forEach((l: any) => {
      if (!l.broker_id || !brokerMap[l.broker_id]) return;
      if (!byBroker[l.broker_id]) byBroker[l.broker_id] = [];
      byBroker[l.broker_id].push(l);
    });

    const brokerPerf = Object.entries(byBroker).map(([bid, arr]) => {
      const total = arr.length;
      const manual = arr.filter(isManual).length;
      const received = total - manual;
      const att = arr.filter((l: any) => l.atendimento_iniciado_em);
      const sched = arr.filter((l: any) => l.data_agendamento);
      const vis = arr.filter((l: any) => l.comparecimento === true);
      const prop = arr.filter((l: any) => l.data_envio_proposta);
      const sale = arr.filter((l: any) => l.data_fechamento);
      const inact = arr.filter((l: any) => l.status === "inactive");
      const stale = staleByBroker[bid] || 0;

      // Median response time for this broker
      const times: number[] = [];
      att.forEach((l: any) => {
        if (l.created_at && l.atendimento_iniciado_em) {
          const diff = (new Date(l.atendimento_iniciado_em).getTime() - new Date(l.created_at).getTime()) / 3600000;
          if (diff >= 0 && diff < 720) times.push(diff);
        }
      });
      times.sort((a, b) => a - b);
      const medResp = times.length > 0 ? times[Math.floor(times.length / 2)] : null;

      return {
        id: bid,
        name: brokerMap[bid],
        total, manual, received,
        attended: att.length,
        responseTime: medResp,
        scheduled: sched.length,
        visited: vis.length,
        proposals: prop.length,
        sales: sale.length,
        lost: inact.length,
        stale,
        calls: callsByBroker[bid] || 0,
        followups: followupsByBroker[bid] || 0,
        convVisit: calcRate(vis.length, att.length || total),
        convSchedule: calcRate(sched.length, att.length || total),
        convProposal: calcRate(prop.length, att.length || total),
        convSale: calcRate(sale.length, att.length || total),
      };
    }).sort((a, b) => b.convSale - a.convSale);

    // Team averages for bottleneck comparison
    const avgConvVisit = brokerPerf.length > 0 ? brokerPerf.reduce((s, b) => s + b.convVisit, 0) / brokerPerf.length : 0;
    const avgConvSchedule = brokerPerf.length > 0 ? brokerPerf.reduce((s, b) => s + b.convSchedule, 0) / brokerPerf.length : 0;
    const avgConvProposal = brokerPerf.length > 0 ? brokerPerf.reduce((s, b) => s + b.convProposal, 0) / brokerPerf.length : 0;
    const avgConvSale = brokerPerf.length > 0 ? brokerPerf.reduce((s, b) => s + b.convSale, 0) / brokerPerf.length : 0;
    const avgCalls = brokerPerf.length > 0 ? brokerPerf.reduce((s, b) => s + b.calls, 0) / brokerPerf.length : 0;
    const avgResponseTime = (() => {
      const valid = brokerPerf.filter(b => b.responseTime !== null);
      return valid.length > 0 ? valid.reduce((s, b) => s + (b.responseTime || 0), 0) / valid.length : null;
    })();

    // Loss analysis
    const lossReasons: Record<string, number> = {};
    const lossByBroker: Record<string, Record<string, number>> = {};
    const lossByOrigin: Record<string, Record<string, number>> = {};
    const lossByProject: Record<string, Record<string, number>> = {};
    const lossByStage: Record<string, number> = {};

    lost.forEach((l: any) => {
      const reason = l.inactivation_reason || "sem_motivo";
      lossReasons[reason] = (lossReasons[reason] || 0) + 1;

      // By broker
      if (l.broker_id && brokerMap[l.broker_id]) {
        if (!lossByBroker[brokerMap[l.broker_id]]) lossByBroker[brokerMap[l.broker_id]] = {};
        lossByBroker[brokerMap[l.broker_id]][reason] = (lossByBroker[brokerMap[l.broker_id]][reason] || 0) + 1;
      }

      // By origin
      const origin = l.lead_origin || "Não identificada";
      if (!lossByOrigin[origin]) lossByOrigin[origin] = {};
      lossByOrigin[origin][reason] = (lossByOrigin[origin][reason] || 0) + 1;

      // By project
      if (l.project_id && projectMap[l.project_id]) {
        const pName = projectMap[l.project_id];
        if (!lossByProject[pName]) lossByProject[pName] = {};
        lossByProject[pName][reason] = (lossByProject[pName][reason] || 0) + 1;
      }

      // By funnel stage
      const stage = l.etapa_perda || (l.data_envio_proposta ? "proposta" : l.data_agendamento ? "agendamento" : l.atendimento_iniciado_em ? "atendimento" : "pre_atendimento");
      lossByStage[stage] = (lossByStage[stage] || 0) + 1;
    });

    const topLossReasons = Object.entries(lossReasons).sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([key, count]) => ({ key, label: getInactivationReasonLabel(key), count }));

    const lossByStageData = Object.entries(lossByStage).sort((a, b) => b[1] - a[1])
      .map(([stage, count]) => ({
        stage,
        label: stage === "pre_atendimento" ? "Pré-Atendimento" : stage === "atendimento" ? "Atendimento" : stage === "agendamento" ? "Agendamento" : stage === "proposta" ? "Proposta" : stage,
        count
      }));

    // Insights
    const bestResponseBroker = brokerPerf.filter(b => b.responseTime !== null).sort((a, b) => (a.responseTime || 999) - (b.responseTime || 999))[0];
    const bestVisitBroker = [...brokerPerf].filter(b => b.total >= 3).sort((a, b) => b.convVisit - a.convVisit)[0];
    const bestProposalBroker = [...brokerPerf].filter(b => b.total >= 3).sort((a, b) => b.convProposal - a.convProposal)[0];
    const bestSaleBroker = [...brokerPerf].filter(b => b.total >= 3).sort((a, b) => b.convSale - a.convSale)[0];
    const mostStaleBroker = [...brokerPerf].sort((a, b) => b.stale - a.stale)[0];
    const mostCallsBroker = [...brokerPerf].sort((a, b) => b.calls - a.calls)[0];

    return {
      totalLeads, attended: attended.length, scheduled: scheduled.length,
      visited: visited.length, proposals: proposals.length, sales: sales.length,
      lost: lost.length, totalCalls, totalStale, medianResponseHours, responseRate,
      brokerPerf,
      avgConvVisit, avgConvSchedule, avgConvProposal, avgConvSale, avgCalls, avgResponseTime,
      topLossReasons, lossByBroker, lossByOrigin, lossByProject, lossByStageData,
      bestResponseBroker, bestVisitBroker, bestProposalBroker, bestSaleBroker,
      mostStaleBroker, mostCallsBroker,
      callsByBroker, staleByBroker, followupsByBroker, byBroker,
    };
  }, [allLeads, interactions, staleLeads, brokerMap, projectMap, manualLeadIds]);

  // Individual broker data
  const individualData = useMemo(() => {
    if (!selectedBrokerId) return null;
    const broker = metrics.brokerPerf.find(b => b.id === selectedBrokerId);
    if (!broker) return null;

    const leads = metrics.byBroker[selectedBrokerId] || [];

    // Origins that convert best for this broker
    const originConv: Record<string, { total: number; sold: number }> = {};
    leads.forEach((l: any) => {
      const o = l.lead_origin || "Não identificada";
      if (!originConv[o]) originConv[o] = { total: 0, sold: 0 };
      originConv[o].total++;
      if (l.data_fechamento) originConv[o].sold++;
    });
    const bestOrigins = Object.entries(originConv)
      .filter(([, v]) => v.total >= 2)
      .map(([key, v]) => ({ label: getOriginDisplayLabel(key), total: v.total, sold: v.sold, rate: (v.sold / v.total) * 100 }))
      .sort((a, b) => b.rate - a.rate).slice(0, 5);

    // Projects that convert best
    const projConv: Record<string, { total: number; sold: number }> = {};
    leads.forEach((l: any) => {
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

    // Loss reasons for this broker
    const lossReasons: Record<string, number> = {};
    leads.filter((l: any) => l.status === "inactive").forEach((l: any) => {
      const r = l.inactivation_reason || "sem_motivo";
      lossReasons[r] = (lossReasons[r] || 0) + 1;
    });
    const topLoss = Object.entries(lossReasons).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([key, count]) => ({ label: getInactivationReasonLabel(key), count }));

    // Bottlenecks
    const bottlenecks: { label: string; severity: "high" | "medium" | "low"; detail: string }[] = [];
    if (broker.responseTime !== null && metrics.avgResponseTime !== null && broker.responseTime > metrics.avgResponseTime * 1.5) {
      bottlenecks.push({ label: "Demora para responder", severity: "high", detail: `${fmtHours(broker.responseTime)} vs média ${fmtHours(metrics.avgResponseTime)}` });
    }
    if (broker.calls < metrics.avgCalls * 0.5 && metrics.avgCalls > 1) {
      bottlenecks.push({ label: "Liga pouco", severity: "medium", detail: `${broker.calls} ligações vs média ${Math.round(metrics.avgCalls)}` });
    }
    if (broker.convVisit < metrics.avgConvVisit * 0.7 && broker.total >= 3) {
      bottlenecks.push({ label: "Baixa conversão para visita", severity: "medium", detail: `${broker.convVisit.toFixed(1)}% vs média ${metrics.avgConvVisit.toFixed(1)}%` });
    }
    if (broker.convProposal < metrics.avgConvProposal * 0.7 && broker.total >= 3) {
      bottlenecks.push({ label: "Baixa conversão para proposta", severity: "medium", detail: `${broker.convProposal.toFixed(1)}% vs média ${metrics.avgConvProposal.toFixed(1)}%` });
    }
    if (broker.stale > 5) {
      bottlenecks.push({ label: "Muitos leads parados", severity: "high", detail: `${broker.stale} leads sem movimentação há +30 dias` });
    }
    if (broker.lost > broker.total * 0.5 && broker.total >= 5) {
      bottlenecks.push({ label: "Alta taxa de perda", severity: "high", detail: `${broker.lost} perdidos de ${broker.total} total (${((broker.lost / broker.total) * 100).toFixed(0)}%)` });
    }

    // Radar chart data for comparison
    const normalize = (val: number, max: number) => max === 0 ? 0 : Math.min((val / max) * 100, 100);
    const maxVals = {
      conv: Math.max(...metrics.brokerPerf.map(b => b.convSale), 1),
      calls: Math.max(...metrics.brokerPerf.map(b => b.calls), 1),
      resp: Math.max(...metrics.brokerPerf.map(b => b.responseTime || 0), 1),
      visit: Math.max(...metrics.brokerPerf.map(b => b.convVisit), 1),
      prop: Math.max(...metrics.brokerPerf.map(b => b.convProposal), 1),
    };

    const radarData = [
      { subject: "Conversão Venda", value: normalize(broker.convSale, maxVals.conv) },
      { subject: "Ligações", value: normalize(broker.calls, maxVals.calls) },
      { subject: "Vel. Resposta", value: broker.responseTime !== null ? 100 - normalize(broker.responseTime, maxVals.resp) : 50 },
      { subject: "Conv. Visita", value: normalize(broker.convVisit, maxVals.visit) },
      { subject: "Conv. Proposta", value: normalize(broker.convProposal, maxVals.prop) },
    ];

    return { broker, bestOrigins, bestProjects, topLoss, bottlenecks, radarData };
  }, [selectedBrokerId, metrics, projectMap]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFFF00]" />
      </div>
    );
  }

  const fmtPct = (v: number) => `${v.toFixed(1)}%`;

  // Comparison chart data
  const compResponseChart = metrics.brokerPerf
    .filter(b => b.responseTime !== null)
    .sort((a, b) => (a.responseTime || 0) - (b.responseTime || 0))
    .slice(0, 10)
    .map(b => ({ name: b.name.split(" ")[0], value: +(b.responseTime || 0).toFixed(1) }));

  const compConvChart = metrics.brokerPerf
    .filter(b => b.total >= 3)
    .sort((a, b) => b.convSale - a.convSale)
    .slice(0, 10)
    .map(b => ({ name: b.name.split(" ")[0], visita: +b.convVisit.toFixed(1), proposta: +b.convProposal.toFixed(1), venda: +b.convSale.toFixed(1) }));

  const compCallsChart = metrics.brokerPerf
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 10)
    .map(b => ({ name: b.name.split(" ")[0], calls: b.calls }));

  const compStaleChart = metrics.brokerPerf
    .filter(b => b.stale > 0)
    .sort((a, b) => b.stale - a.stale)
    .slice(0, 10)
    .map(b => ({ name: b.name.split(" ")[0], stale: b.stale }));

  const lossByStageColors = ["#FFFF00", "#22d3ee", "#a78bfa", "#f97316", "#f87171"];

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-white">Performance Comercial</h2>
        <PeriodFilterWithCustom
          period={period}
          onPeriodChange={(v) => setPeriod(v as Period)}
          customRange={customRange}
          onCustomRangeApply={(start, end) => {
            setCustomRange({ start, end });
            setPeriod("custom");
          }}
          showAllPeriod
        />
      </div>

      {/* ══════════ 1. CARDS PRINCIPAIS ══════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <KpiCard icon={Users} label="Leads Distribuídos" value={metrics.totalLeads} />
        <KpiCard icon={UserCheck} label="Leads Atendidos" value={metrics.attended} color="text-cyan-400" />
        <KpiCard icon={Clock} label="Tempo Médio Resposta" value={metrics.medianResponseHours !== null ? fmtHours(metrics.medianResponseHours) : "—"} color="text-[#FFFF00]" />
        <KpiCard icon={Activity} label="Taxa de Resposta" value={fmtPct(metrics.responseRate)} color="text-emerald-400" />
        <KpiCard icon={Phone} label="Total de Ligações" value={metrics.totalCalls} color="text-violet-400" />
        <KpiCard icon={Eye} label="Total de Visitas" value={metrics.visited} color="text-cyan-400" />
        <KpiCard icon={CalendarCheck} label="Agendamentos" value={metrics.scheduled} color="text-orange-400" />
        <KpiCard icon={FileText} label="Propostas" value={metrics.proposals} color="text-violet-400" />
        <KpiCard icon={Handshake} label="Vendas" value={metrics.sales} color="text-emerald-400" />
        <KpiCard icon={AlertTriangle} label="Leads Parados" value={metrics.totalStale} color="text-amber-400" alert={metrics.totalStale > 10} />
        <KpiCard icon={ArrowDownRight} label="Leads Perdidos" value={metrics.lost} color="text-red-400" />
      </div>

      {/* ══════════ 2. RANKING DE CORRETORES ══════════ */}
      <Card className="bg-[#1e1e22] border-[#2a2a2e]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#FFFF00]" /> Ranking de Corretores
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {metrics.brokerPerf.length === 0 ? (
            <p className="text-xs text-slate-500">Sem dados</p>
          ) : (
            <table className="w-full text-xs min-w-[900px]">
              <thead>
                <tr className="border-b border-[#2a2a2e]">
                  <th className="text-left py-2 text-slate-400 font-medium sticky left-0 bg-[#1e1e22] z-10">#</th>
                  <th className="text-left py-2 text-slate-400 font-medium sticky left-6 bg-[#1e1e22] z-10">Corretor</th>
                  <th className="text-center py-2 text-slate-400 font-medium">Receb.</th>
                  <th className="text-center py-2 text-slate-400 font-medium">Manual</th>
                  <th className="text-center py-2 text-slate-400 font-medium">Atend.</th>
                  <th className="text-center py-2 text-slate-400 font-medium">T. Resp.</th>
                  <th className="text-center py-2 text-slate-400 font-medium">Ligações</th>
                  <th className="text-center py-2 text-[#FFFF00] font-bold">→ Visita</th>
                  <th className="text-center py-2 text-slate-400 font-medium">→ Agend.</th>
                  <th className="text-center py-2 text-slate-400 font-medium">→ Prop.</th>
                  <th className="text-center py-2 text-emerald-400 font-bold">→ Venda</th>
                  <th className="text-center py-2 text-slate-400 font-medium">Parados</th>
                  <th className="text-center py-2 text-slate-400 font-medium">Perdidos</th>
                </tr>
              </thead>
              <tbody>
                {metrics.brokerPerf.map((b, i) => (
                  <tr
                    key={b.id}
                    className={`border-b border-[#2a2a2e]/50 hover:bg-[#2a2a2e]/30 cursor-pointer ${selectedBrokerId === b.id ? "bg-[#FFFF00]/5" : ""}`}
                    onClick={() => setSelectedBrokerId(selectedBrokerId === b.id ? null : b.id)}
                  >
                    <td className="py-2 text-slate-500 sticky left-0 bg-inherit">{i + 1}</td>
                    <td className="py-2 text-white font-medium max-w-[140px] truncate sticky left-6 bg-inherit">{b.name}</td>
                    <td className="text-center py-2 text-cyan-400">{b.received}</td>
                    <td className="text-center py-2 text-violet-400">{b.manual}</td>
                    <td className="text-center py-2 text-slate-300">{b.attended}</td>
                    <td className="text-center py-2 text-slate-300">{b.responseTime !== null ? fmtHours(b.responseTime) : "—"}</td>
                    <td className="text-center py-2 text-slate-300">{b.calls}</td>
                    <td className="text-center py-2 font-bold text-[#FFFF00]">{fmtPct(b.convVisit)}</td>
                    <td className="text-center py-2 text-slate-300">{fmtPct(b.convSchedule)}</td>
                    <td className="text-center py-2 text-slate-300">{fmtPct(b.convProposal)}</td>
                    <td className="text-center py-2 font-bold text-emerald-400">{fmtPct(b.convSale)}</td>
                    <td className={`text-center py-2 ${b.stale > 5 ? "text-amber-400 font-bold" : "text-slate-300"}`}>{b.stale}</td>
                    <td className={`text-center py-2 ${b.lost > b.total * 0.4 ? "text-red-400 font-bold" : "text-slate-300"}`}>{b.lost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* ══════════ 3. COMPARATIVO ENTRE CORRETORES ══════════ */}
      <div className="grid lg:grid-cols-2 gap-4">
        {compResponseChart.length > 0 && (
          <Card className="bg-[#1e1e22] border-[#2a2a2e]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                <Timer className="w-4 h-4 text-[#FFFF00]" /> Quem Atende Mais Rápido (horas)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(180, compResponseChart.length * 30)}>
                <BarChart data={compResponseChart} layout="vertical">
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} unit="h" />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#e2e8f0", fontSize: 11 }} width={70} />
                  <Tooltip {...chartTooltipStyle} formatter={(v: number) => `${v}h`} />
                  <Bar dataKey="value" fill="#22d3ee" radius={[0, 4, 4, 0]} barSize={16} name="Tempo" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {compConvChart.length > 0 && (
          <Card className="bg-[#1e1e22] border-[#2a2a2e]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#FFFF00]" /> Quem Converte Melhor (%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(180, compConvChart.length * 36)}>
                <BarChart data={compConvChart} layout="vertical">
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#e2e8f0", fontSize: 11 }} width={70} />
                  <Tooltip {...chartTooltipStyle} formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="visita" fill="#22d3ee" name="Visita" barSize={8} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="proposta" fill="#a78bfa" name="Proposta" barSize={8} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="venda" fill="#34d399" name="Venda" barSize={8} radius={[0, 4, 4, 0]} />
                  <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {compCallsChart.length > 0 && (
          <Card className="bg-[#1e1e22] border-[#2a2a2e]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#FFFF00]" /> Quem Liga Mais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(180, compCallsChart.length * 30)}>
                <BarChart data={compCallsChart} layout="vertical">
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#e2e8f0", fontSize: 11 }} width={70} />
                  <Tooltip {...chartTooltipStyle} />
                  <Bar dataKey="calls" fill="#a78bfa" radius={[0, 4, 4, 0]} barSize={16} name="Ligações" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {compStaleChart.length > 0 && (
          <Card className="bg-[#1e1e22] border-[#2a2a2e]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Acúmulo de Leads Parados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(180, compStaleChart.length * 30)}>
                <BarChart data={compStaleChart} layout="vertical">
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#e2e8f0", fontSize: 11 }} width={70} />
                  <Tooltip {...chartTooltipStyle} />
                  <Bar dataKey="stale" fill="#fbbf24" radius={[0, 4, 4, 0]} barSize={16} name="Parados" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ══════════ 4 & 5. PERFORMANCE INDIVIDUAL ══════════ */}
      <Card className="bg-[#1e1e22] border-[#2a2a2e]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-[#FFFF00]" /> Performance Individual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {brokers.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBrokerId(selectedBrokerId === b.id ? null : b.id)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                  selectedBrokerId === b.id
                    ? "bg-[#FFFF00] text-black border-[#FFFF00] font-bold"
                    : "bg-[#2a2a2e] text-slate-300 border-[#2a2a2e] hover:border-[#FFFF00]/50"
                }`}
              >
                {b.name.split(" ")[0]}
              </button>
            ))}
          </div>

          {individualData ? (
            <div className="space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <MiniStat label="Leads Recebidos" value={individualData.broker.total} />
                <MiniStat label="Taxa de Atendimento" value={fmtPct(individualData.broker.attended / Math.max(individualData.broker.total, 1) * 100)} />
                <MiniStat label="Tempo Resposta" value={individualData.broker.responseTime !== null ? fmtHours(individualData.broker.responseTime) : "—"} />
                <MiniStat label="Conv. Visita" value={fmtPct(individualData.broker.convVisit)} />
                <MiniStat label="Conv. Proposta" value={fmtPct(individualData.broker.convProposal)} />
                <MiniStat label="Conv. Venda" value={fmtPct(individualData.broker.convSale)} highlight />
                <MiniStat label="Ligações" value={individualData.broker.calls} />
                <MiniStat label="Follow-ups" value={individualData.broker.followups} />
                <MiniStat label="Leads Parados" value={individualData.broker.stale} alert={individualData.broker.stale > 5} />
                <MiniStat label="Leads Perdidos" value={individualData.broker.lost} />
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

              {/* Bottlenecks */}
              {individualData.bottlenecks.length > 0 && (
                <Card className="bg-[#16161a] border-amber-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-amber-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Pontos de Atenção
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {individualData.bottlenecks.map((b, i) => (
                        <div key={i} className={`rounded-lg p-3 border ${
                          b.severity === "high" ? "bg-red-500/5 border-red-500/30" : "bg-amber-500/5 border-amber-500/20"
                        }`}>
                          <p className={`text-xs font-medium ${b.severity === "high" ? "text-red-400" : "text-amber-400"}`}>{b.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{b.detail}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Loss reasons for individual */}
              {individualData.topLoss.length > 0 && (
                <Card className="bg-[#16161a] border-[#2a2a2e]">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs text-slate-400">Motivos de Perda Mais Comuns</CardTitle>
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
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">Selecione um corretor acima para ver a performance individual</p>
          )}
        </CardContent>
      </Card>

      {/* ══════════ 6. MOTIVOS DE PERDA ══════════ */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="bg-[#1e1e22] border-[#2a2a2e]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-red-400" /> Motivos de Perda (Geral)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.topLossReasons.length === 0 ? <p className="text-xs text-slate-500">Sem dados</p> : (
              <ResponsiveContainer width="100%" height={Math.max(160, metrics.topLossReasons.length * 28)}>
                <BarChart data={metrics.topLossReasons.map(r => ({ name: r.label.length > 20 ? r.label.slice(0, 20) + "…" : r.label, count: r.count }))} layout="vertical">
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#e2e8f0", fontSize: 10 }} width={140} />
                  <Tooltip {...chartTooltipStyle} />
                  <Bar dataKey="count" fill="#f87171" radius={[0, 4, 4, 0]} barSize={16} name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#1e1e22] border-[#2a2a2e]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-red-400" /> Perda por Etapa do Funil
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.lossByStageData.length === 0 ? <p className="text-xs text-slate-500">Sem dados</p> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={metrics.lossByStageData.map((d, i) => ({ name: d.label, value: d.count, fill: lossByStageColors[i % lossByStageColors.length] }))}
                    dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={35} paddingAngle={2} strokeWidth={0}
                  >
                    {metrics.lossByStageData.map((_, i) => <Cell key={i} fill={lossByStageColors[i % lossByStageColors.length]} />)}
                  </Pie>
                  <Tooltip {...chartTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Loss by broker table */}
      <Card className="bg-[#1e1e22] border-[#2a2a2e]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <ArrowDownRight className="w-4 h-4 text-red-400" /> Perda por Corretor
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {Object.keys(metrics.lossByBroker).length === 0 ? <p className="text-xs text-slate-500">Sem dados</p> : (
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-[#2a2a2e]">
                  <th className="text-left py-2 text-slate-400 font-medium">Corretor</th>
                  {metrics.topLossReasons.slice(0, 5).map(r => (
                    <th key={r.key} className="text-center py-2 text-slate-400 font-medium">{r.label.length > 12 ? r.label.slice(0, 12) + "…" : r.label}</th>
                  ))}
                  <th className="text-center py-2 text-red-400 font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metrics.lossByBroker)
                  .map(([name, reasons]) => ({ name, reasons, total: Object.values(reasons).reduce((a, b) => a + b, 0) }))
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 10)
                  .map((row, i) => (
                    <tr key={i} className="border-b border-[#2a2a2e]/50 hover:bg-[#2a2a2e]/30">
                      <td className="py-2 text-white font-medium max-w-[120px] truncate">{row.name}</td>
                      {metrics.topLossReasons.slice(0, 5).map(r => (
                        <td key={r.key} className="text-center py-2 text-slate-300">{row.reasons[r.key] || 0}</td>
                      ))}
                      <td className="text-center py-2 text-red-400 font-bold">{row.total}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* ══════════ 7. INSIGHTS ══════════ */}
      <Card className="bg-[#1e1e22] border-[#FFFF00]/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-[#FFFF00] flex items-center gap-2">
            <Award className="w-4 h-4" /> Destaques do Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {metrics.bestResponseBroker && (
              <InsightCard
                icon={Zap}
                label="Resposta mais rápida"
                broker={metrics.bestResponseBroker.name}
                value={fmtHours(metrics.bestResponseBroker.responseTime || 0)}
                color="text-cyan-400"
              />
            )}
            {metrics.bestVisitBroker && (
              <InsightCard
                icon={Eye}
                label="Melhor conversão visita"
                broker={metrics.bestVisitBroker.name}
                value={fmtPct(metrics.bestVisitBroker.convVisit)}
                color="text-violet-400"
              />
            )}
            {metrics.bestProposalBroker && (
              <InsightCard
                icon={FileText}
                label="Mais propostas"
                broker={metrics.bestProposalBroker.name}
                value={fmtPct(metrics.bestProposalBroker.convProposal)}
                color="text-orange-400"
              />
            )}
            {metrics.bestSaleBroker && (
              <InsightCard
                icon={Handshake}
                label="Melhor conversão venda"
                broker={metrics.bestSaleBroker.name}
                value={fmtPct(metrics.bestSaleBroker.convSale)}
                color="text-emerald-400"
              />
            )}
            {metrics.mostCallsBroker && metrics.mostCallsBroker.calls > 0 && (
              <InsightCard
                icon={Phone}
                label="Mais ligações"
                broker={metrics.mostCallsBroker.name}
                value={`${metrics.mostCallsBroker.calls} ligações`}
                color="text-violet-400"
              />
            )}
            {metrics.mostStaleBroker && metrics.mostStaleBroker.stale > 0 && (
              <InsightCard
                icon={AlertTriangle}
                label="Mais leads parados"
                broker={metrics.mostStaleBroker.name}
                value={`${metrics.mostStaleBroker.stale} leads`}
                color="text-amber-400"
                isAlert
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Helper ──
function fmtHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}min`;
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

// ── Sub-components ──
function KpiCard({ icon: Icon, label, value, color = "text-white", alert }: {
  icon: any; label: string; value: string | number; color?: string; alert?: boolean;
}) {
  return (
    <div className={`bg-[#1e1e22] border rounded-xl p-3 sm:p-4 ${alert ? "border-amber-500/50" : "border-[#2a2a2e]"}`}>
      <div className="flex items-start gap-2 sm:gap-3">
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 ${alert ? "bg-amber-400/10" : "bg-[#FFFF00]/10"}`}>
          <Icon className={`w-4 h-4 ${alert ? "text-amber-400" : "text-[#FFFF00]"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-slate-400 truncate leading-tight">{label}</p>
          <p className={`text-base sm:text-lg font-bold ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );
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

function InsightCard({ icon: Icon, label, broker, value, color, isAlert }: {
  icon: any; label: string; broker: string; value: string; color: string; isAlert?: boolean;
}) {
  return (
    <div className={`rounded-lg p-3 border ${isAlert ? "bg-amber-500/5 border-amber-500/20" : "bg-[#16161a] border-[#2a2a2e]"}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[10px] text-slate-400">{label}</span>
      </div>
      <p className="text-sm font-bold text-white truncate">{broker}</p>
      <p className={`text-xs font-medium ${color}`}>{value}</p>
    </div>
  );
}
