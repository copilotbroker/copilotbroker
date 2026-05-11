import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/use-user-role";
import { AdminScopeToggle, type AdminScope } from "@/components/admin/AdminScopeToggle";
import {
  Users, TrendingUp, AlertTriangle, Clock, BarChart3, Globe,
  Eye, Trophy, Timer, ArrowDownRight, UserCheck, UserPlus, Loader2,
  CalendarCheck, FileText, Handshake, AlertCircle, TrendingDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodFilterWithCustom } from "@/components/ui/custom-date-range-picker";
import { getInactivationReasonLabel, getOriginDisplayLabel } from "@/types/crm";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid,
  LineChart, Line
} from "recharts";
import { format, subDays, startOfDay, startOfMonth, eachDayOfInterval, eachHourOfInterval, eachMonthOfInterval, startOfHour } from "date-fns";
import { ptBR } from "date-fns/locale";

type Period = "today" | "7d" | "30d" | "all" | "custom";

function getDateRange(period: Period): { from: Date | null; to: Date } {
  const now = new Date();
  if (period === "today") return { from: startOfDay(now), to: now };
  if (period === "7d") return { from: subDays(startOfDay(now), 7), to: now };
  if (period === "30d") return { from: subDays(startOfDay(now), 30), to: now };
  return { from: null, to: now };
}

function getPreviousRange(period: Period): { from: Date; to: Date } | null {
  if (period === "all") return null;
  const now = new Date();
  if (period === "today") {
    const yesterday = subDays(startOfDay(now), 1);
    return { from: yesterday, to: startOfDay(now) };
  }
  if (period === "7d") {
    return { from: subDays(startOfDay(now), 14), to: subDays(startOfDay(now), 7) };
  }
  if (period === "30d") {
    return { from: subDays(startOfDay(now), 60), to: subDays(startOfDay(now), 30) };
  }
  return null;
}

interface BrokerRow { id: string; name: string; lider_id?: string | null }

const CHART_COLORS = ["#FFFF00", "#22d3ee", "#a78bfa", "#f97316", "#34d399", "#f472b6", "#60a5fa", "#fbbf24"];

const chartTooltipStyle = {
  contentStyle: { background: "#1e1e22", border: "1px solid #2a2a2e", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "#fff" },
  itemStyle: { color: "#e2e8f0" },
};

function VariationBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  const pct = previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;
  const isPositive = pct >= 0;
  return (
    <span className={`text-[10px] font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
      {isPositive ? "+" : ""}{pct.toFixed(0)}%
    </span>
  );
}

export default function IntelligenceDashboard() {
  const { brokerId: myBrokerId } = useUserRole();
  const [scope, setScope] = useState<AdminScope>(myBrokerId ? "mine" : "all");
  const [period, setPeriod] = useState<Period>("30d");
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | null>(null);
  const { from: dateFrom, to: dateTo } = period === "custom" && customRange
    ? { from: customRange.start, to: customRange.end }
    : getDateRange(period as "today" | "7d" | "30d" | "all");
  const prevRange = period === "custom" ? null : getPreviousRange(period as "today" | "7d" | "30d" | "all");

  // === Data fetching ===
  const { data: allBrokersRaw = [] } = useQuery<BrokerRow[]>({
    queryKey: ["intel-brokers"],
    queryFn: async () => {
      const { data } = await supabase.from("brokers").select("id, name, lider_id").eq("is_active", true).order("name");
      return (data || []) as BrokerRow[];
    },
    staleTime: 5 * 60_000,
  });

  const brokers = useMemo(() => {
    const leaderIds = new Set(allBrokersRaw.filter(b => b.lider_id).map(b => b.lider_id!));
    return allBrokersRaw.filter(b => b.lider_id !== null || leaderIds.has(b.id));
  }, [allBrokersRaw]);

  const brokerMap = useMemo(() => {
    const m: Record<string, string> = {};
    brokers.forEach(b => { m[b.id] = b.name; });
    return m;
  }, [brokers]);

  const { data: allLeadsRaw = [], isLoading } = useQuery({
    queryKey: ["intel-leads", period],
    queryFn: async () => {
      let q = supabase.from("leads").select(
        "id, name, status, broker_id, project_id, lead_origin, source, created_at, inactivation_reason, atendimento_iniciado_em, data_agendamento, tipo_agendamento, comparecimento, data_envio_proposta, data_fechamento, data_perda, last_interaction_at, registered_by"
      );
      // For period comparison, fetch wider range
      if (dateFrom && prevRange) {
        q = q.gte("created_at", prevRange.from.toISOString());
      } else if (dateFrom) {
        q = q.gte("created_at", dateFrom.toISOString());
      }
      const { data } = await q.order("created_at", { ascending: false }).limit(10000);
      return data || [];
    },
    staleTime: 30_000,
  });

  const { data: staleLeadsRaw = [] } = useQuery({
    queryKey: ["intel-stale-leads"],
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

  const allLeads = useMemo(
    () => (scope === "mine" && myBrokerId ? (allLeadsRaw as any[]).filter(l => l.broker_id === myBrokerId) : allLeadsRaw),
    [allLeadsRaw, scope, myBrokerId]
  );
  const staleLeads = useMemo(
    () => (scope === "mine" && myBrokerId ? (staleLeadsRaw as any[]).filter(l => l.broker_id === myBrokerId) : staleLeadsRaw),
    [staleLeadsRaw, scope, myBrokerId]
  );

  const { data: projects = [] } = useQuery({
    queryKey: ["intel-projects"],
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
    queryKey: ["intel-pageviews", period],
    queryFn: async () => {
      let q = supabase.from("page_views").select("id, project_id, created_at");
      if (dateFrom) q = q.gte("created_at", dateFrom.toISOString());
      const { data } = await q.limit(10000);
      return data || [];
    },
    staleTime: 60_000,
  });

  const { data: attributions = [] } = useQuery({
    queryKey: ["intel-attributions"],
    queryFn: async () => {
      const { data } = await supabase.from("lead_attribution").select("lead_id, landing_page");
      return data || [];
    },
    staleTime: 5 * 60_000,
  });

  const { manualLeadIds, landingPageLeadIds } = useMemo(() => {
    const manual = new Set<string>();
    const lp = new Set<string>();
    (attributions as any[]).forEach(a => {
      if (!a.lead_id) return;
      if (a.landing_page === "admin_manual" || a.landing_page === "csv_import") {
        manual.add(a.lead_id);
      } else {
        lp.add(a.lead_id);
      }
    });
    return { manualLeadIds: manual, landingPageLeadIds: lp };
  }, [attributions]);

  // === Metrics calculation ===
  const metrics = useMemo(() => {
    const currentLeads = dateFrom
      ? allLeads.filter((l: any) => new Date(l.created_at) >= dateFrom)
      : allLeads;
    const prevLeads = prevRange
      ? allLeads.filter((l: any) => {
          const d = new Date(l.created_at);
          return d >= prevRange.from && d < prevRange.to;
        })
      : [];

    const totalLeads = currentLeads.length;
    const prevTotalLeads = prevLeads.length;

    const isManual = (l: any) => l.source === "manual" || l.source === "csv" || !!l.registered_by || manualLeadIds.has(l.id);
    const manualLeads = currentLeads.filter(isManual);
    const receivedLeads = currentLeads.filter((l: any) => !isManual(l));
    const prevManualLeads = prevLeads.filter(isManual);
    const prevReceivedLeads = prevLeads.filter((l: any) => !isManual(l));

    const inactive = currentLeads.filter((l: any) => l.status === "inactive");
    const prevInactive = prevLeads.filter((l: any) => l.status === "inactive");
    const reasonCount: Record<string, number> = {};
    inactive.forEach((l: any) => {
      const r = l.inactivation_reason || "sem_motivo";
      reasonCount[r] = (reasonCount[r] || 0) + 1;
    });
    const topReasons = Object.entries(reasonCount)
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([key, count]) => ({ key, label: getInactivationReasonLabel(key), count }));

    // Evolution chart
    const evolutionData = (() => {
      if (period === "today") {
        const hours = eachHourOfInterval({ start: startOfDay(new Date()), end: new Date() });
        return hours.map(h => {
          const count = currentLeads.filter((l: any) => {
            const d = new Date(l.created_at);
            return d >= h && d < new Date(h.getTime() + 3600000);
          }).length;
          return { label: format(h, "HH:mm"), count };
        });
      } else if (period === "7d" || period === "30d") {
        const days = eachDayOfInterval({ start: dateFrom!, end: dateTo });
        return days.map(day => {
          const nextDay = new Date(day.getTime() + 86400000);
          const count = currentLeads.filter((l: any) => {
            const d = new Date(l.created_at);
            return d >= day && d < nextDay;
          }).length;
          return { label: format(day, "dd/MM", { locale: ptBR }), count };
        });
      } else {
        const earliest = currentLeads.length > 0 ? new Date(currentLeads[currentLeads.length - 1].created_at) : subDays(new Date(), 365);
        const months = eachMonthOfInterval({ start: startOfMonth(earliest), end: new Date() });
        return months.map(m => {
          const nextM = new Date(m.getFullYear(), m.getMonth() + 1, 1);
          const count = currentLeads.filter((l: any) => {
            const d = new Date(l.created_at);
            return d >= m && d < nextM;
          }).length;
          return { label: format(m, "MMM/yy", { locale: ptBR }), count };
        });
      }
    })();

    // By origin
    const byOrigin: Record<string, number> = {};
    currentLeads.forEach((l: any) => {
      const o = l.lead_origin || "Não identificada";
      byOrigin[o] = (byOrigin[o] || 0) + 1;
    });
    const originRanking = Object.entries(byOrigin)
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([key, count]) => ({ label: getOriginDisplayLabel(key), count }));

    // Broker table
    const byBroker: Record<string, { total: number; manual: number; received: number }> = {};
    currentLeads.forEach((l: any) => {
      const bid = l.broker_id || "_sem";
      if (!byBroker[bid]) byBroker[bid] = { total: 0, manual: 0, received: 0 };
      byBroker[bid].total++;
      if (isManual(l)) byBroker[bid].manual++;
      else byBroker[bid].received++;
    });

    // Funnel
    const attended = currentLeads.filter((l: any) => l.atendimento_iniciado_em || !["new"].includes(l.status));
    const prevAttended = prevLeads.filter((l: any) => l.atendimento_iniciado_em || !["new"].includes(l.status));
    const funnelCount = {
      atendimento: attended.length,
      agendamento: attended.filter((l: any) => l.data_agendamento).length,
      visita: attended.filter((l: any) => l.comparecimento === true).length,
      proposta: attended.filter((l: any) => l.data_envio_proposta).length,
      venda: attended.filter((l: any) => l.data_fechamento).length,
    };
    const calcRate = (num: number, den: number) => den === 0 ? 0 : (num / den) * 100;
    const funnelRates = {
      agendamento: calcRate(funnelCount.agendamento, funnelCount.atendimento),
      visita: calcRate(funnelCount.visita, funnelCount.atendimento),
      proposta: calcRate(funnelCount.proposta, funnelCount.atendimento),
      venda: calcRate(funnelCount.venda, funnelCount.atendimento),
    };
    const prevFunnelRates = (() => {
      const att = prevAttended.length;
      return {
        agendamento: calcRate(prevAttended.filter((l: any) => l.data_agendamento).length, att),
        visita: calcRate(prevAttended.filter((l: any) => l.comparecimento === true).length, att),
        proposta: calcRate(prevAttended.filter((l: any) => l.data_envio_proposta).length, att),
        venda: calcRate(prevAttended.filter((l: any) => l.data_fechamento).length, att),
      };
    })();

    // Broker funnel
    const attendedByBroker: Record<string, any[]> = {};
    attended.forEach((l: any) => {
      const bid = l.broker_id;
      if (!bid) return;
      if (!attendedByBroker[bid]) attendedByBroker[bid] = [];
      attendedByBroker[bid].push(l);
    });

    const brokerPerformance = Object.entries(attendedByBroker)
      .filter(([bid]) => brokerMap[bid])
      .map(([bid, arr]) => {
        const total = byBroker[bid]?.total || arr.length;
        return {
          id: bid,
          name: brokerMap[bid] || bid.slice(0, 8),
          total,
          manual: byBroker[bid]?.manual || 0,
          received: byBroker[bid]?.received || 0,
          base: arr.length,
          agendamento: calcRate(arr.filter((l: any) => l.data_agendamento).length, arr.length),
          visita: calcRate(arr.filter((l: any) => l.comparecimento === true).length, arr.length),
          proposta: calcRate(arr.filter((l: any) => l.data_envio_proposta).length, arr.length),
          venda: calcRate(arr.filter((l: any) => l.data_fechamento).length, arr.length),
        };
      })
      .sort((a, b) => b.venda - a.venda);

    // Projects — only count landing page leads for conversion rate
    const byProject: Record<string, number> = {};
    const byProjectLandingPage: Record<string, number> = {};
    currentLeads.forEach((l: any) => {
      if (l.project_id) {
        byProject[l.project_id] = (byProject[l.project_id] || 0) + 1;
        if (landingPageLeadIds.has(l.id)) byProjectLandingPage[l.project_id] = (byProjectLandingPage[l.project_id] || 0) + 1;
      }
    });
    const pvByProject: Record<string, number> = {};
    (pageViews as any[]).forEach((pv: any) => {
      if (pv.project_id) pvByProject[pv.project_id] = (pvByProject[pv.project_id] || 0) + 1;
    });

    const allProjectIds = new Set([...Object.keys(byProject), ...Object.keys(pvByProject)]);
    const projectPerformance = Array.from(allProjectIds)
      .map(id => ({
        id,
        name: projectMap[id] || id.slice(0, 8),
        leads: byProject[id] || 0,
        leadsLandingPage: byProjectLandingPage[id] || 0,
        views: pvByProject[id] || 0,
        rate: pvByProject[id] ? calcRate(byProjectLandingPage[id] || 0, pvByProject[id]) : 0,
      }))
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 10);

    // Conversion time (median)
    const calcMedianDays = (subset: any[], fromField: string, toField: string) => {
      const diffs: number[] = [];
      subset.forEach((l: any) => {
        const from = l[fromField]; const to = l[toField];
        if (from && to) {
          const d = (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000;
          if (d >= 0) diffs.push(d);
        }
      });
      if (diffs.length === 0) return null;
      diffs.sort((a, b) => a - b);
      const mid = Math.floor(diffs.length / 2);
      return diffs.length % 2 !== 0 ? diffs[mid] : (diffs[mid - 1] + diffs[mid]) / 2;
    };

    const convTimeByBroker = (toField: string) => {
      const results: { name: string; medianDays: number; count: number }[] = [];
      Object.entries(attendedByBroker).forEach(([bid, arr]) => {
        if (!brokerMap[bid]) return;
        const relevant = arr.filter((l: any) => l.atendimento_iniciado_em && l[toField]);
        if (relevant.length === 0) return;
        const median = calcMedianDays(relevant, "atendimento_iniciado_em", toField);
        if (median !== null) results.push({ name: brokerMap[bid] || bid.slice(0, 8), medianDays: median, count: relevant.length });
      });
      return results.sort((a, b) => a.medianDays - b.medianDays);
    };

    return {
      totalLeads, prevTotalLeads,
      receivedCount: receivedLeads.length, prevReceivedCount: prevReceivedLeads.length,
      manualCount: manualLeads.length, prevManualCount: prevManualLeads.length,
      inactiveCount: inactive.length, prevInactiveCount: prevInactive.length,
      staleCount: staleLeads.length,
      funnelCount, funnelRates, prevFunnelRates,
      evolutionData, originRanking, topReasons,
      byBroker, brokerPerformance, projectPerformance,
      timeToAgendamento: convTimeByBroker("data_agendamento"),
      timeToProposta: convTimeByBroker("data_envio_proposta"),
      timeToVenda: convTimeByBroker("data_fechamento"),
    };
  }, [allLeads, staleLeads, brokerMap, projectMap, pageViews, dateFrom, dateTo, period, prevRange, manualLeadIds, landingPageLeadIds]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFFF00]" />
      </div>
    );
  }

  const fmtPct = (v: number) => `${v.toFixed(1)}%`;
  const fmtDays = (v: number) => v < 1 ? `${Math.round(v * 24)}h` : `${v.toFixed(1)}d`;

  const originPieData = metrics.originRanking.map((o, i) => ({
    name: o.label, value: o.count, fill: CHART_COLORS[i % CHART_COLORS.length]
  }));

  const isAgendamentoDown = metrics.prevFunnelRates.agendamento > 0 && metrics.funnelRates.agendamento < metrics.prevFunnelRates.agendamento;
  const isPropostaDown = metrics.prevFunnelRates.proposta > 0 && metrics.funnelRates.proposta < metrics.prevFunnelRates.proposta;

  return (
    <div className="space-y-6">
      {/* Scope + Period selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white">Inteligência Comercial</h2>
          <AdminScopeToggle scope={scope} onScopeChange={setScope} hasBrokerProfile={!!myBrokerId} />
        </div>
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

      {/* ══════════════════════════════════════════════════════ */}
      {/* FAIXA 1 — Resumo Executivo                           */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard icon={Users} label="Total de Leads" value={metrics.totalLeads} prev={metrics.prevTotalLeads} />
        <KpiCard icon={UserCheck} label="Recebidos" value={metrics.receivedCount} prev={metrics.prevReceivedCount} color="text-cyan-400" />
        <KpiCard icon={UserPlus} label="Manuais" value={metrics.manualCount} prev={metrics.prevManualCount} color="text-violet-400" />
        <KpiCard icon={AlertTriangle} label="Inativados" value={metrics.inactiveCount} prev={metrics.prevInactiveCount} color="text-red-400" />
        <KpiCard icon={Clock} label="Parados +30d" value={metrics.staleCount} sublabel="(base atual)" color="text-amber-400" alert={metrics.staleCount > 10} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard icon={CalendarCheck} label="Conv. → Agendamento" value={fmtPct(metrics.funnelRates.agendamento)} prev={metrics.prevFunnelRates.agendamento} isPct color="text-[#FFFF00]" alert={isAgendamentoDown} />
        <KpiCard icon={Eye} label="Conv. → Visita" value={fmtPct(metrics.funnelRates.visita)} prev={metrics.prevFunnelRates.visita} isPct color="text-cyan-400" />
        <KpiCard icon={FileText} label="Conv. → Proposta" value={fmtPct(metrics.funnelRates.proposta)} prev={metrics.prevFunnelRates.proposta} isPct color="text-violet-400" alert={isPropostaDown} />
        <KpiCard icon={Handshake} label="Conv. → Venda" value={fmtPct(metrics.funnelRates.venda)} prev={metrics.prevFunnelRates.venda} isPct color="text-emerald-400" />
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* FAIXA 2 — Evolução + Origens                         */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="bg-[#1e1e22] border-[#2a2a2e]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FFFF00]" /> Evolução de Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={metrics.evolutionData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFFF00" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FFFF00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
                <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
                <Tooltip {...chartTooltipStyle} />
                <Area type="monotone" dataKey="count" stroke="#FFFF00" fill="url(#colorLeads)" strokeWidth={2} name="Leads" />
              </AreaChart>
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
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={originPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={2} strokeWidth={0}>
                  {originPieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip {...chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* FAIXA 3 — Funil + Inativação/Parados                 */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="bg-[#1e1e22] border-[#2a2a2e]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#FFFF00]" /> Funil Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Atendimento", count: metrics.funnelCount.atendimento, rate: 100, color: "bg-[#FFFF00]" },
                { label: "Agendamento", count: metrics.funnelCount.agendamento, rate: metrics.funnelRates.agendamento, color: "bg-cyan-400" },
                { label: "Visita", count: metrics.funnelCount.visita, rate: metrics.funnelRates.visita, color: "bg-violet-400" },
                { label: "Proposta", count: metrics.funnelCount.proposta, rate: metrics.funnelRates.proposta, color: "bg-orange-400" },
                { label: "Venda", count: metrics.funnelCount.venda, rate: metrics.funnelRates.venda, color: "bg-emerald-400" },
              ].map((step, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-300">{step.label}</span>
                    <span className="text-xs font-bold text-white">{step.count} <span className="text-slate-500 font-normal">({step.rate.toFixed(1)}%)</span></span>
                  </div>
                  <div className="w-full h-2 bg-[#2a2a2e] rounded-full overflow-hidden">
                    <div className={`h-full ${step.color} rounded-full transition-all`} style={{ width: `${Math.min(step.rate, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-[#1e1e22] border-[#2a2a2e]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-red-400" /> Motivos de Inativação
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.topReasons.length === 0 ? <p className="text-xs text-slate-500">Sem dados</p> : (
                <div className="space-y-2">
                  {metrics.topReasons.map((r, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-slate-300 truncate flex-1">{r.label}</span>
                      <span className="text-xs font-bold text-red-400 ml-2">{r.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {metrics.staleCount > 0 && (
            <Card className="bg-[#1e1e22] border-amber-500/30 border-2">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-400">{metrics.staleCount} leads parados</p>
                    <p className="text-xs text-slate-400">Sem movimentação há mais de 30 dias — gargalo operacional</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* FAIXA 4 — Performance por Corretor                   */}
      {/* ══════════════════════════════════════════════════════ */}
      <Card className="bg-[#1e1e22] border-[#2a2a2e]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#FFFF00]" /> Performance por Corretor
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {metrics.brokerPerformance.length === 0 ? (
            <p className="text-xs text-slate-500">Sem dados</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#2a2a2e]">
                  <th className="text-left py-2 text-slate-400 font-medium">Corretor</th>
                  <th className="text-center py-2 text-slate-400 font-medium">Leads</th>
                  <th className="text-center py-2 text-slate-400 font-medium">Manual</th>
                  <th className="text-center py-2 text-slate-400 font-medium">Receb.</th>
                  <th className="text-center py-2 text-[#FFFF00] font-bold">→ Agend.</th>
                  <th className="text-center py-2 text-slate-400 font-medium">→ Visita</th>
                  <th className="text-center py-2 text-slate-400 font-medium">→ Prop.</th>
                  <th className="text-center py-2 text-slate-400 font-medium">→ Venda</th>
                </tr>
              </thead>
              <tbody>
                {metrics.brokerPerformance.map((b, i) => (
                  <tr key={i} className="border-b border-[#2a2a2e]/50 hover:bg-[#2a2a2e]/30">
                    <td className="py-2 text-white font-medium max-w-[140px] truncate">{b.name}</td>
                    <td className="text-center py-2 text-slate-300">{b.total}</td>
                    <td className="text-center py-2 text-violet-400">{b.manual}</td>
                    <td className="text-center py-2 text-cyan-400">{b.received}</td>
                    <td className="text-center py-2 font-bold text-[#FFFF00]">
                      {fmtPct(b.agendamento)}
                      <span className="block text-[10px] text-slate-500 font-normal">base: {b.base}</span>
                    </td>
                    <td className="text-center py-2 text-slate-300">{fmtPct(b.visita)}</td>
                    <td className="text-center py-2 text-slate-300">{fmtPct(b.proposta)}</td>
                    <td className="text-center py-2 text-emerald-400 font-medium">{fmtPct(b.venda)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════ */}
      {/* FAIXA 5 — Performance por Empreendimento              */}
      {/* ══════════════════════════════════════════════════════ */}
      <Card className="bg-[#1e1e22] border-[#2a2a2e]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#FFFF00]" /> Performance por Empreendimento
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {metrics.projectPerformance.length === 0 ? (
            <p className="text-xs text-slate-500">Sem dados</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#2a2a2e]">
                  <th className="text-left py-2 text-slate-400 font-medium">Empreendimento</th>
                  <th className="text-center py-2 text-slate-400 font-medium">Leads</th>
                  <th className="text-center py-2 text-slate-400 font-medium">Visualizações</th>
                  <th className="text-center py-2 text-[#FFFF00] font-bold">Conv. %</th>
                </tr>
              </thead>
              <tbody>
                {metrics.projectPerformance.map((p, i) => {
                  const lowConversion = p.views > 50 && p.rate < 2;
                  return (
                    <tr key={i} className="border-b border-[#2a2a2e]/50 hover:bg-[#2a2a2e]/30">
                      <td className="py-2 text-white font-medium max-w-[180px] truncate">{p.name}</td>
                      <td className="text-center py-2 text-cyan-400">{p.leads}</td>
                      <td className="text-center py-2 text-slate-300">{p.views}</td>
                      <td className={`text-center py-2 font-bold ${lowConversion ? "text-red-400" : "text-[#FFFF00]"}`}>
                        {p.rate.toFixed(1)}%
                        {lowConversion && <TrendingDown className="inline w-3 h-3 ml-1 text-red-400" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════ */}
      {/* FAIXA 6 — Velocidade de Conversão por Corretor        */}
      {/* ══════════════════════════════════════════════════════ */}
      <Card className="bg-[#1e1e22] border-[#2a2a2e]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <Timer className="w-4 h-4 text-[#FFFF00]" /> Velocidade de Conversão por Corretor (mediana)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <ConversionTimeRanking title="→ Agendamento" data={metrics.timeToAgendamento} highlight />
            <ConversionTimeRanking title="→ Proposta" data={metrics.timeToProposta} />
            <ConversionTimeRanking title="→ Venda" data={metrics.timeToVenda} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Sub-components ──

function KpiCard({
  icon: Icon, label, value, color = "text-white", prev, isPct, sublabel, alert
}: {
  icon: any; label: string; value: string | number; color?: string;
  prev?: number; isPct?: boolean; sublabel?: string; alert?: boolean;
}) {
  const showVariation = prev !== undefined && prev !== null;
  const currentNum = typeof value === "number" ? value : parseFloat(String(value));
  return (
    <div className={`bg-[#1e1e22] border rounded-xl p-4 ${alert ? "border-amber-500/50" : "border-[#2a2a2e]"}`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${alert ? "bg-amber-400/10" : "bg-[#FFFF00]/10"}`}>
          <Icon className={`w-4 h-4 ${alert ? "text-amber-400" : "text-[#FFFF00]"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-slate-400 truncate leading-tight">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            {showVariation && !isNaN(currentNum) && <VariationBadge current={currentNum} previous={prev!} />}
          </div>
          {sublabel && <p className="text-[9px] text-slate-500">{sublabel}</p>}
        </div>
      </div>
    </div>
  );
}

function ConversionTimeRanking({
  title, data, highlight
}: {
  title: string;
  data: { name: string; medianDays: number; count: number }[];
  highlight?: boolean;
}) {
  const fmtDays = (v: number) => v < 1 ? `${Math.round(v * 24)}h` : `${v.toFixed(1)}d`;
  return (
    <div>
      <h4 className={`text-xs font-medium mb-3 ${highlight ? "text-[#FFFF00]" : "text-slate-300"}`}>{title}</h4>
      {data.length === 0 ? (
        <p className="text-xs text-slate-500">Sem dados</p>
      ) : (
        <div className="space-y-2">
          {data.slice(0, 8).map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[10px] w-4 text-right shrink-0 ${i === 0 ? "text-emerald-400 font-bold" : "text-slate-500"}`}>{i + 1}.</span>
                <span className="text-xs text-slate-300 truncate">{item.name}</span>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-xs font-bold ${i === 0 ? "text-emerald-400" : "text-white"}`}>{fmtDays(item.medianDays)}</span>
                <p className="text-[10px] text-slate-500">{item.count} leads</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
