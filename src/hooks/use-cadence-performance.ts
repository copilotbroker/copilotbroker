import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UseCadencePerformanceParams {
  brokerId: string;
  projectId?: string | null;
  periodStart: Date;
  periodEnd: Date;
}

export interface AttemptBreakdown {
  attempt: number;
  received: number;
  replied: number;
  replyRate: number;
  cumulativeRate: number;
}

export interface CadenceInsight {
  type: "success" | "warning" | "info";
  title: string;
  description: string;
}

export interface CadencePerformanceData {
  totalCadences: number;
  replied: number;
  responseRate: number;
  finishedNoReply: number;
  inProgress: number;
  avgHoursToReply: number | null;
  byAttempt: AttemptBreakdown[];
  noReplyCount: number;
  insights: CadenceInsight[];
}

const TOTAL_STEPS = 7;

export function useCadencePerformance({
  brokerId,
  projectId,
  periodStart,
  periodEnd,
}: UseCadencePerformanceParams) {
  return useQuery({
    queryKey: [
      "cadence-performance",
      brokerId,
      projectId,
      periodStart.toISOString(),
      periodEnd.toISOString(),
    ],
    enabled: !!brokerId,
    staleTime: 60_000,
    queryFn: async (): Promise<CadencePerformanceData> => {
      // 1. Fetch individual cadence campaigns (lead_id IS NOT NULL)
      let campQ = supabase
        .from("whatsapp_campaigns")
        .select("id, status, reply_count, started_at, lead_id, project_id, created_at")
        .eq("broker_id", brokerId)
        .not("lead_id", "is", null)
        .gte("created_at", periodStart.toISOString())
        .lte("created_at", periodEnd.toISOString());

      if (projectId) campQ = campQ.eq("project_id", projectId);

      const { data: campaigns = [] } = await campQ.limit(5000);

      if (!campaigns || campaigns.length === 0) {
        return emptyResult();
      }

      const campaignIds = campaigns.map((c: any) => c.id);

      // 2. Fetch queue items for these campaigns
      const { data: queueItems = [] } = await supabase
        .from("whatsapp_message_queue")
        .select("campaign_id, step_number, status, sent_at, updated_at")
        .in("campaign_id", campaignIds)
        .limit(50000);

      // Group by campaign
      const queueByCampaign = new Map<string, any[]>();
      (queueItems as any[]).forEach((q) => {
        const arr = queueByCampaign.get(q.campaign_id) || [];
        arr.push(q);
        queueByCampaign.set(q.campaign_id, arr);
      });

      // 3. Classify each cadence
      let inProgress = 0;
      let finishedNoReply = 0;
      let replied = 0;
      const repliedAtAttempt: number[] = new Array(TOTAL_STEPS + 1).fill(0); // 1..7
      const replyTimesHours: number[] = [];

      for (const camp of campaigns as any[]) {
        const items = queueByCampaign.get(camp.id) || [];
        const sentSteps = items.filter((i) => i.status === "sent");
        const sentCount = sentSteps.length;
        const maxSentStep = sentSteps.reduce(
          (m, i) => Math.max(m, Number(i.step_number) || 0),
          0
        );

        if ((camp.reply_count || 0) > 0) {
          // Replied
          const attempt = Math.min(Math.max(maxSentStep, 1), TOTAL_STEPS);
          repliedAtAttempt[attempt] = (repliedAtAttempt[attempt] || 0) + 1;
          replied++;

          // Time to reply
          if (camp.started_at) {
            const lastSent = sentSteps.reduce((latest, i) => {
              const t = new Date(i.sent_at || i.updated_at).getTime();
              return t > latest ? t : latest;
            }, 0);
            if (lastSent > 0) {
              const diffH =
                (lastSent - new Date(camp.started_at).getTime()) / 3_600_000;
              if (diffH >= 0 && diffH < 24 * 60) replyTimesHours.push(diffH);
            }
          }
        } else if (sentCount >= TOTAL_STEPS) {
          finishedNoReply++;
        } else if (
          camp.status === "running" ||
          camp.status === "scheduled" ||
          camp.status === "paused"
        ) {
          inProgress++;
        } else {
          // Cancelled or completed without all steps & no reply -> count as no-reply
          finishedNoReply++;
        }
      }

      const totalCadences = campaigns.length;
      const finalCohort = replied + finishedNoReply; // finalized cadences
      const responseRate =
        finalCohort > 0 ? (replied / finalCohort) * 100 : 0;

      // Median time
      replyTimesHours.sort((a, b) => a - b);
      const avgHoursToReply =
        replyTimesHours.length > 0
          ? replyTimesHours[Math.floor(replyTimesHours.length / 2)]
          : null;

      // 4. byAttempt: cumulative breakdown
      const byAttempt: AttemptBreakdown[] = [];
      let cumulativeReplied = 0;
      let received = finalCohort; // everyone in final cohort received attempt 1
      for (let step = 1; step <= TOTAL_STEPS; step++) {
        const repAtStep = repliedAtAttempt[step] || 0;
        const replyRate = received > 0 ? (repAtStep / received) * 100 : 0;
        cumulativeReplied += repAtStep;
        const cumulativeRate =
          finalCohort > 0 ? (cumulativeReplied / finalCohort) * 100 : 0;
        byAttempt.push({
          attempt: step,
          received,
          replied: repAtStep,
          replyRate,
          cumulativeRate,
        });
        received = Math.max(0, received - repAtStep);
      }

      // 5. Insights
      const insights: CadenceInsight[] = [];

      if (finalCohort > 0) {
        // Best attempt
        const bestAttempt = byAttempt
          .filter((a) => a.received >= 3)
          .reduce<AttemptBreakdown | null>(
            (best, cur) => (!best || cur.replyRate > best.replyRate ? cur : best),
            null
          );
        if (bestAttempt && bestAttempt.replyRate >= 15) {
          insights.push({
            type: "success",
            title: `${bestAttempt.attempt}ª tentativa é a sua melhor`,
            description: `Taxa de ${bestAttempt.replyRate.toFixed(
              1
            )}% — sua copy aqui está convertendo bem.`,
          });
        }

        // Weak attempt
        const weakAttempt = byAttempt
          .filter((a) => a.received >= 5 && a.replyRate < 5)
          .reduce<AttemptBreakdown | null>(
            (worst, cur) => (!worst || cur.replyRate < worst.replyRate ? cur : worst),
            null
          );
        if (weakAttempt) {
          insights.push({
            type: "warning",
            title: `${weakAttempt.attempt}ª tentativa com baixo desempenho`,
            description: `Apenas ${weakAttempt.replyRate.toFixed(
              1
            )}% de resposta — considere reescrever a copy desta etapa.`,
          });
        }

        // High no-reply
        const noReplyRate = (finishedNoReply / finalCohort) * 100;
        if (noReplyRate > 50) {
          insights.push({
            type: "warning",
            title: "Muitas cadências terminam sem resposta",
            description: `${noReplyRate.toFixed(
              0
            )}% dos leads percorreram as 7 tentativas sem responder. Repense a abordagem da cadência.`,
          });
        }

        // Late recovery (steps 6 + 7)
        const lateRecovery =
          (repliedAtAttempt[6] || 0) + (repliedAtAttempt[7] || 0);
        if (lateRecovery >= 3) {
          insights.push({
            type: "info",
            title: `Você recuperou ${lateRecovery} leads na 6ª/7ª tentativa`,
            description: "Insistir nas últimas tentativas está compensando.",
          });
        }
      }

      return {
        totalCadences,
        replied,
        responseRate,
        finishedNoReply,
        inProgress,
        avgHoursToReply,
        byAttempt,
        noReplyCount: finishedNoReply,
        insights,
      };
    },
  });
}

function emptyResult(): CadencePerformanceData {
  return {
    totalCadences: 0,
    replied: 0,
    responseRate: 0,
    finishedNoReply: 0,
    inProgress: 0,
    avgHoursToReply: null,
    byAttempt: [],
    noReplyCount: 0,
    insights: [],
  };
}
