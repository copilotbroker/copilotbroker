import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Centralized logout: clears all React Query cache, signs out from auth,
 * and navigates to /auth. Prevents stale data when switching users.
 */
export const useLogout = (options?: { silent?: boolean }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logout = useCallback(async () => {
    // 1. Clear all cached data immediately to prevent stale data on next login
    queryClient.clear();

    // 2. Sign out from auth
    await supabase.auth.signOut();

    // 3. Navigate to auth page
    navigate("/auth", { replace: true });

    if (!options?.silent) {
      toast.success("Logout realizado com sucesso!");
    }
  }, [queryClient, navigate, options?.silent]);

  return logout;
};
