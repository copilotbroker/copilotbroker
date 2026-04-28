import { ReactNode, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Building2, LayoutDashboard, CreditCard, ScrollText, ShieldCheck, Loader2 } from "lucide-react";
import { useOrganization } from "@/hooks/use-organization";

const items = [
  { title: "Visão Geral", url: "/master/overview", icon: LayoutDashboard },
  { title: "Imobiliárias", url: "/master/imobiliarias", icon: Building2 },
  { title: "Planos", url: "/master/planos", icon: CreditCard },
  { title: "Auditoria", url: "/master/auditoria", icon: ScrollText },
];

const MasterSidebar = () => {
  const { pathname } = useLocation();
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2 px-3 py-4 border-b">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-semibold">Master Panel</span>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)}>
                    <NavLink to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

const MasterLayout = ({ children }: { children?: ReactNode }) => {
  const { isLoading, isSuperAdmin } = useOrganization();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      navigate("/auth", { replace: true });
    }
  }, [isLoading, isSuperAdmin, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isSuperAdmin) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <MasterSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b px-3">
            <SidebarTrigger />
            <span className="ml-3 text-sm text-muted-foreground">Copilot Broker · Master</span>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children ?? <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MasterLayout;
