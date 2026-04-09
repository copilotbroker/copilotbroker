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
  leads: number;
  responded: number;
  scheduled: number;
  visited: number;
  proposals: number;
  sales: number;
  avgDaysToSale: number | null;
}

export interface TimeoutLossData {
  lostByTimeout: number;
  lostThatSold: number;
}

export interface AttemptStat {
  attempt: number;
  sent: number;
  replied: number;
  rate: number;
}

export interface FollowUpStats {
  totalSent: number;
  totalReplied: number;
  responseRate: number;
  avgTouchesToReply: number;
  lateResponses: number;
  byAttempt: AttemptStat[];
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

      return { leads: leadsArr.length, responded, scheduled, visited, proposals, sales } as FunnelData;
    },
    enabled,
    staleTime: 60_000,
  });

  const followUpQuery = useQuery({
    queryKey: ["broker-dashboard-followup", brokerId, projectId, periodStart.toISOString(), periodEnd.toISOString()],
    queryFn: async () => {
      // Get followups with conversation -> lead join to filter by project
      let fQuery = supabase
        .from("autopilot_followups")
        .select("id, conversation_id, attempt_number, sent_at, conversations!inner(id, last_message_direction, lead_id, leads(project_id))")
        .eq("broker_id", brokerId)
        .gte("sent_at", periodStart.toISOString())
        .lte("sent_at", periodEnd.toISOString())
        .order("sent_at", { ascending: true });

      const { data: followups } = await fQuery;
      let followupsArr = (followups || []) as any[];

      // Filter by project if selected
      if (projectId) {
        followupsArr = followupsArr.filter((f: any) => {
          const lead = f.conversations?.leads;
          return lead && lead.project_id === projectId;
        });
      }

      const totalSent = followupsArr.length;

      // Map conversation -> max attempt
      const convMap = new Map<string, number>();
      for (const f of followupsArr) {
        const current = convMap.get(f.conversation_id) || 0;
        convMap.set(f.conversation_id, Math.max(current, f.attempt_number));
      }

      // Build set of replied conversation IDs from the joined data
      const repliedConvIds = new Set<string>();
      for (const f of followupsArr) {
        if (f.conversations?.last_message_direction === "inbound") {
          repliedConvIds.add(f.conversation_id);
        }
      }

      const totalReplied = repliedConvIds.size;
      let lateResponses = 0;
      for (const cid of repliedConvIds) {
        if ((convMap.get(cid) || 0) >= 3) lateResponses++;
      }

      // Per-attempt breakdown (1-7)
      const byAttempt: AttemptStat[] = [];
      for (let a = 1; a <= 7; a++) {
        const sentAtAttempt = followupsArr.filter((f: any) => f.attempt_number === a);
        const convIdsAtAttempt = new Set(sentAtAttempt.map((f: any) => f.conversation_id));
        // Conversations whose max attempt == a AND replied (meaning they responded at this touch)
        let repliedAtAttempt = 0;
        for (const cid of convIdsAtAttempt) {
          if (convMap.get(cid) === a && repliedConvIds.has(cid)) {
            repliedAtAttempt++;
          }
        }
        byAttempt.push({
          attempt: a,
          sent: sentAtAttempt.length,
          replied: repliedAtAttempt,
          rate: sentAtAttempt.length > 0 ? Math.round((repliedAtAttempt / convIdsAtAttempt.size) * 1000) / 10 : 0,
        });
      }

      const responseRate = convMap.size > 0 ? (totalReplied / convMap.size) * 100 : 0;
      const avgTouchesToReply = totalReplied > 0
        ? [...repliedConvIds].reduce((sum, cid) => sum + (convMap.get(cid) || 0), 0) / totalReplied
        : 0;

      return {
        totalSent,
        totalReplied,
        responseRate: Math.round(responseRate * 10) / 10,
        avgTouchesToReply: Math.round(avgTouchesToReply * 10) / 10,
        lateResponses,
        byAttempt,
      } as FollowUpStats;
    },
    enabled,
    staleTime: 60_000,
  });

  // Timeout loss query
  const timeoutQuery = useQuery({
    queryKey: ["broker-dashboard-timeout", brokerId, projectId, periodStart.toISOString(), periodEnd.toISOString()],
    queryFn: async () => {
      // Get leads lost by timeout from roletas_log
      const { data: logs } = await supabase
        .from("roletas_log")
        .select("lead_id")
        .eq("de_corretor_id", brokerId)
        .eq("acao", "timeout_reassinado")
        .gte("created_at", periodStart.toISOString())
        .lte("created_at", periodEnd.toISOString());

      const logsArr = (logs || []) as any[];
      const lostLeadIds = [...new Set(logsArr.map((l: any) => l.lead_id))];

      if (lostLeadIds.length === 0) {
        return { lostByTimeout: 0, lostThatSold: 0 } as TimeoutLossData;
      }

      // Check how many of those leads ended up with a sale
      const { data: soldLeads } = await supabase
        .from("leads")
        .select("id")
        .in("id", lostLeadIds)
        .not("data_fechamento", "is", null);

      return {
        lostByTimeout: lostLeadIds.length,
        lostThatSold: (soldLeads || []).length,
      } as TimeoutLossData;
    },
    enabled,
    staleTime: 60_000,
  });

  // Generate insights
  const insights: DashboardInsight[] = [];
  const funnel = funnelQuery.data;
  if (funnel) {
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

  const timeoutLoss = timeoutQuery.data;
  if (timeoutLoss && timeoutLoss.lostByTimeout > 0) {
    insights.push({
      type: "warning",
      title: "Leads perdidos por timeout",
      description: `${timeoutLoss.lostByTimeout} leads foram reatribuídos por falta de atendimento no prazo. ${timeoutLoss.lostThatSold > 0 ? `Destes, ${timeoutLoss.lostThatSold} fecharam venda com outro corretor.` : ""}`,
    });
  }

  return {
    funnel: funnelQuery.data,
    followUp: followUpQuery.data,
    timeoutLoss: timeoutQuery.data,
    insights,
    isLoading: !enabled ? false : (funnelQuery.isLoading || followUpQuery.isLoading || timeoutQuery.isLoading),
    isFetching: funnelQuery.isFetching || followUpQuery.isFetching || timeoutQuery.isFetching,
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
