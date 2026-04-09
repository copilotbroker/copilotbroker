import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  RefreshCw, TrendingDown, TrendingUp, AlertTriangle, Lightbulb, Info,
  MessageSquare, Zap, Users, UserCheck, Eye, CalendarCheck, FileText,
  Handshake, BarChart3, Activity, ArrowDown, Loader2,
} from "lucide-react";
import { useLogout } from "@/hooks/use-logout";
import { useUserRole } from "@/hooks/use-user-role";
import { useBrokerFeatures } from "@/hooks/use-broker-features";
import { useBrokerProjects } from "@/hooks/use-broker-projects";
import { BrokerLayout } from "@/components/broker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBrokerDashboard, getPeriodDates, type FunnelData, type FollowUpStats, type DashboardInsight } from "@/hooks/use-broker-dashboard";
import { cn } from "@/lib/utils";

type Period = "today" | "7d" | "30d";

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
    { label: "Visitantes", value: funnel.visitors },
    { label: "Cadastros", value: funnel.leads },
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
  return (
    <Card className="bg-[#1e1e22] border-[#2a2a2e]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" /> Follow-up Automático
        </CardTitle>
      </CardHeader>
      <CardContent>
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
            <p className="text-[10px] text-slate-400 truncate">Respostas tardias (3+)</p>
            <p className="text-sm font-bold text-white">{stats.lateResponses}</p>
          </div>
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
  const brokerProjectsResult = useBrokerProjects(brokerId);
  const projects = brokerProjectsResult.brokerProjects || [];
  const handleLogout = useLogout();

  const [period, setPeriod] = useState<Period>("30d");
  const [projectId, setProjectId] = useState<string | null>(null);

  const periodDates = useMemo(() => getPeriodDates(period), [period]);

  const { funnel, followUp, insights, isLoading } = useBrokerDashboard({
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

  const fmtRate = (num: number, den: number) => den > 0 ? `${((num / den) * 100).toFixed(1)}%` : "—";

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
          {/* Header + Period + Project filter */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-white">Meu Dashboard</h2>
              <Select value={projectId || "all"} onValueChange={(v) => setProjectId(v === "all" ? null : v)}>
                <SelectTrigger className="w-[180px] bg-[#1e1e22] border-[#2a2a2e] text-slate-200 text-xs h-8">
                  <SelectValue placeholder="Todos empreendimentos" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e1e22] border-[#2a2a2e]">
                  <SelectItem value="all">Todos empreendimentos</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.project.id} value={p.project.id}>{p.project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <TabsList className="bg-[#1e1e22] border border-[#2a2a2e]">
                <TabsTrigger value="today" className="data-[state=active]:bg-[#FFFF00] data-[state=active]:text-black text-xs">Hoje</TabsTrigger>
                <TabsTrigger value="7d" className="data-[state=active]:bg-[#FFFF00] data-[state=active]:text-black text-xs">7 dias</TabsTrigger>
                <TabsTrigger value="30d" className="data-[state=active]:bg-[#FFFF00] data-[state=active]:text-black text-xs">30 dias</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#FFFF00]" />
            </div>
          ) : funnel ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <KpiCard icon={Users} label="Visitantes LP" value={funnel.visitors} />
                <KpiCard icon={UserCheck} label="Cadastros" value={funnel.leads} color="text-cyan-400" />
                <KpiCard icon={Activity} label="Conversão LP" value={fmtRate(funnel.leads, funnel.visitors)} color="text-[#FFFF00]" />
                <KpiCard icon={MessageSquare} label="Responderam" value={funnel.responded} color="text-emerald-400" />
                <KpiCard icon={CalendarCheck} label="Agendamentos" value={funnel.scheduled} color="text-orange-400" />
                <KpiCard icon={Eye} label="Visitas" value={funnel.visited} color="text-cyan-400" />
                <KpiCard icon={FileText} label="Propostas" value={funnel.proposals} color="text-violet-400" />
                <KpiCard icon={Handshake} label="Vendas" value={funnel.sales} color="text-emerald-400" />
              </div>

              {/* Funnel */}
              <FunnelVisualization funnel={funnel} />

              {/* Follow-up */}
              {followUp && <FollowUpCard stats={followUp} />}

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
