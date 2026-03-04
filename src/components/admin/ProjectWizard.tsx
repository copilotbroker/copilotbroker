import { useState, useRef, useEffect } from "react";
import { useProjects } from "@/hooks/use-projects";
import { LandingContent, ProjectStatus, PROJECT_STATUS_CONFIG } from "@/types/project";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, Sparkles, Send, RefreshCw, Check, Eye, MessageSquare, Loader2,
  Building2, MapPin, Users, Target, Rocket, X,
  Home, HardHat, Store, Gem, Trees, Building, Briefcase, Heart,
} from "lucide-react";
import DynamicLandingPage from "@/components/landing/DynamicLandingPage";

interface WizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editProject?: {
    id: string; name: string; slug: string; city: string; city_slug: string;
    landing_content: LandingContent | null; webhook_url: string | null;
  };
  onComplete?: () => void;
}

interface WizardData {
  name: string;
  slug: string;
  city: string;
  city_slug: string;
  description: string;
  status: ProjectStatus;
  projectType: string;
  targetAudience: string;
  tone: string;
  sellingPoints: string;
  priceRange: string;
  differentials: string;
  location: string;
  webhook_url: string;
  ai_prompt: string;
}

const initialData: WizardData = {
  name: "", slug: "", city: "", city_slug: "", description: "", status: "pre_launch",
  projectType: "", targetAudience: "", tone: "", sellingPoints: "", priceRange: "",
  differentials: "", location: "", webhook_url: "", ai_prompt: "",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// ─── Reusable selection card (same pattern as Copilot wizard) ───
function SelectionCard({
  selected, onClick, icon: Icon, title, description, className,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ElementType;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl border text-left transition-all duration-200",
        selected
          ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.08)]"
          : "border-border bg-card hover:border-primary/30 hover:bg-primary/5",
        className,
      )}
    >
      {selected && (
        <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)]" />
      )}
      <Icon className={cn("w-5 h-5 mb-2", selected ? "text-primary" : "text-muted-foreground")} />
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
    </button>
  );
}

const STEP_LABELS = ["Dados", "Detalhes", "Público", "Config", "IA + Preview"];

const PROJECT_TYPES = [
  { id: "loteamento", label: "Loteamento", desc: "Terrenos divididos", icon: MapPin },
  { id: "condominio_lotes", label: "Condomínio de Lotes", desc: "Lotes com infraestrutura", icon: Trees },
  { id: "apartamento", label: "Apartamento", desc: "Unidades verticais", icon: Building },
  { id: "casa", label: "Casa", desc: "Casas prontas ou na planta", icon: Home },
  { id: "comercial", label: "Comercial", desc: "Salas e lojas", icon: Store },
];

const TARGET_AUDIENCES = [
  { id: "investidores", label: "Investidores", desc: "Foco em rentabilidade", icon: Briefcase },
  { id: "familias", label: "Famílias", desc: "Conforto e segurança", icon: Heart },
  { id: "jovens_casais", label: "Jovens Casais", desc: "Primeiro lar", icon: Home },
  { id: "alto_padrao", label: "Alto Padrão", desc: "Exclusividade e luxo", icon: Gem },
  { id: "primeiro_imovel", label: "Primeiro Imóvel", desc: "Acessibilidade", icon: Target },
];

const TONES = [
  { id: "luxo_exclusivo", label: "Luxo & Exclusividade", desc: "Sofisticado", icon: Gem },
  { id: "acessivel_familiar", label: "Acessível & Familiar", desc: "Acolhedor", icon: Heart },
  { id: "moderno_jovem", label: "Moderno & Jovem", desc: "Contemporâneo", icon: Sparkles },
  { id: "natureza_tranquilidade", label: "Natureza & Paz", desc: "Tranquilo", icon: Trees },
  { id: "investimento_rentabilidade", label: "Investimento", desc: "Rentabilidade", icon: Briefcase },
];

export default function ProjectWizard({ open, onOpenChange, editProject, onComplete }: WizardProps) {
  const { createProject, updateProject } = useProjects();
  const [step, setStep] = useState(editProject ? 4 : 0);
  const [data, setData] = useState<WizardData>(initialData);
  const [landingContent, setLandingContent] = useState<LandingContent | null>(editProject?.landing_content || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const [isSaving, setIsSaving] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const totalSteps = STEP_LABELS.length;
  const progress = ((step + 1) / totalSteps) * 100;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (step === 4 && !landingContent && !isGenerating) {
      generateLanding();
    }
  }, [step]);

  if (!open) return null;

  const set = (field: keyof WizardData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setData(prev => ({ ...prev, [field]: e.target.value }));

  const generateLanding = async (userMessage?: string) => {
    setIsGenerating(true);
    if (userMessage) {
      setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    } else {
      setChatMessages(prev => [...prev, { role: "system", content: "🪄 Gerando landing page com IA..." }]);
    }

    try {
      const { data: fnData, error } = await supabase.functions.invoke("generate-landing", {
        body: {
          projectData: {
            name: editProject?.name || data.name,
            city: editProject?.city || data.city,
            description: data.description,
            status: data.status,
            projectType: data.projectType,
            targetAudience: data.targetAudience,
            tone: data.tone,
            sellingPoints: data.sellingPoints,
            priceRange: data.priceRange,
            differentials: data.differentials,
            location: data.location,
          },
          currentContent: userMessage ? landingContent : undefined,
          userMessage: userMessage || undefined,
        },
      });

      if (error) throw error;
      if (fnData?.error) throw new Error(fnData.error);

      const content = fnData.landing_content as LandingContent;
      setLandingContent(content);
      setChatMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: userMessage
            ? "✅ Alterações aplicadas! Confira o preview."
            : "✅ Landing page gerada! Peça ajustes no chat ou clique em Publicar.",
        },
      ]);
      setMobileTab("preview");
    } catch (err: any) {
      console.error("generate-landing error:", err);
      setChatMessages(prev => [
        ...prev,
        { role: "assistant", content: `❌ Erro: ${err.message || "Falha ao gerar conteúdo."}` },
      ]);
      toast.error("Erro ao gerar landing page.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChatSend = () => {
    const msg = chatInput.trim();
    if (!msg || isGenerating) return;
    setChatInput("");
    generateLanding(msg);
  };

  const handlePublish = async () => {
    if (!landingContent) return;
    setIsSaving(true);

    try {
      if (editProject) {
        await updateProject(editProject.id, { landing_content: landingContent } as any);
        toast.success("Landing page atualizada!");
      } else {
        const projectPayload = {
          name: data.name.trim(),
          slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, ""),
          city: data.city.trim(),
          city_slug: data.city_slug.toLowerCase().replace(/[^a-z0-9-]/g, ""),
          description: data.description.trim() || null,
          status: data.status,
          webhook_url: data.webhook_url.trim() || null,
          ai_prompt: data.ai_prompt.trim() || null,
          landing_content: landingContent,
        };
        await createProject(projectPayload as any);
        toast.success("Empreendimento criado com landing page!");
      }
      onOpenChange(false);
      onComplete?.();
    } catch (err) {
      toast.error("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const canAdvance = () => {
    if (step === 0) return data.name && data.slug && data.city && data.city_slug;
    return true;
  };

  const previewProject = editProject
    ? { ...editProject, status: "pre_launch" as ProjectStatus, is_active: true, description: null, hero_title: null, hero_subtitle: null, features: null, ai_prompt: null, created_at: "", updated_at: "" }
    : { id: "preview", name: data.name, slug: data.slug, city: data.city, city_slug: data.city_slug, description: data.description || null, status: data.status, is_active: true, hero_title: null, hero_subtitle: null, features: null, webhook_url: data.webhook_url || null, ai_prompt: data.ai_prompt || null, landing_content: null, created_at: "", updated_at: "" };

  const stepContent = [
    // Step 0: Dados Básicos
    <div key="dados" className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold text-foreground">Dados Básicos do Empreendimento</h2>
        <p className="text-xs text-muted-foreground mt-1">Informações essenciais para criar o projeto.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Nome do Empreendimento *</Label>
        <Input value={data.name} onChange={set("name")} placeholder="Residencial Alto da Serra" className="bg-background border-border" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Cidade *</Label>
          <Input value={data.city} onChange={set("city")} placeholder="Portão" className="bg-background border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Slug Cidade (URL) *</Label>
          <Input value={data.city_slug} onChange={(e) => setData(p => ({ ...p, city_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} placeholder="portao" className="bg-background border-border" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Slug Projeto (URL) *</Label>
          <Input value={data.slug} onChange={(e) => setData(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} placeholder="alto-da-serra" className="bg-background border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={data.status} onValueChange={(v: ProjectStatus) => setData(p => ({ ...p, status: v }))}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PROJECT_STATUS_CONFIG).map(([k, c]) => (
                <SelectItem key={k} value={k}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        URL: <span className="font-mono text-primary">/{data.city_slug || "cidade"}/{data.slug || "projeto"}</span>
      </p>
    </div>,

    // Step 1: Detalhes
    <div key="detalhes" className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold text-foreground">Sobre o Empreendimento</h2>
        <p className="text-xs text-muted-foreground mt-1">Detalhes que a IA usará para criar a landing page.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Descrição</Label>
        <Textarea value={data.description} onChange={set("description")} rows={3} placeholder="Descreva o empreendimento em detalhes..." className="bg-background border-border" />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Tipo de Empreendimento</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PROJECT_TYPES.map((t) => (
            <SelectionCard
              key={t.id}
              selected={data.projectType === t.id}
              onClick={() => setData(p => ({ ...p, projectType: t.id }))}
              icon={t.icon}
              title={t.label}
              description={t.desc}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Faixa de Preço</Label>
          <Input value={data.priceRange} onChange={set("priceRange")} placeholder="A partir de R$ 250.000" className="bg-background border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Localização</Label>
          <Input value={data.location} onChange={set("location")} placeholder="Bairro Nobre, Portão" className="bg-background border-border" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Diferenciais</Label>
        <Textarea value={data.differentials} onChange={set("differentials")} rows={2} placeholder="Piscina, academia, churrasqueira, segurança 24h..." className="bg-background border-border" />
      </div>
    </div>,

    // Step 2: Público e Posicionamento
    <div key="publico" className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold text-foreground">Público e Posicionamento</h2>
        <p className="text-xs text-muted-foreground mt-1">Para quem é esse empreendimento e como comunicar.</p>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Público-alvo</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TARGET_AUDIENCES.map((a) => (
            <SelectionCard
              key={a.id}
              selected={data.targetAudience === a.id}
              onClick={() => setData(p => ({ ...p, targetAudience: a.id }))}
              icon={a.icon}
              title={a.label}
              description={a.desc}
            />
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Tom de Comunicação</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TONES.map((t) => (
            <SelectionCard
              key={t.id}
              selected={data.tone === t.id}
              onClick={() => setData(p => ({ ...p, tone: t.id }))}
              icon={t.icon}
              title={t.label}
              description={t.desc}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Argumentos de Venda (3-5)</Label>
        <Textarea value={data.sellingPoints} onChange={set("sellingPoints")} rows={3} placeholder="1. Localização privilegiada&#10;2. Valorização garantida&#10;3. Infraestrutura completa" className="bg-background border-border" />
      </div>
    </div>,

    // Step 3: Configurações
    <div key="config" className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold text-foreground">Configurações Adicionais</h2>
        <p className="text-xs text-muted-foreground mt-1">Prompt da IA e webhook (opcional).</p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Prompt do Agente IA (Copiloto)</Label>
        <Textarea
          value={data.ai_prompt} onChange={set("ai_prompt")} rows={6}
          placeholder="Descrição completa para o agente IA atender leads deste empreendimento..."
          className="bg-background border-border"
        />
        <p className="text-xs text-muted-foreground">Este prompt será usado pelo Copiloto e Piloto Automático.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Webhook URL (opcional)</Label>
        <Input value={data.webhook_url} onChange={set("webhook_url")} placeholder="https://webhook.example.com/..." type="url" className="bg-background border-border" />
      </div>
    </div>,

    // Step 4: IA + Preview (full-width)
    <div key="ia" className="flex flex-col h-full">
      {/* Mobile tabs */}
      <div className="flex md:hidden border-b border-border mb-3">
        <button
          onClick={() => setMobileTab("chat")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors",
            mobileTab === "chat" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
          )}
        >
          <MessageSquare className="w-4 h-4" /> Chat IA
        </button>
        <button
          onClick={() => setMobileTab("preview")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors",
            mobileTab === "preview" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
          )}
        >
          <Eye className="w-4 h-4" /> Preview
        </button>
      </div>

      <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">
        {/* Chat side */}
        <div className={cn("flex flex-col w-full md:w-[380px] md:flex-shrink-0", mobileTab !== "chat" ? "hidden md:flex" : "flex")}>
          <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-muted/30 rounded-xl mb-3">
            {chatMessages.length === 0 && !isGenerating && (
              <p className="text-sm text-muted-foreground text-center py-8">
                A IA está gerando sua landing page...
              </p>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "text-sm p-3 rounded-xl max-w-[90%]",
                  msg.role === "user" && "ml-auto bg-primary text-primary-foreground",
                  msg.role === "system" && "mx-auto bg-muted text-muted-foreground text-center text-xs",
                  msg.role === "assistant" && "mr-auto bg-card text-card-foreground border border-border",
                )}
              >
                {msg.content}
              </div>
            ))}
            {isGenerating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-2">
            <Textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
              placeholder="Peça alterações... ex: 'mude a cor para azul'"
              className="flex-1 resize-none text-sm bg-background border-border"
              rows={2}
              disabled={isGenerating}
            />
            <div className="flex flex-col gap-1">
              <Button size="icon" onClick={handleChatSend} disabled={isGenerating || !chatInput.trim()} className="bg-primary text-primary-foreground hover:bg-primary/80">
                <Send className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => generateLanding()} disabled={isGenerating} title="Regenerar tudo" className="border-border text-muted-foreground hover:bg-muted">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Preview side */}
        <div className={cn("flex-1 overflow-y-auto rounded-xl border border-border bg-white", mobileTab !== "preview" ? "hidden md:block" : "block")}>
          {landingContent ? (
            <div className="transform scale-[0.5] origin-top-left w-[200%]">
              <DynamicLandingPage project={previewProject as any} previewContent={landingContent} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando preview...
                </div>
              ) : (
                "O preview aparecerá aqui após a geração"
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">
                {editProject ? "Editar Landing Page" : "Novo Empreendimento"}
              </h1>
              <p className="text-xs text-muted-foreground">Passo {step + 1} de {totalSteps}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress bar with step labels */}
          <div>
            <div className="flex justify-between mb-2">
              {STEP_LABELS.map((label, i) => (
                <button
                  key={label}
                  onClick={() => { if (i <= step || editProject) setStep(i); }}
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    i <= step ? "text-primary" : "text-muted-foreground/50",
                    i <= step && "cursor-pointer",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        "flex-1 overflow-y-auto",
        step === 4 ? "p-3 sm:p-4" : "py-6",
      )}>
        <div className={cn(
          step === 4 ? "h-full" : "max-w-2xl mx-auto px-4",
        )}>
          <div className={cn(step === 4 ? "h-full" : "min-h-[340px]")}>
            {stepContent[step]}
          </div>
        </div>
      </div>

      {/* Bottom nav — fixed */}
      <div className="flex-shrink-0 border-t border-border bg-background/95 backdrop-blur p-3">
        <div className={cn(step === 4 ? "max-w-full px-2" : "max-w-2xl mx-auto", "flex gap-3")}>
          {step > 0 && !editProject ? (
            <Button
              onClick={() => setStep(step - 1)}
              variant="outline"
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          ) : (
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Cancelar
            </Button>
          )}

          {step < totalSteps - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance()}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/80 font-medium"
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handlePublish}
              disabled={!landingContent || isGenerating || isSaving}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/80 font-medium"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Publicando...</>
              ) : (
                <><Rocket className="w-4 h-4 mr-2" />Publicar Landing Page</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
