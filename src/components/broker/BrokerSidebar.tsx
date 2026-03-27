import { LogOut, ExternalLink, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoEnoveMini from "@/assets/logo-enove-mini.png";
import { NotificationPanel } from "@/components/admin/NotificationPanel";
import { BROKER_ROUTE_TABS, getBrokerPathByTab, getBrokerTabFromPath } from "./brokerNavigation";

interface BrokerSidebarProps {
  viewMode: "kanban" | "list";
  onViewChange: (mode: "kanban" | "list") => void;
  onLogout: () => void;
  onOpenLanding?: () => void;
  onAddLead?: () => void;
  brokerInitial?: string;
  isLeader?: boolean;
  inboxEnabled?: boolean;
  copilotEnabled?: boolean;
}

export function BrokerSidebar({
  viewMode,
  onViewChange,
  onLogout,
  onOpenLanding,
  onAddLead,
  brokerInitial = "C",
  isLeader = false,
  inboxEnabled = true,
  copilotEnabled = true,
}: BrokerSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = getBrokerTabFromPath(location.pathname);

  const navigationItems = BROKER_ROUTE_TABS.filter((item) => {
    if (item.id === "roletas") return isLeader;
    if (item.id === "inbox") return inboxEnabled;
    if (item.id === "plantao") return true;
    if (item.id === "copilot") return copilotEnabled;
    return item.id !== "projects" || true;
  });

  const handleTabClick = (tabId: "crm" | "leads") => {
    const mode = tabId === "leads" ? "list" : "kanban";
    onViewChange(mode);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-16 hidden lg:flex flex-col bg-[#141417] border-r border-[#2a2a2e]">
      <div className="flex items-center justify-center pt-4 pb-2">
        <img src={logoEnoveMini} alt="Enove" className="h-8 w-8 object-contain" />
      </div>

      <div className="flex items-center justify-center py-3">
        <button
          onClick={onAddLead}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FFFF00] hover:brightness-110 text-black shadow-lg shadow-[hsl(60_100%_50%/0.3)] transition-all duration-200 active:scale-95"
          title="Adicionar Lead"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 flex flex-col items-center gap-1 px-2 py-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === "crm" && viewMode === "kanban" && activeTab === "crm") || (item.id === "leads" && viewMode === "list" && activeTab === "leads");
          const isInbox = item.id === "inbox";
          const isCopilot = item.id === "copilot";

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "crm" || item.id === "leads") {
                  handleTabClick(item.id);
                  return;
                }
                navigate(getBrokerPathByTab(item.id));
              }}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                "hover:bg-[#2a2a2e] group relative",
                isActive
                  ? isInbox
                    ? "bg-[#2a2a2e] text-[hsl(145,80%,55%)]"
                    : isCopilot
                      ? "bg-[#2a2a2e] text-blue-400"
                      : item.id === "plantao"
                        ? "bg-[#2a2a2e] text-orange-400"
                        : "bg-[#2a2a2e] text-[#FFFF00]"
                  : isInbox
                    ? "text-[hsl(145,80%,55%)]/70 hover:text-[hsl(145,80%,55%)]"
                    : item.id === "plantao"
                      ? "text-orange-400/70 hover:text-orange-400"
                      : "text-slate-400 hover:text-white"
              )}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-[#2a2a2e] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {item.label}
              </span>
            </button>
          );
        })}

        {onOpenLanding && (
          <button
            onClick={onOpenLanding}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-[#2a2a2e] text-slate-400 hover:text-white group relative mt-2"
            title="Abrir Landing Page"
          >
            <ExternalLink className="w-5 h-5" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-[#2a2a2e] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Abrir Landing
            </span>
          </button>
        )}
      </nav>

      <div className="flex flex-col items-center gap-2 px-2 py-4 border-t border-[#2a2a2e]">
        <NotificationPanel />

        <div className="w-8 h-8 rounded-full bg-[#FFFF00]/10 border border-[#FFFF00]/30 flex items-center justify-center">
          <span className="text-[#FFFF00] text-sm font-medium">{brokerInitial}</span>
        </div>

        <button
          onClick={onLogout}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-red-500/10 text-slate-400 hover:text-red-400 group relative"
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-[#2a2a2e] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Sair
          </span>
        </button>
      </div>
    </aside>
  );
}
