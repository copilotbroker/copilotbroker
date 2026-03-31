import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./use-user-role";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface AutoCadenciaStep {
  messageContent: string;
  delayMinutes: number;
  sendIfReplied: boolean;
}

export type CadenceType = 'manual' | 'automatic';

export interface BrokerAutoCadenciaRule {
  id: string;
  broker_id: string;
  name: string;
  project_id: string | null;
  is_active: boolean;
  cadence_type: CadenceType;
  created_at: string;
  updated_at: string;
  project?: { id: string; name: string } | null;
  steps_count?: number;
}

const fetchRulesForBroker = async (brokerId: string): Promise<BrokerAutoCadenciaRule[]> => {
  const { data, error } = await (supabase
    .from("broker_auto_cadencia_rules") as any)
    .select(`*, project:projects(id, name)`)
    .eq("broker_id", brokerId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rulesData = (data as BrokerAutoCadenciaRule[]) || [];
  if (rulesData.length > 0) {
    const ruleIds = rulesData.map(r => r.id);
    const { data: stepsData } = await (supabase
      .from("auto_cadencia_steps") as any)
      .select("rule_id")
      .in("rule_id", ruleIds);

    const countMap: Record<string, number> = {};
    (stepsData || []).forEach((s: any) => {
      countMap[s.rule_id] = (countMap[s.rule_id] || 0) + 1;
    });
    rulesData.forEach(r => { r.steps_count = countMap[r.id] || 0; });
  }

  return rulesData;
};

export function useAutoCadenciaRules() {
  const { brokerId } = useUserRole();
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const queryKey = ["auto-cadencia-rules", brokerId];

  const { data: rules = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchRulesForBroker(brokerId!),
    enabled: !!brokerId,
    staleTime: 30_000,
  });

  const saveSteps = async (ruleId: string, steps: AutoCadenciaStep[]) => {
    await (supabase.from("auto_cadencia_steps") as any)
      .delete()
      .eq("rule_id", ruleId);

    const stepsToInsert = steps.map((step, i) => ({
      rule_id: ruleId,
      step_order: i + 1,
      message_content: step.messageContent,
      delay_minutes: i === 0 ? 0 : step.delayMinutes,
      send_if_replied: i === 0 ? true : step.sendIfReplied,
    }));

    const { error } = await (supabase.from("auto_cadencia_steps") as any)
      .insert(stepsToInsert);
    if (error) throw error;
  };

  const fetchRuleSteps = async (ruleId: string): Promise<AutoCadenciaStep[]> => {
    const { data, error } = await (supabase.from("auto_cadencia_steps") as any)
      .select("message_content, delay_minutes, send_if_replied")
      .eq("rule_id", ruleId)
      .order("step_order", { ascending: true });

    if (error) throw error;

    return (data || []).map((step: any) => ({
      messageContent: step.message_content,
      delayMinutes: step.delay_minutes,
      sendIfReplied: step.send_if_replied,
    }));
  };

  const createRule = async (data: { name?: string; project_id: string | null; is_active: boolean; cadence_type?: CadenceType; steps: AutoCadenciaStep[] }) => {
    if (!brokerId) return null;
    setIsSaving(true);
    try {
      const { data: newRule, error } = await (supabase
        .from("broker_auto_cadencia_rules") as any)
        .insert({
          broker_id: brokerId,
          name: data.name || "Cadência de Follow-up",
          project_id: data.project_id,
          is_active: data.is_active,
          cadence_type: data.cadence_type || 'manual',
        })
        .select(`*, project:projects(id, name)`)
        .single();

      if (error) throw error;

      await saveSteps(newRule.id, data.steps);
      await queryClient.invalidateQueries({ queryKey });
      toast.success("Cadência de follow-up criada!");
      return newRule;
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Já existe uma cadência para este empreendimento");
      } else {
        toast.error("Erro ao criar cadência");
      }
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateRule = async (id: string, data: Partial<{ name: string; project_id: string | null; is_active: boolean }>, steps?: AutoCadenciaStep[]) => {
    setIsSaving(true);
    try {
      const { data: updated, error } = await (supabase
        .from("broker_auto_cadencia_rules") as any)
        .update(data)
        .eq("id", id)
        .select(`*, project:projects(id, name)`)
        .single();

      if (error) throw error;

      if (steps) {
        await saveSteps(id, steps);
      }

      await queryClient.invalidateQueries({ queryKey });
      toast.success("Regra atualizada!");
      return updated;
    } catch (error) {
      toast.error("Erro ao atualizar regra");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await (supabase
        .from("broker_auto_cadencia_rules") as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey });
      toast.success("Regra excluída!");
      return true;
    } catch (error) {
      toast.error("Erro ao excluir regra");
      return false;
    }
  };

  const toggleRuleActive = async (id: string, is_active: boolean) => {
    return updateRule(id, { is_active });
  };

  const fetchRules = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return { rules, isLoading, isSaving, fetchRules, fetchRuleSteps, createRule, updateRule, deleteRule, toggleRuleActive };
}
