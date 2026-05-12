import { ReactNode, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Building2, LayoutDashboard, CreditCard, ScrollText, ShieldCheck, Loader2,
  LogOut, ExternalLink,
} from "lucide-react";
import { useOrganization } from "@/hooks/use-organization";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const MasterUserMenu = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!cancelled) setEmail(user?.email ?? "");
    })();
    return () => { cancelled = true; };
  }, []);

  const initial = (email?.charAt(0) ?? "M").toUpperCase();

  const handleLogout = async () => {
    try {
      queryClient.clear();
      await supabase.auth.signOut();
      toast.success("Sessão encerrada.");
    } catch (err: any) {
      console.error("[MasterLayout] logout error:", err);
    } finally {
      navigate("/master/login", { replace: true });
    }
  };

  const goToAdmin = () => {
    // Sai do Master e vai para a área operacional da imobiliária ativa.
    navigate("/admin/copiloto");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-2 px-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground max-w-[180px] truncate hidden sm:inline">
            {email || "super_admin"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">
          <div className="font-medium">Super Admin</div>
          <div className="text-muted-foreground truncate">{email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={goToAdmin}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Ir para Imobiliária
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const MasterLayout = ({ children }: { children?: ReactNode }) => {
  const { isLoading, isSuperAdmin } = useOrganization();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      navigate("/master/login", { replace: true });
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
          <header className="h-12 flex items-center justify-between border-b px-3 pt-safe">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground">Copilot Broker · Master</span>
            </div>
            <MasterUserMenu />
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
