// React Query cached user role hook
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type AppRole = "admin" | "broker" | null;

interface UserRoleState {
  role: AppRole;
  isLoading: boolean;
  brokerId: string | null;
  isLeader: boolean;
}

const fetchUserRole = async (): Promise<Omit<UserRoleState, "isLoading">> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { role: null, brokerId: null, isLeader: false };

  const [rolesResult, brokerResult, membershipResult] = await Promise.all([
    supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", user.id) as any,
    supabase
      .from("brokers" as any)
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle() as any,
    supabase
      .from("organization_members" as any)
      .select("role, approval_status, is_active")
      .eq("user_id", user.id)
      .eq("approval_status", "approved")
      .eq("is_active", true) as any,
  ]);

  if (rolesResult.error) {
    console.error("Erro ao buscar role:", rolesResult.error);
    return { role: null, brokerId: null, isLeader: false };
  }

  const roles = (rolesResult.data || []).map((r: { role: string }) => r.role);
  const isLeader = roles.includes("leader");

  const memberships = (membershipResult.data || []) as Array<{ role: string }>;
  const hasAdminMembership = memberships.some(
    (m) => m.role === "owner" || m.role === "admin" || m.role === "manager"
  );

  let role: AppRole = null;
  if (roles.includes("admin") || (roles.includes("super_admin") && hasAdminMembership) || hasAdminMembership) {
    role = "admin";
  } else if (roles.includes("broker") || roles.includes("leader") || memberships.some((m) => m.role === "broker")) {
    role = "broker";
  }

  const brokerId = brokerResult.data?.id || null;
  return { role, brokerId, isLeader };
};

export const useUserRole = (): UserRoleState => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["user-role"],
    queryFn: fetchUserRole,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "TOKEN_REFRESHED") return;
      if (event === "SIGNED_OUT") {
        queryClient.setQueryData(["user-role"], { role: null, brokerId: null, isLeader: false });
      } else if (event === "SIGNED_IN") {
        queryClient.invalidateQueries({ queryKey: ["user-role"] });
      }
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  return {
    role: data?.role ?? null,
    isLoading,
    brokerId: data?.brokerId ?? null,
    isLeader: data?.isLeader ?? false,
  };
};
