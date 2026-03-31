import { ReactNode, useState } from "react";
import { BrokerSidebar } from "./BrokerSidebar";
import { BrokerHeader } from "./BrokerHeader";
import { BrokerBottomNav } from "./BrokerBottomNav";
import { WhatsAppDisconnectedBanner } from "./WhatsAppDisconnectedBanner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useBrokerSessionTracker } from "@/hooks/use-broker-session-tracker";
import { NotificationPanel } from "@/components/admin/NotificationPanel";

interface BrokerLayoutProps {
  children: ReactNode;
  brokerName?: string;
  brokerInitial?: string;
  viewMode: "kanban" | "list";
  onViewChange: (mode: "kanban" | "list") => void;
  onLogout: () => void;
  onCopyLink?: () => void;
  onOpenLanding?: () => void;
  onAddLead?: () => void;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  isLeader?: boolean;
  inboxEnabled?: boolean;
  copilotEnabled?: boolean;
  collapsibleContent?: ReactNode;
  brokerId?: string;
}


export function BrokerLayout({
  children,
  brokerName,
  brokerInitial,
  viewMode,
  onViewChange,
  onLogout,
  onCopyLink,
  onOpenLanding,
  onAddLead,
  searchTerm,
  onSearchChange,
  isLeader = false,
  inboxEnabled,
  copilotEnabled,
  collapsibleContent,
  brokerId,
}: BrokerLayoutProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  // Rastrear sessão de login
  useBrokerSessionTracker();

  return (
    <div className="min-h-screen bg-[#0f0f12] admin-scrollbar">
      {/* Sidebar - fixed left, hidden on mobile */}
      <BrokerSidebar
        viewMode={viewMode}
        onViewChange={onViewChange}
        onLogout={onLogout}
        onOpenLanding={onOpenLanding}
        onAddLead={onAddLead}
        brokerInitial={brokerInitial}
        isLeader={isLeader}
        inboxEnabled={inboxEnabled}
        copilotEnabled={copilotEnabled}
      />

      {/* Mobile Bottom Navigation */}
      <BrokerBottomNav
        viewMode={viewMode}
        onViewChange={onViewChange}
        onCopyLink={onCopyLink}
        onAddLead={onAddLead}
        onNotificationsClick={() => setIsNotificationsOpen(true)}
        isLeader={isLeader}
        inboxEnabled={inboxEnabled}
        copilotEnabled={copilotEnabled}
      />

      {/* Mobile Notifications Sheet - uses NotificationPanel inline */}
      <Sheet open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <SheetContent side="bottom" className="bg-[#1e1e22] border-[#2a2a2e] h-[80vh] rounded-t-2xl">
          <SheetHeader className="border-b border-[#2a2a2e] pb-3">
            <SheetTitle className="text-slate-200">Notificações</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <NotificationPanel variant="inline" showHeader={false} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content - offset by sidebar width on desktop */}
      <div className={cn("lg:ml-16 h-screen flex flex-col overflow-hidden", viewMode === "kanban" && "pb-20 lg:pb-0")}>
        <BrokerHeader
          brokerName={brokerName}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          collapsibleContent={collapsibleContent}
          onAddLead={onAddLead}
          brokerId={brokerId}
        />
        <WhatsAppDisconnectedBanner />
        <main className={viewMode === "kanban"
          ? "flex-1 flex flex-col min-h-0 overflow-y-auto p-3 lg:p-6"
          : "flex-1 min-h-0 overflow-y-auto p-3 pb-20 lg:p-6 lg:pb-6"
        }>{children}</main>
      </div>
    </div>
  );
}
