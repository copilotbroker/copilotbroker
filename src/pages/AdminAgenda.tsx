import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { MobileBottomNav } from "@/components/admin/MobileBottomNav";
import { AgendaModule } from "@/components/agenda/AgendaModule";
import { useIsMobile } from "@/hooks/use-mobile";

const AdminAgenda = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [brokerId, setBrokerId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/auth"); return; }

      const { data: roles } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", session.user.id) as any;
      const hasAdmin = (roles || []).some((r: any) => r.role === "admin");
      if (!hasAdmin) { navigate("/auth"); return; }

      const { data: broker } = await supabase
        .from("brokers")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (broker) setBrokerId((broker as any).id);
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {!isMobile && (
        <AdminSidebar activeTab="agenda" onLogout={() => { supabase.auth.signOut(); navigate("/auth"); }} />
      )}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <AgendaModule brokerId={brokerId} isAdmin />
        </div>
      </main>
      {isMobile && (
        <MobileBottomNav activeTab="agenda" />
      )}
    </div>
  );
};

export default AdminAgenda;
