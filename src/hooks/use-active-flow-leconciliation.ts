import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { KanbanColumnFilters } from "@/hooks/use-kanban-column";

const ACTIVE_FLOW_STATUSES = ["queued", "scheduled", "sending", "paused_by_system"] as const;

function applyBrokerFilters<T>(query: T, filters: Pick<KanbanColumnFilters, "brokerId" | "isAdmin" | "selectedBroker">) {
  let nextQuery: any = query;

  if (!filters.isAdmin && filters.brokerId) {
    nextQuery = nextQuery.eq("broker_id", filters.brokerId);
  }

  if (filters.selectedBroker && filters.selectedBroker !== "all") {
    if (filters.selectedBroker === "enove") {
      nextQuery = nextQuery.is("broker_id", null);
    } else {
      nextQuery = nextQuery.eq("broker_id", filters.selectedBroker);
    }
  }

  return nextQuery as T;
}

async function fetchActiveFlowLeadIds(filters: Pick<KanbanColumnFilters, "brokerId" | "isAdmin" | "selectedBroker">) {
  let campaignsQuery = supabase
    .from("whatsapp_campaigns")
    .select("lead_id")
    .eq("status", "running")
    .not("lead_id", "is", null);

  let queueQuery = supabase
    .from("whatsapp_message_queue")
    .select("lead_id")
    .in("status", [...ACTIVE_FLOW_STATUSES])
    .not("lead_id", "is", null);

  campaignsQuery = applyBrokerFilters(campaignsQuery, filters);
  queueQuery = applyBrokerFilters(queueQuery, filters);

  const [{ data: campaigns, error: campaignsError }, { data: queueItems, error: queueError }] = await Promise.all([
    campaignsQuery,
    queueQuery,
  ]);

  if (campaignsError) throw campaignsError;
  if (queueError) throw queueError;

  return new Set<string>(
    [...(campaigns || []), ...(queueItems || [])]
      .map((row: { lead_id: string | null }) => row.lead_id)
      .filter((leadId): leadId is string => Boolean(leadId))
  );
}

export function useActiveFlowLeads(filters: Pick<KanbanColumnFilters, "brokerId" | "isAdmin" | "selectedBroker">) {
  const queryKey = ["kanban-active-flow-ids", filters.brokerId, filters.isAdmin, filters.selectedBroker];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchActiveFlowLeadIds(filters),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const activeFlowLeadIds = useMemo(() => query.data ?? new Set<string>(), [query.data]);
  const activeFlowIdList = useMemo(() => Array.from(activeFlowLeadIds), [activeFlowLeadIds]);
  const activeFlowSignature = useMemo(() => activeFlowIdList.slice().sort().join(","), [activeFlowIdList]);

  return {
    ...query,
    activeFlowLeadIds,
    activeFlowIdList,
    activeFlowSignature,
  };
}
