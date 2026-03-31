import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface GlobalInstanceState {
  status: "connected" | "disconnected" | "connecting" | "qr_pending";
  phoneNumber: string | null;
  instanceName: string | null;
  lastSeenAt: string | null;
  error: string | null;
  needsInit: boolean;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-global-instance-manager`;
const QUERY_KEY = ["whatsapp-global-instance"];

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("No active session");
  }
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.access_token}`,
  };
};

const fetchGlobalStatus = async (): Promise<GlobalInstanceState> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${FUNCTION_URL}/status`, { headers });
  const data = await response.json();

  if (data.error && !data.status) {
    return {
      status: "disconnected",
      phoneNumber: null,
      instanceName: null,
      lastSeenAt: null,
      error: data.error,
      needsInit: data.needsInit || false,
    };
  }

  return {
    status: data.status as GlobalInstanceState["status"],
    phoneNumber: data.phoneNumber || null,
    instanceName: data.instanceName || null,
    lastSeenAt: data.lastSeenAt || null,
    error: data.error || null,
    needsInit: data.needsInit || false,
  };
};

export function useWhatsAppGlobalInstance() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const queryClient = useQueryClient();

  const { data: state, isLoading: isQueryLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchGlobalStatus,
    staleTime: 30_000,
    refetchInterval: (query) => {
      const s = query.state.data;
      if (!s) return false;
      if (s.status === "qr_pending" || s.status === "connecting") return 5000;
      if (s.status === "connected") return 60000;
      return 15000;
    },
  });

  const currentState = state ?? {
    status: "disconnected" as const,
    phoneNumber: null,
    instanceName: null,
    lastSeenAt: null,
    error: null,
    needsInit: false,
  };

  // Clear QR when connected
  if (currentState.status === "connected" && (qrCode || pairingCode)) {
    setQrCode(null);
    setPairingCode(null);
  }

  const refreshStatus = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  const fetchQRCodeInternal = async () => {
    try {
      setIsLoadingQR(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${FUNCTION_URL}/qrcode`, { headers });
      const data = await response.json();

      if (data.error) {
        if (data.needsInit) {
          toast.error("Instância não existe. Clique em 'Criar Nova Instância' primeiro.");
          queryClient.setQueryData(QUERY_KEY, (prev: GlobalInstanceState | undefined) =>
            prev ? { ...prev, needsInit: true } : prev
          );
        } else {
          toast.error(data.error);
        }
        return;
      }

      if (data.qrCode) {
        setQrCode(data.qrCode);
        setPairingCode(data.pairingCode || null);
        queryClient.setQueryData(QUERY_KEY, (prev: GlobalInstanceState | undefined) =>
          prev ? { ...prev, status: "qr_pending" as const, needsInit: false } : prev
        );
      } else if (data.pairingCode) {
        setPairingCode(data.pairingCode);
        setQrCode(null);
        queryClient.setQueryData(QUERY_KEY, (prev: GlobalInstanceState | undefined) =>
          prev ? { ...prev, status: "qr_pending" as const, needsInit: false } : prev
        );
        if (data.newInstance) {
          toast.success("Nova instância criada! Escaneie o QR Code.");
        }
      } else {
        toast.warning("QR Code não disponível - tente novamente");
      }
    } catch (error) {
      console.error("Failed to fetch QR code:", error);
      toast.error("Erro ao obter QR Code");
    } finally {
      setIsLoadingQR(false);
    }
  };

  const initInstance = useCallback(async () => {
    try {
      setIsInitializing(true);
      const headers = await getAuthHeaders();
      toast.info("Criando nova instância...");

      const response = await fetch(`${FUNCTION_URL}/init`, { method: "POST", headers });
      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return false;
      }

      toast.success("Instância criada! Gerando QR Code...");

      if (data.qrCode) {
        setQrCode(data.qrCode);
        setPairingCode(data.pairingCode || null);
        queryClient.setQueryData(QUERY_KEY, (prev: GlobalInstanceState | undefined) =>
          prev ? { ...prev, status: "qr_pending" as const, needsInit: false } : prev
        );
      } else if (data.pairingCode) {
        setPairingCode(data.pairingCode);
        queryClient.setQueryData(QUERY_KEY, (prev: GlobalInstanceState | undefined) =>
          prev ? { ...prev, status: "qr_pending" as const, needsInit: false } : prev
        );
      } else {
        await fetchQRCodeInternal();
      }

      return true;
    } catch (error) {
      console.error("Failed to init instance:", error);
      toast.error("Erro ao criar instância");
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [queryClient]);

  const fetchQRCode = useCallback(async () => {
    await fetchQRCodeInternal();
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      setIsMutating(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${FUNCTION_URL}/logout`, { method: "POST", headers });
      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success("Instância desconectada");
      setQrCode(null);
      setPairingCode(null);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    } catch (error) {
      console.error("Failed to logout:", error);
      toast.error("Erro ao desconectar");
    } finally {
      setIsMutating(false);
    }
  }, [queryClient]);

  const restart = useCallback(async () => {
    try {
      setIsMutating(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${FUNCTION_URL}/restart`, { method: "POST", headers });
      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success("Instância reiniciada");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    } catch (error) {
      console.error("Failed to restart:", error);
      toast.error("Erro ao reiniciar");
    } finally {
      setIsMutating(false);
    }
  }, [queryClient]);

  const clearSession = useCallback(async () => {
    try {
      setIsMutating(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${FUNCTION_URL}/clear-session`, { method: "POST", headers });
      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success("Sessão limpa com sucesso");
      setQrCode(null);
      setPairingCode(null);
      queryClient.setQueryData(QUERY_KEY, {
        status: "disconnected",
        phoneNumber: null,
        instanceName: null,
        lastSeenAt: null,
        error: null,
        needsInit: true,
      });
    } catch (error) {
      console.error("Failed to clear session:", error);
      toast.error("Erro ao limpar sessão");
    } finally {
      setIsMutating(false);
    }
  }, [queryClient]);

  return {
    status: currentState.status,
    phoneNumber: currentState.phoneNumber,
    instanceName: currentState.instanceName,
    lastSeenAt: currentState.lastSeenAt,
    error: currentState.error,
    needsInit: currentState.needsInit,
    isLoading: isQueryLoading || isMutating,
    qrCode,
    pairingCode,
    isLoadingQR,
    isInitializing,
    refreshStatus,
    initInstance,
    fetchQRCode,
    logout,
    restart,
    clearSession,
  };
}
