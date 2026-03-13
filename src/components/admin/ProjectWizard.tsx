import { useState, useRef, useEffect } from "react";
import { useProjects } from "@/hooks/use-projects";
import { LandingContent, ProjectStatus, PROJECT_STATUS_CONFIG, ProjectType } from "@/types/project";
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
  Building2, MapPin, Rocket, X, Upload, Image, Trash2, FileVideo, Home,
} from "lucide-react";
import DynamicLandingPage from "@/components/landing/DynamicLandingPage";

interface WizardProps {
  inline?: boolean;
  onBack?: () => void;
  editProject?: {
    id: string; name: string; slug: string; city: string; city_slug: string;
    landing_content: LandingContent | null; webhook_url: string | null;
  };
  onComplete?: () => void;
  /** Broker mode: simplified wizard for brokers creating their own projects */
  brokerMode?: boolean;
  brokerId?: string;
}

interface WizardData {
  name: string;
  slug: string;
  city: string;
  city_slug: string;
  description: string;
  status: ProjectStatus;
  location: string;
  webhook_url: string;
  ai_prompt: string;
  type: ProjectType;
}

const initialData: WizardData = {
  name: "", slug: "", city: "", city_slug: "", description: "", status: "pre_launch",
  location: "", webhook_url: "", ai_prompt: "", type: "empreendimento",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface MediaFile {
  name: string;
  url: string;
  type: "image" | "video";
  path: string;
}

const ADMIN_STEP_LABELS = ["Dados", "Conteúdo", "Config", "IA + Preview"];
const BROKER_STEP_LABELS = ["Dados", "Conteúdo", "IA + Preview"];

const DRAFT_KEY = "project-wizard-draft";

interface DraftState {
  data: WizardData;
  step: number;
  landingContent: LandingContent | null;
  chatMessages: ChatMessage[];
  mediaFiles: MediaFile[];
  savedAt: string;
}

export default function ProjectWizard({ inline, onBack, editProject, onComplete, brokerMode, brokerId }: WizardProps) {
  const { createProject, updateProject } = useProjects();
  const STEP_LABELS = brokerMode ? BROKER_STEP_LABELS : ADMIN_STEP_LABELS;
  const [step, setStep] = useState(editProject ? (brokerMode ? 2 : 3) : 0);
  const [data, setData] = useState<WizardData>(initialData);
  const [landingContent, setLandingContent] = useState<LandingContent | null>(editProject?.landing_content || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const [isSaving, setIsSaving] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const skipAutoSaveRef = useRef(false);

  // Restore draft on mount (only for new projects, not edits)
  useEffect(() => {
    if (editProject) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft: DraftState = JSON.parse(raw);
      if (draft.data?.name) {
        setHasDraft(true);
      }
    } catch { /* ignore corrupt data */ }
  }, [editProject]);

  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft: DraftState = JSON.parse(raw);
      setData(draft.data || initialData);
      setStep(draft.step || 0);
      setLandingContent(draft.landingContent || null);
      setChatMessages(draft.chatMessages || []);
      setMediaFiles(draft.mediaFiles || []);
      setHasDraft(false);
      toast.success("Rascunho restaurado!");
    } catch {
      toast.error("Erro ao restaurar rascunho.");
      localStorage.removeItem(DRAFT_KEY);
    }
  };

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  };

  // Auto-save draft (debounced)
  useEffect(() => {
    if (editProject || skipAutoSaveRef.current) return;
    // Only save if there's meaningful data
    if (!data.name && !data.city && !data.description && mediaFiles.length === 0) return;
    const timer = setTimeout(() => {
      const draft: DraftState = {
        data,
        step,
        landingContent,
        chatMessages: chatMessages.filter(m => m.role !== "system"),
        mediaFiles,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 1500);
    return () => clearTimeout(timer);
  }, [data, step, landingContent, chatMessages, mediaFiles, editProject]);

  const clearDraft = () => {
    skipAutoSaveRef.current = true;
    localStorage.removeItem(DRAFT_KEY);
  };

  const totalSteps = STEP_LABELS.length;
  const progress = ((step + 1) / totalSteps) * 100;
  const isLastStep = step === totalSteps - 1;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (isLastStep && !landingContent && !isGenerating) {
      generateLanding();
    }
  }, [step]);

  const toSlug = (text: string) =>
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const set = (field: keyof WizardData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setData(prev => {
      const next = { ...prev, [field]: val };
      if (field === "name") next.slug = toSlug(val);
      if (field === "city") next.city_slug = toSlug(val);
      return next;
    });
  };

  const [mediaTab, setMediaTab] = useState<"photos" | "videos">("photos");
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Convert image to WebP and resize to stay under 500kb
  const convertToWebp = (file: File, maxSizeKb = 500): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;

          // Scale down if image is very large
          const MAX_DIM = 1920;
          if (width > MAX_DIM || height > MAX_DIM) {
            const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas not supported"));
          ctx.drawImage(img, 0, 0, width, height);

          // Try decreasing quality until under maxSizeKb
          let quality = 0.85;
          const tryExport = () => {
            canvas.toBlob(
              (blob) => {
                if (!blob) return reject(new Error("Conversion failed"));
                if (blob.size > maxSizeKb * 1024 && quality > 0.3) {
                  quality -= 0.1;
                  // Also scale down dimensions further
                  if (quality <= 0.5 && width > 800) {
                    width = Math.round(width * 0.75);
                    height = Math.round(height * 0.75);
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                  }
                  tryExport();
                } else {
                  resolve(blob);
                }
              },
              "image/webp",
              quality
            );
          };
          tryExport();
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  // Photo upload with WebP conversion
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const newFiles: MediaFile[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`Formato não suportado: ${file.name}`);
        continue;
      }
      try {
        const webpBlob = await convertToWebp(file);
        const path = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
        const { error } = await supabase.storage.from("project-media").upload(path, webpBlob, {
          contentType: "image/webp",
          cacheControl: "3600",
        });
        if (error) { toast.error(`Erro ao enviar ${file.name}`); continue; }
        const { data: urlData } = supabase.storage.from("project-media").getPublicUrl(path);
        newFiles.push({ name: file.name.replace(/\.[^.]+$/, ".webp"), url: urlData.publicUrl, type: "image", path });
      } catch (err) {
        console.error("WebP conversion error:", err);
        toast.error(`Erro ao converter ${file.name}`);
      }
    }
    setMediaFiles(prev => [...prev, ...newFiles]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Video upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const newFiles: MediaFile[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("video/")) {
        toast.error(`Formato não suportado: ${file.name}`);
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`Vídeo muito grande (máx 50MB): ${file.name}`);
        continue;
      }
      const ext = file.name.split(".").pop() || "mp4";
      const path = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { error } = await supabase.storage.from("project-media").upload(path, file, {
        contentType: file.type,
        cacheControl: "3600",
      });
      if (error) { toast.error(`Erro ao enviar ${file.name}`); continue; }
      const { data: urlData } = supabase.storage.from("project-media").getPublicUrl(path);
      newFiles.push({ name: file.name, url: urlData.publicUrl, type: "video", path });
    }
    setMediaFiles(prev => [...prev, ...newFiles]);
    setIsUploading(false);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const removeMedia = async (index: number) => {
    const file = mediaFiles[index];
    await supabase.storage.from("project-media").remove([file.path]);
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

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
            location: data.location,
            mediaUrls: mediaFiles.map(f => f.url),
            type: data.type,
          },
          currentContent: userMessage ? landingContent : undefined,
          userMessage: userMessage || undefined,
          chatHistory: userMessage ? chatMessages.filter(m => m.role !== "system") : undefined,
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
      } else if (brokerMode && brokerId) {
        // Broker mode: insert directly with created_by_broker_id
        const projectPayload = {
          name: data.name.trim(),
          slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, ""),
          city: data.city.trim(),
          city_slug: data.city_slug.toLowerCase().replace(/[^a-z0-9-]/g, ""),
          description: data.description.trim() || null,
          status: data.status,
          type: data.type,
          created_by_broker_id: brokerId,
          landing_content: landingContent as any,
          is_active: true,
        };

        const { data: newProject, error: projError } = await supabase
          .from("projects")
          .insert(projectPayload)
          .select("id")
          .single();

        if (projError) throw projError;

        // Auto-link to broker_projects
        const { error: linkError } = await supabase
          .from("broker_projects")
          .insert({ broker_id: brokerId, project_id: newProject.id, is_active: true });

        if (linkError) console.error("Error linking project:", linkError);

        const typeLabel = data.type === "imovel" ? "Imóvel" : "Empreendimento";
        toast.success(`${typeLabel} criado com landing page!`);
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
      clearDraft();
      onComplete?.();
      onBack?.();
    } catch (err) {
      console.error("Publish error:", err);
      toast.error("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const canAdvance = () => {
    if (step === 0) return data.name && data.city;
    return true;
  };

  const previewProject = editProject
    ? { ...editProject, status: "pre_launch" as ProjectStatus, is_active: true, description: null, hero_title: null, hero_subtitle: null, features: null, ai_prompt: null, created_at: "", updated_at: "" }
    : { id: "preview", name: data.name, slug: data.slug, city: data.city, city_slug: data.city_slug, description: data.description || null, status: data.status, is_active: true, hero_title: null, hero_subtitle: null, features: null, webhook_url: data.webhook_url || null, ai_prompt: data.ai_prompt || null, landing_content: null, created_at: "", updated_at: "" };

  // ---- Step content builders ----
  const stepDados = (
    <div key="dados" className="space-y-5 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">
          {brokerMode ? "Dados do Imóvel / Empreendimento" : "Dados Básicos"}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {brokerMode ? "Escolha o tipo e preencha as informações." : "Informações essenciais do empreendimento."}
        </p>
      </div>

      {/* Type selector - broker mode */}
      {brokerMode && (
        <div className="space-y-2">
          <Label className="text-sm text-slate-300">Tipo *</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setData(p => ({ ...p, type: "empreendimento" }))}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                data.type === "empreendimento"
                  ? "border-[#FFFF00] bg-[#FFFF00]/5"
                  : "border-[#2a2a2e] bg-[#1e1e22] hover:border-[#3a3a3e]"
              )}
            >
              <Building2 className={cn("w-5 h-5", data.type === "empreendimento" ? "text-[#FFFF00]" : "text-slate-500")} />
              <div className="text-left">
                <p className={cn("text-sm font-medium", data.type === "empreendimento" ? "text-white" : "text-slate-300")}>Empreendimento</p>
                <p className="text-[10px] text-slate-500">Condomínio, loteamento</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setData(p => ({ ...p, type: "imovel" }))}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                data.type === "imovel"
                  ? "border-[#FFFF00] bg-[#FFFF00]/5"
                  : "border-[#2a2a2e] bg-[#1e1e22] hover:border-[#3a3a3e]"
              )}
            >
              <Home className={cn("w-5 h-5", data.type === "imovel" ? "text-[#FFFF00]" : "text-slate-500")} />
              <div className="text-left">
                <p className={cn("text-sm font-medium", data.type === "imovel" ? "text-white" : "text-slate-300")}>Imóvel</p>
                <p className="text-[10px] text-slate-500">Casa, apartamento, terreno</p>
              </div>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm text-slate-300">
          {data.type === "imovel" ? "Nome do Imóvel *" : "Nome do Empreendimento *"}
        </Label>
        <Input value={data.name} onChange={set("name")} placeholder={data.type === "imovel" ? "Casa Alto Padrão - Bairro Nobre" : "Residencial Alto da Serra"} className="bg-[#1e1e22] border-[#2a2a2e] text-white placeholder:text-slate-600" />
      </div>

      <div className={cn("grid gap-4", brokerMode ? "grid-cols-1" : "grid-cols-2")}>
        <div className="space-y-2">
          <Label className="text-sm text-slate-300">Cidade *</Label>
          <Input value={data.city} onChange={set("city")} placeholder="Portão" className="bg-[#1e1e22] border-[#2a2a2e] text-white placeholder:text-slate-600" />
        </div>
        {!brokerMode && (
          <div className="space-y-2">
            <Label className="text-sm text-slate-300">Status</Label>
            <Select value={data.status} onValueChange={(v: ProjectStatus) => setData(p => ({ ...p, status: v }))}>
              <SelectTrigger className="bg-[#1e1e22] border-[#2a2a2e] text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PROJECT_STATUS_CONFIG).map(([k, c]) => (
                  <SelectItem key={k} value={k}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 text-center">
        URL: <span className="font-mono text-[#FFFF00]">/{data.city_slug || "cidade"}/{data.slug || "projeto"}</span>
      </p>
    </div>
  );

  const stepConteudo = (
    <div key="conteudo" className="space-y-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Conteúdo da Landing Page</h2>
        <p className="text-sm text-slate-400 mt-1">
          {data.type === "imovel"
            ? "Cole aqui todas as informações do imóvel. A IA usará este conteúdo para criar a página."
            : "Cole aqui todas as informações do empreendimento. A IA usará este conteúdo para criar a página."
          }
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-slate-300">Localização / Endereço</Label>
        <Input value={data.location} onChange={set("location")} placeholder="Rua das Palmeiras, 500 — Bairro Nobre, Portão/RS" className="bg-[#1e1e22] border-[#2a2a2e] text-white placeholder:text-slate-600" />
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-slate-300">
          {data.type === "imovel" ? "Conteúdo Completo do Imóvel *" : "Conteúdo Completo do Empreendimento *"}
        </Label>
        <p className="text-xs text-slate-500">Inclua: descrição, diferenciais, infraestrutura, tipologias, faixa de preço, público-alvo, argumentos de venda, links de mapas interativos, vídeos do YouTube, e qualquer informação relevante.</p>
        <Textarea
          value={data.description}
          onChange={set("description")}
          rows={14}
          placeholder={data.type === "imovel" ? `Exemplo:

Casa com 3 dormitórios (1 suíte), 180m² de área construída em terreno de 400m².
Acabamento de alto padrão, piso porcelanato, churrasqueira gourmet.

Diferenciais:
- Energia solar instalada
- Piscina aquecida
- Garagem para 3 carros

Bairro: Nobre, próximo a escolas e comércio
Valor: R$ 850.000
Aceita financiamento bancário` : `Exemplo:

Condomínio de lotes fechado com 120 lotes a partir de 300m².
Infraestrutura completa: asfalto, fibra óptica, água, esgoto.

Diferenciais:
- Clube com piscina aquecida, academia e salão de festas
- Segurança 24h com portaria inteligente
- Área verde preservada de 5.000m²

Público-alvo: Famílias de classe média-alta
Faixa de preço: A partir de R$ 320.000`}
          className="bg-[#1e1e22] border-[#2a2a2e] text-white placeholder:text-slate-600 font-mono text-sm leading-relaxed"
        />
      </div>

      {/* Media Upload - Tabbed */}
      <div className="space-y-3">
        <Label className="text-sm text-slate-300">Mídias</Label>
        <div className="flex gap-1 p-1 rounded-lg bg-[#1a1a1e] border border-[#2a2a2e]">
          <button
            type="button"
            onClick={() => setMediaTab("photos")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
              mediaTab === "photos" ? "bg-[#2a2a2e] text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Image className="w-4 h-4" />
            Fotos {mediaFiles.filter(f => f.type === "image").length > 0 && (
              <span className="text-[10px] bg-[#FFFF00]/20 text-[#FFFF00] px-1.5 rounded-full">
                {mediaFiles.filter(f => f.type === "image").length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMediaTab("videos")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
              mediaTab === "videos" ? "bg-[#2a2a2e] text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <FileVideo className="w-4 h-4" />
            Vídeos {mediaFiles.filter(f => f.type === "video").length > 0 && (
              <span className="text-[10px] bg-[#FFFF00]/20 text-[#FFFF00] px-1.5 rounded-full">
                {mediaFiles.filter(f => f.type === "video").length}
              </span>
            )}
          </button>
        </div>

        {mediaTab === "photos" && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">Imagens são convertidas automaticamente para WebP e redimensionadas (máx 500kb).</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {mediaFiles.filter(f => f.type === "image").map((file) => {
                const origIdx = mediaFiles.indexOf(file);
                return (
                  <div key={origIdx} className="relative group rounded-xl overflow-hidden border border-[#2a2a2e] bg-[#1e1e22]">
                    <img src={file.url} alt={file.name} className="w-full h-28 object-cover" />
                    <button
                      onClick={() => removeMedia(origIdx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <p className="px-2 py-1.5 text-[10px] text-slate-400 truncate">{file.name}</p>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="h-28 rounded-xl border-2 border-dashed border-[#2a2a2e] hover:border-[#FFFF00]/40 bg-[#1a1a1e] flex flex-col items-center justify-center gap-2 transition-colors"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-slate-500" />
                    <span className="text-xs text-slate-500">Enviar fotos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {mediaTab === "videos" && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">Envie vídeos (máx 50MB) que serão exibidos na landing page.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {mediaFiles.filter(f => f.type === "video").map((file) => {
                const origIdx = mediaFiles.indexOf(file);
                return (
                  <div key={origIdx} className="relative group rounded-xl overflow-hidden border border-[#2a2a2e] bg-[#1e1e22]">
                    <video src={file.url} className="w-full h-28 object-cover" muted preload="metadata" />
                    <button
                      onClick={() => removeMedia(origIdx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <p className="px-2 py-1.5 text-[10px] text-slate-400 truncate">{file.name}</p>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={isUploading}
                className="h-28 rounded-xl border-2 border-dashed border-[#2a2a2e] hover:border-[#FFFF00]/40 bg-[#1a1a1e] flex flex-col items-center justify-center gap-2 transition-colors"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-slate-500" />
                    <span className="text-xs text-slate-500">Enviar vídeos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
        <input ref={videoInputRef} type="file" accept="video/*" multiple onChange={handleVideoUpload} className="hidden" />
      </div>
    </div>
  );

  const stepConfig = (
    <div key="config" className="space-y-5 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Configurações</h2>
        <p className="text-sm text-slate-400 mt-1">Prompt da IA e integrações.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-slate-300">Prompt do Agente IA (Copiloto)</Label>
        <Textarea
          value={data.ai_prompt} onChange={set("ai_prompt")} rows={6}
          placeholder="Descrição completa para o agente IA atender leads deste empreendimento..."
          className="bg-[#1e1e22] border-[#2a2a2e] text-white placeholder:text-slate-600"
        />
        <p className="text-xs text-slate-500">Este prompt será usado pelo Copiloto e Piloto Automático.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-slate-300">Webhook URL (opcional)</Label>
        <Input value={data.webhook_url} onChange={set("webhook_url")} placeholder="https://webhook.example.com/..." type="url" className="bg-[#1e1e22] border-[#2a2a2e] text-white placeholder:text-slate-600" />
      </div>
    </div>
  );

  const stepIA = (
    <div key="ia" className="flex flex-col h-full">
      {/* Mobile tabs */}
      <div className="flex md:hidden border-b border-[#2a2a2e] mb-3">
        <button
          onClick={() => setMobileTab("chat")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors",
            mobileTab === "chat" ? "border-[#FFFF00] text-[#FFFF00]" : "border-transparent text-slate-500"
          )}
        >
          <MessageSquare className="w-4 h-4" /> Chat IA
        </button>
        <button
          onClick={() => setMobileTab("preview")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors",
            mobileTab === "preview" ? "border-[#FFFF00] text-[#FFFF00]" : "border-transparent text-slate-500"
          )}
        >
          <Eye className="w-4 h-4" /> Preview
        </button>
      </div>

      <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">
        {/* Chat side */}
        <div className={cn("flex flex-col w-full md:w-[380px] md:flex-shrink-0", mobileTab !== "chat" ? "hidden md:flex" : "flex")}>
          <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-[#1a1a1e] rounded-xl mb-3">
            {chatMessages.length === 0 && !isGenerating && (
              <p className="text-sm text-slate-500 text-center py-8">
                A IA está gerando sua landing page...
              </p>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "text-sm p-3 rounded-xl max-w-[90%]",
                  msg.role === "user" && "ml-auto bg-[#FFFF00] text-black",
                  msg.role === "system" && "mx-auto bg-[#2a2a2e] text-slate-400 text-center text-xs",
                  msg.role === "assistant" && "mr-auto bg-[#1e1e22] text-slate-200 border border-[#2a2a2e]",
                )}
              >
                {msg.content}
              </div>
            ))}
            {isGenerating && (
              <div className="flex items-center gap-2 text-sm text-slate-400 p-3">
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
              placeholder="Peça alterações... ex: 'adicione um mapa interativo'"
              className="flex-1 resize-none text-sm bg-[#1e1e22] border-[#2a2a2e] text-white placeholder:text-slate-600"
              rows={2}
              disabled={isGenerating}
            />
            <div className="flex flex-col gap-1">
              <Button size="icon" onClick={handleChatSend} disabled={isGenerating || !chatInput.trim()} className="bg-[#FFFF00] text-black hover:brightness-110">
                <Send className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => generateLanding()} disabled={isGenerating} title="Regenerar tudo" className="border-[#2a2a2e] text-slate-400 hover:bg-[#2a2a2e]">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Preview side */}
        <div className={cn("flex-1 overflow-y-auto rounded-xl border border-[#2a2a2e] bg-white", mobileTab !== "preview" ? "hidden md:block" : "block")}>
          {landingContent ? (
            <div className="transform scale-[0.5] origin-top-left w-[200%]">
              <DynamicLandingPage project={previewProject as any} previewContent={landingContent} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
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

  // Build steps array based on mode
  const stepContent = brokerMode
    ? [stepDados, stepConteudo, stepIA]
    : [stepDados, stepConteudo, stepConfig, stepIA];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFFF00]/80 to-[#FFFF00] flex items-center justify-center">
            {data.type === "imovel" ? <Home className="w-5 h-5 text-black" /> : <Building2 className="w-5 h-5 text-black" />}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">
              {editProject ? "Editar Landing Page" : brokerMode ? (data.type === "imovel" ? "Novo Imóvel" : "Novo Empreendimento") : "Novo Empreendimento"}
            </h1>
            <p className="text-xs text-slate-500">Passo {step + 1} de {totalSteps}</p>
          </div>
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-400 hover:text-white hover:bg-[#2a2a2e]">
              <X className="w-5 h-5" />
            </Button>
          )}
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
                  i <= step ? "text-[#FFFF00]" : "text-slate-600",
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

      {/* Draft restore banner */}
      {hasDraft && !editProject && (
        <div className="flex-shrink-0 mb-4 p-3 rounded-xl border border-[#FFFF00]/30 bg-[#FFFF00]/5 flex items-center justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Rascunho encontrado</p>
            <p className="text-xs text-slate-400">Você tem um rascunho salvo. Deseja continuar de onde parou?</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={discardDraft} className="border-[#2a2a2e] text-slate-400 hover:bg-[#2a2a2e] text-xs">
              Descartar
            </Button>
            <Button size="sm" onClick={restoreDraft} className="bg-[#FFFF00] text-black hover:brightness-110 text-xs">
              Restaurar
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "flex-1 overflow-y-auto min-h-0",
        isLastStep ? "" : "pb-4",
      )}>
        <div className={cn(isLastStep ? "h-full" : "")}>
          <div className={cn(isLastStep ? "h-full" : "min-h-[340px]")}>
            {stepContent[step]}
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex-shrink-0 border-t border-[#2a2a2e] pt-4 mt-4">
        <div className="flex gap-3">
          {step > 0 && !editProject ? (
            <Button
              onClick={() => setStep(step - 1)}
              variant="outline"
              className="border-[#2a2a2e] text-slate-400 hover:bg-[#2a2a2e] hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          ) : (
            <Button
              onClick={onBack}
              variant="outline"
              className="border-[#2a2a2e] text-slate-400 hover:bg-[#2a2a2e] hover:text-white"
            >
              Cancelar
            </Button>
          )}

          {!isLastStep ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance()}
              className="flex-1 bg-[#FFFF00] text-black hover:brightness-110 font-medium"
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handlePublish}
              disabled={!landingContent || isGenerating || isSaving}
              className="flex-1 bg-[#FFFF00] text-black hover:brightness-110 font-medium"
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
