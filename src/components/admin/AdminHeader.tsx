import { useEffect, useState } from "react";
import { type AdminRouteTabId, ADMIN_TAB_LABELS } from "./adminNavigation";
import { useOrgContext } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { BrokerRoletas } from "@/components/broker/BrokerRoletas";

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
  const { activeOrg } = useOrgContext();
  const orgName = activeOrg?.display_name || activeOrg?.name || "Admin";
  const [myBrokerId, setMyBrokerId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await (supabase
        .from("brokers" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle() as any);
      if (!cancelled && data?.id) setMyBrokerId(data.id);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[#141417]/95 backdrop-blur-sm border-b border-[#2a2a2e] pt-safe">
      <div className="md:hidden flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          {activeOrg?.logo_url && (
            <img src={activeOrg.logo_url} alt={orgName} className="h-6 w-6 rounded object-contain flex-shrink-0" />
          )}
          <h1 className="text-lg font-bold text-foreground truncate">{currentTab.title}</h1>
        </div>
      </div>

      <div className="hidden md:flex items-center justify-between px-6 py-3 border-b border-[#2a2a2e] gap-4">
        <nav className="flex items-center gap-2 text-sm min-w-0">
          {activeOrg?.logo_url ? (
            <img src={activeOrg.logo_url} alt={orgName} className="h-5 w-5 rounded object-contain" />
          ) : null}
          <span className="text-muted-foreground">{orgName}</span>
          <span className="text-muted-foreground">›</span>
          <span className="text-foreground font-medium">{currentTab.title}</span>
          {currentTab.subtitle && (
            <>
              <span className="text-muted-foreground/60">·</span>
              <span className="text-muted-foreground truncate">{currentTab.subtitle}</span>
            </>
          )}
        </nav>
        {myBrokerId && (
          <div className="shrink-0 min-w-[260px] max-w-[420px]">
            <BrokerRoletas brokerId={myBrokerId} />
          </div>
        )}
      </div>

      {myBrokerId && (
        <div className="md:hidden px-4 pb-3">
          <BrokerRoletas brokerId={myBrokerId} />
        </div>
      )}
    </header>
  );
}

