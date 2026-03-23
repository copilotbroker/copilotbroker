import { useState } from "react";
import { Zap, Plus, Pencil, Trash2, Loader2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAutoCadenciaRules, type BrokerAutoCadenciaRule } from "@/hooks/use-auto-cadencia-rules";
import { useWhatsAppCampaigns } from "@/hooks/use-whatsapp-campaigns";
import { AutoCadenciaRuleEditor } from "./AutoCadenciaRuleEditor";
import { CampaignCard } from "./CampaignCard";
import { CampaignDetailSheet, type CampaignStepRow } from "./CampaignDetailSheet";
import { WhatsAppCampaign } from "@/types/whatsapp";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function AutoCadenciaSection() {
  const { rules, isLoading, toggleRuleActive, deleteRule, createRule, updateRule, isSaving, fetchRules } = useAutoCadenciaRules();
  const { campaigns, isLoading: isLoadingCampaigns, pauseCampaign, resumeCampaign, cancelCampaign } = useWhatsAppCampaigns();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BrokerAutoCadenciaRule | null>(null);
  const [showAutoActivateDialog, setShowAutoActivateDialog] = useState(false);
  const [lastCreatedRuleId, setLastCreatedRuleId] = useState<string | null>(null);

  // Campaign detail
  const [detailCampaign, setDetailCampaign] = useState<WhatsAppCampaign | null>(null);

  const handleCreateNew = () => { setEditingRule(null); setIsEditorOpen(true); };
  const handleEdit = (rule: BrokerAutoCadenciaRule) => { setEditingRule(rule); setIsEditorOpen(true); };
  const handleCloseEditor = () => { setIsEditorOpen(false); setEditingRule(null); };

  const handleCreated = (ruleId: string) => {
    setLastCreatedRuleId(ruleId);
    setShowAutoActivateDialog(true);
  };

  const handleAutoActivate = () => {
    if (lastCreatedRuleId) toggleRuleActive(lastCreatedRuleId, true);
    setShowAutoActivateDialog(false);
    setLastCreatedRuleId(null);
  };

  const handleSkipActivate = () => {
    setShowAutoActivateDialog(false);
    setLastCreatedRuleId(null);
  };

  const handleDelete = async (ruleId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta cadência?")) {
      await deleteRule(ruleId);
    }
  };

  const handleCampaignDetail = async (campaign: WhatsAppCampaign) => {
    setDetailCampaign(campaign);
    const { data } = await supabase
      .from("campaign_steps")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("step_order", { ascending: true });
    setDetailSteps((data || []) as CampaignStepRow[]);
  };

  const loading = isLoading || isLoadingCampaigns;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const hasContent = rules.length > 0 || campaigns.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 shrink-0">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-white leading-tight">Cadências de Follow-up</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Configure sequências de follow-up para seus leads</p>
          </div>
        </div>
        <Button onClick={handleCreateNew} className="gap-2 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4" />
          Nova Cadência
        </Button>
      </div>

      {/* Empty state */}
      {!hasContent && (
        <div className="text-center py-8 bg-[#1a1a1d] rounded-xl border border-[#2a2a2e]">
          <Zap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-medium text-white mb-1">Nenhuma cadência configurada</h3>
          <p className="text-slate-400 text-sm mb-4 px-4">Crie uma cadência de follow-up para engajar seus leads</p>
          <Button onClick={handleCreateNew} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Criar Primeira Cadência
          </Button>
        </div>
      )}

      {/* Cadence rules list */}
      {rules.length > 0 && (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={cn(
                "p-3 sm:p-4 rounded-xl border transition-all cursor-pointer active:scale-[0.99]",
                rule.is_active ? "bg-[#1a1a1d] border-emerald-500/30" : "bg-[#141417] border-[#2a2a2e] opacity-60"
              )}
              onClick={() => handleEdit(rule)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide truncate max-w-[200px]",
                    rule.project_id ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-300"
                  )}>
                    {rule.name || rule.project?.name || "Cadência"}
                  </span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-medium",
                    rule.cadence_type === "automatic" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"
                  )}>
                    {rule.cadence_type === "automatic" ? "⚡ Auto" : "📋 Manual"}
                  </span>
                  {rule.cadence_type === "automatic" && (
                    rule.is_active ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Ativo
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 shrink-0">Inativo</span>
                    )
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {rule.cadence_type === "automatic" && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <Switch checked={rule.is_active} onCheckedChange={() => toggleRuleActive(rule.id, !rule.is_active)} className="data-[state=checked]:bg-emerald-500" />
                    </div>
                  )}
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(rule); }} className="text-slate-400 hover:text-white h-8 w-8 p-0">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(rule.id); }} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Excluir</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {rule.steps_count && rule.steps_count > 0 ? rule.steps_count : 7} etapas
                {rule.project?.name && ` · ${rule.project.name}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Campaigns list */}
      {campaigns.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mt-4 mb-1">
            <Megaphone className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Campanhas</span>
          </div>
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onPause={() => pauseCampaign(campaign.id)}
              onResume={() => resumeCampaign(campaign.id)}
              onCancel={() => cancelCampaign(campaign.id)}
              onDetail={() => handleCampaignDetail(campaign)}
            />
          ))}
        </div>
      )}

      {/* Editor */}
      <AutoCadenciaRuleEditor
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        editingRule={editingRule}
        createRule={createRule}
        updateRule={updateRule}
        isSaving={isSaving}
        rules={rules}
        onCreated={handleCreated}
        onCampaignCreated={fetchRules}
      />

      {/* Campaign Detail Sheet */}
      {detailCampaign && (
        <CampaignDetailSheet
          campaign={detailCampaign}
          steps={detailSteps}
          open={!!detailCampaign}
          onOpenChange={(open) => !open && setDetailCampaign(null)}
        />
      )}

      {/* Auto-activate dialog */}
      <AlertDialog open={showAutoActivateDialog} onOpenChange={setShowAutoActivateDialog}>
        <AlertDialogContent className="bg-[#1a1a1d] border-[#2a2a2e]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Ativar sequência automática?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Deseja que esta cadência de follow-up seja ativada automaticamente quando um novo lead for atribuído a você?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSkipActivate} className="border-[#2a2a2e] text-slate-300 hover:bg-[#2a2a2e]">Não, depois</AlertDialogCancel>
            <AlertDialogAction onClick={handleAutoActivate} className="bg-emerald-600 hover:bg-emerald-700">Sim, ativar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
