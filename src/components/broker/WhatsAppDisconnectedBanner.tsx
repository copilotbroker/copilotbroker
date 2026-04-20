import { useEffect, useState } from "react";
import { WifiOff, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBrokerWhatsAppStatus } from "@/hooks/use-broker-whatsapp-status";
import { usePausedMessages } from "@/hooks/use-paused-messages";
import { Button } from "@/components/ui/button";
import { PausedMessagesReviewModal } from "@/components/whatsapp/PausedMessagesReviewModal";

export function WhatsAppDisconnectedBanner() {
  const navigate = useNavigate();
  const [brokerId, setBrokerId] = useState<string>();
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from("brokers")
        .select("id")
        .eq("user_id", data.user.id)
        .single()
        .then(({ data: broker }) => {
          if (broker) setBrokerId(broker.id);
        });
    });
  }, []);

  const { data: instance, isLoading } = useBrokerWhatsAppStatus(brokerId);
  const { data: pausedData } = usePausedMessages(brokerId);

  const isDisconnected = instance && instance.status !== "connected";
  const pausedCount = pausedData?.count ?? 0;
  const showPausedReview = !isDisconnected && pausedCount > 0;

  if (isLoading || !instance) return null;
  if (!isDisconnected && !showPausedReview) return null;

  // Variant 1: Currently disconnected
  if (isDisconnected) {
    return (
      <div className="bg-red-500/15 border border-red-500/30 text-red-300 px-4 py-3 flex items-center justify-between gap-3 rounded-lg mx-3 mt-3 lg:mx-6 lg:mt-4">
        <div className="flex items-center gap-3 min-w-0">
          <WifiOff className="w-5 h-5 shrink-0 text-red-400" />
          <p className="text-sm">
            <span className="font-semibold">Seu WhatsApp está desconectado.</span>{" "}
            <span className="hidden sm:inline">
              Cadências automáticas foram pausadas e aguardam sua revisão após reconectar.
            </span>
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 border-red-500/40 text-red-300 hover:bg-red-500/20 hover:text-red-200"
          onClick={() => navigate("/corretor/whatsapp")}
        >
          Reconectar
        </Button>
      </div>
    );
  }

  // Variant 2: Reconnected but messages are waiting for review
  return (
    <>
      <div className="bg-amber-500/15 border border-amber-500/30 text-amber-200 px-4 py-3 flex items-center justify-between gap-3 rounded-lg mx-3 mt-3 lg:mx-6 lg:mt-4">
        <div className="flex items-center gap-3 min-w-0">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
          <p className="text-sm">
            <span className="font-semibold">{pausedCount} mensagem(ns) aguardando revisão.</span>{" "}
            <span className="hidden sm:inline">
              Foram pausadas durante a desconexão. Escolha o que reativar ou descartar.
            </span>
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 border-amber-500/40 text-amber-200 hover:bg-amber-500/20 hover:text-amber-100"
          onClick={() => setReviewOpen(true)}
        >
          Revisar mensagens
        </Button>
      </div>
      <PausedMessagesReviewModal open={reviewOpen} onOpenChange={setReviewOpen} brokerId={brokerId} />
    </>
  );
}
