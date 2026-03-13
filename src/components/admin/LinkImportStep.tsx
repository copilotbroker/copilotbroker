import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Link2, Sparkles, Loader2, Globe, ImageIcon, FileText, LayoutTemplate,
  CheckCircle, AlertTriangle, ArrowRight, ChevronLeft, X, GripVertical, Trash2, MapPin, Home,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export interface ScrapedData {
  title: string;
  description: string;
  images: string[];
  videos: string[];
  rawText: string;
  url: string;
  city?: string;
}

interface LinkImportStepProps {
  onImportSuccess: (data: ScrapedData) => void;
  onBack: () => void;
}

const PROGRESS_STEPS = [
  { label: "Lendo link...", icon: Globe, duration: 2500 },
  { label: "Extraindo informações...", icon: FileText, duration: 3000 },
  { label: "Organizando fotos...", icon: ImageIcon, duration: 2000 },
  { label: "Montando apresentação...", icon: LayoutTemplate, duration: 2500 },
];

export default function LinkImportStep({ onImportSuccess, onBack }: LinkImportStepProps) {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressStep, setProgressStep] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScrapedData | null>(null);

  // Editable state for review screen
  const [editableImages, setEditableImages] = useState<string[]>([]);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [propertyName, setPropertyName] = useState("");
  const [propertyCity, setPropertyCity] = useState("");

  const isValidUrl = (v: string) => {
    if (!v.trim()) return false;
    try {
      const formatted = v.startsWith("http") ? v : `https://${v}`;
      new URL(formatted);
      return true;
    } catch {
      return false;
    }
  };

  // Animated progress steps
  useEffect(() => {
    if (!isAnalyzing || progressStep < 0) return;
    if (progressStep >= PROGRESS_STEPS.length) return;

    const timer = setTimeout(() => {
      if (progressStep < PROGRESS_STEPS.length - 1) {
        setProgressStep(prev => prev + 1);
      }
    }, PROGRESS_STEPS[progressStep].duration);

    return () => clearTimeout(timer);
  }, [isAnalyzing, progressStep]);

  const handleAnalyze = async () => {
    if (!isValidUrl(url)) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setProgressStep(0);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("scrape-url", {
        body: { url: url.trim() },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const scraped = data as ScrapedData;
      setResult(scraped);
      setEditableImages(scraped.images || []);
      setPropertyName(scraped.title || "");
      setPropertyCity("");
      setFailedImages(new Set());
      setProgressStep(PROGRESS_STEPS.length);
    } catch (err: any) {
      console.error("Scrape error:", err);
      setError(err.message || "Não foi possível acessar este link. Tente outro ou crie manualmente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleContinue = () => {
    if (!result) return;
    if (!propertyName.trim()) return;
    // Pass modified data with filtered images and name
    onImportSuccess({
      ...result,
      images: editableImages.filter(img => !failedImages.has(img)),
      title: propertyName.trim(),
    });
  };

  const handleRetry = () => {
    setError(null);
    setResult(null);
    setProgressStep(-1);
    setEditableImages([]);
    setFailedImages(new Set());
  };

  const removeImage = (index: number) => {
    setEditableImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(editableImages);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setEditableImages(items);
  };

  const handleImageError = (imgUrl: string) => {
    setFailedImages(prev => new Set(prev).add(imgUrl));
  };

  const validImages = editableImages.filter(img => !failedImages.has(img));

  // --- Success state with review ---
  if (result) {
    const warnings: string[] = [];
    if (!propertyName.trim()) warnings.push("Nome do imóvel é obrigatório");
    if (validImages.length === 0) warnings.push("Nenhuma foto válida encontrada");
    if (!result.rawText || result.rawText.length < 50) warnings.push("Pouco conteúdo de texto extraído");

    const canContinue = propertyName.trim().length > 0;

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="text-center mb-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-green-500/10 flex items-center justify-center mb-3">
            <CheckCircle className="w-7 h-7 text-green-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Conteúdo extraído!</h2>
          <p className="text-sm text-slate-400 mt-1">Revise as informações, organize as fotos e continue.</p>
        </div>

        {/* Name and City fields */}
        <div className="bg-[#1a1a1e] border border-[#2a2a2e] rounded-xl p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-slate-300 flex items-center gap-2">
              <Home className="w-4 h-4" /> Nome do Imóvel *
            </Label>
            <Input
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              placeholder="Ex: Residencial Bela Vista"
              className="bg-[#1e1e22] border-[#2a2a2e] text-white placeholder:text-slate-600"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-slate-300 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Cidade *
            </Label>
            <Input
              value={propertyCity}
              onChange={(e) => setPropertyCity(e.target.value)}
              placeholder="Ex: Porto Alegre"
              className="bg-[#1e1e22] border-[#2a2a2e] text-white placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1e1e22] border border-[#2a2a2e] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#FFFF00]">{validImages.length}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Fotos</p>
          </div>
          <div className="bg-[#1e1e22] border border-[#2a2a2e] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#FFFF00]">{result.videos.length}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Vídeos</p>
          </div>
          <div className="bg-[#1e1e22] border border-[#2a2a2e] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#FFFF00]">{Math.round(result.rawText.length / 100)}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Blocos texto</p>
          </div>
        </div>

        {/* Photo gallery with drag-and-drop reorder + delete */}
        {editableImages.length > 0 && (
          <div className="bg-[#1a1a1e] border border-[#2a2a2e] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                Fotos ({validImages.length}) — arraste para reordenar
              </p>
              {failedImages.size > 0 && (
                <p className="text-[10px] text-amber-400">{failedImages.size} não carregaram</p>
              )}
            </div>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="images" direction="horizontal">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex flex-wrap gap-2"
                  >
                    {editableImages.map((img, i) => {
                      const isFailed = failedImages.has(img);
                      if (isFailed) return null;
                      return (
                        <Draggable key={`${img}-${i}`} draggableId={`${img}-${i}`} index={i}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                "relative group w-[calc(25%-6px)] sm:w-[calc(20%-6.4px)] aspect-square rounded-lg overflow-hidden bg-[#2a2a2e] transition-shadow",
                                snapshot.isDragging && "shadow-lg shadow-[#FFFF00]/20 z-50 ring-2 ring-[#FFFF00]/40"
                              )}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="absolute top-1 left-1 z-10 p-1 rounded bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
                              >
                                <GripVertical className="w-3 h-3 text-white" />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeImage(i)}
                                className="absolute top-1 right-1 z-10 p-1 rounded bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                              {i === 0 && (
                                <span className="absolute bottom-1 left-1 z-10 text-[9px] font-bold bg-[#FFFF00] text-black px-1.5 py-0.5 rounded">
                                  CAPA
                                </span>
                              )}
                              <img
                                src={img}
                                alt={`Foto ${i + 1}`}
                                className="w-full h-full object-cover"
                                onError={() => handleImageError(img)}
                              />
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300 mb-1">Atenção</p>
              <ul className="text-xs text-amber-200/70 space-y-0.5">
                {warnings.map((w, i) => <li key={i}>• {w}</li>)}
              </ul>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={handleRetry} className="border-[#2a2a2e] text-slate-400 hover:bg-[#2a2a2e] hover:text-white">
            <ChevronLeft className="w-4 h-4 mr-1" /> Tentar outro link
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!canContinue}
            className="flex-1 bg-[#FFFF00] text-black hover:brightness-110 font-medium disabled:opacity-50"
          >
            Continuar com IA <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-5 py-8">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center">
          <X className="w-7 h-7 text-red-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white mb-1">Não foi possível ler este link</h3>
          <p className="text-sm text-slate-400">{error}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onBack} className="border-[#2a2a2e] text-slate-400 hover:bg-[#2a2a2e] hover:text-white">
            Criar manualmente
          </Button>
          <Button onClick={handleRetry} className="bg-[#FFFF00] text-black hover:brightness-110">
            Tentar outro link
          </Button>
        </div>
      </div>
    );
  }

  // --- Analyzing state ---
  if (isAnalyzing) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="absolute inset-0 rounded-2xl bg-[#FFFF00]/10 animate-pulse" />
          <div className="absolute inset-2 rounded-xl bg-[#FFFF00]/5 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-[#FFFF00] animate-pulse" />
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {PROGRESS_STEPS.map((ps, i) => {
            const Icon = ps.icon;
            const isActive = i === progressStep;
            const isDone = i < progressStep;

            return (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500",
                  isActive && "bg-[#FFFF00]/5 border border-[#FFFF00]/20",
                  isDone && "opacity-50",
                  !isActive && !isDone && "opacity-20",
                )}
              >
                {isDone ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-[#FFFF00] animate-spin" />
                ) : (
                  <Icon className="w-5 h-5 text-slate-600" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  isActive ? "text-white" : isDone ? "text-slate-500" : "text-slate-600"
                )}>
                  {ps.label}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-slate-500">Isso pode levar alguns segundos...</p>
      </div>
    );
  }

  // --- Initial input state ---
  return (
    <div className="max-w-lg mx-auto space-y-6 py-4">
      <div className="text-center mb-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFFF00]/10 flex items-center justify-center mb-3">
          <Link2 className="w-7 h-7 text-[#FFFF00]" />
        </div>
        <h2 className="text-lg font-bold text-white">Cole o link do anúncio</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
          A IA vai capturar automaticamente fotos, dados e informações disponíveis na página para criar uma landing page de alta conversão.
        </p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.exemplo.com/imovel/..."
            className="pl-10 bg-[#1e1e22] border-[#2a2a2e] text-white placeholder:text-slate-600 h-12 text-sm"
            onKeyDown={(e) => { if (e.key === "Enter" && isValidUrl(url)) handleAnalyze(); }}
          />
        </div>
        <p className="text-[11px] text-slate-500 text-center">
          Funciona com sites de imobiliárias, portais de imóveis, OLX, Viva Real, ZAP e outros.
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="border-[#2a2a2e] text-slate-400 hover:bg-[#2a2a2e] hover:text-white">
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <Button
          onClick={handleAnalyze}
          disabled={!isValidUrl(url)}
          className="flex-1 bg-[#FFFF00] text-black hover:brightness-110 font-medium h-11"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Analisar com IA
        </Button>
      </div>
    </div>
  );
}
