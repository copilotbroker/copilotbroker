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

/* ── Funnel ── */
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

  return (
    <Card className="bg-[#1e1e22] border-[#2a2a2e]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#FFFF00]" /> Funil de Conversão
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop: horizontal */}
        <div className="hidden md:flex gap-1.5 items-end">
          {steps.map((step, i) => {
            const prevValue = i > 0 ? steps[i - 1].value : undefined;
            const rate = prevValue && prevValue > 0 ? (step.value / prevValue) * 100 : null;
            const isLow = rate !== null && rate < 30;
            const isMid = rate !== null && rate >= 30 && rate < 60;

            return (
              <div key={step.label} className="flex-1 min-w-0 flex flex-col items-center gap-1.5">
                <p className="text-lg font-bold text-white">{step.value.toLocaleString("pt-BR")}</p>
                <div
                  className={cn(
                    "w-full rounded-lg px-2 py-2.5 text-center border",
                    i === 0
                      ? "bg-[#FFFF00]/5 border-[#FFFF00]/20"
                      : isLow
                        ? "bg-red-500/5 border-red-500/20"
                        : isMid
                          ? "bg-yellow-500/5 border-yellow-500/20"
                          : "bg-emerald-500/5 border-emerald-500/20"
                  )}
                >
                  <p className="text-[10px] text-slate-400 truncate">{step.label}</p>
                </div>
                {rate !== null && (
                  <div className={cn(
                    "flex items-center gap-0.5 text-[10px] font-medium",
                    isLow ? "text-red-400" : isMid ? "text-yellow-400" : "text-emerald-400"
                  )}>
                    {isLow ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {rate.toFixed(1)}%
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile: vertical */}
        <div className="md:hidden flex flex-col gap-1.5">
          {steps.map((step, i) => {
            const prevValue = i > 0 ? steps[i - 1].value : undefined;
            const rate = prevValue && prevValue > 0 ? (step.value / prevValue) * 100 : null;
            const isLow = rate !== null && rate < 30;
            const isMid = rate !== null && rate >= 30 && rate < 60;

            return (
              <div key={step.label}>
                <div
                  className={cn(
                    "rounded-lg px-4 py-3 border flex items-center justify-between",
                    i === 0
                      ? "bg-[#FFFF00]/5 border-[#FFFF00]/20"
                      : isLow
                        ? "bg-red-500/5 border-red-500/20"
                        : isMid
                          ? "bg-yellow-500/5 border-yellow-500/20"
                          : "bg-emerald-500/5 border-emerald-500/20"
                  )}
                >
                  <span className="text-xs text-slate-400">{step.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{step.value.toLocaleString("pt-BR")}</span>
                    {rate !== null && (
                      <span className={cn(
                        "text-xs font-medium",
                        isLow ? "text-red-400" : isMid ? "text-yellow-400" : "text-emerald-400"
                      )}>
                        {rate.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <ArrowDown className="w-3 h-3 text-slate-600" />
                  </div>
                )}
              </div>
            );
          })}
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
