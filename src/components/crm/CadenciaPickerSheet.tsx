import { useMemo, useState } from "react";
import { Zap, Plus, Loader2, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AutoCadenciaRuleEditor, DEFAULT_AUTO_CADENCIA_STEPS } from "@/components/whatsapp/AutoCadenciaRuleEditor";
import { useAutoCadenciaRules, type AutoCadenciaStep, type BrokerAutoCadenciaRule } from "@/hooks/use-auto-cadencia-rules";

interface CadenciaPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCadencia: (payload: { name: string; steps: AutoCadenciaStep[]; sourceRuleId?: string }) => void;
}

export function CadenciaPickerSheet({ open, onOpenChange, onSelectCadencia }: CadenciaPickerSheetProps) {
  const { rules, isLoading, isSaving, createRule, updateRule, fetchRuleSteps, fetchRules } = useAutoCadenciaRules();
  const [editorOpen, setEditorOpen] = useState(false);

  const activeRules = useMemo(() => rules.filter((rule) => rule.is_active), [rules]);

  const handleSelectDefault = () => {
    onSelectCadencia({
      name: "Cadência 10D",
      steps: DEFAULT_AUTO_CADENCIA_STEPS.map((step) => ({ ...step })),
    });
    onOpenChange(false);
  };

  const handleSelectRule = async (rule: BrokerAutoCadenciaRule) => {
    const steps = await fetchRuleSteps(rule.id);
    if (!steps.length) return;
    onSelectCadencia({
      name: rule.name || rule.project?.name || "Cadência",
      steps,
      sourceRuleId: rule.id,
    });
    onOpenChange(false);
  };

  const handleCloseEditor = async () => {
    setEditorOpen(false);
    await fetchRules();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg bg-[#0f0f11] border-[#2a2a2e] flex flex-col h-full p-0">
          <div className="px-6 pt-6">
            <SheetHeader>
              <SheetTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                + Cadência
              </SheetTitle>
              <SheetDescription className="text-slate-400">
                Escolha uma cadência pronta ou crie uma nova para este lead.
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            <button
              type="button"
              onClick={handleSelectDefault}
              className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-left transition-colors hover:bg-emerald-500/15"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">Padrão</span>
                    <h3 className="text-sm font-semibold text-white">Cadência 10D</h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-300">Preset pré-configurado com 7 etapas.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-emerald-300" />
              </div>
            </button>

            <div className="pt-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Cadências salvas</p>
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : activeRules.length === 0 ? (
                <div className="rounded-xl border border-[#2a2a2e] bg-[#141417] p-4 text-sm text-slate-400">
                  Nenhuma cadência salva ativa.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeRules.map((rule) => (
                    <button
                      key={rule.id}
                      type="button"
                      onClick={() => handleSelectRule(rule)}
                      className="w-full rounded-xl border border-[#2a2a2e] bg-[#141417] p-4 text-left transition-colors hover:bg-[#1a1a1d]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-white">{rule.name || rule.project?.name || "Cadência"}</h3>
                          <p className="mt-1 text-xs text-slate-400">
                            {rule.steps_count || 0} etapa{rule.steps_count === 1 ? "" : "s"}
                            {rule.project?.name ? ` · ${rule.project.name}` : " · Todos os empreendimentos"}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-[#2a2a2e] bg-[#0f0f11] px-6 py-4 flex gap-3 mt-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-[#2a2a2e] text-slate-300">
              Cancelar
            </Button>
            <Button onClick={() => setEditorOpen(true)} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Criar nova
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AutoCadenciaRuleEditor
        isOpen={editorOpen}
        onClose={handleCloseEditor}
        editingRule={null}
        createRule={createRule}
        updateRule={updateRule}
        isSaving={isSaving}
        rules={rules}
      />
    </>
  );
}
