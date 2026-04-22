import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface CopilotConfig {
  id: string;
  broker_id: string;
  name: string;
  personality: string;
  persuasion_level: number;
  objectivity_level: number;
  use_mental_triggers: boolean;
  allow_emojis: boolean;
  language_style: string;
  commercial_priority: string;
  commercial_focus: string;
  incentive_visit: boolean;
  incentive_call: boolean;
  followup_enabled: boolean;
  followup_max_attempts: number;
  followup_period_days: number;
  followup_tone: string;
  auto_close_inactive: boolean;
  max_autonomy: string;
  property_type: string;
  region: string | null;
  target_audience: string | null;
  brand_positioning: string | null;
  custom_system_prompt: string | null;
  copilot_mode: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const fetchCopilotConfig = async (brokerId: string): Promise<CopilotConfig | null> => {
  const { data, error } = await supabase
    .from("copilot_configs")
    .select("*")
    .eq("broker_id", brokerId)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as CopilotConfig | null;
};

export function useCopilotConfig(brokerId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ["copilot-config", brokerId];

  const { data: config = null, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchCopilotConfig(brokerId!),
    enabled: !!brokerId,
    staleTime: 60_000,
  });

  const saveConfig = useCallback(async (updates: Partial<CopilotConfig>) => {
    if (!brokerId) return false;
    try {
      if (config) {
        const { error } = await supabase
          .from("copilot_configs")
          .update(updates as any)
          .eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("copilot_configs")
          .insert({ broker_id: brokerId, ...updates } as any);
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey });
      toast.success("Configurações do Copiloto salvas!");
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar configurações");
      return false;
    }
  }, [brokerId, config, queryClient, queryKey]);

  const fetchConfig = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return { config, isLoading, saveConfig, fetchConfig };
}

export function useCopilotSuggestion() {
  const [suggestion, setSuggestion] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSuggestion = useCallback(async (params: {
    action: string;
    conversation_id?: string;
    lead_context?: Record<string, unknown>;
    messages?: Array<{ role: string; content: string }>;
    copilot_config?: Partial<CopilotConfig>;
  }) => {
    setIsGenerating(true);
    setSuggestion("");

    try {
      const { data, error } = await supabase.functions.invoke("copilot-ai", {
        body: params,
      });

      if (error) throw error;

      if (data?.suggestion) {
        setSuggestion(data.suggestion);
        setIsGenerating(false);
        return data.suggestion;
      }

      setSuggestion(data?.suggestion || "Não foi possível gerar sugestão.");
      setIsGenerating(false);
      return data?.suggestion;
    } catch (error: any) {
      console.error("Erro ao gerar sugestão:", error);
      if (error?.status === 429) {
        toast.error("Limite de requisições IA excedido. Tente novamente em instantes.");
      } else if (error?.status === 402) {
        toast.error("Créditos de IA esgotados.");
      } else {
        toast.error("Erro ao consultar Copiloto IA");
      }
      setIsGenerating(false);
      return null;
    }
  }, []);

  return { suggestion, isGenerating, generateSuggestion, setSuggestion };
}
