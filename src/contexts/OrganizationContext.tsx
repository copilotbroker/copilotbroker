// Global Organization context — exposes the active tenant across the app.
// Wraps useOrganization (React Query cached) so all components share the same state
// and switching org triggers re-renders + query invalidations everywhere.
import { createContext, useContext, useCallback, useMemo, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrganization, OrganizationMembership } from "@/hooks/use-organization";

interface OrganizationContextValue {
  isLoading: boolean;
  isSuperAdmin: boolean;
  memberships: OrganizationMembership[];
  activeOrgId: string | null;
  activeOrg: OrganizationMembership["organization"] | null;
  activeOrgRole: OrganizationMembership["role"] | null;
  isOwnerOrAdmin: boolean;
  setActiveOrg: (orgId: string) => void;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const org = useOrganization();
  const queryClient = useQueryClient();

  // Wrap setActiveOrg to also invalidate tenant-scoped queries
  const setActiveOrg = useCallback(
    (orgId: string) => {
      org.setActiveOrg(orgId);
      // Invalidate any query that depends on the active organization.
      // Convention: include "org-scoped" in the queryKey for caches that need it.
      queryClient.invalidateQueries({ predicate: (q) => {
        const key = q.queryKey?.[0];
        return typeof key === "string" && key !== "organization-context";
      }});
    },
    [org, queryClient]
  );

  const value = useMemo<OrganizationContextValue>(
    () => ({ ...org, setActiveOrg }),
    [org, setActiveOrg]
  );

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
};

export const useOrgContext = (): OrganizationContextValue => {
  const ctx = useContext(OrganizationContext);
  if (!ctx) {
    throw new Error("useOrgContext must be used within an OrganizationProvider");
  }
  return ctx;
};
