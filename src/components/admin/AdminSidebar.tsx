import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logoEnove from "@/assets/logo-enove-mini.png";
import { useInboxUnread } from "@/hooks/use-inbox-unread";
import { usePlantaoNovosCount } from "@/hooks/use-plantao-novos-count";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationPanel } from "./NotificationPanel";
import { SettingsPanel } from "./SettingsPanel";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_ROUTE_TABS, type AdminRouteTabId, getAdminPathByTab } from "./adminNavigation";

interface AdminSidebarProps {
  activeTab: AdminRouteTabId;
  onLogout: () => void;
  onAddLead?: () => void;
}

export function AdminSidebar({ activeTab, onLogout, onAddLead }: AdminSidebarProps) {
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userInitial, setUserInitial] = useState("A");
  const { unreadCount: inboxUnread } = useInboxUnread();
  const { count: plantaoNovosCount } = usePlantaoNovosCount();

  useEffect(() => {
    const fetchUserInitial = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserInitial(user.email.charAt(0).toUpperCase());
      }
    };
    fetchUserInitial();
  }, []);

  return (
    <TooltipProvider delayDuration={100}>
      <aside className="fixed left-0 top-0 bottom-0 z-40 hidden md:flex flex-col w-16 bg-[#141417] border-r border-[#2a2a2e]">
        <div className="flex items-center justify-center pt-4 pb-3">
          <img
            src={logoEnove}
            alt="Enove"
            className="h-6 w-6 object-contain"
          />
        </div>

        <div className="flex items-center justify-center py-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onAddLead}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  "bg-enove-yellow hover:brightness-110 text-black",
                  "shadow-lg shadow-[hsl(60_100%_50%/0.3)] hover:shadow-[hsl(60_100%_50%/0.5)]",
                  "transition-all duration-200 hover:scale-105"
                )}
              >
                <Plus className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-card border-border text-foreground">
              Adicionar Lead
            </TooltipContent>
          </Tooltip>
        </div>

        <nav className="flex-1 flex flex-col items-center gap-1 py-4">
          {ADMIN_ROUTE_TABS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            const isInbox = item.id === "inbox";
            const isPlantao = item.id === "plantao";

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate(getAdminPathByTab(item.id))}
                    className={cn(
                      "relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                      isInbox
                        ? isActive
                          ? "bg-[hsl(145,80%,42%)]/20 text-[hsl(145,80%,55%)] shadow-[0_0_12px_hsl(145,80%,42%,0.3)]"
                          : "text-[hsl(145,80%,55%)]/70 hover:text-[hsl(145,80%,55%)] hover:bg-[hsl(145,80%,42%)]/10 hover:shadow-[0_0_8px_hsl(145,80%,42%,0.15)]"
                        : isPlantao
                          ? isActive
                            ? "bg-orange-400/20 text-orange-400 shadow-[0_0_12px_hsl(30,90%,50%,0.3)]"
                            : "text-orange-400/70 hover:text-orange-400 hover:bg-orange-400/10"
                          : isActive
                            ? "bg-primary/20 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    {isActive && (
                      <div className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full",
                        isInbox ? "bg-[hsl(145,80%,55%)]" : isPlantao ? "bg-orange-400" : "bg-primary"
                      )} />
                    )}
                    <Icon className="w-5 h-5" />
                    {item.id === "inbox" && inboxUnread > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center px-1 shadow-md shadow-red-500/50">
                        {inboxUnread > 99 ? "99+" : inboxUnread}
                      </span>
                    )}
                    {item.id === "plantao" && plantaoNovosCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center px-1 shadow-md shadow-red-500/50">
                        {plantaoNovosCount > 99 ? "99+" : plantaoNovosCount}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-card border-border text-foreground">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-2 py-4 border-t border-[#2a2a2e]">
          <NotificationPanel />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-card border-border text-foreground">
              Configurações
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onLogout}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-primary/50 transition-colors"
              >
                <Avatar className="w-full h-full">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-card border-border text-foreground">
              Sair
            </TooltipContent>
          </Tooltip>
        </div>

        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </aside>
    </TooltipProvider>
  );
}
