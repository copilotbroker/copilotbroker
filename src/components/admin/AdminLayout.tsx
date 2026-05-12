import { ReactNode, useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NotificationPanel } from "./NotificationPanel";
import { type AdminRouteTabId } from "./adminNavigation";

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: AdminRouteTabId;
  onLogout: () => void;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  onAddLead?: () => void;
  brokers?: { id: string; name: string; slug: string }[];
}

export function AdminLayout({
  children,
  activeTab,
  onLogout,
  searchTerm,
  onSearchChange,
  onAddLead,
  brokers,
}: AdminLayoutProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0f0f12] admin-scrollbar">
      <AdminSidebar
        activeTab={activeTab}
        onLogout={onLogout}
        onAddLead={onAddLead}
      />

      <MobileBottomNav
        activeTab={activeTab}
        onAddLead={onAddLead}
      />

      <Sheet open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md bg-[#0f0f12] border-[#2a2a2e] p-0">
          <SheetHeader className="p-4 border-b border-[#2a2a2e]">
            <SheetTitle className="text-white">Notificações</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto admin-scrollbar">
            <NotificationPanel variant="inline" showHeader={false} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="md:ml-16 h-screen flex flex-col pb-20 md:pb-0 overflow-hidden">
        <AdminHeader
          activeTab={activeTab}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          brokers={brokers}
        />
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
