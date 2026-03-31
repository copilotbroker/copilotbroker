import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Megaphone,
  Loader2,
  ChevronRight,
  Send,
  CheckCircle2,
  XCircle,
  Zap,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useWhatsAppCampaigns } from "@/hooks/use-whatsapp-campaigns";
import { useUserRole } from "@/hooks/use-user-role";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NewCampaignSheet } from "./NewCampaignSheet";
import { CampaignCard } from "./CampaignCard";
import { CampaignDetailSheet, type CampaignStepRow } from "./CampaignDetailSheet";
import { WhatsAppCampaign } from "@/types/whatsapp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ─── helpers ─── */
interface SectionDef {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  dotClass: string;
  defaultOpen: boolean;
}

const SECTIONS: SectionDef[] = [
  {
    key: "active",
    label: "Em andamento",
    icon: Zap,
    accentClass: "text-emerald-400",
    dotClass: "bg-emerald-400",
    defaultOpen: true,
  },
  {
    key: "completed",
    label: "Concluídas",
    icon: CheckCircle2,
    accentClass: "text-blue-400",
    dotClass: "bg-blue-400",
    defaultOpen: false,
  },
  {
    key: "cancelled",
    label: "Canceladas",
    icon: XCircle,
    accentClass: "text-red-400",
    dotClass: "bg-red-400",
    defaultOpen: false,
  },
];

export function CampaignsTab() {
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("");
  const [detailCampaign, setDetailCampaign] = useState<WhatsAppCampaign | null>(null);
  const [duplicateData, setDuplicateData] = useState<
    | {
        name: string;
        steps: Array<{
          messageContent: string;
          delayMinutes: number;
          sendIfReplied?: boolean;
        }>;
        targetStatus?: string[];
      }
    | undefined
  >(undefined);
  const { role } = useUserRole();

  const { data: brokersList = [] } = useQuery({
    queryKey: ["brokers-list-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brokers")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: role === "admin",
  });

  const { campaigns, isLoading, pauseCampaign, resumeCampaign, cancelCampaign } =
    useWhatsAppCampaigns(
      role === "admin"
        ? selectedBrokerId && selectedBrokerId !== "all"
          ? selectedBrokerId
          : undefined
        : undefined
    );

  /* ─── derived data ─── */
  const buckets = useMemo(() => {
    const active = campaigns.filter((c) =>
      ["draft", "scheduled", "running", "paused"].includes(c.status)
    );
    const completed = campaigns.filter((c) => c.status === "completed");
    const cancelled = campaigns.filter((c) => c.status === "cancelled");
    return { active, completed, cancelled } as Record<string, WhatsAppCampaign[]>;
  }, [campaigns]);

  const stats = useMemo(() => {
    const totalSent = campaigns.reduce((s, c) => s + c.sent_count, 0);
    const totalReplies = campaigns.reduce((s, c) => s + c.reply_count, 0);
    const totalFailed = campaigns.reduce((s, c) => s + c.failed_count, 0);
    return { totalSent, totalReplies, totalFailed, total: campaigns.length };
  }, [campaigns]);

  /* ─── handlers ─── */
  const handleDuplicate = (campaign: WhatsAppCampaign, steps: CampaignStepRow[]) => {
    setDetailCampaign(null);
    setDuplicateData({
      name: `Cópia de ${campaign.name}`,
      steps:
        steps.length > 0
          ? steps.map((s) => ({
              messageContent: s.message_content,
              delayMinutes: s.delay_minutes,
              sendIfReplied: s.send_if_replied,
            }))
          : campaign.custom_message
          ? [{ messageContent: campaign.custom_message, delayMinutes: 0 }]
          : [{ messageContent: "", delayMinutes: 0 }],
      targetStatus: campaign.target_status || undefined,
    });
    setIsNewCampaignOpen(true);
  };

  const handleDuplicateFromCard = async (campaign: WhatsAppCampaign) => {
    const { data: steps } = await supabase
      .from("campaign_steps")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("step_order");
    handleDuplicate(campaign, (steps as CampaignStepRow[]) || []);
  };

  /* ─── loading ─── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  /* ─── section renderer ─── */
  const renderSection = (section: SectionDef, list: WhatsAppCampaign[]) => (
    <Collapsible key={section.key} defaultOpen={section.defaultOpen}>
      <CollapsibleTrigger className="flex items-center gap-3 w-full group py-3 px-4 rounded-xl bg-[#111114] hover:bg-[#161619] border border-[#1e1e22] transition-all">
        <ChevronRight className="w-4 h-4 text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-90" />
        <div className={cn("w-2 h-2 rounded-full", section.dotClass)} />
        <span className="text-sm font-medium text-slate-200">{section.label}</span>
        <Badge
          variant="secondary"
          className={cn(
            "ml-auto text-[10px] px-2 py-0 h-5 font-semibold",
            list.length > 0
              ? "bg-[#1e1e22] text-slate-300"
              : "bg-[#1e1e22]/50 text-slate-600"
          )}
        >
          {list.length}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 pl-4 space-y-3">
        {list.length > 0 ? (
          list.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onPause={pauseCampaign}
              onResume={resumeCampaign}
              onCancel={cancelCampaign}
              onViewDetail={(c) => setDetailCampaign(c)}
              onDuplicate={(c) => handleDuplicateFromCard(c)}
            />
          ))
        ) : (
          <div className="flex items-center gap-2 py-4 px-3 rounded-lg border border-dashed border-[#2a2a2e]">
            <section.icon className={cn("w-4 h-4", section.accentClass, "opacity-40")} />
            <p className="text-xs text-slate-600">Nenhuma campanha {section.label.toLowerCase()}</p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );

  /* ─── render ─── */
  return (
    <div className="space-y-6">
      {/* ── Header Row ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground leading-tight">Campanhas</h2>
            <p className="text-xs text-muted-foreground">Disparos em lote para seus leads</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <Select value={selectedBrokerId} onValueChange={setSelectedBrokerId}>
              <SelectTrigger className="w-full sm:w-[180px] bg-[#111114] border-[#1e1e22] text-slate-300 h-9 text-xs">
                <SelectValue placeholder="Todos os corretores" />
              </SelectTrigger>
              <SelectContent className="bg-[#111114] border-[#1e1e22]">
                <SelectItem value="all">Todos os corretores</SelectItem>
                {brokersList.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-sm font-medium"
            onClick={() => setIsNewCampaignOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nova Campanha
          </Button>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Campanhas",
              value: stats.total,
              icon: BarChart3,
              accent: "text-slate-300",
            },
            {
              label: "Enviadas",
              value: stats.totalSent,
              icon: Send,
              accent: "text-emerald-400",
            },
            {
              label: "Respostas",
              value: stats.totalReplies,
              icon: TrendingUp,
              accent: "text-blue-400",
            },
            {
              label: "Falhas",
              value: stats.totalFailed,
              icon: XCircle,
              accent: "text-red-400",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#111114] border border-[#1e1e22]"
            >
              <s.icon className={cn("w-4 h-4 shrink-0", s.accent)} />
              <div className="min-w-0">
                <p className={cn("text-lg font-bold leading-none", s.accent)}>{s.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      {campaigns.length === 0 ? (
        <Card className="bg-[#111114] border-[#1e1e22]">
          <CardContent className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Megaphone className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">
              Nenhuma campanha criada
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
              Crie sua primeira campanha para disparar mensagens automatizadas para seus leads.
            </p>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setIsNewCampaignOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Campanha
            </Button>

            {/* How it works */}
            <div className="grid gap-3 sm:grid-cols-3 mt-10 text-left">
              {[
                {
                  step: "1",
                  title: "Filtre os leads",
                  desc: "Escolha por status do Kanban, empreendimento ou origem.",
                },
                {
                  step: "2",
                  title: "Monte os steps",
                  desc: "Crie mensagens sequenciais com intervalos personalizados.",
                },
                {
                  step: "3",
                  title: "Dispare com segurança",
                  desc: "Intervalo automático de 1-4 min entre envios protege seu número.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="p-4 rounded-xl bg-[#0a0a0f] border border-[#1e1e22]"
                >
                  <div className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mb-2.5">
                    {item.step}
                  </div>
                  <p className="text-xs font-medium text-slate-200 mb-1">{item.title}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {SECTIONS.map((section) => renderSection(section, buckets[section.key] || []))}
        </div>
      )}

      {/* ── Sheets ── */}
      <CampaignDetailSheet
        open={!!detailCampaign}
        onOpenChange={(open) => {
          if (!open) setDetailCampaign(null);
        }}
        campaign={detailCampaign}
        onDuplicate={handleDuplicate}
      />

      <NewCampaignSheet
        open={isNewCampaignOpen}
        onOpenChange={(open) => {
          setIsNewCampaignOpen(open);
          if (!open) setDuplicateData(undefined);
        }}
        duplicateData={duplicateData}
      />
    </div>
  );
}
