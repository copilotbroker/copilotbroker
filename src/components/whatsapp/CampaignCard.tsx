import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  XCircle,
  CheckCircle,
  Clock,
  Eye,
  Copy,
  Trash2,
  Send,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { WhatsAppCampaign, CampaignStatus } from "@/types/whatsapp";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CampaignCardProps {
  campaign: WhatsAppCampaign;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onViewDetail: (campaign: WhatsAppCampaign) => void;
  onDuplicate: (campaign: WhatsAppCampaign) => void;
  onDelete?: (id: string) => void;
}

const STATUS_CONFIG: Record<
  CampaignStatus,
  {
    label: string;
    dotClass: string;
    textClass: string;
    bgClass: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  draft: {
    label: "Rascunho",
    dotClass: "bg-slate-400",
    textClass: "text-slate-400",
    bgClass: "bg-slate-400/10",
    icon: Clock,
  },
  scheduled: {
    label: "Agendada",
    dotClass: "bg-blue-400",
    textClass: "text-blue-400",
    bgClass: "bg-blue-400/10",
    icon: Clock,
  },
  running: {
    label: "Enviando",
    dotClass: "bg-emerald-400 animate-pulse",
    textClass: "text-emerald-400",
    bgClass: "bg-emerald-400/10",
    icon: Play,
  },
  paused: {
    label: "Pausada",
    dotClass: "bg-yellow-400",
    textClass: "text-yellow-400",
    bgClass: "bg-yellow-400/10",
    icon: Pause,
  },
  completed: {
    label: "Concluída",
    dotClass: "bg-blue-400",
    textClass: "text-blue-400",
    bgClass: "bg-blue-400/10",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelada",
    dotClass: "bg-red-400",
    textClass: "text-red-400",
    bgClass: "bg-red-400/10",
    icon: XCircle,
  },
};

export function CampaignCard({
  campaign,
  onPause,
  onResume,
  onCancel,
  onViewDetail,
  onDuplicate,
  onDelete,
}: CampaignCardProps) {
  const rawStatus = campaign.status as CampaignStatus;

  const status: CampaignStatus =
    rawStatus === "running" &&
    campaign.sent_count >= campaign.total_leads &&
    campaign.total_leads > 0
      ? "completed"
      : rawStatus;

  const config = STATUS_CONFIG[status];

  const progress =
    campaign.total_leads > 0
      ? Math.round((campaign.sent_count / campaign.total_leads) * 100)
      : 0;

  const showProgress =
    status === "running" || status === "paused" || status === "completed";
  const canPause =
    rawStatus === "running" && campaign.sent_count < campaign.total_leads;
  const canResume = rawStatus === "paused";
  const canCancel =
    rawStatus === "running" ||
    rawStatus === "paused" ||
    rawStatus === "scheduled";

  return (
    <div
      className="group rounded-xl bg-[#111114] border border-[#1e1e22] hover:border-[#2a2a2e] transition-all overflow-hidden cursor-pointer"
      onClick={() => onViewDetail(campaign)}
    >
      <div className="p-4">
        {/* ── Row 1: Status + Name + Actions ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dotClass)} />
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider",
                  config.textClass
                )}
              >
                {config.label}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-100 truncate">
              {campaign.name}
            </h3>
            {(campaign.project || campaign.broker) && (
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {campaign.project?.name}
                {campaign.project && campaign.broker && " · "}
                {campaign.broker && campaign.broker.name}
              </p>
            )}
          </div>

          {/* Actions */}
          <div
            className="flex items-center gap-0.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-slate-500 hover:text-white hover:bg-[#1e1e22]"
              onClick={() => onDuplicate(campaign)}
              title="Duplicar"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
            {canPause && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-yellow-400/70 hover:text-yellow-400 hover:bg-yellow-400/10"
                onClick={() => onPause(campaign.id)}
                title="Pausar"
              >
                <Pause className="w-3.5 h-3.5" />
              </Button>
            )}
            {canResume && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-400/10"
                onClick={() => onResume(campaign.id)}
                title="Retomar"
              >
                <Play className="w-3.5 h-3.5" />
              </Button>
            )}
            {canCancel && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-red-400/70 hover:text-red-400 hover:bg-red-400/10"
                onClick={() => onCancel(campaign.id)}
                title="Cancelar"
              >
                <XCircle className="w-3.5 h-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-red-400/70 hover:text-red-400 hover:bg-red-400/10"
                onClick={() => {
                  if (
                    window.confirm(
                      "Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita."
                    )
                  ) {
                    onDelete(campaign.id);
                  }
                }}
                title="Excluir"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* ── Progress Bar ── */}
        {showProgress && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5">
              <span>
                {campaign.sent_count}/{campaign.total_leads} enviados
              </span>
              <span className={cn("font-semibold", config.textClass)}>
                {progress}%
              </span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        )}

        {/* ── Stats Row ── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-[#1e1e22]">
          <div className="flex items-center gap-1.5">
            <Send className="w-3 h-3 text-emerald-400/60" />
            <span className="text-xs text-slate-400">
              <span className="font-semibold text-slate-200">{campaign.sent_count}</span> env.
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3 text-blue-400/60" />
            <span className="text-xs text-slate-400">
              <span className="font-semibold text-slate-200">{campaign.reply_count}</span> resp.
            </span>
          </div>
          {campaign.failed_count > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-red-400/60" />
              <span className="text-xs text-red-400">
                <span className="font-semibold">{campaign.failed_count}</span>
              </span>
            </div>
          )}
          <span className="ml-auto text-[10px] text-slate-600">
            {formatDistanceToNow(
              new Date(campaign.started_at || campaign.created_at),
              { addSuffix: true, locale: ptBR }
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
