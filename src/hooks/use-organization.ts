// Cached organization context for the current user.
// Returns: super-admin status, list of orgs the user belongs to, and the active org (first by default).
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OrganizationMembership {
  organization_id: string;
  role: "super_admin" | "owner" | "admin" | "manager" | "leader" | "broker";
  is_active: boolean;
  organization: {
    id: string;
    name: string;
    slug: string;
    status: string;
    logo_url: string | null;
    primary_color: string | null;
  };
}

interface OrganizationState {
  isSuperAdmin: boolean;
  memberships: OrganizationMembership[];
  activeOrgId: string | null;
  activeOrg: OrganizationMembership["organization"] | null;
  activeOrgRole: OrganizationMembership["role"] | null;
  isOwnerOrAdmin: boolean;
}

const ACTIVE_ORG_KEY = "copilot:active_org_id";

const fetchOrgContext = async (): Promise<Omit<OrganizationState, "isOwnerOrAdmin">> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { isSuperAdmin: false, memberships: [], activeOrgId: null, activeOrg: null, activeOrgRole: null };
  }

  const [rolesRes, membersRes] = await Promise.all([
    supabase.from("user_roles" as any).select("role").eq("user_id", user.id) as any,
    supabase
      .from("organization_members" as any)
      .select("organization_id, role, is_active, organization:organizations(id,name,slug,status,logo_url,primary_color)")
      .eq("user_id", user.id)
      .eq("is_active", true) as any,
  ]);

  const isSuperAdmin = ((rolesRes.data ?? []) as any[]).some((r) => r.role === "super_admin");
  const memberships = (membersRes.data ?? []) as OrganizationMembership[];

  let activeOrgId: string | null = null;
  try {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(ACTIVE_ORG_KEY) : null;
    if (stored && memberships.some((m) => m.organization_id === stored)) {
      activeOrgId = stored;
    }
  } catch { /* ignore */ }

  if (!activeOrgId && memberships.length > 0) {
    activeOrgId = memberships[0].organization_id;
  }

  const active = memberships.find((m) => m.organization_id === activeOrgId) ?? null;

  return {
    isSuperAdmin,
    memberships,
    activeOrgId,
    activeOrg: active?.organization ?? null,
    activeOrgRole: active?.role ?? null,
  };
};

export const useOrganization = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["organization-context"],
    queryFn: fetchOrgContext,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "TOKEN_REFRESHED") return;
      if (event === "SIGNED_OUT") {
        queryClient.setQueryData(["organization-context"], {
          isSuperAdmin: false, memberships: [], activeOrgId: null, activeOrg: null, activeOrgRole: null,
        });
      } else if (event === "SIGNED_IN") {
        queryClient.invalidateQueries({ queryKey: ["organization-context"] });
      }
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  const setActiveOrg = (orgId: string) => {
    try { window.localStorage.setItem(ACTIVE_ORG_KEY, orgId); } catch { /* ignore */ }
    queryClient.invalidateQueries({ queryKey: ["organization-context"] });
  };

  const role = query.data?.activeOrgRole ?? null;
  const isOwnerOrAdmin = role === "owner" || role === "admin";

  return {
    isLoading: query.isLoading,
    isSuperAdmin: query.data?.isSuperAdmin ?? false,
    memberships: query.data?.memberships ?? [],
    activeOrgId: query.data?.activeOrgId ?? null,
    activeOrg: query.data?.activeOrg ?? null,
    activeOrgRole: role,
    isOwnerOrAdmin,
    setActiveOrg,
  };
};
