import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrokerWhatsAppInstance } from "@/types/whatsapp";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-instance-manager`;

const QUERY_KEY = ["whatsapp-instance"];

interface UseWhatsAppInstanceReturn {
  instance: BrokerWhatsAppInstance | null;
  pairingCode: string | null;
  isLoading: boolean;
  qrCode: string | null;
  isLoadingQR: boolean;
  error: string | null;
  initInstance: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  fetchQRCode: (phoneNumber?: string) => Promise<void>;
  logout: () => Promise<void>;
  restart: () => Promise<void>;
  deleteInstance: () => Promise<void>;
  configureWebhook: () => Promise<void>;
  togglePause: (pause: boolean, reason?: string) => Promise<void>;
  updateSettings: (settings: Partial<Pick<BrokerWhatsAppInstance, 'hourly_limit' | 'daily_limit' | 'working_hours_start' | 'working_hours_end'>>) => Promise<void>;
}

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("No active session");
  }
  return {
    "Authorization": `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
};

const fetchInstanceStatus = async (): Promise<BrokerWhatsAppInstance | null> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${FUNCTION_URL}/status`, {
    method: "GET",
    headers,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to get status");
  }
  return data.instance ?? null;
};

export function useWhatsAppInstance(): UseWhatsAppInstanceReturn {
  const [qrCode, setQRCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: instance = null, isLoading: isQueryLoading, error: queryError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchInstanceStatus,
    staleTime: 30_000,
    refetchInterval: (query) => {
      const inst = query.state.data;
      if (!inst) return false;
      if (inst.status === "qr_pending" || inst.status === "connecting") return 5000;
      if (inst.status === "disconnected") return 10000;
      if (inst.status === "connected") return 60000;
      return false;
    },
  });

  // Clear QR when connected
  if (instance?.status === "connected" && (qrCode || pairingCode)) {
    setQRCode(null);
    setPairingCode(null);
  }

  const refreshStatus = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  const initInstance = useCallback(async () => {
    try {
      setIsMutating(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${FUNCTION_URL}/init`, {
        method: "POST",
        headers,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to initialize instance");

      queryClient.setQueryData(QUERY_KEY, data.instance);
      toast({
        title: "Instância criada",
        description: "Escaneie o QR Code para conectar seu WhatsApp.",
      });
      // Auto-fetch QR code after init
      await fetchQRCodeInternal();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Erro ao criar instância", description: message, variant: "destructive" });
    } finally {
      setIsMutating(false);
    }
  }, [toast, queryClient]);

  const fetchQRCodeInternal = async (phoneNumber?: string) => {
    try {
      setIsLoadingQR(true);
      setQRCode(null);
      setPairingCode(null);
      const headers = await getAuthHeaders();
      const params = phoneNumber ? `?number=${encodeURIComponent(phoneNumber.replace(/\D/g, ""))}` : "";
      const response = await fetch(`${FUNCTION_URL}/qrcode${params}`, { method: "GET", headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to get QR code");

      const nextQrCode = data.qrcode || null;
      const nextPairingCode = data.pairingCode || null;
      setQRCode(nextQrCode);
      setPairingCode(nextPairingCode);

      if (data.message) {
        toast({ title: nextPairingCode ? "Código gerado" : "Pareamento disponível", description: data.message });
      } else if (phoneNumber && nextPairingCode) {
        toast({ title: "Código gerado", description: "Digite o código no WhatsApp para concluir o pareamento." });
      } else if (phoneNumber && nextQrCode && !nextPairingCode) {
        toast({ title: "Código numérico indisponível", description: "Seu provedor não retornou o código agora. Use o QR Code como alternativa." });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("QR Code error:", err);
      toast({ title: "Erro ao obter QR Code", description: message, variant: "destructive" });
    } finally {
      setIsLoadingQR(false);
    }
  };

  const fetchQRCode = useCallback(async (phoneNumber?: string) => {
    await fetchQRCodeInternal(phoneNumber);
  }, [toast]);

  const logout = useCallback(async () => {
    try {
      setIsMutating(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${FUNCTION_URL}/logout`, { method: "POST", headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to logout");

      setQRCode(null);
      setPairingCode(null);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: "Desconectado", description: "WhatsApp desconectado com sucesso." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Erro ao desconectar", description: message, variant: "destructive" });
    } finally {
      setIsMutating(false);
    }
  }, [queryClient, toast]);

  const restart = useCallback(async () => {
    try {
      setIsMutating(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${FUNCTION_URL}/restart`, { method: "POST", headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to restart");

      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: "Reiniciando", description: "Instância sendo reiniciada..." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Erro ao reiniciar", description: message, variant: "destructive" });
    } finally {
      setIsMutating(false);
    }
  }, [queryClient, toast]);

  const deleteInstance = useCallback(async () => {
    try {
      setIsMutating(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${FUNCTION_URL}/delete`, { method: "DELETE", headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete instance");

      queryClient.setQueryData(QUERY_KEY, null);
      setQRCode(null);
      setPairingCode(null);
      toast({ title: "Instância deletada", description: "A instância WhatsApp foi removida completamente." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Erro ao deletar", description: message, variant: "destructive" });
    } finally {
      setIsMutating(false);
    }
  }, [queryClient, toast]);

  const togglePause = useCallback(async (pause: boolean, reason?: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${FUNCTION_URL}/pause`, {
        method: "POST",
        headers,
        body: JSON.stringify({ pause, reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to toggle pause");

      queryClient.setQueryData(QUERY_KEY, data.instance);
      toast({
        title: pause ? "Envios pausados" : "Envios retomados",
        description: pause ? "Todos os envios foram pausados." : "Os envios foram retomados.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Erro", description: message, variant: "destructive" });
    }
  }, [queryClient, toast]);

  const updateSettings = useCallback(async (settings: Partial<Pick<BrokerWhatsAppInstance, 'hourly_limit' | 'daily_limit' | 'working_hours_start' | 'working_hours_end'>>) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${FUNCTION_URL}/settings`, {
        method: "POST",
        headers,
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update settings");

      queryClient.setQueryData(QUERY_KEY, data.instance);
      toast({ title: "Configurações salvas", description: "As configurações foram atualizadas." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Erro ao salvar", description: message, variant: "destructive" });
    }
  }, [queryClient, toast]);

  return {
    instance,
    isLoading: isQueryLoading || isMutating,
    qrCode,
    pairingCode,
    isLoadingQR,
    error: queryError ? (queryError instanceof Error ? queryError.message : "Unknown error") : null,
    initInstance,
    refreshStatus,
    fetchQRCode,
    logout,
    restart,
    deleteInstance,
    configureWebhook,
    togglePause,
    updateSettings,
  };
}
