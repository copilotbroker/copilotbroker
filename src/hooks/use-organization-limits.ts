// Resolve plan limits & current usage for the active organization.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./use-organization";

export interface FeatureLimit {
  feature_key: string;
  value_int: number | null;
  value_bool: boolean | null;
  value_text: string | null;
}

export interface UsageSnapshot {
  brokers: number;
  whatsapp_instances: number;
  landing_pages: number;
}

interface LimitsResult {
  isLoading: boolean;
  planName: string | null;
  features: Record<string, FeatureLimit>;
  usage: UsageSnapshot;
  hasReached: (featureKey: string, currentExtra?: number) => boolean;
  remaining: (featureKey: string) => number | null;
}

const fetchLimits = async (orgId: string) => {
  // Subscription -> plan -> features
  const subRes = await supabase
    .from("organization_subscriptions" as any)
    .select("plan_id, plan:plans(id,code,name)")
    .eq("organization_id", orgId)
    .in("status", ["active", "trial", "past_due"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle() as any;

  const planId = subRes.data?.plan_id ?? null;
  const planName = subRes.data?.plan?.name ?? null;

  let features: FeatureLimit[] = [];
  if (planId) {
    const featRes = await supabase
      .from("plan_features" as any)
      .select("feature_key, value_int, value_bool, value_text")
      .eq("plan_id", planId) as any;
    features = (featRes.data ?? []) as FeatureLimit[];
  }

  // Usage counters (count via head:true)
  const [brokersRes, instancesRes, projectsRes] = await Promise.all([
    supabase.from("brokers" as any).select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("is_active", true) as any,
    supabase.from("broker_whatsapp_instances" as any).select("id", { count: "exact", head: true }).eq("organization_id", orgId) as any,
    supabase.from("projects" as any).select("id", { count: "exact", head: true }).eq("organization_id", orgId) as any,
  ]);

  const featuresMap: Record<string, FeatureLimit> = {};
  for (const f of features) featuresMap[f.feature_key] = f;

  return {
    planName,
    features: featuresMap,
    usage: {
      brokers: brokersRes.count ?? 0,
      whatsapp_instances: instancesRes.count ?? 0,
      landing_pages: projectsRes.count ?? 0,
    } as UsageSnapshot,
  };
};

export const useOrganizationLimits = (): LimitsResult => {
  const { activeOrgId } = useOrganization();

  const { data, isLoading } = useQuery({
    queryKey: ["organization-limits", activeOrgId],
    queryFn: () => fetchLimits(activeOrgId!),
    enabled: !!activeOrgId,
    staleTime: 60 * 1000,
  });

  const features = data?.features ?? {};
  const usage = data?.usage ?? { brokers: 0, whatsapp_instances: 0, landing_pages: 0 };

  const usageKeyFor = (k: string): keyof UsageSnapshot | null => {
    if (k === "max_brokers") return "brokers";
    if (k === "max_whatsapp_instances") return "whatsapp_instances";
    if (k === "max_landing_pages") return "landing_pages";
    return null;
  };

  const remaining = (featureKey: string): number | null => {
    const f = features[featureKey];
    if (!f || f.value_int == null) return null;
    const usageKey = usageKeyFor(featureKey);
    if (!usageKey) return null;
    return Math.max(0, f.value_int - usage[usageKey]);
  };

  const hasReached = (featureKey: string, currentExtra = 0) => {
    const f = features[featureKey];
    if (!f || f.value_int == null) return false; // unlimited / unknown
    const usageKey = usageKeyFor(featureKey);
    if (!usageKey) return false;
    return usage[usageKey] + currentExtra >= f.value_int;
  };

  return {
    isLoading,
    planName: data?.planName ?? null,
    features,
    usage,
    hasReached,
    remaining,
  };
};
