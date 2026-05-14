import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/use-user-role";
import { useLogout } from "@/hooks/use-logout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Wifi, Send, Shield, Bot, Sparkles } from "lucide-react";
import { ConnectionTab } from "@/components/whatsapp/ConnectionTab";

import { QueueTab } from "@/components/whatsapp/QueueTab";
import { SecurityTab } from "@/components/whatsapp/SecurityTab";
import { AutoMessageTab } from "@/components/whatsapp/AutoMessageTab";
import { CopilotConfigPage } from "@/components/inbox/CopilotConfigPage";
import { BrokerLayout } from "@/components/broker";

export default function BrokerCopilotConfig() {
  const navigate = useNavigate();
  const { role, isLoading: roleLoading, brokerId, isLeader } = useUserRole();
  const [brokerName, setBrokerName] = useState("");
  const [activeTab, setActiveTab] = useState("connection");
  

  useEffect(() => {
    if (!roleLoading && role !== "broker" && role !== "admin") {
      navigate("/auth");
    }
  }, [role, roleLoading, navigate]);

  useEffect(() => {
    const fetchBrokerInfo = async () => {
      if (!brokerId) return;
      const { data } = await supabase
        .from("brokers")
        .select("name")
        .eq("id", brokerId)
        .single();
      if (data) setBrokerName(data.name);
    };
    fetchBrokerInfo();
  }, [brokerId]);

  const handleLogout = useLogout({ silent: true });

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <BrokerLayout
      brokerName={brokerName}
      brokerInitial={brokerName?.charAt(0) || "C"}
      viewMode="list"
      onViewChange={(mode) => navigate(mode === "list" ? "/corretor/leads" : "/corretor/crm")}
      onLogout={handleLogout}
      isLeader={isLeader}
    >
      <div className="max-w-6xl mx-auto w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#1a1a1d] border border-[#2a2a2e] w-full justify-start overflow-x-auto no-scrollbar">
            <TabsTrigger value="connection" className="text-slate-400 data-[state=active]:bg-[#2a2a2e] data-[state=active]:text-white hover:text-white flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              <span className="hidden sm:inline">Conexão</span>
            </TabsTrigger>
            <TabsTrigger value="copilot" className="text-slate-400 data-[state=active]:bg-[#2a2a2e] data-[state=active]:text-white hover:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Copiloto</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="text-slate-400 data-[state=active]:bg-[#2a2a2e] data-[state=active]:text-white hover:text-white flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
              <TabsTrigger value="automation" className="text-slate-400 data-[state=active]:bg-[#2a2a2e] data-[state=active]:text-white hover:text-white flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">Follow-up</span>
              </TabsTrigger>
            <TabsTrigger value="queue" className="text-slate-400 data-[state=active]:bg-[#2a2a2e] data-[state=active]:text-white hover:text-white flex items-center gap-2">
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Fila</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="mt-6">
            <ConnectionTab />
          </TabsContent>

          <TabsContent value="copilot" className="mt-6">
            {brokerId && <CopilotConfigPage brokerId={brokerId} />}
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <SecurityTab />
          </TabsContent>

          <TabsContent value="automation" className="mt-6">
            <AutoMessageTab />
          </TabsContent>

          <TabsContent value="queue" className="mt-6">
            <QueueTab />
          </TabsContent>
        </Tabs>
      </div>
    </BrokerLayout>
  );
}
