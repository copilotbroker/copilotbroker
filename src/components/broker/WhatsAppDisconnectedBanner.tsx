import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBrokerWhatsAppStatus } from "@/hooks/use-broker-whatsapp-status";
import { Button } from "@/components/ui/button";

export function WhatsAppDisconnectedBanner() {
  const navigate = useNavigate();
  const [brokerId, setBrokerId] = useState<string>();

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

  // Don't show if loading, no instance, or connected
  if (isLoading || !instance || instance.status === "connected") return null;

  return (
    <div className="bg-red-500/15 border border-red-500/30 text-red-300 px-4 py-3 flex items-center justify-between gap-3 rounded-lg mx-3 mt-3 lg:mx-6 lg:mt-4">
      <div className="flex items-center gap-3 min-w-0">
        <WifiOff className="w-5 h-5 shrink-0 text-red-400" />
        <p className="text-sm">
          <span className="font-semibold">Seu WhatsApp está desconectado.</span>{" "}
          <span className="hidden sm:inline">
            Cadências automáticas não serão ativadas para novos leads.
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
