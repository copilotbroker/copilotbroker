import { useState, useRef, useEffect } from "react";
import { useProjects } from "@/hooks/use-projects";
import { LandingContent, ProjectStatus, PROJECT_STATUS_CONFIG } from "@/types/project";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Sparkles, Send, RefreshCw, Check, Eye, MessageSquare, Loader2,
} from "lucide-react";
import DynamicLandingPage from "@/components/landing/DynamicLandingPage";

interface WizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, opens in edit mode (step 5 chat) */
  editProject?: { id: string; name: string; slug: string; city: string; city_slug: string; landing_content: LandingContent | null; webhook_url: string | null };
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

export default function ProjectWizard({ open, onOpenChange, editProject, onComplete }: WizardProps) {
  const { createProject, updateProject } = useProjects();
  const [step, setStep] = useState(editProject ? 5 : 1);
  const [data, setData] = useState<WizardData>(initialData);
  const [landingContent, setLandingContent] = useState<LandingContent | null>(editProject?.landing_content || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const [isSaving, setIsSaving] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Auto-generate on entering step 5
  useEffect(() => {
    if (step === 5 && !landingContent && !isGenerating) {
      generateLanding();
    }
  }, [step]);

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

      if (fnData?.error) {
        throw new Error(fnData.error);
      }

      const content = fnData.landing_content as LandingContent;
      setLandingContent(content);
      setChatMessages(prev => [
        ...prev,
        { role: "assistant", content: userMessage ? "✅ Alterações aplicadas! Confira o preview." : "✅ Landing page gerada! Confira o preview ao lado. Peça ajustes no chat ou clique em Publicar." },
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
    if (step === 1) return data.name && data.slug && data.city && data.city_slug;
    return true;
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Dados Básicos</h3>
            <div className="space-y-2">
              <Label>Nome do Empreendimento *</Label>
              <Input value={data.name} onChange={set("name")} placeholder="Residencial Alto da Serra" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade *</Label>
                <Input value={data.city} onChange={set("city")} placeholder="Portão" />
              </div>
              <div className="space-y-2">
                <Label>Slug Cidade (URL) *</Label>
                <Input value={data.city_slug} onChange={(e) => setData(p => ({ ...p, city_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} placeholder="portao" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Slug Projeto (URL) *</Label>
                <Input value={data.slug} onChange={(e) => setData(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} placeholder="alto-da-serra" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={data.status} onValueChange={(v: ProjectStatus) => setData(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROJECT_STATUS_CONFIG).map(([k, c]) => (
                      <SelectItem key={k} value={k}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">URL: /{data.city_slug || "cidade"}/{data.slug || "projeto"}</p>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Sobre o Empreendimento</h3>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={data.description} onChange={set("description")} rows={3} placeholder="Descreva o empreendimento em detalhes..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Empreendimento</Label>
                <Select value={data.projectType} onValueChange={(v) => setData(p => ({ ...p, projectType: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loteamento">Loteamento</SelectItem>
                    <SelectItem value="condominio_lotes">Condomínio de Lotes</SelectItem>
                    <SelectItem value="apartamento">Apartamento</SelectItem>
                    <SelectItem value="casa">Casa</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Faixa de Preço</Label>
                <Input value={data.priceRange} onChange={set("priceRange")} placeholder="A partir de R$ 250.000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Localização / Endereço</Label>
              <Input value={data.location} onChange={set("location")} placeholder="Rua das Flores, 123 - Bairro Nobre" />
            </div>
            <div className="space-y-2">
              <Label>Diferenciais</Label>
              <Textarea value={data.differentials} onChange={set("differentials")} rows={2} placeholder="Piscina, academia, churrasqueira, segurança 24h..." />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Público e Posicionamento</h3>
            <div className="space-y-2">
              <Label>Público-alvo</Label>
              <Select value={data.targetAudience} onValueChange={(v) => setData(p => ({ ...p, targetAudience: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="investidores">Investidores</SelectItem>
                  <SelectItem value="familias">Famílias</SelectItem>
                  <SelectItem value="jovens_casais">Jovens Casais</SelectItem>
                  <SelectItem value="alto_padrao">Alto Padrão</SelectItem>
                  <SelectItem value="primeiro_imovel">Primeiro Imóvel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tom de Comunicação</Label>
              <Select value={data.tone} onValueChange={(v) => setData(p => ({ ...p, tone: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="luxo_exclusivo">Luxo & Exclusividade</SelectItem>
                  <SelectItem value="acessivel_familiar">Acessível & Familiar</SelectItem>
                  <SelectItem value="moderno_jovem">Moderno & Jovem</SelectItem>
                  <SelectItem value="natureza_tranquilidade">Natureza & Tranquilidade</SelectItem>
                  <SelectItem value="investimento_rentabilidade">Investimento & Rentabilidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Argumentos de Venda (3-5)</Label>
              <Textarea value={data.sellingPoints} onChange={set("sellingPoints")} rows={3} placeholder="1. Localização privilegiada&#10;2. Valorização garantida&#10;3. Infraestrutura completa" />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Configurações Adicionais</h3>
            <div className="space-y-2">
              <Label>Prompt do Agente IA (Copiloto)</Label>
              <Textarea
                value={data.ai_prompt} onChange={set("ai_prompt")} rows={5}
                placeholder="Descrição completa para o agente IA atender leads deste empreendimento..."
              />
              <p className="text-xs text-muted-foreground">Este prompt será usado pelo Copiloto e Piloto Automático.</p>
            </div>
            <div className="space-y-2">
              <Label>Webhook URL (opcional)</Label>
              <Input value={data.webhook_url} onChange={set("webhook_url")} placeholder="https://webhook.example.com/..." type="url" />
            </div>
          </div>
        );
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  const renderStep5 = () => {
    const previewProject = editProject
      ? { ...editProject, status: "pre_launch" as ProjectStatus, is_active: true, description: null, hero_title: null, hero_subtitle: null, features: null, ai_prompt: null, created_at: "", updated_at: "" }
      : { id: "preview", name: data.name, slug: data.slug, city: data.city, city_slug: data.city_slug, description: data.description || null, status: data.status, is_active: true, hero_title: null, hero_subtitle: null, features: null, webhook_url: data.webhook_url || null, ai_prompt: data.ai_prompt || null, landing_content: null, created_at: "", updated_at: "" };

    return (
      <div className="flex flex-col h-full">
        {/* Mobile tabs */}
        <div className="flex md:hidden border-b border-border mb-2">
          <button
            onClick={() => setMobileTab("chat")}
            className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${mobileTab === "chat" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          >
            <MessageSquare className="w-4 h-4" /> Chat
          </button>
          <button
            onClick={() => setMobileTab("preview")}
            className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${mobileTab === "preview" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          >
            <Eye className="w-4 h-4" /> Preview
          </button>
        </div>

        <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">
          {/* Chat side */}
          <div className={`flex flex-col w-full md:w-[380px] md:flex-shrink-0 ${mobileTab !== "chat" ? "hidden md:flex" : "flex"}`}>
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-muted/30 rounded-lg mb-3">
              {chatMessages.length === 0 && !isGenerating && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  A IA está gerando sua landing page...
                </p>
              )}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-sm p-3 rounded-lg max-w-[90%] ${
                    msg.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : msg.role === "system"
                      ? "mx-auto bg-muted text-muted-foreground text-center text-xs"
                      : "mr-auto bg-card text-card-foreground border border-border"
                  }`}
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
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                placeholder="Peça alterações... ex: 'mude a cor para azul'"
                className="flex-1 resize-none text-sm"
                rows={2}
                disabled={isGenerating}
              />
              <div className="flex flex-col gap-1">
                <Button size="icon" onClick={handleChatSend} disabled={isGenerating || !chatInput.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => generateLanding()} disabled={isGenerating} title="Regenerar tudo">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Preview side */}
          <div className={`flex-1 overflow-y-auto rounded-lg border border-border bg-white ${mobileTab !== "preview" ? "hidden md:block" : "block"}`}>
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
      </div>
    );
  };

  const stepLabels = ["Dados", "Detalhes", "Público", "Config", "IA + Preview"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${step === 5 ? "max-w-[95vw] h-[90vh]" : "max-w-lg max-h-[90vh]"} flex flex-col overflow-hidden p-0`}>
        {/* Header with steps */}
        <div className="px-6 pt-5 pb-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground">
              {editProject ? "Editar Landing Page" : "Novo Empreendimento"}
            </h2>
            <span className="text-xs text-muted-foreground">{step}/5</span>
          </div>
          <div className="flex gap-1">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-colors ${
                    i + 1 <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
                <p className={`text-[10px] mt-1 text-center ${i + 1 <= step ? "text-primary" : "text-muted-foreground"}`}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className={`flex-1 overflow-y-auto px-6 py-4 ${step === 5 ? "overflow-hidden" : ""}`}>
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex-shrink-0 flex items-center justify-between">
          <div>
            {step > 1 && !editProject && (
              <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            {step < 5 ? (
              <Button size="sm" onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}>
                Próximo <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={!landingContent || isGenerating || isSaving}
                className="gap-1.5"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Publicar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
