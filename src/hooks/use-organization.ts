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
    favicon_url: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    display_name: string | null;
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
      .select("organization_id, role, is_active, organization:organizations(id,name,slug,status,logo_url,favicon_url,primary_color,secondary_color,display_name)")
      .eq("user_id", user.id)
      .eq("is_active", true) as any,
  ]);

  const isSuperAdmin = ((rolesRes.data ?? []) as any[]).some((r) => r.role === "super_admin");
  const memberships = (membersRes.data ?? []) as OrganizationMembership[];

  let activeOrgId: string | null = null;
  let storedFromLS: string | null = null;
  try {
    storedFromLS = typeof window !== "undefined" ? window.localStorage.getItem(ACTIVE_ORG_KEY) : null;
    if (storedFromLS && memberships.some((m) => m.organization_id === storedFromLS)) {
      activeOrgId = storedFromLS;
    }
  } catch { /* ignore */ }

  // Super admin can impersonate any org (even non-member). Honor the stored choice.
  if (!activeOrgId && isSuperAdmin && storedFromLS) {
    activeOrgId = storedFromLS;
  }

  if (!activeOrgId && memberships.length > 0) {
    activeOrgId = memberships[0].organization_id;
  }

  let active = memberships.find((m) => m.organization_id === activeOrgId) ?? null;

  // For super_admin viewing a non-member org, fetch that org's metadata.
  let activeOrgData = active?.organization ?? null;
  if (!activeOrgData && isSuperAdmin && activeOrgId) {
    const { data: orgData } = await supabase
      .from("organizations" as any)
      .select("id,name,slug,status,logo_url,favicon_url,primary_color,secondary_color,display_name")
      .eq("id", activeOrgId)
      .maybeSingle() as any;
    if (orgData) activeOrgData = orgData as OrganizationMembership["organization"];
  }

  return {
    isSuperAdmin,
    memberships,
    activeOrgId,
    activeOrg: activeOrgData,
    activeOrgRole: active?.role ?? (isSuperAdmin ? "super_admin" : null),
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
    // Update cache synchronously so UI reflects the switch immediately,
    // even if the org is not in the user's memberships (super_admin impersonation).
    queryClient.setQueryData(["organization-context"], (prev: any) => {
      if (!prev) return prev;
      const membershipMatch = (prev.memberships ?? []).find((m: OrganizationMembership) => m.organization_id === orgId) ?? null;
      return {
        ...prev,
        activeOrgId: orgId,
        activeOrg: membershipMatch?.organization ?? prev.activeOrg,
        activeOrgRole: membershipMatch?.role ?? prev.activeOrgRole,
      };
    });
    // Refetch in background to pick up org details for super_admin (non-member orgs).
    queryClient.invalidateQueries({ queryKey: ["organization-context"] });
  };

  const role = query.data?.activeOrgRole ?? null;
  // 'manager' tem o mesmo poder administrativo de owner/admin dentro da organização
  const isOwnerOrAdmin = role === "owner" || role === "admin" || role === "manager";

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
