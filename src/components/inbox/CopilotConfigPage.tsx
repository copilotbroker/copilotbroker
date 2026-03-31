import { useState, useEffect } from "react";
import {
  Bot, Save, Sparkles, MessageSquare, Target, Sliders, Shield, Building2,
  Pencil, Trash2, ChevronLeft, ChevronRight, Handshake, Rocket,
  Brain, Crown, Zap, GraduationCap, Gem,
  Calendar, FileText, Search, Trophy,
  Home, Building, Landmark, Store, HardHat, Plane
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCopilotConfig, CopilotConfig } from "@/hooks/use-copilot";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CopilotConfigPageProps {
  brokerId: string;
}

const DEFAULT_SYSTEM_PROMPT = `Você é um Copiloto de vendas imobiliárias inteligente.
{personalidade}
{regra_emojis}
Nível de persuasão: {nivel_persuasao}/100.

REGRAS:
- Responda SEMPRE em português do Brasil
- Seja conciso (máximo 3 parágrafos)
- Foque em avançar o lead no funil de vendas
- Considere o contexto do lead e histórico de conversa
- Sugira próximos passos estratégicos
- Se o lead demonstrar objeção, trate com empatia e argumente com valor
- NUNCA invente dados sobre o empreendimento que não foram fornecidos

Seu Papel e Identidade
Você é um assistente imobiliário digital altamente capacitado e conversacional, atuando em conjunto com os corretores da Enove Imobiliária. Seu objetivo é interagir com potenciais clientes (leads), entender profundamente suas necessidades, criar conexão humana e avançar o atendimento pelas etapas do nosso funil (Kanban) de forma natural, sem nunca parecer um robô ou um vendedor insistente.

Seu Tom de Voz e Personalidade
- Humano e Empático: Aja como um consultor de confiança. Use uma linguagem natural, amigável e acolhedora. Evite jargões técnicos excessivos.
- Consultivo e Persuasivo: Sua persuasão não vem da pressão, mas da clareza. Você ajuda o cliente a descobrir o que ele realmente precisa fazendo as perguntas certas.
- Paciente: Respeite o tempo do cliente. Nunca force um agendamento de visita se o cliente ainda não estiver pronto.

Você deve guiar a conversa sutilmente, faça no máximo uma pergunta por mensagem para não parecer um interrogatório.

Tente sempre identificar se o cliente é da cidade do imóvel que ele pediu informações. Esta pergunta é importante para saber quanto enfoque damos sobre a localização.
Tente sempre identificar se a compra é para Investimento ou Moradia.

Seu Objetivo: Consultar objetivo da conversa de acordo com empreendimento. Alguns empreendimentos o objetivo é agendar uma visita no plantão da incorporadora, outras é agendar uma visita na imobiliária, outras é visita no imóvel, ou ainda, agendar uma visita com o especialista nesse produto (corretor).

Diretrizes Críticas (O que NÃO fazer)
- Não envie blocos de texto gigantes. Responda de forma concisa (máximo de 3 parágrafos curtos).
- Não invente características de imóveis que você não tem certeza. Se não souber, tente direcionar o atendimento para um bate papo com o corretor.
- Não peça documentos ou dados sensíveis (como renda exata) logo no início. Deixe isso para o corretor humano em uma etapa avançada.

{contexto_empreendimento}
{contexto_lead}`;

const PERSONALITIES = [
  { id: "consultivo", label: "Consultivo", desc: "Empático e estratégico", icon: Brain },
  { id: "formal", label: "Formal", desc: "Profissional e direto", icon: GraduationCap },
  { id: "agressivo", label: "Agressivo", desc: "Persuasivo e fechador", icon: Zap },
  { id: "tecnico", label: "Técnico", desc: "Informativo e preciso", icon: Search },
  { id: "premium", label: "Premium", desc: "Sofisticado e exclusivo", icon: Gem },
];

const PROPERTY_TYPES = [
  { id: "prontos", label: "Imóveis Prontos", icon: Home },
  { id: "lancamentos", label: "Lançamentos", icon: HardHat },
];

const PRIORITIES = [
  { id: "agendamento", label: "Agendamento", desc: "Agendar visitas", icon: Calendar },
  { id: "proposta", label: "Proposta", desc: "Enviar propostas", icon: FileText },
  { id: "qualificacao", label: "Qualificação", desc: "Qualificar leads", icon: Search },
  { id: "fechamento", label: "Fechamento", desc: "Fechar negócio", icon: Trophy },
];

const AUTONOMY_LABELS: Record<string, string> = {
  suggest_only: "Apenas sugerir",
  suggest_and_draft: "Sugerir e rascunhar",
  auto_respond: "Responder automaticamente",
};

const PRIORITY_LABELS: Record<string, string> = {
  agendamento: "Agendamento de visita",
  proposta: "Envio de proposta",
  qualificacao: "Qualificação do lead",
  fechamento: "Fechamento direto",
};

const STEP_LABELS = ["Modo", "Identidade", "Estilo", "Estratégia", "Avançado"];

// ─── Reusable selection card ───
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
          : "border-[#1e1e22] bg-[#111114] hover:border-primary/30 hover:bg-primary/5",
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




function CopilotSummary({ config, onEdit, onDelete, onRefresh }: { config: CopilotConfig; onEdit: () => void; onDelete: () => void; onRefresh: () => void }) {
  const personality = PERSONALITIES.find(p => p.id === config.personality);
  const propertyType = PROPERTY_TYPES.find(p => p.id === config.property_type);
  const modeLabel = config.copilot_mode === "autonomo" ? "Age como Corretor" : "Assistente do Corretor";
  const modeIcon = config.copilot_mode === "autonomo" ? Rocket : Handshake;
  const ModeIcon = modeIcon;
  const PersonalityIcon = personality?.icon || Brain;

  const toggleActive = async (v: boolean) => {
    const { error } = await supabase.from("copilot_configs").update({ is_active: v }).eq("id", config.id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    toast.success(v ? "Copiloto ativado! 🚀" : "Copiloto desativado");
    onRefresh();
  };

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4 space-y-4 pt-6">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">Copiloto IA</h2>
          <p className="text-xs text-muted-foreground">Configuração e status do assistente inteligente</p>
        </div>
      </div>

      {/* Hero card with avatar, name, and power switch */}
      <div className="relative overflow-hidden rounded-2xl bg-[#111114] border border-[#1e1e22]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-primary/[0.02] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="relative p-5">
          {/* Top: Avatar + Name + Switch */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className={cn(
                "absolute -inset-1 rounded-2xl blur-lg transition-opacity duration-700",
                config.is_active ? "bg-primary/15 opacity-100" : "opacity-0"
              )} />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                <Bot className={cn("w-7 h-7", config.is_active ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#111114]",
                config.is_active ? "bg-green-500 shadow-[0_0_8px_hsl(142_71%_45%/0.5)]" : "bg-muted-foreground"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground tracking-tight truncate">{config.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{personality?.label} · {personality?.desc}</p>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-1">
              <Switch checked={config.is_active} onCheckedChange={toggleActive} />
              <span className={cn("text-[10px] font-semibold uppercase tracking-wider",
                config.is_active ? "text-green-400" : "text-muted-foreground"
              )}>
                {config.is_active ? "Ativo" : "Off"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick capability cards — 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        <CapabilityCard
          icon={ModeIcon}
          label="Modo"
          value={modeLabel}
          active
        />
        <CapabilityCard
          icon={PersonalityIcon}
          label="Personalidade"
          value={personality?.label || "—"}
          active
        />
        <CapabilityCard
          icon={Target}
          label="Prioridade"
          value={PRIORITY_LABELS[config.commercial_priority]?.replace(" de ", "\nde ") || "—"}
          active
        />
        <CapabilityCard
          icon={propertyType?.icon || Building2}
          label="Imóvel"
          value={propertyType?.label || config.property_type}
          active
        />
      </div>

      {/* Performance dials */}
      <div className="rounded-2xl border border-[#1e1e22] bg-[#111114] p-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-3">Calibragem do Copiloto</p>
        <div className="space-y-3">
          <DialRow label="Persuasão" value={config.persuasion_level} />
          <DialRow label="Objetividade" value={config.objectivity_level} />
        </div>
        <div className="mt-3 pt-3 border-t border-[#1e1e22] flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Autonomia</span>
          <span className="text-xs font-semibold text-primary">{AUTONOMY_LABELS[config.max_autonomy] || "—"}</span>
        </div>
      </div>

      {/* Features toggles — compact pills */}
      <div className="rounded-2xl border border-[#1e1e22] bg-[#111114] p-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-3">Recursos Ativos</p>
        <div className="flex flex-wrap gap-2">
          <FeaturePill label="Gatilhos mentais" active={config.use_mental_triggers} />
          <FeaturePill label="Emojis" active={config.allow_emojis} />
          <FeaturePill label="Visita presencial" active={config.incentive_visit} />
          <FeaturePill label="Ligação" active={config.incentive_call} />
          <FeaturePill
            label={config.followup_enabled ? `Follow-up ${config.followup_max_attempts}x/${config.followup_period_days}d` : "Follow-up"}
            active={config.followup_enabled}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button onClick={onEdit} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold h-12 rounded-xl text-sm">
          <Pencil className="w-4 h-4 mr-2" />
          Editar Copiloto
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="h-12 w-12 rounded-xl border-[#1e1e22] bg-[#111114] text-muted-foreground hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5 p-0">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[#111114] border-[#1e1e22]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Excluir Copiloto</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Tem certeza que deseja excluir o copiloto "{config.name}"? Essa ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[#1e1e22] border-[#1e1e22] text-foreground hover:bg-[#2a2a2e]">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700 text-foreground">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function CapabilityCard({ icon: Icon, label, value, active }: { icon: React.ElementType; label: string; value: string; active?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-sm font-semibold text-foreground leading-tight">{value}</p>
    </div>
  );
}

function DialRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-bold text-foreground">{value}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function FeaturePill({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors",
      active
        ? "bg-primary/10 border-primary/20 text-primary"
        : "bg-muted/50 border-border text-muted-foreground"
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-primary" : "bg-muted-foreground/50")} />
      {label}
    </span>
  );
}




// ─── Wizard Steps ───

function StepMode({ form, update }: { form: Partial<CopilotConfig>; update: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold text-foreground">Como seu Copiloto deve atuar?</h2>
        <p className="text-xs text-muted-foreground mt-1">Você pode mudar isso a qualquer momento.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SelectionCard
          selected={form.copilot_mode !== "autonomo"}
          onClick={() => update("copilot_mode", "assistente")}
          icon={Handshake}
          title="Assistente do Corretor"
          description="Ele se apresenta como assistente do corretor. Ex: 'Oi, sou assistente do João e vou te ajudar!'"
        />
        <SelectionCard
          selected={form.copilot_mode === "autonomo"}
          onClick={() => update("copilot_mode", "autonomo")}
          icon={Rocket}
          title="Agir como o Corretor"
          description="Ele fala como se fosse você. O cliente não sabe que é uma IA. Ex: 'Oi, aqui é o João!'"
        />
      </div>
    </div>
  );
}

function StepIdentity({ form, update }: { form: Partial<CopilotConfig>; update: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold text-foreground">Identidade e Personalidade</h2>
        <p className="text-xs text-muted-foreground mt-1">Dê um nome e escolha o estilo do seu Copiloto.</p>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Nome do Copiloto</Label>
        <Input
          value={form.name || ""}
          onChange={(e) => update("name", e.target.value)}
          className="bg-background border-border text-foreground mt-1"
          placeholder="Ex: Max, Luna, Atlas..."
        />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Personalidade</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PERSONALITIES.map((p) => (
            <SelectionCard
              key={p.id}
              selected={form.personality === p.id}
              onClick={() => update("personality", p.id)}
              icon={p.icon}
              title={p.label}
              description={p.desc}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm text-foreground">Emojis</Label>
            <p className="text-xs text-muted-foreground">Humaniza as respostas com emojis</p>
          </div>
          <Switch checked={form.allow_emojis} onCheckedChange={(v) => update("allow_emojis", v)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm text-foreground">Gatilhos mentais</Label>
            <p className="text-xs text-muted-foreground">Escassez, urgência, prova social</p>
          </div>
          <Switch checked={form.use_mental_triggers} onCheckedChange={(v) => update("use_mental_triggers", v)} />
        </div>
      </div>
    </div>
  );
}

function StepStyle({ form, update }: { form: Partial<CopilotConfig>; update: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold text-foreground">Estilo de Comunicação</h2>
        <p className="text-xs text-muted-foreground mt-1">Ajuste como o Copiloto se comunica.</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Sutil</span>
          <Label className="text-sm text-foreground font-medium">Persuasão: {form.persuasion_level}%</Label>
          <span className="text-xs text-muted-foreground">Direto</span>
        </div>
        <Slider value={[form.persuasion_level || 50]} onValueChange={([v]) => update("persuasion_level", v)} max={100} step={5} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Detalhista</span>
          <Label className="text-sm text-foreground font-medium">Objetividade: {form.objectivity_level}%</Label>
          <span className="text-xs text-muted-foreground">Objetivo</span>
        </div>
        <Slider value={[form.objectivity_level || 50]} onValueChange={([v]) => update("objectivity_level", v)} max={100} step={5} />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Tipo de imóvel predominante</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PROPERTY_TYPES.map((pt) => (
            <SelectionCard
              key={pt.id}
              selected={form.property_type === pt.id}
              onClick={() => update("property_type", pt.id)}
              icon={pt.icon}
              title={pt.label}
              description=""
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepStrategy({ form, update }: { form: Partial<CopilotConfig>; update: (k: string, v: unknown) => void }) {
  const followupEnabled = form.followup_enabled ?? true;
  const maxAttempts = form.followup_max_attempts ?? 7;
  const periodDays = form.followup_period_days ?? 10;

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold text-foreground">Estratégia Comercial</h2>
        <p className="text-xs text-muted-foreground mt-1">Defina prioridades e automações.</p>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Prioridade comercial</Label>
        <div className="grid grid-cols-2 gap-2">
          {PRIORITIES.map((p) => (
            <SelectionCard
              key={p.id}
              selected={form.commercial_priority === p.id}
              onClick={() => update("commercial_priority", p.id)}
              icon={p.icon}
              title={p.label}
              description={p.desc}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm text-foreground">Incentivar visita</Label>
            <p className="text-xs text-muted-foreground">Sugere visitas presenciais</p>
          </div>
          <Switch checked={form.incentive_visit} onCheckedChange={(v) => update("incentive_visit", v)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm text-foreground">Incentivar chamada</Label>
            <p className="text-xs text-muted-foreground">Sugere ligações ou videochamadas</p>
          </div>
          <Switch checked={form.incentive_call} onCheckedChange={(v) => update("incentive_call", v)} />
        </div>
      </div>

      {/* Follow-up por inatividade — controle real */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm text-foreground font-semibold">Follow-up por inatividade</Label>
            <p className="text-xs text-muted-foreground">Reengaja leads que param de responder no Piloto Automático</p>
          </div>
          <Switch
            checked={followupEnabled}
            onCheckedChange={(v) => {
              update("followup_enabled", v);
              update("followup_auto", v); // keep legacy field in sync
            }}
          />
        </div>

        {followupEnabled && (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Tentativas</Label>
                <Input
                  type="number"
                  min={1}
                  max={15}
                  value={maxAttempts}
                  onChange={(e) => update("followup_max_attempts", Math.min(15, Math.max(1, Number(e.target.value) || 1)))}
                  className="bg-background border-border text-foreground mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Período (dias)</Label>
                <Input
                  type="number"
                  min={3}
                  max={30}
                  value={periodDays}
                  onChange={(e) => update("followup_period_days", Math.min(30, Math.max(3, Number(e.target.value) || 3)))}
                  className="bg-background border-border text-foreground mt-1"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              O Copiloto vai tentar reengajar leads que não respondem, enviando até{" "}
              <span className="text-foreground font-medium">{maxAttempts} mensagens</span> em{" "}
              <span className="text-foreground font-medium">{periodDays} dias</span> com intervalos crescentes.
              Funciona apenas com o Piloto Automático ativo na conversa.
            </p>
          </div>
        )}
      </div>

      {form.copilot_mode === "autonomo" && (
        <div>
          <Label className="text-xs text-muted-foreground">Nível de autonomia</Label>
          <Select value={form.max_autonomy} onValueChange={(v) => update("max_autonomy", v)}>
            <SelectTrigger className="bg-background border-border text-foreground mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="suggest_only">Apenas sugerir</SelectItem>
              <SelectItem value="suggest_and_draft">Sugerir e rascunhar</SelectItem>
              <SelectItem value="auto_respond">Responder automaticamente</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground mt-1">Define o quanto o Copiloto pode agir sozinho.</p>
        </div>
      )}
    </div>
  );
}

function StepAdvanced({ form, update }: { form: Partial<CopilotConfig>; update: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold text-foreground">Prompt do Copiloto</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Leia o prompt abaixo e ajuste de acordo com sua forma de trabalhar. Quanto mais personalizado, melhor o resultado!
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Prompt do sistema</Label>
        <Textarea
          value={form.custom_system_prompt || ""}
          onChange={(e) => update("custom_system_prompt", e.target.value || null)}
          className="bg-background border-border text-foreground min-h-[260px] text-xs font-mono"
          placeholder={DEFAULT_SYSTEM_PROMPT}
        />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          💡 Personalize o comportamento do seu Copiloto editando o prompt acima. Use as variáveis disponíveis para torná-lo dinâmico:{" "}
          <span className="text-foreground font-medium">{"{personalidade}"}</span>,{" "}
          <span className="text-foreground font-medium">{"{regra_emojis}"}</span>,{" "}
          <span className="text-foreground font-medium">{"{nivel_persuasao}"}</span>,{" "}
          <span className="text-foreground font-medium">{"{nome_corretor}"}</span>,{" "}
          <span className="text-foreground font-medium">{"{contexto_lead}"}</span>,{" "}
          <span className="text-foreground font-medium">{"{contexto_empreendimento}"}</span>
        </p>
        {form.custom_system_prompt && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => update("custom_system_prompt", null)}
            className="text-xs border-border text-muted-foreground"
          >
            Restaurar prompt padrão
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main ───
export function CopilotConfigPage({ brokerId }: CopilotConfigPageProps) {
  const { config, isLoading, saveConfig, fetchConfig } = useCopilotConfig(brokerId);
  const [isEditing, setIsEditing] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Partial<CopilotConfig>>({
    name: "Meu Copiloto",
    personality: "consultivo",
    persuasion_level: 50,
    objectivity_level: 50,
    use_mental_triggers: true,
    allow_emojis: true,
    language_style: "proximo",
    commercial_priority: "agendamento",
    commercial_focus: "presencial",
    incentive_visit: true,
    incentive_call: false,
    followup_auto: false,
    followup_enabled: true,
    followup_max_attempts: 7,
    followup_period_days: 10,
    followup_tone: "consultivo",
    auto_close_inactive: false,
    max_autonomy: "suggest_only",
    property_type: "lancamentos",
    region: "",
    target_audience: "",
    brand_positioning: "",
    custom_system_prompt: null,
    copilot_mode: "assistente",
    is_active: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  const update = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setIsSaving(true);
    // Ao clicar em "Decolar", ativa o copiloto automaticamente
    const success = await saveConfig({ ...form, is_active: true });
    setIsSaving(false);
    if (success) {
      setIsEditing(false);
      setStep(0);
    }
  };

  const handleDelete = async () => {
    if (!config?.id) return;
    try {
      const { error } = await supabase.from("copilot_configs").delete().eq("id", config.id);
      if (error) throw error;
      toast.success("Copiloto excluído com sucesso");
      await fetchConfig();
      setIsEditing(false);
      setStep(0);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir copiloto");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (config && !isEditing) {
    return <CopilotSummary config={config} onEdit={() => setIsEditing(true)} onDelete={handleDelete} onRefresh={fetchConfig} />;
  }

  const isFirstTime = !config;
  const totalSteps = STEP_LABELS.length;
  const progress = ((step + 1) / totalSteps) * 100;

  const stepContent = [
    <StepMode key="mode" form={form} update={update} />,
    <StepIdentity key="identity" form={form} update={update} />,
    <StepStyle key="style" form={form} update={update} />,
    <StepStrategy key="strategy" form={form} update={update} />,
    <StepAdvanced key="advanced" form={form} update={update} />,
  ];

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">
            {isFirstTime ? "Crie seu Copiloto" : "Editar Copiloto"}
          </h1>
          <p className="text-xs text-muted-foreground">Passo {step + 1} de {totalSteps}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          {STEP_LABELS.map((label, i) => (
            <button
              key={label}
              onClick={() => setStep(i)}
              className={cn(
                "text-[10px] font-medium transition-colors",
                i <= step ? "text-primary" : "text-muted-foreground/50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Step Content */}
      <div className="min-h-[340px]">
        {stepContent[step]}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur border-t border-border lg:static lg:bg-transparent lg:border-0 lg:p-0 lg:mt-6">
        <div className="flex gap-3">
          {step > 0 ? (
            <Button
              onClick={() => setStep(step - 1)}
              variant="outline"
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          ) : !isFirstTime ? (
            <Button
              onClick={() => { setIsEditing(false); setStep(0); }}
              variant="outline"
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Cancelar
            </Button>
          ) : null}

          {step < totalSteps - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/80 font-medium"
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/80 font-medium"
            >
              <Plane className="w-4 h-4 mr-2" />
              {isSaving ? "Decolando..." : "Decolar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
