import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CRMLead, LeadStatus } from "@/types/crm";
import { useMemo } from "react";
import { useActiveFlowLeads } from "@/hooks/use-active-flow-reconciliation";

const PAGE_SIZE = 30;

const KANBAN_SELECT = `
  id, name, whatsapp, email, created_at, source, status,
  lead_origin, broker_id, project_id, roleta_id,
  status_distribuicao, comparecimento, last_interaction_at,
  auto_first_message_sent, data_agendamento,
  broker:brokers!leads_broker_id_fkey(id, name, slug),
  project:projects(id, name),
  attribution:lead_attribution(landing_page)
`;

export interface KanbanColumnFilters {
  brokerId?: string | null;
  isAdmin?: boolean;
  projectId?: string | null;
  selectedBroker?: string;
  selectedOrigins?: string[];
  searchTerm?: string;
}

function applyFilters(query: any, filters: KanbanColumnFilters) {
  if (!filters.isAdmin && filters.brokerId) {
    query = query.eq("broker_id", filters.brokerId);
  }
  if (filters.projectId) {
    query = query.eq("project_id", filters.projectId);
  }
  if (filters.selectedBroker && filters.selectedBroker !== "all") {
    if (filters.selectedBroker === "enove") {
      query = query.is("broker_id", null);
    } else {
      query = query.eq("broker_id", filters.selectedBroker);
    }
  }
  if (filters.selectedOrigins && filters.selectedOrigins.length > 0) {
    const hasNoOrigin = filters.selectedOrigins.includes("sem_origem");
    const origins = filters.selectedOrigins.filter((o: string) => o !== "sem_origem");
    if (hasNoOrigin && origins.length > 0) {
      query = query.or(`lead_origin.is.null,lead_origin.in.(${origins.join(",")})`);
    } else if (hasNoOrigin) {
      query = query.is("lead_origin", null);
    } else if (origins.length > 0) {
      query = query.in("lead_origin", origins);
    }
  }
  if (filters.searchTerm && filters.searchTerm.trim()) {
    const rawTerm = filters.searchTerm.trim();
    const textTerm = rawTerm.replace(/[(),."'\\%_]/g, "");
    const digitsTerm = rawTerm.replace(/\D/g, "");
    const orFilters = [];

    if (textTerm) {
      orFilters.push(`name.ilike.%${textTerm}%`);
      orFilters.push(`whatsapp.ilike.%${textTerm}%`);
    }

    if (digitsTerm && digitsTerm !== textTerm) {
      orFilters.push(`whatsapp.ilike.%${digitsTerm}%`);
    }

    if (orFilters.length > 0) {
      query = query.or(orFilters.join(","));
    }
  }
  return query;
}

function applyEffectiveStatusFilter(query: any, status: LeadStatus, activeFlowLeadIds: string[]) {
  if (activeFlowLeadIds.length === 0) {
    return query.eq("status", status);
  }

  if (status === "awaiting_docs") {
    return query.or(`status.eq.awaiting_docs,id.in.(${activeFlowLeadIds.join(",")})`);
  }

  return query
    .eq("status", status)
    .not("id", "in", `(${activeFlowLeadIds.join(",")})`);
}

function reconcileLeadStatus<T extends CRMLead>(lead: T, activeFlowLeadIds: Set<string>): T {
  if (lead.status !== "awaiting_docs" && activeFlowLeadIds.has(lead.id)) {
    return { ...lead, status: "awaiting_docs" };
  }
  return lead;
}

export function useKanbanColumn(status: LeadStatus, filters: KanbanColumnFilters) {
  const filtersKey = useMemo(() => [
    filters.brokerId, filters.isAdmin, filters.projectId,
    filters.selectedBroker,
    JSON.stringify(filters.selectedOrigins || []),
    filters.searchTerm || "",
  ], [filters.brokerId, filters.isAdmin, filters.projectId, filters.selectedBroker, filters.selectedOrigins, filters.searchTerm]);

  const { activeFlowLeadIds, activeFlowIdList, activeFlowSignature } = useActiveFlowLeads({
    brokerId: filters.brokerId,
    isAdmin: filters.isAdmin,
    selectedBroker: filters.selectedBroker,
  });

  const queryKey = ["kanban-column", status, ...filtersKey, activeFlowSignature];
  const countKey = ["kanban-count", status, ...filtersKey, activeFlowSignature];

  const { data: totalCount = 0 } = useQuery({
    queryKey: countKey,
    queryFn: async () => {
      let query = supabase.from("leads").select("id", { count: "exact", head: true });
      query = applyFilters(query, filters);
      query = applyEffectiveStatusFilter(query, status, activeFlowIdList);
      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("leads")
        .select(KANBAN_SELECT)
        .order("last_interaction_at", { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      query = applyFilters(query, filters);
      query = applyEffectiveStatusFilter(query, status, activeFlowIdList);

      const { data, error } = await query;
      if (error) throw error;
      return ((data || []) as any[]).map((lead: any) => reconcileLeadStatus({
        ...lead,
        attribution: Array.isArray(lead.attribution) && lead.attribution.length > 0
          ? lead.attribution[0]
          : lead.attribution,
      } as CRMLead, activeFlowLeadIds));
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.reduce((acc, page) => acc + page.length, 0);
    },
    initialPageParam: 0,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const leads = useMemo(() => data?.pages.flat() ?? [], [data]);

  return {
    leads,
    totalCount,
    isLoading,
    isFetchingNextPage,
    hasNextPage: !!hasNextPage,
    fetchNextPage,
  };
}

