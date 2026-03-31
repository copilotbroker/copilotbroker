import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BrokerSidebar } from "@/components/broker/BrokerSidebar";
import { BrokerBottomNav } from "@/components/broker/BrokerBottomNav";
import { AgendaModule } from "@/components/agenda/AgendaModule";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLogout } from "@/hooks/use-logout";

const BrokerAgenda = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [brokerId, setBrokerId] = useState<string | null>(null);
  const handleLogout = useLogout({ silent: true });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/auth"); return; }

      const { data: broker } = await supabase
        .from("brokers")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (broker) setBrokerId((broker as any).id);
      else navigate("/auth");
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {!isMobile && (
        <BrokerSidebar
          viewMode="kanban"
          onViewChange={() => {}}
          onLogout={handleLogout}
        />
      )}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <AgendaModule brokerId={brokerId} />
        </div>
      </main>
      {isMobile && (
        <BrokerBottomNav
          viewMode="kanban"
          onViewChange={() => {}}
        />
      )}
    </div>
  );
};

export default BrokerAgenda;
