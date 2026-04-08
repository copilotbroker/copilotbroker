import { Bot, Building2, CalendarDays, LayoutDashboard, List, RotateCw, UserCog } from "lucide-react";
import { WhatsAppInboxIcon, WhatsAppPlantaoIcon } from "@/components/icons/WhatsAppIcon";

export const BROKER_ROUTE_TABS = [
  { id: "crm", label: "Kanban", path: "/corretor/crm", icon: LayoutDashboard },
  { id: "leads", label: "Lista", path: "/corretor/leads", icon: List },
  { id: "inbox", label: "Inbox", path: "/corretor/inbox", icon: WhatsAppInboxIcon },
  { id: "plantao", label: "Plantão", path: "/corretor/plantao", icon: WhatsAppPlantaoIcon },
  { id: "agenda", label: "Agenda", path: "/corretor/agenda", icon: CalendarDays },
  { id: "copilot", label: "Copiloto", path: "/corretor/copiloto", icon: Bot },
  { id: "roletas", label: "Roletas", path: "/corretor/roletas", icon: RotateCw },
  { id: "projects", label: "Landing Pages", path: "/corretor/empreendimentos", icon: Building2 },
  { id: "profile", label: "Perfil", path: "/corretor/perfil", icon: UserCog },
] as const;

export type BrokerRouteTabId = typeof BROKER_ROUTE_TABS[number]["id"];

export const BROKER_DEFAULT_TAB: BrokerRouteTabId = "crm";

export const BROKER_TAB_BY_SEGMENT: Record<string, BrokerRouteTabId> = {
  admin: "crm",
  crm: "crm",
  leads: "leads",
  inbox: "inbox",
  plantao: "plantao",
  agenda: "agenda",
  copiloto: "copilot",
  roletas: "roletas",
  empreendimentos: "projects",
  perfil: "profile",
};

export const BROKER_TAB_LABELS: Record<BrokerRouteTabId, { title: string; subtitle?: string }> = {
  crm: { title: "Meus Leads", subtitle: "Pipeline visual do corretor" },
  leads: { title: "Lista de Leads", subtitle: "Visualização tabular da carteira" },
  inbox: { title: "Inbox", subtitle: "Conversas e atendimento em tempo real" },
  plantao: { title: "Plantão", subtitle: "Atendimento de leads da instância global" },
  agenda: { title: "Agenda", subtitle: "Compromissos e eventos" },
  copilot: { title: "Copiloto", subtitle: "Conexão, assistente e automações" },
  roletas: { title: "Roletas", subtitle: "Distribuição e regras da equipe" },
  projects: { title: "Landing Pages", subtitle: "Links e empreendimentos do corretor" },
  profile: { title: "Perfil", subtitle: "Informações e configurações pessoais" },
};

export function getBrokerTabFromPath(pathname: string): BrokerRouteTabId {
  const segment = pathname.split("/").filter(Boolean)[1];
  return BROKER_TAB_BY_SEGMENT[segment ?? ""] ?? BROKER_DEFAULT_TAB;
}

export function getBrokerPathByTab(tab: BrokerRouteTabId): string {
  return BROKER_ROUTE_TABS.find((item) => item.id === tab)?.path ?? "/corretor/crm";
}

export function getBrokerViewModeFromPath(pathname: string): "kanban" | "list" {
  return getBrokerTabFromPath(pathname) === "leads" ? "list" : "kanban";
}
