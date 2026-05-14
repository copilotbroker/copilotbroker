import { useState, useEffect, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2, AlertTriangle, Zap, Plus, Trash2, GripVertical,
  ArrowLeft, ArrowRight, Megaphone, ClipboardList, Search,
  ChevronDown, ChevronUp, Filter, CheckSquare, Square, Tag,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/use-user-role";
import { useProjects } from "@/hooks/use-projects";
import { useCustomOrigins } from "@/hooks/use-custom-origins";
import { useWhatsAppCampaigns } from "@/hooks/use-whatsapp-campaigns";
import { useQuery } from "@tanstack/react-query";
import { STATUS_CONFIG, LEAD_ORIGINS, getOriginDisplayLabel } from "@/types/crm";
import type { LeadStatus, CRMLead } from "@/types/crm";
import { replaceTemplateVariables } from "@/types/whatsapp";
import { DelayIntervalPicker, formatDelayHuman } from "./DelayIntervalPicker";
import type { BrokerAutoCadenciaRule, AutoCadenciaStep, CadenceType, TriggerLeadSource } from "@/hooks/use-auto-cadencia-rules";

type WizardType = "automatic" | "manual" | "campaign";

interface AutoCadenciaRuleEditorProps {
  isOpen: boolean;
  onClose: () => void;
  editingRule: BrokerAutoCadenciaRule | null;
  createRule: (data: { name?: string; project_id: string | null; is_active: boolean; cadence_type?: CadenceType; trigger_lead_source?: TriggerLeadSource; steps: AutoCadenciaStep[] }) => Promise<any>;
  updateRule: (id: string, data: Partial<{ name: string; project_id: string | null; is_active: boolean; trigger_lead_source: TriggerLeadSource }>, steps?: AutoCadenciaStep[]) => Promise<any>;
  isSaving: boolean;
  rules: BrokerAutoCadenciaRule[];
  onCreated?: (ruleId: string) => void;
  onCampaignCreated?: () => void;
  initialWizardType?: WizardType;
}

interface Project { id: string; name: string; }

const ACTIVE_STATUSES: LeadStatus[] = ["new", "info_sent", "scheduling", "docs_received"];

export const DEFAULT_AUTO_CADENCIA_STEPS: AutoCadenciaStep[] = [
  { messageContent: "Olá {nome}, tudo bem? Aqui é {corretor_nome}, da Enove Imobiliária! Recebi agora seu cadastro para saber mais sobre o {empreendimento}, já quis te chamar para te explicar como funciona! Foi você mesmo que se cadastrou?", delayMinutes: 0, sendIfReplied: true },
  { messageContent: "Pode falar agora?", delayMinutes: 60, sendIfReplied: false },
  { messageContent: "Tentei ligar para você, mas não consegui contato, qual melhor horário para falarmos?", delayMinutes: 180, sendIfReplied: false },
  { messageContent: "Oi {nome}! Caso não esteja no momento certo, entenderei perfeitamente! Só acho que uma oportunidade dessas merece ser ouvida, caso queira fazer um bate papo sem compromisso, estarei aqui pra te ajudar.", delayMinutes: 1440, sendIfReplied: false },
  { messageContent: "Percebi que você não está podendo falar comigo agora, em virtude disso, vou finalizar esse atendimento, mas fique a vontade de me chamar quando quiser!", delayMinutes: 2880, sendIfReplied: false },
  { messageContent: "Ei! Não esqueci de ti! Lembrei de te chamar pois entrou uma condição que eu não poderia deixar de te mostrar, tem 20 minutos para uma video chamada? Prometo te apresentar algo que você nunca viu na vida!", delayMinutes: 7200, sendIfReplied: false },
  { messageContent: "Oi {nome}! Voltei porque surgiu uma condição que muda totalmente o cenário desse projeto. Não estou enviando para todos, pois recebemos pouquíssimas unidades com uma condição realmente diferenciada, você tem 10 minutos hoje para entender?", delayMinutes: 14400, sendIfReplied: false },
];

function replaceVarsPreview(text: string) {
  return text
    .replace(/{nome}/g, "João")
    .replace(/{corretor_nome}/g, "Corretor")
    .replace(/{empreendimento}/g, "Empreendimento");
}

export function AutoCadenciaRuleEditor({
  isOpen, onClose, editingRule, createRule, updateRule, isSaving, rules, onCreated, onCampaignCreated, initialWizardType,
}: AutoCadenciaRuleEditorProps) {
  const { brokerId, role } = useUserRole();
  const { projects: allProjects } = useProjects();
  const { data: customOrigins = [] } = useCustomOrigins();
  const { broker, createCampaign, isCreating, fetchLeadsByStatus } = useWhatsAppCampaigns();

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardType, setWizardType] = useState<WizardType>("manual");

  // Common fields
  const [ruleName, setRuleName] = useState("");
  const [steps, setSteps] = useState<AutoCadenciaStep[]>(DEFAULT_AUTO_CADENCIA_STEPS.map(s => ({ ...s })));
  const [loadingSteps, setLoadingSteps] = useState(false);

  // Auto fields
  const [brokerProjects, setBrokerProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectId, setProjectId] = useState<string>("all");
  const [triggerLeadSource, setTriggerLeadSource] = useState<TriggerLeadSource>("landing_page");

  // Campaign fields
  const [selectedStatuses, setSelectedStatuses] = useState<LeadStatus[]>([]);
  const [campaignProjectId, setCampaignProjectId] = useState<string>("");
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  const [brokerFilterId, setBrokerFilterId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [fetchedLeads, setFetchedLeads] = useState<CRMLead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [excludedLeadIds, setExcludedLeadIds] = useState<Set<string>>(new Set());

  // Fetch brokers for admin
  const { data: allBrokers = [] } = useQuery({
    queryKey: ["all-brokers-wizard"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brokers").select("id, name").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
    enabled: role === "admin" && isOpen,
  });

  const allOriginOptions = useMemo(() => {
    const predefined = LEAD_ORIGINS.filter(o => o.key !== "outro").map(o => ({ key: o.key, label: o.label }));
    const custom = customOrigins.map(o => ({ key: o, label: o }));
    return [...predefined, ...custom, { key: "__sem_origem__", label: "Sem origem" }];
  }, [customOrigins]);

  // Fetch broker projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!brokerId) return;
      setLoadingProjects(true);
      try {
        const { data } = await supabase
          .from("broker_projects")
          .select("project:projects(id, name)")
          .eq("broker_id", brokerId)
          .eq("is_active", true);
        if (data) setBrokerProjects(data.map((bp: any) => bp.project).filter(Boolean));
      } catch (err) {
        console.error("Error fetching projects:", err);
      } finally {
        setLoadingProjects(false);
      }
    };
    if (isOpen) fetchProjects();
  }, [isOpen, brokerId]);

  // Load editing rule
  useEffect(() => {
    if (editingRule) {
      setRuleName(editingRule.name || "");
      setProjectId(editingRule.project_id || "all");
      setWizardType(editingRule.cadence_type || "manual");
      setTriggerLeadSource(editingRule.trigger_lead_source || "landing_page");
      setWizardStep(2); // skip type selection when editing

      setLoadingSteps(true);
      (supabase.from("auto_cadencia_steps") as any)
        .select("*")
        .eq("rule_id", editingRule.id)
        .order("step_order", { ascending: true })
        .then(({ data }: any) => {
          if (data && data.length > 0) {
            setSteps(data.map((s: any) => ({
              messageContent: s.message_content,
              delayMinutes: s.delay_minutes,
              sendIfReplied: s.send_if_replied,
            })));
          } else {
            setSteps(DEFAULT_AUTO_CADENCIA_STEPS.map(s => ({ ...s })));
          }
          setLoadingSteps(false);
        });
    } else {
      setRuleName("");
      setProjectId("all");
      setWizardType("manual");
      setTriggerLeadSource("landing_page");
      setWizardStep(1);
      setSteps(DEFAULT_AUTO_CADENCIA_STEPS.map(s => ({ ...s })));
      setSelectedStatuses([]);
      setCampaignProjectId("");
      setSelectedOrigins([]);
      setBrokerFilterId("");
      setSearchQuery("");
      setFetchedLeads([]);
      setExcludedLeadIds(new Set());
      setFiltersOpen(true);
    }
  }, [editingRule, isOpen]);

  // Fetch leads for campaign when filters change
  useEffect(() => {
    if (wizardType !== "campaign" || wizardStep !== 2) return;
    const fetchLeads = async () => {
      if (selectedStatuses.length === 0) { setFetchedLeads([]); return; }
      setIsLoadingLeads(true);
      try {
        const leads = await fetchLeadsByStatus(
          selectedStatuses,
          campaignProjectId || undefined,
          selectedOrigins.length > 0 ? selectedOrigins : undefined,
          brokerFilterId || undefined
        );
        setFetchedLeads(leads);
        setExcludedLeadIds(new Set());
      } catch { setFetchedLeads([]); }
      setIsLoadingLeads(false);
    };
    fetchLeads();
  }, [selectedStatuses, campaignProjectId, selectedOrigins, brokerFilterId, wizardType, wizardStep, fetchLeadsByStatus]);

  const displayedLeads = useMemo(() => {
    if (!searchQuery.trim()) return fetchedLeads;
    const q = searchQuery.toLowerCase();
    return fetchedLeads.filter(l => l.name.toLowerCase().includes(q) || l.whatsapp.includes(q));
  }, [fetchedLeads, searchQuery]);

  const selectedCount = fetchedLeads.length - excludedLeadIds.size;
  const allLeadsSelected = fetchedLeads.length > 0 && excludedLeadIds.size === 0;

  const projectHasRule = useMemo(() => {
    if (editingRule) return false;
    if (wizardType !== "automatic") return false;
    // For WhatsApp/both sources, project_id is forced to null
    const target = (triggerLeadSource !== "landing_page") ? null : (projectId === "all" ? null : projectId);
    return rules.some(r =>
      r.project_id === target &&
      r.cadence_type === "automatic" &&
      (r.trigger_lead_source || "landing_page") === triggerLeadSource
    );
  }, [projectId, rules, editingRule, wizardType, triggerLeadSource]);

  // Step helpers
  const addStep = () => setSteps(prev => [...prev, { messageContent: "", delayMinutes: 1440, sendIfReplied: false }]);
  const removeStep = (index: number) => setSteps(prev => prev.filter((_, i) => i !== index));
  const updateStep = (index: number, updates: Partial<AutoCadenciaStep>) => {
    setSteps(prev => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const stepsValid = steps.length > 0 && steps.every(s => s.messageContent.trim().length > 0);
  const nameValid = ruleName.trim().length > 0;

  // Validate step 2
  const step2Valid = (() => {
    if (!nameValid) return false;
    if (wizardType === "automatic" && projectHasRule) return false;
    if (wizardType === "campaign" && (selectedStatuses.length === 0 || selectedCount === 0)) return false;
    return true;
  })();

  const totalSteps = wizardType === "automatic" ? 4 : 3;

  const handleSubmit = async () => {
    if (wizardType === "campaign") {
      // Use campaign creation
      const campaignSteps = steps.map(step => ({
        messageContent: step.messageContent,
        delayMinutes: step.delayMinutes,
        sendIfReplied: step.sendIfReplied || false,
      }));
      try {
        await createCampaign({
          name: ruleName.trim(),
          targetStatus: selectedStatuses,
          projectId: campaignProjectId || undefined,
          origins: selectedOrigins.length > 0 ? selectedOrigins : undefined,
          brokerFilterId: brokerFilterId || undefined,
          excludedLeadIds: excludedLeadIds.size > 0 ? Array.from(excludedLeadIds) : undefined,
          steps: campaignSteps,
        });
        onCampaignCreated?.();
        onClose();
      } catch { /* handled in hook */ }
      return;
    }

    // Cadence creation (auto/manual)
    const isNew = !editingRule;
    const isAuto = wizardType === "automatic";
    const forceNullProject = isAuto && triggerLeadSource !== "landing_page";
    const finalProjectId = wizardType === "manual"
      ? null
      : forceNullProject
        ? null
        : (projectId === "all" ? null : projectId);
    const data: any = {
      name: ruleName.trim(),
      project_id: finalProjectId,
      is_active: isNew ? false : true,
    };
    if (isAuto) data.trigger_lead_source = triggerLeadSource;

    let success;
    if (editingRule) {
      success = await updateRule(editingRule.id, data, steps);
    } else {
      success = await createRule({ ...data, cadence_type: wizardType as CadenceType, steps });
    }
    if (success) {
      onClose();
      if (isNew && wizardType === "automatic" && success?.id && onCreated) {
        onCreated(success.id);
      }
    }
  };

  const isLoading = loadingProjects || loadingSteps;
  const isBusy = isSaving || isCreating;

  // ─── Render helpers ───────────────────────────────────────────

  const renderStep1TypeSelector = () => (
    <div className="space-y-4 mt-4 px-6">
      <p className="text-sm text-slate-400">Escolha o tipo de follow-up que deseja criar:</p>
      <div className="space-y-3">
        {[
          { type: "automatic" as WizardType, icon: <Zap className="w-5 h-5 text-amber-400" />, emoji: "⚡", label: "Automática", desc: "Dispara automaticamente ao receber um lead no empreendimento." },
          { type: "manual" as WizardType, icon: <ClipboardList className="w-5 h-5 text-blue-400" />, emoji: "📋", label: "Manual", desc: "Salva como template. Você aplica no lead quando quiser." },
          { type: "campaign" as WizardType, icon: <Megaphone className="w-5 h-5 text-purple-400" />, emoji: "📣", label: "Campanha", desc: "Envio em massa para leads filtrados por status, empreendimento ou etiqueta." },
        ].map(({ type, icon, label, desc }) => (
          <button
            key={type}
            type="button"
            onClick={() => { setWizardType(type); setWizardStep(2); }}
            className={`w-full p-4 rounded-xl border text-left transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5 ${
              wizardType === type ? "border-emerald-500/50 bg-emerald-500/10" : "border-[#2a2a2e] bg-[#141417]"
            }`}
          >
            <div className="flex items-center gap-3">
              {icon}
              <div>
                <h3 className="text-sm font-semibold text-white">{label}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2Config = () => (
    <div className="space-y-5 mt-4 px-6">
      <div className="space-y-2">
        <Label className="text-slate-300">Nome *</Label>
        <Input
          value={ruleName}
          onChange={(e) => setRuleName(e.target.value)}
          placeholder={wizardType === "campaign" ? "Ex.: Follow-up Novos Leads" : "Ex.: Reengajamento, Pós-visita..."}
          className="bg-[#141417] border-[#2a2a2e] text-white"
        />
      </div>

      {wizardType === "automatic" && (
        <>
          <div className="space-y-2">
            <Label className="text-slate-300">Disparar para leads vindos de</Label>
            <RadioGroup
              value={triggerLeadSource}
              onValueChange={(v) => setTriggerLeadSource(v as TriggerLeadSource)}
              className="space-y-2"
            >
              {[
                { value: "landing_page", label: "Landing Page", desc: "Leads cadastrados pelas páginas de captura." },
                { value: "whatsapp", label: "WhatsApp", desc: "Apenas leads vindos do Plantão (WhatsApp Global)." },
                { value: "both", label: "WhatsApp e Landing Page", desc: "Dispara para leads de ambas as origens." },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    triggerLeadSource === opt.value
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "border-[#2a2a2e] bg-[#141417] hover:border-[#3a3a3e]"
                  }`}
                >
                  <RadioGroupItem value={opt.value} className="mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{opt.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          {triggerLeadSource === "landing_page" ? (
            <div className="space-y-2">
              <Label className="text-slate-300">Empreendimento</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="bg-[#141417] border-[#2a2a2e] text-white min-h-[44px]">
                  <SelectValue placeholder="Selecione o empreendimento" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e1e22] border-[#2a2a2e]">
                  <SelectItem value="all" className="text-white">🌐 Todos os empreendimentos</SelectItem>
                  {brokerProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-white">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {projectHasRule && <p className="text-xs text-red-400">Já existe uma cadência automática de Landing Page para este empreendimento</p>}
            </div>
          ) : (
            <Alert className="bg-[#141417] border-[#2a2a2e]">
              <AlertDescription className="text-xs text-slate-400">
                Leads vindos do WhatsApp não têm empreendimento identificado, então a cadência será aplicada para todos.
              </AlertDescription>
            </Alert>
          )}
          {projectHasRule && triggerLeadSource !== "landing_page" && (
            <p className="text-xs text-red-400">Já existe uma cadência automática de {triggerLeadSource === "whatsapp" ? "WhatsApp" : "WhatsApp+LP"} configurada</p>
          )}
        </>
      )}

      {wizardType === "campaign" && renderCampaignFilters()}
    </div>
  );

  const renderCampaignFilters = () => (
    <div className="space-y-4">
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full text-sm font-medium text-slate-300 hover:text-white transition-colors py-1">
            <span className="flex items-center gap-2"><Filter className="w-4 h-4" />Filtros de leads</span>
            {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-3">
          <div className="space-y-2">
            <Label className="text-xs text-slate-400">Status no Kanban</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {ACTIVE_STATUSES.map((status) => (
                <label key={status} className="flex items-center gap-2 p-2 rounded-md bg-[#1a1a1d] border border-[#2a2a2e] cursor-pointer hover:border-[#3a3a3e]">
                  <Checkbox checked={selectedStatuses.includes(status)} onCheckedChange={() => {
                    setSelectedStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
                  }} />
                  <span className="text-xs text-slate-200">{STATUS_CONFIG[status].label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">Empreendimento</Label>
            <Select value={campaignProjectId} onValueChange={setCampaignProjectId}>
              <SelectTrigger className="bg-[#1a1a1d] border-[#2a2a2e] text-white h-9 text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1d] border-[#2a2a2e]">
                <SelectItem value="all">Todos</SelectItem>
                {allProjects?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">Origem</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between bg-[#1a1a1d] border-[#2a2a2e] text-white h-9 text-sm hover:bg-[#2a2a2e]">
                  {selectedOrigins.length === 0 ? "Todas as origens" : `${selectedOrigins.length} selecionada(s)`}
                  <ChevronDown className="w-3.5 h-3.5 ml-2 text-slate-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2 bg-[#1e1e22] border-[#2a2a2e]" align="start">
                <ScrollArea className="h-[192px]">
                  <div className="space-y-0.5">
                    {allOriginOptions.map((origin) => (
                      <label key={origin.key} className="flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-[#2a2a2e]">
                        <Checkbox checked={selectedOrigins.includes(origin.key)} onCheckedChange={() => {
                          setSelectedOrigins(prev => prev.includes(origin.key) ? prev.filter(o => o !== origin.key) : [...prev, origin.key]);
                        }} />
                        <span className="text-xs text-slate-200">{origin.label}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          {role === "admin" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Corretor</Label>
              <Select value={brokerFilterId} onValueChange={setBrokerFilterId}>
                <SelectTrigger className="bg-[#1a1a1d] border-[#2a2a2e] text-white h-9 text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1d] border-[#2a2a2e]">
                  <SelectItem value="all">Todos</SelectItem>
                  {allBrokers.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Lead list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-slate-300 text-sm">Leads selecionados</Label>
          {isLoadingLeads && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar por nome ou telefone..." className="bg-[#1a1a1d] border-[#2a2a2e] text-white h-8 text-xs pl-8" />
        </div>
        {fetchedLeads.length > 0 && (
          <div className="flex items-center justify-between py-1.5 px-2 rounded-md bg-[#1a1a1d] border border-[#2a2a2e]">
            <button type="button" className="flex items-center gap-2 text-xs text-slate-300 hover:text-white" onClick={() => {
              if (allLeadsSelected) setExcludedLeadIds(new Set(fetchedLeads.map(l => l.id)));
              else setExcludedLeadIds(new Set());
            }}>
              {allLeadsSelected ? <CheckSquare className="w-3.5 h-3.5 text-primary" /> : <Square className="w-3.5 h-3.5" />}
              Selecionar todos
            </button>
            <span className="text-xs text-slate-400">{selectedCount} de {fetchedLeads.length}</span>
          </div>
        )}
        {fetchedLeads.length > 0 ? (
          <ScrollArea className="h-[180px] rounded-md border border-[#2a2a2e] bg-[#0f0f11]">
            <div className="p-1 space-y-0.5">
              {displayedLeads.map((lead) => {
                const isSelected = !excludedLeadIds.has(lead.id);
                return (
                  <label key={lead.id} className={`flex items-center gap-2 p-2 rounded cursor-pointer text-xs ${isSelected ? "bg-[#1a1a1d] hover:bg-[#222226]" : "bg-transparent hover:bg-[#1a1a1d] opacity-50"}`}>
                    <Checkbox checked={isSelected} onCheckedChange={() => {
                      setExcludedLeadIds(prev => { const next = new Set(prev); if (next.has(lead.id)) next.delete(lead.id); else next.add(lead.id); return next; });
                    }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 truncate font-medium">{lead.name}</p>
                      <p className="text-slate-500 text-[10px] truncate">
                        {lead.whatsapp}
                        {lead.project?.name && ` · ${lead.project.name}`}
                        {lead.lead_origin && ` · ${getOriginDisplayLabel(lead.lead_origin)}`}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">{STATUS_CONFIG[lead.status]?.label?.split(" ")[0]}</span>
                  </label>
                );
              })}
            </div>
          </ScrollArea>
        ) : selectedStatuses.length > 0 && !isLoadingLeads ? (
          <p className="text-xs text-slate-500 text-center py-4 bg-[#0f0f11] rounded-md border border-[#2a2a2e]">Nenhum lead encontrado</p>
        ) : !isLoadingLeads ? (
          <p className="text-xs text-slate-500 text-center py-4 bg-[#0f0f11] rounded-md border border-[#2a2a2e]">Selecione ao menos um status</p>
        ) : null}
      </div>
    </div>
  );

  const renderStep3Sequence = () => (
    <div className="space-y-3 mt-4 px-6">
      <Label className="text-slate-300">Etapas da Sequência</Label>
      {steps.map((step, index) => (
        <div key={index}>
          {index > 0 && (
            <div className="flex items-center gap-2 py-2 pl-4">
              <div className="w-0.5 h-4 bg-[#2a2a2e]" />
              <span className="text-xs text-slate-500">após {formatDelayHuman(step.delayMinutes)}</span>
            </div>
          )}
          <div className="rounded-lg border border-[#2a2a2e] bg-[#141417] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-300">Etapa {index + 1}</span>
                {index === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">Imediato</span>}
              </div>
              {steps.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:bg-red-500/10" onClick={() => removeStep(index)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            {index > 0 && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Enviar após</Label>
                  <DelayIntervalPicker
                    valueInMinutes={step.delayMinutes}
                    onChange={(v) => updateStep(index, { delayMinutes: v })}
                  />
                </div>
                <RadioGroup
                  value={step.sendIfReplied ? "true" : "false"}
                  onValueChange={(val) => updateStep(index, { sendIfReplied: val === "true" })}
                  className="space-y-1.5 py-1.5"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id={`wiz-send-${index}`} />
                    <Label className="text-xs text-slate-400 cursor-pointer font-normal" htmlFor={`wiz-send-${index}`}>Enviar mesmo que responda</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id={`wiz-stop-${index}`} />
                    <Label className="text-xs text-slate-400 cursor-pointer font-normal" htmlFor={`wiz-stop-${index}`}>Enviar somente se não responder</Label>
                  </div>
                </RadioGroup>
              </>
            )}

            <div className="space-y-1.5">
              <Textarea
                value={step.messageContent}
                onChange={(e) => updateStep(index, { messageContent: e.target.value })}
                placeholder="Digite sua mensagem... Use {nome}, {empreendimento}, {corretor_nome}"
                className="bg-[#0f0f11] border-[#2a2a2e] text-white min-h-[80px] text-sm"
              />
              <p className="text-xs text-slate-600">Variáveis: {"{nome}"}, {"{empreendimento}"}, {"{corretor_nome}"}</p>
            </div>

            {step.messageContent && (
              <div className="p-2.5 rounded bg-[#0f0f11] border border-[#2a2a2e]">
                <p className="text-xs text-slate-400 mb-1">Prévia:</p>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{replaceVarsPreview(step.messageContent)}</p>
              </div>
            )}
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" className="w-full border-dashed border-[#2a2a2e] text-slate-400 hover:text-white hover:border-primary/50" onClick={addStep}>
        <Plus className="w-4 h-4 mr-2" />Adicionar etapa
      </Button>
      <p className="text-xs text-slate-400 text-center">{steps.length} etapa{steps.length > 1 ? "s" : ""}</p>

      {wizardType === "automatic" && (
        <Alert className="bg-yellow-500/10 border-yellow-500/30">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <AlertDescription className="text-yellow-300 text-sm">
            Quando ativa, a cadência será disparada <strong>automaticamente</strong> ao receber um lead neste empreendimento.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const wizardTitle = editingRule
    ? "Editar Cadência"
    : wizardStep === 1
    ? "Nova Cadência de Follow-up"
    : wizardType === "campaign"
    ? "Nova Campanha"
    : wizardType === "automatic"
    ? "Cadência Automática"
    : "Cadência Manual";

  const wizardDesc = wizardStep === 1
    ? "Escolha o tipo de follow-up"
    : wizardStep === 2
    ? (wizardType === "campaign" ? "Configure os filtros de leads" : "Configure os dados básicos")
    : wizardStep === 3
    ? "Defina as etapas da sequência"
    : "";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="bg-[#1a1a1d] border-[#2a2a2e] w-full sm:max-w-lg flex flex-col h-full p-0">
        <div className="px-6 pt-6">
          <SheetHeader className="space-y-1">
            <SheetTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              {wizardTitle}
            </SheetTitle>
            <SheetDescription className="text-slate-400">{wizardDesc}</SheetDescription>
          </SheetHeader>

          {/* Progress indicator */}
          {wizardStep > 0 && (
            <div className="flex items-center gap-1.5 mt-4">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i + 1 <= wizardStep ? "bg-emerald-500" : "bg-[#2a2a2e]"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto pb-2">
              {wizardStep === 1 && renderStep1TypeSelector()}
              {wizardStep === 2 && renderStep2Config()}
              {wizardStep === 3 && renderStep3Sequence()}
            </div>

            {/* Navigation */}
            {wizardStep > 1 && (
              <div className="border-t border-[#2a2a2e] bg-[#1a1a1d] px-6 py-4 flex gap-3 mt-auto">
                <Button variant="outline" onClick={() => {
                  if (wizardStep === 2 && !editingRule) setWizardStep(1);
                  else if (wizardStep === 3) setWizardStep(2);
                  else onClose();
                }} disabled={isBusy} className="flex-1 border-[#2a2a2e] text-slate-300 hover:bg-[#2a2a2e] min-h-[44px] sm:min-h-0">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>

                {wizardStep === 2 && (
                  <Button onClick={() => setWizardStep(3)} disabled={!step2Valid}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 min-h-[44px] sm:min-h-0">
                    Próximo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}

                {wizardStep === 3 && (
                  <Button onClick={handleSubmit} disabled={isBusy || !stepsValid || !nameValid}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 min-h-[44px] sm:min-h-0">
                    {isBusy ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                    ) : editingRule ? "Salvar" : wizardType === "campaign" ? "Criar Campanha" : "Criar Cadência"}
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
