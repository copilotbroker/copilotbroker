import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  RefreshCw, TrendingDown, TrendingUp, AlertTriangle, Lightbulb, Info,
  MessageSquare, Zap, ArrowDown, BarChart3, Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLogout } from "@/hooks/use-logout";
import { useUserRole } from "@/hooks/use-user-role";
import { useBrokerFeatures } from "@/hooks/use-broker-features";
import { useBrokerProjects } from "@/hooks/use-broker-projects";
import { BrokerLayout } from "@/components/broker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrokerDashboard, getPeriodDates, type FunnelData, type FollowUpStats, type DashboardInsight } from "@/hooks/use-broker-dashboard";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "custom", label: "Personalizado" },
];

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
    <Card className="bg-[#111114] border-[#1e1e22]">
      <CardHeader className="pb-2 flex-row items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#FFFF00]/10 flex items-center justify-center shrink-0">
          <BarChart3 className="w-4 h-4 text-[#FFFF00]" />
        </div>
        <div>
          <CardTitle className="text-base font-semibold text-slate-100">Funil de Conversão</CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">Jornada do visitante à venda</p>
        </div>
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
                <p className="text-xl font-bold text-slate-100">{step.value.toLocaleString("pt-BR")}</p>
                <div
                  className={cn(
                    "w-full rounded-lg px-2 py-2.5 text-center border transition-all",
                    i === 0
                      ? "bg-[#FFFF00]/5 border-[#FFFF00]/20"
                      : isLow
                        ? "bg-red-500/5 border-red-500/20"
                        : isMid
                          ? "bg-yellow-500/5 border-yellow-500/20"
                          : "bg-emerald-500/5 border-emerald-500/20"
                  )}
                >
                  <p className="text-[11px] text-slate-400 truncate">{step.label}</p>
                </div>
                {rate !== null && (
                  <div className={cn(
                    "flex items-center gap-0.5 text-[11px] font-medium",
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
                  <span className="text-sm text-slate-400">{step.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-100">{step.value.toLocaleString("pt-BR")}</span>
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
    <Card className="bg-[#111114] border-[#1e1e22]">
      <CardHeader className="pb-2 flex-row items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <CardTitle className="text-base font-semibold text-slate-100">Follow-up Automático</CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">Desempenho do autopilot</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0f0f12] rounded-lg p-3 border border-[#1e1e22] text-center">
            <p className="text-2xl font-bold text-slate-100">{stats.totalSent}</p>
            <p className="text-[11px] text-slate-500 mt-1">Toques enviados</p>
          </div>
          <div className="bg-[#0f0f12] rounded-lg p-3 border border-[#1e1e22] text-center">
            <p className="text-2xl font-bold text-slate-100">{stats.totalReplied}</p>
            <p className="text-[11px] text-slate-500 mt-1">Responderam</p>
          </div>
          <div className="bg-[#0f0f12] rounded-lg p-3 border border-[#1e1e22] text-center">
            <p className={cn(
              "text-2xl font-bold",
              stats.responseRate >= 40 ? "text-emerald-400" : stats.responseRate >= 20 ? "text-yellow-400" : "text-red-400"
            )}>
              {stats.responseRate}%
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Taxa de resposta</p>
          </div>
          <div className="bg-[#0f0f12] rounded-lg p-3 border border-[#1e1e22] text-center">
            <p className="text-2xl font-bold text-slate-100">{stats.lateResponses}</p>
            <p className="text-[11px] text-slate-500 mt-1">Respostas tardias (3+)</p>
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
    warning: <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />,
    success: <Zap className="w-4 h-4 text-emerald-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
  };
  const bgMap = {
    warning: "bg-yellow-500/5 border-yellow-500/15",
    success: "bg-emerald-500/5 border-emerald-500/15",
    info: "bg-blue-500/5 border-blue-500/15",
  };

  return (
    <Card className="bg-[#111114] border-[#1e1e22]">
      <CardHeader className="pb-2 flex-row items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
          <Lightbulb className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <CardTitle className="text-base font-semibold text-slate-100">Insights</CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">Diagnóstico automático do funil</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {insights.map((insight, i) => (
          <div key={i} className={cn("flex items-start gap-3 rounded-lg border p-3", bgMap[insight.type])}>
            {iconMap[insight.type]}
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200">{insight.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{insight.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ── Loading skeleton ── */
function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-[280px] w-full bg-[#1e1e22] rounded-lg" />
      <Skeleton className="h-[140px] w-full bg-[#1e1e22] rounded-lg" />
      <Skeleton className="h-[120px] w-full bg-[#1e1e22] rounded-lg" />
    </div>
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

  const [period, setPeriod] = useState("30d");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();

  const isCustom = period === "custom";
  const { start, end } = isCustom && customStart && customEnd
    ? { start: customStart, end: customEnd }
    : getPeriodDates(period);

  const { funnel, followUp, insights, isLoading } = useBrokerDashboard({
    brokerId: brokerId || "",
    projectId,
    periodStart: start,
    periodEnd: end,
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
        <div className="space-y-4 pb-20 lg:pb-0">
          {/* Filters row */}
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px] bg-[#111114] border-[#1e1e22] text-slate-200 text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1e22] border-[#2a2a2e]">
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isCustom && (
              <div className="flex gap-2 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-[#111114] border-[#1e1e22] text-slate-300 text-xs h-9 gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {customStart ? format(customStart, "dd/MM/yy", { locale: ptBR }) : "Início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#1e1e22] border-[#2a2a2e]" align="start">
                    <CalendarPicker mode="single" selected={customStart} onSelect={setCustomStart} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <span className="text-slate-600 text-xs">—</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-[#111114] border-[#1e1e22] text-slate-300 text-xs h-9 gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {customEnd ? format(customEnd, "dd/MM/yy", { locale: ptBR }) : "Fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#1e1e22] border-[#2a2a2e]" align="start">
                    <CalendarPicker mode="single" selected={customEnd} onSelect={setCustomEnd} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <Select value={projectId || "all"} onValueChange={(v) => setProjectId(v === "all" ? null : v)}>
              <SelectTrigger className="w-[200px] bg-[#111114] border-[#1e1e22] text-slate-200 text-sm h-9">
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

          {/* Content */}
          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {funnel && <FunnelVisualization funnel={funnel} />}
              {followUp && <FollowUpCard stats={followUp} />}
              <InsightsCard insights={insights} />

              {!funnel && !followUp && (
                <Card className="bg-[#111114] border-[#1e1e22]">
                  <CardContent className="py-16 text-center">
                    <BarChart3 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Nenhum dado disponível para este período.</p>
                    <p className="text-slate-600 text-xs mt-1">Selecione outro período ou empreendimento.</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </BrokerLayout>
    </>
  );
};

export default BrokerDashboard;
