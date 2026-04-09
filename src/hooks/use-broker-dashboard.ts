import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays } from "date-fns";

export interface BrokerDashboardFilters {
  brokerId: string;
  projectId?: string | null;
  periodStart: Date;
  periodEnd: Date;
}

export interface FunnelData {
  visitors: number;
  leads: number;
  responded: number;
  scheduled: number;
  visited: number;
  proposals: number;
  sales: number;
}

export interface FollowUpStats {
  totalSent: number;
  totalReplied: number;
  responseRate: number;
  avgTouchesToReply: number;
  lateResponses: number;
}

export interface DashboardInsight {
  type: "warning" | "success" | "info";
  title: string;
  description: string;
}

export function useBrokerDashboard(filters: BrokerDashboardFilters) {
  const { brokerId, projectId, periodStart, periodEnd } = filters;
  const enabled = !!brokerId;

  const funnelQuery = useQuery({
    queryKey: ["broker-dashboard-funnel", brokerId, projectId, periodStart.toISOString(), periodEnd.toISOString()],
    queryFn: async () => {
      let pvQuery = supabase
        .from("page_views")
        .select("id", { count: "exact", head: true })
        .gte("created_at", periodStart.toISOString())
        .lte("created_at", periodEnd.toISOString());
      if (projectId) pvQuery = pvQuery.eq("project_id", projectId);
      const { count: visitors } = await pvQuery;

      let leadsQuery = supabase
        .from("leads")
        .select("id, status, data_agendamento, comparecimento, data_envio_proposta, data_fechamento, last_interaction_at, created_at")
        .eq("broker_id", brokerId)
        .gte("created_at", periodStart.toISOString())
        .lte("created_at", periodEnd.toISOString());
      if (projectId) leadsQuery = leadsQuery.eq("project_id", projectId);
      const { data: leads } = await leadsQuery;
      const leadsArr = (leads || []) as any[];

      const responded = leadsArr.filter(
        (l) => l.last_interaction_at && new Date(l.last_interaction_at) > new Date(l.created_at)
      ).length;
      const scheduled = leadsArr.filter((l) => l.data_agendamento).length;
      const visited = leadsArr.filter((l) => l.comparecimento === true).length;
      const proposals = leadsArr.filter((l) => l.data_envio_proposta).length;
      const sales = leadsArr.filter((l) => l.data_fechamento).length;

      return { visitors: visitors || 0, leads: leadsArr.length, responded, scheduled, visited, proposals, sales } as FunnelData;
    },
    enabled,
    staleTime: 60_000,
  });

  const followUpQuery = useQuery({
    queryKey: ["broker-dashboard-followup", brokerId, periodStart.toISOString(), periodEnd.toISOString()],
    queryFn: async () => {
      const { data: followups } = await supabase
        .from("autopilot_followups")
        .select("id, conversation_id, attempt_number, sent_at")
        .eq("broker_id", brokerId)
        .gte("sent_at", periodStart.toISOString())
        .lte("sent_at", periodEnd.toISOString())
        .order("sent_at", { ascending: true });

      const followupsArr = (followups || []) as any[];
      const totalSent = followupsArr.length;

      const convMap = new Map<string, number>();
      for (const f of followupsArr) {
        const current = convMap.get(f.conversation_id) || 0;
        convMap.set(f.conversation_id, Math.max(current, f.attempt_number));
      }

      const convIds = Array.from(convMap.keys());
      let totalReplied = 0;
      let lateResponses = 0;

      if (convIds.length > 0) {
        const chunkSize = 50;
        for (let i = 0; i < convIds.length; i += chunkSize) {
          const chunk = convIds.slice(i, i + chunkSize);
          const { data: convs } = await supabase
            .from("conversations")
            .select("id, last_message_direction")
            .in("id", chunk)
            .eq("last_message_direction", "inbound");

          const repliedConvs = (convs || []) as any[];
          totalReplied += repliedConvs.length;
          for (const c of repliedConvs) {
            const maxAttempt = convMap.get(c.id) || 0;
            if (maxAttempt >= 3) lateResponses++;
          }
        }
      }

      const responseRate = convMap.size > 0 ? (totalReplied / convMap.size) * 100 : 0;
      const avgTouchesToReply = totalReplied > 0
        ? followupsArr
            .filter((f) => convIds.includes(f.conversation_id))
            .reduce((sum: number, f: any) => sum + f.attempt_number, 0) / totalReplied
        : 0;

      return {
        totalSent,
        totalReplied,
        responseRate: Math.round(responseRate * 10) / 10,
        avgTouchesToReply: Math.round(avgTouchesToReply * 10) / 10,
        lateResponses,
      } as FollowUpStats;
    },
    enabled,
    staleTime: 60_000,
  });

  // Generate insights
  const insights: DashboardInsight[] = [];
  const funnel = funnelQuery.data;
  if (funnel) {
    if (funnel.visitors > 0 && funnel.leads > 0) {
      const lpRate = (funnel.leads / funnel.visitors) * 100;
      if (lpRate < 2) {
        insights.push({ type: "warning", title: "Conversão da LP baixa", description: `Apenas ${lpRate.toFixed(1)}% dos visitantes se cadastraram. Revise o copy e a oferta da landing page.` });
      }
    }
    if (funnel.leads > 10 && funnel.responded > 0) {
      const responseRate = (funnel.responded / funnel.leads) * 100;
      if (responseRate < 30) {
        insights.push({ type: "warning", title: "Taxa de resposta baixa", description: `Apenas ${responseRate.toFixed(0)}% dos leads responderam. O follow-up pode precisar de ajustes.` });
      }
    }
    if (funnel.scheduled > 0 && funnel.visited > 0) {
      const visitRate = (funnel.visited / funnel.scheduled) * 100;
      if (visitRate < 50) {
        insights.push({ type: "warning", title: "Baixo comparecimento", description: `Apenas ${visitRate.toFixed(0)}% dos agendados compareceram. Considere lembrar os leads.` });
      } else if (visitRate >= 80) {
        insights.push({ type: "success", title: "Ótimo comparecimento", description: `${visitRate.toFixed(0)}% dos agendados comparecem — excelente taxa!` });
      }
    }
    if (funnel.proposals > 0) {
      const closeRate = (funnel.sales / funnel.proposals) * 100;
      if (closeRate < 20) {
        insights.push({ type: "warning", title: "Baixa conversão de proposta", description: `Apenas ${closeRate.toFixed(0)}% das propostas viraram venda. Revise a negociação.` });
      }
    }
    if (funnel.leads === 0) {
      insights.push({ type: "info", title: "Sem leads no período", description: "Nenhum lead foi registrado neste período. Verifique suas campanhas." });
    }
  }

  const followUp = followUpQuery.data;
  if (followUp) {
    if (followUp.lateResponses > 3) {
      insights.push({ type: "info", title: "Respostas tardias", description: `${followUp.lateResponses} leads responderam somente após 3+ toques. O follow-up automático está funcionando.` });
    }
  }

  return {
    funnel: funnelQuery.data,
    followUp: followUpQuery.data,
    insights,
    isLoading: !enabled ? false : (funnelQuery.isLoading || followUpQuery.isLoading),
    isFetching: funnelQuery.isFetching || followUpQuery.isFetching,
  };
}

export function getPeriodDates(period: string): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case "today": return { start: startOfDay(now), end: now };
    case "7d": return { start: startOfDay(subDays(now, 7)), end: now };
    case "30d": return { start: startOfDay(subDays(now, 30)), end: now };
    default: return { start: startOfDay(subDays(now, 30)), end: now };
  }
}
