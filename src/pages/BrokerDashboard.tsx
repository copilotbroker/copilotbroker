import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { RefreshCw, TrendingDown, TrendingUp, AlertTriangle, Lightbulb, Info, MessageSquare, Zap } from "lucide-react";
import { useLogout } from "@/hooks/use-logout";
import { useUserRole } from "@/hooks/use-user-role";
import { useBrokerFeatures } from "@/hooks/use-broker-features";
import { useBrokerProjects } from "@/hooks/use-broker-projects";
import { BrokerLayout } from "@/components/broker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrokerDashboard, getPeriodDates, type FunnelData, type FollowUpStats, type DashboardInsight } from "@/hooks/use-broker-dashboard";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
];

function FunnelStep({ label, value, prevValue, isFirst }: { label: string; value: number; prevValue?: number; isFirst?: boolean }) {
  const rate = !isFirst && prevValue && prevValue > 0 ? ((value / prevValue) * 100) : null;
  const isLow = rate !== null && rate < 30;
  const isMid = rate !== null && rate >= 30 && rate < 60;

  return (
    <div className="flex-1 min-w-0">
      <div className="flex flex-col items-center gap-1">
        <div
          className={cn(
            "w-full rounded-lg px-3 py-4 text-center transition-all",
            "border",
            isFirst
              ? "bg-primary/10 border-primary/30"
              : isLow
                ? "bg-red-500/10 border-red-500/30"
                : isMid
                  ? "bg-yellow-500/10 border-yellow-500/30"
                  : "bg-emerald-500/10 border-emerald-500/30"
          )}
        >
          <p className="text-2xl font-bold text-foreground">{value.toLocaleString("pt-BR")}</p>
          <p className="text-xs text-muted-foreground mt-1 truncate">{label}</p>
        </div>
        {rate !== null && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium",
            isLow ? "text-red-400" : isMid ? "text-yellow-400" : "text-emerald-400"
          )}>
            {isLow ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            {rate.toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}

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
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Funil de Conversão</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop: horizontal */}
        <div className="hidden md:flex gap-2 items-start">
          {steps.map((step, i) => (
            <FunnelStep
              key={step.label}
              label={step.label}
              value={step.value}
              prevValue={i > 0 ? steps[i - 1].value : undefined}
              isFirst={i === 0}
            />
          ))}
        </div>
        {/* Mobile: vertical */}
        <div className="md:hidden flex flex-col gap-2">
          {steps.map((step, i) => {
            const prevValue = i > 0 ? steps[i - 1].value : undefined;
            const rate = prevValue && prevValue > 0 ? ((step.value / prevValue) * 100) : null;
            const isLow = rate !== null && rate < 30;
            const isMid = rate !== null && rate >= 30 && rate < 60;

            return (
              <div key={step.label} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex-1 rounded-lg px-4 py-3 border flex items-center justify-between",
                    i === 0
                      ? "bg-primary/10 border-primary/30"
                      : isLow
                        ? "bg-red-500/10 border-red-500/30"
                        : isMid
                          ? "bg-yellow-500/10 border-yellow-500/30"
                          : "bg-emerald-500/10 border-emerald-500/30"
                  )}
                >
                  <span className="text-sm text-muted-foreground">{step.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground">{step.value.toLocaleString("pt-BR")}</span>
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
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function FollowUpCard({ stats }: { stats: FollowUpStats }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          Follow-up
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{stats.totalSent}</p>
            <p className="text-xs text-muted-foreground mt-1">Toques enviados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{stats.totalReplied}</p>
            <p className="text-xs text-muted-foreground mt-1">Responderam</p>
          </div>
          <div className="text-center">
            <p className={cn(
              "text-2xl font-bold",
              stats.responseRate >= 40 ? "text-emerald-400" : stats.responseRate >= 20 ? "text-yellow-400" : "text-red-400"
            )}>
              {stats.responseRate}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Taxa de resposta</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{stats.lateResponses}</p>
            <p className="text-xs text-muted-foreground mt-1">Respostas tardias (3+)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InsightsCard({ insights }: { insights: DashboardInsight[] }) {
  if (insights.length === 0) return null;

  const iconMap = {
    warning: <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />,
    success: <Zap className="w-4 h-4 text-emerald-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
  };

  const bgMap = {
    warning: "bg-yellow-500/5 border-yellow-500/20",
    success: "bg-emerald-500/5 border-emerald-500/20",
    info: "bg-blue-500/5 border-blue-500/20",
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={cn("flex items-start gap-3 rounded-lg border p-3", bgMap[insight.type])}
          >
            {iconMap[insight.type]}
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{insight.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const BrokerDashboard = () => {
  const navigate = useNavigate();
  const { role, brokerId, isLoading: isRoleLoading, isLeader } = useUserRole();
  const { inboxEnabled, copilotEnabled } = useBrokerFeatures(brokerId);
  const brokerProjectsResult = useBrokerProjects(brokerId);
  const projects = brokerProjectsResult.brokerProjects || [];
  const handleLogout = useLogout();

  const [period, setPeriod] = useState("30d");
  const [projectId, setProjectId] = useState<string | null>(null);

  const { start, end } = getPeriodDates(period);

  const { funnel, followUp, insights, isLoading } = useBrokerDashboard({
    brokerId: brokerId || "",
    projectId,
    periodStart: start,
    periodEnd: end,
  });

  // Redirect logic
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
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
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px] bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={projectId || "all"} onValueChange={(v) => setProjectId(v === "all" ? null : v)}>
              <SelectTrigger className="w-[200px] bg-card border-border">
                <SelectValue placeholder="Todos empreendimentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos empreendimentos</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.project.id} value={p.project.id}>
                    {p.project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {funnel && <FunnelVisualization funnel={funnel} />}
              {followUp && <FollowUpCard stats={followUp} />}
              <InsightsCard insights={insights} />
            </>
          )}
        </div>
      </BrokerLayout>
    </>
  );
};

export default BrokerDashboard;
