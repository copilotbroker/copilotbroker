import { Building2, CalendarDays, LayoutDashboard, Inbox, Users, Bot, BarChart3, Headset, List, RotateCw } from "lucide-react";

export const ADMIN_ROUTE_TABS = [
  { id: "dashboard", label: "Dashboard", path: "/admin/dashboard", icon: BarChart3 },
  { id: "crm", label: "CRM", path: "/admin/crm", icon: LayoutDashboard },
  { id: "leads", label: "Leads", path: "/admin/leads", icon: List },
  { id: "inbox", label: "Inbox", path: "/admin/inbox", icon: Inbox },
  { id: "plantao", label: "Plantão", path: "/admin/plantao", icon: Headset },
  { id: "agenda", label: "Agenda", path: "/admin/agenda", icon: CalendarDays },
  { id: "brokers", label: "Corretores", path: "/admin/corretores", icon: Users },
  { id: "roletas", label: "Roletas", path: "/admin/roletas", icon: RotateCw },
  { id: "projects", label: "Landing Pages", path: "/admin/empreendimentos", icon: Building2 },
  { id: "copilot", label: "Copiloto", path: "/admin/copiloto", icon: Bot },
] as const;

export type AdminRouteTabId = typeof ADMIN_ROUTE_TABS[number]["id"];

export const ADMIN_TAB_LABELS: Record<AdminRouteTabId, { title: string; subtitle?: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Visão geral de métricas e performance" },
  crm: { title: "CRM", subtitle: "Gerencie seus leads e pipeline de vendas" },
  leads: { title: "Leads", subtitle: "Visualize e exporte todos os leads" },
  inbox: { title: "Inbox", subtitle: "Gerencie conversas e atendimento em tempo real" },
  plantao: { title: "Plantão", subtitle: "Conversas da instância global de multi-atendimento" },
  agenda: { title: "Agenda", subtitle: "Gerencie compromissos e eventos" },
  brokers: { title: "Corretores", subtitle: "Cadastre e gerencie corretores parceiros" },
  roletas: { title: "Roletas", subtitle: "Gerencie distribuição e regras de atendimento" },
  projects: { title: "Landing Pages", subtitle: "Gerencie todas as landing pages da imobiliária" },
  copilot: { title: "Copiloto IA", subtitle: "Configure o assistente IA dos corretores" },
};

export const ADMIN_DEFAULT_TAB: AdminRouteTabId = "crm";

export const ADMIN_TAB_BY_SEGMENT: Record<string, AdminRouteTabId> = {
  dashboard: "dashboard",
  crm: "crm",
  leads: "leads",
  corretores: "brokers",
  roletas: "roletas",
  empreendimentos: "projects",
  inbox: "inbox",
  plantao: "plantao",
  agenda: "agenda",
  copiloto: "copilot",
};

export function getAdminPathByTab(tab: AdminRouteTabId) {
  return ADMIN_ROUTE_TABS.find((item) => item.id === tab)?.path ?? "/admin/crm";
}

export function getAdminTabFromPath(pathname: string): AdminRouteTabId {
  const segment = pathname.split("/").filter(Boolean)[1];
  return ADMIN_TAB_BY_SEGMENT[segment ?? ""] ?? ADMIN_DEFAULT_TAB;
}
