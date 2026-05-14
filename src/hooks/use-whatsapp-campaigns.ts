import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/use-user-role";
import { 
  WhatsAppCampaign, 
  CampaignStatus,
  formatPhoneE164,
  isValidPhone,
  replaceTemplateVariables,
  getRandomInterval
} from "@/types/whatsapp";
import { adjustToWorkingHours } from "@/lib/whatsapp-scheduling";
import type { CRMLead, LeadStatus } from "@/types/crm";

interface CreateCampaignData {
  name: string;
  targetStatus: LeadStatus[];
  projectId?: string;
  origins?: string[];
  brokerFilterId?: string;
  labelIds?: string[];
  excludedLeadIds?: string[];
  // Legacy single-message fields (backward compat)
  templateId?: string;
  customMessage?: string;
  // New multi-step
  steps?: Array<{ messageContent: string; delayMinutes: number; templateId?: string; sendIfReplied?: boolean }>;
}

export function useWhatsAppCampaigns(adminBrokerFilterId?: string) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const { role } = useUserRole();

  // Fetch broker ID
  const { data: broker } = useQuery({
    queryKey: ["current-broker"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from("brokers")
        .select("id, name")
        .eq("user_id", user.id)
        .single();
      
      return data;
    },
  });

  // Fetch campaigns
  const { data: campaigns = [], isLoading: isLoadingCampaigns, refetch: refetchCampaigns } = useQuery({
    queryKey: ["whatsapp-campaigns", broker?.id, role, adminBrokerFilterId],
    queryFn: async () => {
      if (role !== "admin" && !broker?.id) return [];
      
      let query = supabase
        .from("whatsapp_campaigns")
        .select(`
          *,
          template:whatsapp_message_templates(id, name, content),
          project:projects(id, name),
          broker:brokers!whatsapp_campaigns_broker_id_fkey(id, name)
        `)
        .order("created_at", { ascending: false });
      
      if (role === "admin" && adminBrokerFilterId) {
        query = query.eq("broker_id", adminBrokerFilterId);
      } else if (role !== "admin" && broker?.id) {
        query = query.eq("broker_id", broker.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as WhatsAppCampaign[];
    },
    enabled: role === "admin" || !!broker?.id,
  });

  // Fetch leads by status with optional filters
  const fetchLeadsByStatus = useCallback(async (
    targetStatus: LeadStatus[],
    projectId?: string,
    origins?: string[],
    brokerFilterId?: string,
    labelIds?: string[]
  ): Promise<CRMLead[]> => {
    if (role !== "admin" && !broker?.id) return [];
    
    let query = supabase
      .from("leads")
      .select(`
        *,
        project:projects(id, name),
        broker:brokers!leads_broker_id_fkey(id, name)
      `)
      .in("status", targetStatus);
    
    // Broker visibility: non-admins only see their own leads
    if (role !== "admin" && broker?.id) {
      query = query.eq("broker_id", broker.id);
    }

    // Admin filtering by specific broker
    if (brokerFilterId && role === "admin") {
      query = query.eq("broker_id", brokerFilterId);
    }
    
    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    // Origin filter
    if (origins && origins.length > 0) {
      const hasNull = origins.includes("__sem_origem__");
      const realOrigins = origins.filter(o => o !== "__sem_origem__");
      if (hasNull && realOrigins.length > 0) {
        query = query.or(`lead_origin.in.(${realOrigins.join(",")}),lead_origin.is.null`);
      } else if (hasNull) {
        query = query.is("lead_origin", null);
      } else {
        query = query.in("lead_origin", realOrigins);
      }
    }

    // Label filter (OR — lead must have at least one of the selected labels)
    if (labelIds && labelIds.length > 0) {
      const { data: links, error: labelErr } = await supabase
        .from("lead_whatsapp_labels")
        .select("lead_id")
        .in("label_id", labelIds);
      if (labelErr) throw labelErr;
      const leadIds = Array.from(new Set((links || []).map((l: any) => l.lead_id)));
      if (leadIds.length === 0) return [];
      query = query.in("id", leadIds);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data as unknown as CRMLead[];
  }, [broker?.id, role]);

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (data: CreateCampaignData) => {
      if (!broker?.id) throw new Error("Corretor não encontrado. Associe um perfil de corretor para criar campanhas.");
      
      setIsCreating(true);
      
      // Build steps array (backward compat: if no steps, use single message)
      const steps = data.steps && data.steps.length > 0
        ? data.steps
        : [{
            messageContent: data.customMessage || "",
            delayMinutes: 0,
          }];

      // Validate steps have content
      for (const step of steps) {
        if (!step.messageContent.trim()) {
          throw new Error("Todas as etapas devem ter uma mensagem");
        }
      }
      
      // Fetch leads for the campaign
      const leads = await fetchLeadsByStatus(data.targetStatus, data.projectId, data.origins, data.brokerFilterId);
      
      // Filter out excluded leads
      const includedLeads = data.excludedLeadIds && data.excludedLeadIds.length > 0
        ? leads.filter(l => !data.excludedLeadIds!.includes(l.id))
        : leads;

      if (includedLeads.length === 0) {
        throw new Error("Nenhum lead encontrado com os filtros selecionados");
      }
      
      // Check for opt-outs
      const phones = includedLeads.map(l => formatPhoneE164(l.whatsapp));
      const { data: optouts } = await supabase
        .from("whatsapp_optouts")
        .select("phone")
        .in("phone", phones);
      
      const optoutPhones = new Set(optouts?.map(o => o.phone) || []);
      const validLeads = includedLeads.filter(l => {
        const phone = formatPhoneE164(l.whatsapp);
        return isValidPhone(l.whatsapp) && !optoutPhones.has(phone);
      });
      
      if (validLeads.length === 0) {
        throw new Error("Nenhum lead válido após filtrar opt-outs e telefones inválidos");
      }

      // Deduplicate by phone - keep first lead per phone number
      const seenPhones = new Set<string>();
      const uniqueLeads = validLeads.filter(lead => {
        const phone = formatPhoneE164(lead.whatsapp);
        if (seenPhones.has(phone)) return false;
        seenPhones.add(phone);
        return true;
      });

      if (uniqueLeads.length < validLeads.length) {
        console.log(`Dedup: ${validLeads.length - uniqueLeads.length} leads duplicados removidos por telefone`);
      }
      
      // Create campaign
      const totalMessages = uniqueLeads.length * steps.length;
      const { data: campaign, error: campaignError } = await supabase
        .from("whatsapp_campaigns")
        .insert({
          broker_id: broker.id,
          name: data.name,
          template_id: steps[0].templateId || null,
          custom_message: steps.length === 1 ? steps[0].messageContent : null,
          target_status: data.targetStatus,
          project_id: data.projectId || null,
          status: "running" as CampaignStatus,
          total_leads: totalMessages,
        })
        .select()
        .single();
      
      if (campaignError) throw campaignError;

      // Insert campaign steps
      const stepsToInsert = steps.map((step, index) => ({
        campaign_id: campaign.id,
        step_order: index + 1,
        message_content: step.messageContent,
        delay_minutes: index === 0 ? 0 : step.delayMinutes,
        template_id: step.templateId || null,
        send_if_replied: index === 0 ? true : (step.sendIfReplied || false),
      }));

      const { error: stepsError } = await supabase
        .from("campaign_steps")
        .insert(stepsToInsert);

      if (stepsError) {
        console.error("Error inserting steps:", stepsError);
        // Don't fail the whole campaign for this
      }
      
      // Carrega janela comercial da instância do corretor
      const { data: instanceData } = await supabase
        .from("broker_whatsapp_instances")
        .select("working_hours_start, working_hours_end")
        .eq("broker_id", broker.id)
        .single();
      const whStart = instanceData?.working_hours_start || "09:00";
      const whEnd = instanceData?.working_hours_end || "21:00";

      // Schedule all messages for all steps
      const queueItems: Array<{
        broker_id: string;
        campaign_id: string;
        lead_id: string;
        phone: string;
        message: string;
        status: string;
        scheduled_at: string;
        step_number: number;
      }> = [];
      
      for (const lead of uniqueLeads) {
        // REGRA: effectiveStart = adjustToWorkingHours(now). Demais etapas = effectiveStart + delay cumulativo.
        const initialTime = new Date(Date.now() + getRandomInterval());
        const { adjusted: effectiveStart } = adjustToWorkingHours(initialTime, whStart, whEnd);

        for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
          const step = steps[stepIndex];

          const cumulativeDelayMs = stepIndex === 0 ? 0 : step.delayMinutes * 60 * 1000;
          const smallJitterMs = stepIndex === 0 ? 0 : Math.floor(Math.random() * 60) * 1000;
          const desiredTime = new Date(effectiveStart.getTime() + cumulativeDelayMs + smallJitterMs);
          const { adjusted: stepTime } = adjustToWorkingHours(desiredTime, whStart, whEnd);

          const personalizedMessage = replaceTemplateVariables(step.messageContent, {
            nome: lead.name.split(" ")[0],
            empreendimento: lead.project?.name || "",
            corretor_nome: broker.name.split(" ")[0],
          });
          
          queueItems.push({
            broker_id: broker.id,
            campaign_id: campaign.id,
            lead_id: lead.id,
            phone: formatPhoneE164(lead.whatsapp),
            message: personalizedMessage,
            status: "scheduled",
            scheduled_at: stepTime.toISOString(),
            step_number: stepIndex + 1,
          });
        }
      }
      
      // Insert queue items in batches of 500
      const BATCH_SIZE = 500;
      for (let i = 0; i < queueItems.length; i += BATCH_SIZE) {
        const batch = queueItems.slice(i, i + BATCH_SIZE);
        const { error: queueError } = await supabase
          .from("whatsapp_message_queue")
          .insert(batch);
        
        if (queueError) throw queueError;
      }
      
      return campaign;
    },
    onSuccess: () => {
      toast.success("Campanha criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["whatsapp-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-queue"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar campanha");
    },
    onSettled: () => {
      setIsCreating(false);
    },
  });

  // Pause campaign
  const pauseCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from("whatsapp_campaigns")
        .update({ status: "paused" as CampaignStatus })
        .eq("id", campaignId);
      
      if (error) throw error;
      
      // Pause pending messages
      await supabase
        .from("whatsapp_message_queue")
        .update({ status: "paused_by_system" })
        .eq("campaign_id", campaignId)
        .in("status", ["queued", "scheduled"]);
    },
    onSuccess: () => {
      toast.success("Campanha pausada");
      refetchCampaigns();
    },
  });

  // Resume campaign
  const resumeCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from("whatsapp_campaigns")
        .update({ status: "running" as CampaignStatus })
        .eq("id", campaignId);
      
      if (error) throw error;
      
      // Re-schedule paused messages
      const { data: pausedMessages } = await supabase
        .from("whatsapp_message_queue")
        .select("id")
        .eq("campaign_id", campaignId)
        .eq("status", "paused_by_system");
      
      if (pausedMessages && pausedMessages.length > 0) {
        let scheduledTime = new Date();
        for (const msg of pausedMessages) {
          const interval = getRandomInterval();
          scheduledTime = new Date(scheduledTime.getTime() + interval);
          
          await supabase
            .from("whatsapp_message_queue")
            .update({ 
              status: "scheduled",
              scheduled_at: scheduledTime.toISOString()
            })
            .eq("id", msg.id);
        }
      }
    },
    onSuccess: () => {
      toast.success("Campanha retomada");
      refetchCampaigns();
    },
  });

  // Cancel campaign
  const cancelCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from("whatsapp_campaigns")
        .update({ status: "cancelled" as CampaignStatus })
        .eq("id", campaignId);
      
      if (error) throw error;
      
      // Cancel pending messages
      await supabase
        .from("whatsapp_message_queue")
        .update({ status: "cancelled" })
        .eq("campaign_id", campaignId)
        .in("status", ["queued", "scheduled", "paused_by_system"]);
    },
    onSuccess: () => {
      toast.success("Campanha cancelada");
      refetchCampaigns();
    },
  });

  // Delete campaign
  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      await supabase
        .from("whatsapp_message_queue")
        .delete()
        .eq("campaign_id", campaignId);

      await supabase
        .from("campaign_steps")
        .delete()
        .eq("campaign_id", campaignId);

      const { error } = await supabase
        .from("whatsapp_campaigns")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Campanha excluída");
      queryClient.invalidateQueries({ queryKey: ["whatsapp-campaigns"] });
    },
    onError: () => {
      toast.error("Erro ao excluir campanha");
    },
  });

  return {
    broker,
    campaigns,
    isLoading: isLoadingCampaigns,
    isCreating,
    fetchLeadsByStatus,
    createCampaign: createCampaignMutation.mutateAsync,
    pauseCampaign: pauseCampaignMutation.mutateAsync,
    resumeCampaign: resumeCampaignMutation.mutateAsync,
    cancelCampaign: cancelCampaignMutation.mutateAsync,
    deleteCampaign: deleteCampaignMutation.mutateAsync,
  };
}
