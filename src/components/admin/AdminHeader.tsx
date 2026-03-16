import { type AdminRouteTabId, ADMIN_TAB_LABELS } from "./adminNavigation";

interface AdminHeaderProps {
  activeTab: AdminRouteTabId;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  brokers?: { id: string; name: string; slug: string }[];
}

export function AdminHeader({
  activeTab,
}: AdminHeaderProps) {
  const currentTab = ADMIN_TAB_LABELS[activeTab] || ADMIN_TAB_LABELS.crm;

  return (
    <header className="sticky top-0 z-30 bg-[#141417]/95 backdrop-blur-sm border-b border-[#2a2a2e] pt-safe">
      <div className="md:hidden flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-bold text-foreground">{currentTab.title}</h1>
      </div>

      <div className="hidden md:flex items-center justify-between px-6 py-3 border-b border-[#2a2a2e]">
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Admin</span>
          <span className="text-muted-foreground">›</span>
          <span className="text-foreground font-medium">{currentTab.title}</span>
          {currentTab.subtitle && (
            <>
              <span className="text-muted-foreground/60">·</span>
              <span className="text-muted-foreground">{currentTab.subtitle}</span>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
