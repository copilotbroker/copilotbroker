import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  RefreshCw, TrendingDown, TrendingUp, AlertTriangle, Lightbulb, Info,
  MessageSquare, Zap, UserCheck, Eye, CalendarCheck, FileText,
  Handshake, BarChart3, Loader2, UserX, ShieldAlert, Timer,
} from "lucide-react";
import { useLogout } from "@/hooks/use-logout";
import { useUserRole } from "@/hooks/use-user-role";
import { useBrokerFeatures } from "@/hooks/use-broker-features";
import { BrokerLayout } from "@/components/broker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodFilterWithCustom } from "@/components/ui/custom-date-range-picker";
import { useBrokerDashboard, getPeriodDates, type FunnelData, type FollowUpStats, type DashboardInsight, type AttemptStat, type TimeoutLossData } from "@/hooks/use-broker-dashboard";
import { cn } from "@/lib/utils";
import { BrokerIndividualPerformance } from "@/components/broker/BrokerIndividualPerformance";
import { CadencePerformanceSection } from "@/components/broker/CadencePerformanceSection";

type Period = "today" | "7d" | "30d" | "all" | "custom";
/* ── KPI Card (same style as admin PerformanceDashboard) ── */
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

/* ── Wave Funnel (SVG) ── */
function FunnelVisualization({ funnel }: { funnel: FunnelData }) {
  const steps = [
    { label: "Atendimento", value: funnel.leads },
    { label: "Responderam", value: funnel.responded },
    { label: "Agendaram", value: funnel.scheduled },
    { label: "Visitaram", value: funnel.visited },
    { label: "Propostas", value: funnel.proposals },
    { label: "Vendas", value: funnel.sales },
  ];

  const maxVal = Math.max(...steps.map((s) => s.value), 1);

  // Normalize heights (0.08 min so even zero has a thin line)
  const heights = steps.map((s) => Math.max(s.value / maxVal, 0.08));

  // SVG dimensions
  const W = 700;
  const H = 200;
  const colW = W / steps.length;
  const cy = H / 2;

  // Build the wave path — organic Bézier curves connecting column midpoints
  const topPoints = heights.map((h, i) => ({ x: colW * i + colW / 2, y: cy - h * (H * 0.42) }));
  const botPoints = heights.map((h, i) => ({ x: colW * i + colW / 2, y: cy + h * (H * 0.42) }));

  const bezier = (pts: { x: number; y: number }[]) => {
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const cp = (pts[i + 1].x - pts[i].x) / 2;
      d += ` C${pts[i].x + cp},${pts[i].y} ${pts[i + 1].x - cp},${pts[i + 1].y} ${pts[i + 1].x},${pts[i + 1].y}`;
    }
    return d;
  };

  const topPath = bezier(topPoints);
  const botPath = bezier(botPoints);
  const shapePath = `${topPath} L${botPoints[botPoints.length - 1].x},${botPoints[botPoints.length - 1].y} ${bezier([...botPoints].reverse()).slice(1)} Z`;

  return (
    <Card className="bg-[#1e1e22] border-[#2a2a2e]">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#FFFF00]" /> Funil de Conversão
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {/* Labels row */}
        <div className="flex">
          {steps.map((step) => (
            <div key={step.label} className="flex-1 text-center">
              <p className="text-[10px] sm:text-xs text-slate-400 truncate px-0.5">{step.label}</p>
            </div>
          ))}
        </div>

        {/* SVG wave */}
        <div className="w-full overflow-hidden my-1">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
            <defs>
              <linearGradient id="funnelGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(60,100%,50%)" stopOpacity="0.85" />
                <stop offset="35%" stopColor="hsl(275,70%,55%)" stopOpacity="0.8" />
                <stop offset="70%" stopColor="hsl(300,65%,50%)" stopOpacity="0.75" />
                <stop offset="100%" stopColor="hsl(330,75%,50%)" stopOpacity="0.7" />
              </linearGradient>
            </defs>
            <path d={shapePath} fill="url(#funnelGrad)" />

            {/* Vertical divider lines between stages */}
            {steps.slice(1).map((_, i) => {
              const x = colW * (i + 1);
              return (
                <line key={`div-${i}`} x1={x} y1={0} x2={x} y2={H} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              );
            })}

            {/* Rate labels inside the wave */}
            {steps.map((step, i) => {
              if (i === 0) return null;
              const prev = steps[i - 1].value;
              const rate = prev > 0 ? ((step.value / prev) * 100) : 0;
              const x = colW * i + colW / 2;
              return (
                <text
                  key={step.label}
                  x={x}
                  y={cy + 5}
                  textAnchor="middle"
                  className="text-[16px] font-bold"
                  fill="white"
                  style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
                >
                  {rate > 0 ? `${rate.toFixed(1)}%` : "0%"}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Values row */}
        <div className="flex">
          {steps.map((step) => (
            <div key={step.label} className="flex-1 text-center">
              <p className="text-sm sm:text-base font-bold text-white">{step.value.toLocaleString("pt-BR")}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Follow-up ── */
function FollowUpCard({ stats }: { stats: FollowUpStats }) {
  const maxSent = Math.max(...stats.byAttempt.map((a) => a.sent), 1);

  return (
    <Card className="bg-[#1e1e22] border-[#2a2a2e]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" /> Follow-up Automático
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#16161a] rounded-lg p-2.5 border border-[#2a2a2e]">
            <p className="text-[10px] text-slate-400 truncate">Toques enviados</p>
            <p className="text-sm font-bold text-white">{stats.totalSent}</p>
          </div>
          <div className="bg-[#16161a] rounded-lg p-2.5 border border-[#2a2a2e]">
            <p className="text-[10px] text-slate-400 truncate">Responderam</p>
            <p className="text-sm font-bold text-white">{stats.totalReplied}</p>
          </div>
          <div className="bg-[#16161a] rounded-lg p-2.5 border border-[#2a2a2e]">
            <p className="text-[10px] text-slate-400 truncate">Taxa de resposta</p>
            <p className={cn(
              "text-sm font-bold",
              stats.responseRate >= 40 ? "text-emerald-400" : stats.responseRate >= 20 ? "text-yellow-400" : "text-red-400"
            )}>
              {stats.responseRate}%
            </p>
          </div>
          <div className="bg-[#16161a] rounded-lg p-2.5 border border-[#2a2a2e]">
            <p className="text-[10px] text-slate-400 truncate">Média de toques p/ resposta</p>
            <p className="text-sm font-bold text-white">{stats.avgTouchesToReply}</p>
          </div>
        </div>

        {/* Per-attempt breakdown */}
        <div className="space-y-1.5">
          <p className="text-[11px] text-slate-400 font-medium">Respostas por toque</p>
          {stats.byAttempt.map((a) => (
            <div key={a.attempt} className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 w-14 shrink-0">Toque {a.attempt}</span>
              <div className="flex-1 h-5 bg-[#16161a] rounded-full border border-[#2a2a2e] overflow-hidden relative">
                {/* Sent bar */}
                <div
                  className="absolute inset-y-0 left-0 bg-[#2a2a2e] rounded-full"
                  style={{ width: `${(a.sent / maxSent) * 100}%` }}
                />
                {/* Replied bar */}
                {a.replied > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 bg-emerald-500/60 rounded-full"
                    style={{ width: `${(a.replied / maxSent) * 100}%` }}
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-between px-2">
                  <span className="text-[9px] text-slate-300 font-medium z-10">
                    {a.sent} enviados
                  </span>
                  <span className={cn(
                    "text-[9px] font-bold z-10",
                    a.replied > 0 ? "text-emerald-400" : "text-slate-600"
                  )}>
                    {a.replied} resp. ({a.rate}%)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Insights ── */
function InsightsCard({ insights }: { insights: DashboardInsight[] }) {
  if (insights.length === 0) return null;

  const iconMap = {
    warning: <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />,
    success: <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
    info: <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />,
  };
  const bgMap = {
    warning: "bg-amber-500/5 border-amber-500/20",
    success: "bg-emerald-500/5 border-emerald-500/20",
    info: "bg-blue-500/5 border-blue-500/20",
  };

  return (
    <Card className="bg-[#1e1e22] border-[#2a2a2e]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-[#FFFF00]" /> Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {insights.map((insight, i) => (
          <div key={i} className={cn("flex items-start gap-3 rounded-lg border p-3", bgMap[insight.type])}>
            {iconMap[insight.type]}
            <div className="min-w-0">
              <p className="text-xs font-medium text-white">{insight.title}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{insight.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ── Page ── */
const BrokerDashboard = () => {
  const navigate = useNavigate();
  const { role, brokerId, isLoading: isRoleLoading, isLeader } = useUserRole();
  const { inboxEnabled, copilotEnabled } = useBrokerFeatures(brokerId);
  const handleLogout = useLogout();

  const [period, setPeriod] = useState<Period>("30d");
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | null>(null);
  const projectId: string | null = null;

  const periodDates = useMemo(() => {
    if (period === "custom" && customRange) return customRange;
    return getPeriodDates(period);
  }, [period, customRange]);

  const { funnel, followUp, timeoutLoss, insights, isLoading } = useBrokerDashboard({
    brokerId: brokerId || "",
    projectId,
    periodStart: periodDates.start,
    periodEnd: periodDates.end,
  });

  // Redirect
  useEffect(() => {
    if (isRoleLoading) return;
    if (role === "admin") {
      navigate("/admin", { replace: true });
    } else if (role !== "broker") {
      navigate("/auth", { replace: true });
    }
  }, [role, isRoleLoading, navigate]);

  const handleViewChange = useCallback(
    (mode: "kanban" | "list") => {
      navigate(mode === "list" ? "/corretor/leads" : "/corretor/crm");
    },
    [navigate]
  );

  if (isRoleLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[#FFFF00]" />
      </div>
    );
  }

  if (role !== "broker") return null;

  // unused removed

  return (
    <>
      <Helmet>
        <title>Dashboard | Enove</title>
      </Helmet>
      <BrokerLayout
        viewMode="kanban"
        onViewChange={handleViewChange}
        onLogout={handleLogout}
        isLeader={isLeader}
        inboxEnabled={inboxEnabled}
        copilotEnabled={copilotEnabled}
        brokerId={brokerId || undefined}
      >
        <div className="space-y-6 pb-20 lg:pb-0">
          {/* Header + Period filter */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-bold text-white">Meu Dashboard</h2>
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

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#FFFF00]" />
            </div>
          ) : funnel ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <KpiCard icon={UserCheck} label="Atendimento" value={funnel.leads} color="text-cyan-400" />
                <KpiCard icon={MessageSquare} label="Responderam" value={funnel.responded} color="text-emerald-400" />
                <KpiCard icon={CalendarCheck} label="Agendamentos" value={funnel.scheduled} color="text-orange-400" />
                <KpiCard icon={Eye} label="Visitas" value={funnel.visited} color="text-cyan-400" />
                <KpiCard icon={FileText} label="Propostas" value={funnel.proposals} color="text-violet-400" />
                <KpiCard icon={Handshake} label="Vendas" value={funnel.sales} color="text-emerald-400" />
                <KpiCard
                  icon={Timer}
                  label="Tempo médio de venda"
                  value={funnel.avgDaysToSale !== null ? `${funnel.avgDaysToSale} dias` : "—"}
                  color={funnel.avgDaysToSale !== null && funnel.avgDaysToSale <= 15 ? "text-emerald-400" : funnel.avgDaysToSale !== null && funnel.avgDaysToSale <= 30 ? "text-yellow-400" : "text-slate-300"}
                />
                {timeoutLoss && timeoutLoss.lostByTimeout > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 sm:p-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 bg-red-500/15">
                        <UserX className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-red-300/70 truncate leading-tight">Perdidos por Timeout</p>
                        <p className="text-base sm:text-lg font-bold text-red-400">{timeoutLoss.lostByTimeout}</p>
                      </div>
                    </div>
                  </div>
                )}
                {timeoutLoss && timeoutLoss.lostThatSold > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 sm:p-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 bg-red-500/15">
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-red-300/70 truncate leading-tight">Venderam c/ outro</p>
                        <p className="text-base sm:text-lg font-bold text-red-400">{timeoutLoss.lostThatSold}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Funnel */}
              <FunnelVisualization funnel={funnel} />

              {/* Cadence Performance */}
              {brokerId && (
                <CadencePerformanceSection
                  brokerId={brokerId}
                  projectId={projectId}
                  periodStart={periodDates.start}
                  periodEnd={periodDates.end}
                />
              )}

              {/* Individual Performance */}
              {brokerId && (
                <BrokerIndividualPerformance
                  brokerId={brokerId}
                  projectId={projectId}
                  periodStart={periodDates.start}
                  periodEnd={periodDates.end}
                />
              )}

              {/* Insights */}
              <InsightsCard insights={insights} />
            </>
          ) : (
            <Card className="bg-[#1e1e22] border-[#2a2a2e]">
              <CardContent className="py-16 text-center">
                <BarChart3 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Nenhum dado disponível para este período.</p>
                <p className="text-slate-600 text-xs mt-1">Selecione outro período ou empreendimento.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </BrokerLayout>
    </>
  );
};

export default BrokerDashboard;
