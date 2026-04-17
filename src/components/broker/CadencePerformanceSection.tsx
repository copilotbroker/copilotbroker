import { useMemo } from "react";
import {
  Activity, Info, MessageSquare, Send, TrendingUp, UserX, Clock,
  AlertTriangle, Lightbulb, Zap,
} from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  useCadencePerformance, type CadenceInsight,
} from "@/hooks/use-cadence-performance";

interface Props {
  brokerId: string;
  projectId?: string | null;
  periodStart: Date;
  periodEnd: Date;
}

function fmtPct(v: number): string {
  return `${v.toFixed(1)}%`;
}

function fmtHours(h: number | null): string {
  if (h === null) return "—";
  if (h < 1) return `${Math.round(h * 60)}min`;
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

/* Gradient color per attempt: green → yellow → red */
const attemptColor = (attempt: number): string => {
  // 1=green, 7=red
  const colors = [
    "#10b981", // 1 emerald
    "#34d399", // 2
    "#a3e635", // 3 lime
    "#facc15", // 4 yellow
    "#fb923c", // 5 orange
    "#f97316", // 6
    "#ef4444", // 7 red
  ];
  return colors[attempt - 1] || "#64748b";
};

const NO_REPLY_COLOR = "#475569";

function KpiCard({
  icon: Icon, label, value, color = "text-white", iconColor = "text-[#FFFF00]",
}: {
  icon: any; label: string; value: string | number; color?: string; iconColor?: string;
}) {
  return (
    <div className="bg-[#1e1e22] border border-[#2a2a2e] rounded-xl p-3 sm:p-4">
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 bg-[#FFFF00]/10">
          <Icon className={cn("w-4 h-4", iconColor)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-slate-400 truncate leading-tight">{label}</p>
          <p className={cn("text-base sm:text-lg font-bold", color)}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function InsightItem({ insight }: { insight: CadenceInsight }) {
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
    <div className={cn("flex items-start gap-3 rounded-lg border p-3", bgMap[insight.type])}>
      {iconMap[insight.type]}
      <div className="min-w-0">
        <p className="text-xs font-medium text-white">{insight.title}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{insight.description}</p>
      </div>
    </div>
  );
}

export function CadencePerformanceSection({
  brokerId, projectId, periodStart, periodEnd,
}: Props) {
  const { data, isLoading } = useCadencePerformance({
    brokerId, projectId, periodStart, periodEnd,
  });

  const chartData = useMemo(() => {
    if (!data) return [];
    const arr = data.byAttempt.map((a) => ({
      label: `${a.attempt}ª`,
      replied: a.replied,
      cumulativeRate: Number(a.cumulativeRate.toFixed(1)),
      attempt: a.attempt,
      isNoReply: false,
    }));
    arr.push({
      label: "Sem resp.",
      replied: data.noReplyCount,
      cumulativeRate: Number(data.responseRate.toFixed(1)),
      attempt: 8,
      isNoReply: true,
    });
    return arr;
  }, [data]);

  if (isLoading) return null;
  if (!data) return null;

  const isEmpty = data.totalCadences === 0;

  return (
    <Card className="bg-[#1e1e22] border-[#2a2a2e]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#FFFF00]" />
          Desempenho da Cadência
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="ml-1 inline-flex items-center justify-center text-slate-500 hover:text-slate-300"
                  aria-label="Como calculamos"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs text-xs">
                Cada lead aparece em apenas uma categoria final.
                "Respondeu na Xª tentativa" significa que o lead respondeu após
                receber o toque X e antes do toque X+1. "Sem resposta" são leads
                que receberam todas as 7 tentativas sem responder. Cadências
                em andamento são contadas separadamente.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEmpty ? (
          <div className="py-12 text-center">
            <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              Nenhuma cadência ativada neste período.
            </p>
            <p className="text-slate-600 text-xs mt-1">
              Quando seus leads entrarem em uma cadência automática, os dados
              aparecem aqui.
            </p>
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <KpiCard
                icon={Send}
                label="Leads na cadência"
                value={data.totalCadences}
                color="text-white"
              />
              <KpiCard
                icon={MessageSquare}
                label="Responderam"
                value={data.replied}
                color="text-emerald-400"
              />
              <KpiCard
                icon={TrendingUp}
                label="Taxa de resposta"
                value={fmtPct(data.responseRate)}
                color={
                  data.responseRate >= 40
                    ? "text-emerald-400"
                    : data.responseRate >= 20
                    ? "text-yellow-400"
                    : "text-red-400"
                }
              />
              <KpiCard
                icon={UserX}
                label="Finalizadas sem resposta"
                value={data.finishedNoReply}
                color="text-red-400"
                iconColor="text-red-400"
              />
              <KpiCard
                icon={Clock}
                label="Tempo médio até resposta"
                value={fmtHours(data.avgHoursToReply)}
                color="text-cyan-400"
                iconColor="text-cyan-400"
              />
            </div>

            {data.inProgress > 0 && (
              <p className="text-[11px] text-slate-500 -mt-2">
                <span className="text-slate-300 font-medium">{data.inProgress}</span>{" "}
                cadência(s) em andamento — não classificadas até finalizarem.
              </p>
            )}

            {/* Analytical table */}
            <Card className="bg-[#16161a] border-[#2a2a2e]">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-slate-400">
                  Análise por tentativa
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 sm:px-2">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2a2a2e] hover:bg-transparent">
                      <TableHead className="text-[11px] text-slate-400 h-9">
                        Tentativa
                      </TableHead>
                      <TableHead className="text-[11px] text-slate-400 h-9 text-right">
                        Receberam
                      </TableHead>
                      <TableHead className="text-[11px] text-slate-400 h-9 text-right">
                        Responderam
                      </TableHead>
                      <TableHead className="text-[11px] text-slate-400 h-9 text-right">
                        Taxa
                      </TableHead>
                      <TableHead className="text-[11px] text-slate-400 h-9 text-right">
                        Acumulada
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.byAttempt.map((a) => (
                      <TableRow
                        key={a.attempt}
                        className="border-[#2a2a2e] hover:bg-[#1e1e22]"
                      >
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: attemptColor(a.attempt) }}
                            />
                            <span className="text-xs text-slate-200 font-medium">
                              {a.attempt}ª tentativa
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-right text-xs text-slate-300">
                          {a.received}
                        </TableCell>
                        <TableCell className="py-2 text-right text-xs text-emerald-400 font-medium">
                          {a.replied}
                        </TableCell>
                        <TableCell className="py-2 text-right text-xs text-slate-200">
                          {fmtPct(a.replyRate)}
                        </TableCell>
                        <TableCell className="py-2 text-right text-xs font-bold text-[#FFFF00]">
                          {fmtPct(a.cumulativeRate)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-[#2a2a2e] bg-[#1a1a1e]">
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: NO_REPLY_COLOR }}
                          />
                          <span className="text-xs text-slate-400 font-medium">
                            Sem resposta (após 7)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-right text-xs text-slate-400">
                        —
                      </TableCell>
                      <TableCell className="py-2 text-right text-xs text-red-400 font-medium">
                        {data.finishedNoReply}
                      </TableCell>
                      <TableCell className="py-2 text-right text-xs text-slate-400">
                        —
                      </TableCell>
                      <TableCell className="py-2 text-right text-xs text-slate-400">
                        —
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Insights */}
            {data.insights.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-400 flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-[#FFFF00]" />
                  Insights da cadência
                </p>
                <div className="space-y-2">
                  {data.insights.map((ins, i) => (
                    <InsightItem key={i} insight={ins} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
