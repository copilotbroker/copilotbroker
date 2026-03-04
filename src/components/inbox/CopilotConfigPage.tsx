import { useState, useEffect } from "react";
import {
  Bot, Save, Sparkles, MessageSquare, Target, Sliders, Shield, Building2,
  Pencil, Trash2, ChevronLeft, ChevronRight, Handshake, Rocket,
  Brain, Crown, Zap, GraduationCap, Gem,
  Calendar, FileText, Search, Trophy,
  Home, Building, Landmark, Store, HardHat
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
  { id: "popular", label: "Popular", icon: Home },
  { id: "medio", label: "Médio Padrão", icon: Building },
  { id: "alto", label: "Alto Padrão", icon: Landmark },
  { id: "lancamentos", label: "Lançamentos", icon: HardHat },
  { id: "comercial", label: "Comercial", icon: Store },
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

// ─── Hero / summary card (unchanged) ───
function CopilotAvatar({ name, isActive }: { name: string; isActive: boolean }) {
  return (
    <div className="relative">
      <div className={cn(
        "absolute -inset-1 rounded-full blur-md transition-opacity duration-1000",
        isActive ? "bg-primary/20 opacity-100 animate-pulse" : "opacity-0"
      )} />
      <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-card to-background border border-primary/30 flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.08)]">
        <div className="relative">
          <div className="flex gap-3 mb-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
            <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
          </div>
          <div className="w-6 h-3 mx-auto border-b-2 border-primary/60 rounded-b-full" />
        </div>
      </div>
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className={cn(
          "w-2.5 h-2.5 rounded-full border border-primary/40",
          isActive ? "bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]" : "bg-muted"
        )} />
        <div className="w-px h-2 bg-primary/30" />
      </div>
    </div>
  );
}

function CopilotSummary({ config, onEdit, onDelete }: { config: CopilotConfig; onEdit: () => void; onDelete: () => void }) {
  const personality = PERSONALITIES.find(p => p.id === config.personality);
  const propertyType = PROPERTY_TYPES.find(p => p.id === config.property_type);
  const modeLabel = config.copilot_mode === "autonomo" ? "🚀 Age como Corretor" : "🤝 Assistente do Corretor";

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4 space-y-5 pt-6">
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="relative px-6 pt-8 pb-6 flex flex-col items-center text-center">
          <CopilotAvatar name={config.name} isActive={config.is_active} />
          <h2 className="text-xl font-bold text-foreground mt-5 tracking-tight">{config.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            {config.is_active ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                Offline
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            {modeLabel} · {personality?.label} · {personality?.desc}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px rounded-xl overflow-hidden border border-border">
        <StatCell label="Persuasão" value={`${config.persuasion_level}%`} />
        <StatCell label="Objetividade" value={`${config.objectivity_level}%`} />
        <StatCell label="Autonomia" value={AUTONOMY_LABELS[config.max_autonomy]?.split(" ")[0] || "—"} />
      </div>

      <div className="space-y-px rounded-xl overflow-hidden border border-border">
        <DetailRow label="Modo de atuação" value={modeLabel} highlight />
        <DetailRow label="Prioridade comercial" value={PRIORITY_LABELS[config.commercial_priority] || config.commercial_priority} />
        <DetailRow label="Tipo de imóvel" value={propertyType?.label || config.property_type} />
        <DetailRow label="Gatilhos mentais" value={config.use_mental_triggers ? "Ativado" : "Desativado"} highlight={config.use_mental_triggers} />
        <DetailRow label="Emojis" value={config.allow_emojis ? "Ativado" : "Desativado"} highlight={config.allow_emojis} />
        <DetailRow label="Follow-up automático" value={config.followup_auto ? "Ativado" : "Desativado"} highlight={config.followup_auto} />
        <DetailRow label="Visita presencial" value={config.incentive_visit ? "Sim" : "Não"} highlight={config.incentive_visit} />
        {config.region && <DetailRow label="Região" value={config.region} />}
        {config.target_audience && <DetailRow label="Público-alvo" value={config.target_audience} />}
      </div>

      <div className="flex gap-3 pt-1">
        <Button onClick={onEdit} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold h-11 rounded-xl">
          <Pencil className="w-4 h-4 mr-2" />
          Editar Copiloto
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="h-11 w-11 rounded-xl border-border text-muted-foreground hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5 p-0">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Excluir Copiloto</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Tem certeza que deseja excluir o copiloto "{config.name}"? Essa ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-muted border-border text-foreground hover:bg-secondary">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700 text-foreground">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card px-3 py-3 text-center">
      <p className="text-base font-bold text-foreground tracking-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-xs font-medium", highlight ? "text-primary" : "text-foreground")}>{value}</span>
    </div>
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
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm text-foreground">Follow-up automático</Label>
            <p className="text-xs text-muted-foreground">Envia lembretes quando o lead esfria</p>
          </div>
          <Switch checked={form.followup_auto} onCheckedChange={(v) => update("followup_auto", v)} />
        </div>
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
  const [promptOpen, setPromptOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold text-foreground">Personalização Avançada</h2>
        <p className="text-xs text-muted-foreground mt-1">Opcional — ajuste fino para especialistas.</p>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Região de atuação</Label>
        <Input
          value={form.region || ""}
          onChange={(e) => update("region", e.target.value)}
          className="bg-background border-border text-foreground mt-1"
          placeholder="Ex: Grande Porto Alegre"
        />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Público-alvo</Label>
        <Input
          value={form.target_audience || ""}
          onChange={(e) => update("target_audience", e.target.value)}
          className="bg-background border-border text-foreground mt-1"
          placeholder="Ex: Jovens casais, investidores"
        />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Posicionamento de marca</Label>
        <Textarea
          value={form.brand_positioning || ""}
          onChange={(e) => update("brand_positioning", e.target.value)}
          className="bg-background border-border text-foreground min-h-[60px] mt-1"
          placeholder="Descreva o posicionamento da sua marca..."
        />
      </div>

      <Collapsible open={promptOpen} onOpenChange={setPromptOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="w-full border-border text-muted-foreground hover:text-foreground">
            <Pencil className="w-3.5 h-3.5 mr-2" />
            {promptOpen ? "Fechar prompt avançado" : "Editar prompt avançado"}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-2">
          <Textarea
            value={form.custom_system_prompt || ""}
            onChange={(e) => update("custom_system_prompt", e.target.value || null)}
            className="bg-background border-border text-foreground min-h-[200px] text-xs font-mono"
            placeholder={DEFAULT_SYSTEM_PROMPT}
          />
          <p className="text-[10px] text-muted-foreground">
            Variáveis: {"{personalidade}"}, {"{regra_emojis}"}, {"{nivel_persuasao}"}, {"{nome_corretor}"}, {"{contexto_lead}"}, {"{contexto_empreendimento}"}
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
        </CollapsibleContent>
      </Collapsible>

      <div className="flex items-center justify-between pt-2">
        <div>
          <Label className="text-sm text-foreground">Copiloto ativo</Label>
          <p className="text-xs text-muted-foreground">Ativar ou desativar o copiloto</p>
        </div>
        <Switch checked={form.is_active} onCheckedChange={(v) => update("is_active", v)} />
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
    const success = await saveConfig(form);
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
    return <CopilotSummary config={config} onEdit={() => setIsEditing(true)} onDelete={handleDelete} />;
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
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Salvando..." : isFirstTime ? "Criar Copiloto" : "Salvar Configurações"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
