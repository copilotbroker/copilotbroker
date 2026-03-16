import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { BrokerLayout } from "@/components/broker";
import RoletaManagement from "@/components/admin/RoletaManagement";

const BrokerRoletasPage = () => {
  const navigate = useNavigate();
  const { role, isLoading: isRoleLoading, isLeader } = useUserRole();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) navigate("/auth");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!isRoleLoading && role !== "broker") {
      navigate(role === "admin" ? "/admin" : "/auth", { replace: true });
      return;
    }

    if (!isRoleLoading && !isLeader) {
      navigate("/corretor/crm", { replace: true });
    }
  }, [isRoleLoading, isLeader, navigate, role]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/auth");
  };

  if (isRoleLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[#FFFF00]" />
      </div>
    );
  }

  if (!isLeader) return null;

  return (
    <>
      <Helmet>
        <title>Roletas | Enove</title>
      </Helmet>
      <BrokerLayout
        viewMode="kanban"
        onViewChange={(mode) => navigate(mode === "list" ? "/corretor/leads" : "/corretor/crm")}
        onLogout={handleLogout}
        isLeader={isLeader}
      >
        <RoletaManagement />
      </BrokerLayout>
    </>
  );
};

export default BrokerRoletasPage;
