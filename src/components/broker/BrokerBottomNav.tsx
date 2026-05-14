import { useState } from "react";
import { Plus, Bell, MoreHorizontal, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import { useInboxUnread } from "@/hooks/use-inbox-unread";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BROKER_ROUTE_TABS, getBrokerPathByTab, getBrokerTabFromPath } from "./brokerNavigation";

interface BrokerBottomNavProps {
  viewMode: "kanban" | "list";
  onViewChange: (mode: "kanban" | "list") => void;
  onCopyLink?: () => void;
  onAddLead?: () => void;
  onNotificationsClick?: () => void;
  isLeader?: boolean;
  copilotEnabled?: boolean;
}

export function BrokerBottomNav({
  viewMode,
  onViewChange,
  onAddLead,
  onNotificationsClick,
  isLeader = false,
  copilotEnabled = true,
}: BrokerBottomNavProps) {
  const { unreadCount } = useNotifications();
  const { unreadCount: inboxUnread } = useInboxUnread();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const activeTab = getBrokerTabFromPath(location.pathname);

  const crmTab = BROKER_ROUTE_TABS.find((item) => item.id === "crm");
  const inboxTab = BROKER_ROUTE_TABS.find((item) => item.id === "inbox");
  const plantaoTab = BROKER_ROUTE_TABS.find((item) => item.id === "plantao");

  const navItems: Array<{
    id: string;
    icon: (typeof BROKER_ROUTE_TABS)[number]["icon"] | typeof Plus | typeof MoreHorizontal;
    isFab?: boolean;
    badge?: number;
  }> = [
    { id: "crm", icon: crmTab!.icon },
    ...(inboxTab ? [{ id: "inbox", icon: inboxTab.icon, badge: inboxUnread }] : []),
    { id: "add", icon: Plus, isFab: true },
    { id: "plantao", icon: plantaoTab!.icon },
    { id: "more", icon: MoreHorizontal },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/auth");
  };

  const handleClick = (id: string) => {
    if (id === "add") {
      onAddLead?.();
    } else if (id === "more") {
      setIsMoreOpen(true);
    } else if (id === "crm" || id === "leads") {
      navigate(getBrokerPathByTab("crm"));
    } else if (id === "inbox" || id === "agenda" || id === "copilot" || id === "plantao" || id === "dashboard") {
      navigate(getBrokerPathByTab(id));
    }
  };

  const handleMoreAction = (action: string) => {
    setIsMoreOpen(false);
    if (action === "leads") {
      onViewChange("list");
      return;
    }
    if (action === "notifications") {
      onNotificationsClick?.();
      return;
    }
    if (action === "logout") {
      handleLogout();
      return;
    }
    navigate(getBrokerPathByTab(action as any));
  };

  const getItemColor = (id: string) => {
    const isActive = getActiveIndicator(id);
    if (id === "plantao") return isActive ? "text-purple-400" : "text-purple-400/70";
    if (id === "inbox") return isActive ? "text-[hsl(145,80%,55%)]" : "text-[hsl(145,80%,55%)]/70";
    if (id === "copilot") return isActive ? "text-blue-400" : "text-blue-400/70";
    if (isActive) return "text-[#FFFF00]";
    return "text-slate-500 active:text-slate-300";
  };

  const getActiveIndicator = (id: string) => {
    if (id === "crm" && (activeTab === "crm" || activeTab === "leads")) return true;
    if (id === "copilot" && activeTab === "copilot") return true;
    if (id === "plantao" && activeTab === "plantao") return true;
    if (id === "inbox" && activeTab === "inbox") return true;
    if (id === "agenda" && activeTab === "agenda") return true;
    if (id === "dashboard" && activeTab === "dashboard") return true;
    return false;
  };

  const moreMenuItems = [
    { id: "dashboard", label: "Dashboard", description: "Performance e funil" },
    { id: "inbox", label: "Meu WhatsApp", description: "Conversas pessoais", badge: inboxUnread },
    { id: "copilot", label: "Copiloto", description: "Assistente e automações" },
    { id: "leads", label: "Modo Lista", description: "Abrir visão em lista" },
    { id: "notifications", label: "Notificações", description: "Ver notificações", badge: unreadCount },
    ...(isLeader ? [{ id: "roletas", label: "Roletas", description: "Gerenciar roletas da equipe" }] : []),
    { id: "projects", label: "Landing Pages", description: "Ver suas landing pages" },
    { id: "profile", label: "Perfil", description: "Informações e configurações" },
    { id: "logout", label: "Sair", description: "Encerrar sessão", destructive: true },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <div className="absolute inset-0 bg-[#141417]/95 backdrop-blur-lg border-t border-[#2a2a2e]" />

        <div className="relative flex items-center justify-around px-2 py-2 pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.isFab) {
              return (
                <button
                  key={item.id}
                  onClick={() => handleClick(item.id)}
                  className={cn(
                    "relative flex items-center justify-center",
                    "w-14 h-14 -mt-6 rounded-full",
                    "bg-[#FFFF00] hover:brightness-110",
                    "text-black shadow-lg shadow-[hsl(60_100%_50%/0.3)]",
                    "transition-all duration-200 active:scale-95"
                  )}
                >
                  <Icon className="w-6 h-6" />
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={cn(
                  "flex items-center justify-center p-3 min-w-[48px]",
                  "transition-colors duration-200 relative",
                  getItemColor(item.id)
                )}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" />
                  {(item.badge ?? 0) > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center px-1 shadow-md shadow-red-500/50">
                      {item.badge! > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </div>

                {getActiveIndicator(item.id) && (
                  <div className={cn(
                    "absolute bottom-1.5 w-1 h-1 rounded-full",
                    item.id === "inbox" ? "bg-[hsl(145,80%,55%)]" : item.id === "plantao" ? "bg-purple-400" : "bg-[#FFFF00]"
                  )} />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <SheetContent side="bottom" className="bg-[#1e1e22] border-[#2a2a2e] rounded-t-2xl px-4 pb-8">
          <SheetHeader className="pb-3">
            <SheetTitle className="text-slate-200 text-base">Mais opções</SheetTitle>
          </SheetHeader>

          <div className="space-y-1 mt-2">
            {moreMenuItems.map((menuItem) => {
              const isDestructive = Boolean((menuItem as { destructive?: boolean }).destructive);
              const isNotifications = menuItem.id === "notifications";
              const matchedTab = BROKER_ROUTE_TABS.find((item) => item.id === menuItem.id);
              const Icon = matchedTab
                ? matchedTab.icon
                : menuItem.id === "notifications"
                  ? Bell
                  : LogOut;

              return (
                <button
                  key={menuItem.id}
                  onClick={() => handleMoreAction(menuItem.id)}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-4 rounded-xl",
                    "transition-colors duration-150",
                    isDestructive
                      ? "text-red-400 hover:bg-red-500/10 active:bg-red-500/20"
                      : "text-slate-200 hover:bg-[#2a2a2e] active:bg-[#333338]"
                  )}
                >
                  <div className="relative shrink-0">
                    <Icon className="w-5 h-5" />
                    {isNotifications && (menuItem.badge ?? 0) > 0 && (
                      <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center px-1 shadow-md shadow-red-500/50">
                        {menuItem.badge! > 99 ? "99+" : menuItem.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">{menuItem.label}</p>
                    <p className={cn(
                      "text-xs mt-0.5",
                      isDestructive ? "text-red-400/60" : "text-slate-500"
                    )}>
                      {menuItem.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
