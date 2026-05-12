import { useState } from "react";
import {
  LayoutDashboard, Plus, LogOut,
  MoreHorizontal, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import { useInboxUnread } from "@/hooks/use-inbox-unread";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { SettingsPanel } from "./SettingsPanel";
import { WhatsAppInboxIcon, WhatsAppPlantaoIcon } from "@/components/icons/WhatsAppIcon";
import { ADMIN_ROUTE_TABS, type AdminRouteTabId, getAdminPathByTab } from "./adminNavigation";

interface MobileBottomNavProps {
  activeTab: AdminRouteTabId;
  onAddLead?: () => void;
}

interface BottomNavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  isFab?: boolean;
}

const DRAWER_ITEMS_STATIC = ADMIN_ROUTE_TABS.filter(
  (item) => !["crm", "inbox", "plantao"].includes(item.id)
);

export function MobileBottomNav({
  activeTab,
  onAddLead,
}: MobileBottomNavProps) {
  const { unreadCount } = useNotifications();
  const { unreadCount: inboxUnread } = useInboxUnread();
  const navigate = useNavigate();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const drawerItems = [
    ...DRAWER_ITEMS_STATIC.map((item) =>
      item.id === "inbox" ? { ...item, badge: inboxUnread } : item
    ),
    {
      id: "notifications",
      label: "Notificações",
      icon: Settings,
      badge: unreadCount,
    },
  ];

  const crmTab = ADMIN_ROUTE_TABS.find((item) => item.id === "crm");
  const inboxTab = ADMIN_ROUTE_TABS.find((item) => item.id === "inbox");
  const plantaoTab = ADMIN_ROUTE_TABS.find((item) => item.id === "plantao");

  const navItems: BottomNavItem[] = [
    { id: "crm", icon: crmTab!.icon, badge: 0 },
    { id: "inbox", icon: inboxTab!.icon, badge: inboxUnread },
    { id: "add", icon: Plus, isFab: true },
    { id: "plantao", icon: plantaoTab!.icon, badge: 0 },
    { id: "more", icon: MoreHorizontal, badge: 0 },
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
    } else {
      navigate(getAdminPathByTab(id as AdminRouteTabId));
    }
  };

  const handleDrawerItemClick = (id: string) => {
    setIsMoreOpen(false);
    if (id === "settings") {
      setIsSettingsOpen(true);
      return;
    }
    if (id === "notifications") {
      navigate("/admin/notificacoes");
      return;
    }
    navigate(getAdminPathByTab(id as AdminRouteTabId));
  };

  const getItemColor = (id: string) => {
    const isActive = activeTab === id;
    if (id === "inbox") return isActive ? "text-[hsl(145,80%,55%)]" : "text-[hsl(145,80%,55%)]/70";
    if (id === "plantao") return isActive ? "text-purple-400" : "text-purple-400/70";
    if (isActive) return "text-[#FFFF00]";
    return "text-slate-500 active:text-slate-300";
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
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

            const isActive = activeTab === item.id;

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
                {isActive && (
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

      <Drawer open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <DrawerContent className="bg-[#141417] border-[#2a2a2e]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-white text-lg">Menu</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 flex flex-col gap-1">
            {drawerItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isInbox = item.id === "inbox";
              const isPlantao = item.id === "plantao";
              return (
                <button
                  key={item.id}
                  onClick={() => handleDrawerItemClick(item.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                    isActive
                      ? isInbox ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_12px_hsl(145,80%,42%,0.3)]"
                        : isPlantao ? "bg-purple-500/20 text-purple-400"
                        : "bg-primary/20 text-primary"
                      : isInbox
                        ? "text-emerald-400/80 active:bg-emerald-500/10"
                        : isPlantao
                          ? "text-purple-400/80 active:bg-purple-500/10"
                          : "text-muted-foreground active:bg-card"
                  )}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {(item as { badge?: number }).badge ? (
                      <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center px-0.5">
                        {(item as { badge?: number }).badge! > 99 ? "99+" : (item as { badge?: number }).badge}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}

            <button
              onClick={() => { setIsMoreOpen(false); setIsSettingsOpen(true); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground active:bg-card transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Configurações</span>
            </button>

            <div className="border-t border-[#2a2a2e] my-2" />

            <button
              onClick={() => { setIsMoreOpen(false); handleLogout(); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 active:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Sair</span>
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
