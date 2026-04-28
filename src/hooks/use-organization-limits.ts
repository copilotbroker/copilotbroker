// Resolve plan limits & current usage for the active organization.
// Overrides from organization_feature_overrides take precedence over plan_features.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./use-organization";

export interface FeatureLimit {
  feature_key: string;
  feature_value: string;
  feature_type: string; // 'limit' | 'boolean' | 'text'
  source: "plan" | "override";
  expires_at?: string | null;
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
  isEnabled: (featureKey: string) => boolean;
  asInt: (featureKey: string) => number | null;
}

const fetchLimits = async (orgId: string) => {
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

  let planFeatures: any[] = [];
  if (planId) {
    const featRes = await supabase
      .from("plan_features" as any)
      .select("feature_key, feature_value, feature_type")
      .eq("plan_id", planId) as any;
    planFeatures = featRes.data ?? [];
  }

  const overridesRes = await supabase
    .from("organization_feature_overrides" as any)
    .select("feature_key, feature_value, expires_at")
    .eq("organization_id", orgId) as any;
  const overrides: any[] = overridesRes.data ?? [];

  // Conta membros aprovados+ativos da organização (fonte real da equipe).
  // Usa organization_members em vez de brokers porque novos cadastros via convite/link
  // público criam linha em organization_members antes de existir registro em brokers.
  const [membersRes, instancesRes, projectsRes] = await Promise.all([
    supabase
      .from("organization_members" as any)
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .eq("approval_status", "approved") as any,
    supabase.from("broker_whatsapp_instances" as any).select("id", { count: "exact", head: true }).eq("organization_id", orgId) as any,
    supabase.from("projects" as any).select("id", { count: "exact", head: true }).eq("organization_id", orgId) as any,
  ]);

  const featuresMap: Record<string, FeatureLimit> = {};
  for (const f of planFeatures) {
    featuresMap[f.feature_key] = {
      feature_key: f.feature_key,
      feature_value: f.feature_value,
      feature_type: f.feature_type,
      source: "plan",
    };
  }
  const now = Date.now();
  for (const o of overrides) {
    if (o.expires_at && new Date(o.expires_at).getTime() < now) continue;
    const base = featuresMap[o.feature_key];
    featuresMap[o.feature_key] = {
      feature_key: o.feature_key,
      feature_value: o.feature_value,
      feature_type: base?.feature_type ?? (isFinite(Number(o.feature_value)) ? "limit" : "boolean"),
      source: "override",
      expires_at: o.expires_at ?? null,
    };
  }

  return {
    planName,
    features: featuresMap,
    usage: {
      brokers: membersRes.count ?? 0,
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

  const asInt = (featureKey: string): number | null => {
    const f = features[featureKey];
    if (!f) return null;
    const n = parseInt(f.feature_value, 10);
    return Number.isFinite(n) ? n : null;
  };

  const isEnabled = (featureKey: string): boolean => {
    const f = features[featureKey];
    if (!f) return false;
    return f.feature_value === "true";
  };

  const remaining = (featureKey: string): number | null => {
    const limit = asInt(featureKey);
    if (limit == null) return null;
    const usageKey = usageKeyFor(featureKey);
    if (!usageKey) return null;
    return Math.max(0, limit - usage[usageKey]);
  };

  const hasReached = (featureKey: string, currentExtra = 0) => {
    const limit = asInt(featureKey);
    if (limit == null) return false;
    const usageKey = usageKeyFor(featureKey);
    if (!usageKey) return false;
    return usage[usageKey] + currentExtra >= limit;
  };

  return {
    isLoading,
    planName: data?.planName ?? null,
    features,
    usage,
    hasReached,
    remaining,
    isEnabled,
    asInt,
  };
};
