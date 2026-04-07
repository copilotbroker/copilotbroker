import { Info, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdReferralData {
  source?: string;
  campaign?: string;
  headline?: string;
  medium?: string;
  source_url?: string;
  source_id?: string;
  source_type?: string;
  thumbnail_url?: string;
}

interface AdReferralCardProps {
  referral: AdReferralData;
  timestamp: string;
}

export function AdReferralCard({ referral, timestamp }: AdReferralCardProps) {
  const hasContent = referral.source || referral.campaign || referral.headline || referral.medium || referral.source_url;
  if (!hasContent) return null;

  return (
    <div className="mx-auto my-3 max-w-md rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-semibold text-foreground">
          <Info className="h-4 w-4 text-amber-400" />
          Rastreamento
        </span>
        <span className="text-[11px] text-muted-foreground">
          {format(new Date(timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </span>
      </div>
      <div className="space-y-1.5 text-[13px]">
        {referral.source && (
          <p>
            <span className="font-semibold text-foreground">Origem:</span>{" "}
            <span className="text-foreground/80">{referral.source}</span>
          </p>
        )}
        {referral.campaign && (
          <p>
            <span className="font-semibold text-foreground">Campanha:</span>{" "}
            <span className="text-foreground/80">{referral.campaign}</span>
          </p>
        )}
        {referral.headline && (
          <p>
            <span className="font-semibold text-foreground">Headline:</span>{" "}
            <span className="text-foreground/80">{referral.headline}</span>
          </p>
        )}
        {referral.medium && (
          <p>
            <span className="font-semibold text-foreground">Meio:</span>{" "}
            <span className="text-foreground/80">{referral.medium}</span>
          </p>
        )}
        {referral.source_url && (
          <p className="flex items-start gap-1">
            <span className="font-semibold text-foreground shrink-0">Acesso:</span>{" "}
            <a
              href={referral.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all inline-flex items-center gap-1"
            >
              {referral.source_url}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
