// Página de Gestão de Equipe — redesenhada (Dark Professional + acentos por perfil).
// Substitui o fluxo de criar/editar corretor: agora a verdade vive aqui.
// Mudanças aplicam-se a TODAS as imobiliárias (atuais e futuras) por ser código SaaS
// + a trigger sync_broker_from_member materializa o lado operacional.
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import { useOrganizationLimits } from "@/hooks/use-organization-limits";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Loader2,
  AlertTriangle,
  UserPlus,
  Copy,
  Check,
  X,
  Link2,
  ArrowLeft,
  Search,
  Users2,
  Pencil,
  Crown,
  Star,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { MemberFormDialog } from "@/components/admin-org/MemberFormDialog";
import { ROLE_META, RoleBadge, type OrgRole } from "@/components/admin-org/RoleBadge";
import { cn } from "@/lib/utils";

type FilterRole = "all" | OrgRole;

const AVATAR_GRADIENTS = [
  "from-violet-500 to-fuchsia-600",
  "from-sky-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-indigo-500 to-blue-600",
];

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

const gradientOf = (key: string) =>
  AVATAR_GRADIENTS[(key.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];

interface MemberRow {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  is_active: boolean;
  approval_status: string;
  joined_at: string | null;
  email: string;
  full_name: string | null;
  whatsapp?: string | null;
}

const AdminOrganizationTeam = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberRow | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterRole>("all");

  const { isLoading: orgLoading, activeOrg, activeOrgRole, isOwnerOrAdmin, isSuperAdmin } = useOrganization();
  const { hasReached, remaining, features, usage, asInt } = useOrganizationLimits();

  useEffect(() => {
    if (!orgLoading && !isOwnerOrAdmin && !isSuperAdmin) {
      navigate("/corretor/dashboard", { replace: true });
    }
  }, [orgLoading, isOwnerOrAdmin, isSuperAdmin, navigate]);

  const { data: members, isLoading } = useQuery({
    queryKey: ["org-members", activeOrg?.id],
    enabled: !!activeOrg,
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_organization_members_with_users" as any,
        { _org_id: activeOrg!.id }
      ) as any;
      if (error) {
        console.error("[AdminOrganizationTeam] members error:", error);
        return [] as MemberRow[];
      }
      return ((data ?? []) as MemberRow[]);
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["org-members", activeOrg?.id] });
    queryClient.invalidateQueries({ queryKey: ["organization-limits", activeOrg?.id] });
  };

  const approveMember = async (memberId: string) => {
    const { error } = await supabase.from("organization_members" as any).update({
      approval_status: "approved",
      is_active: true,
      approved_at: new Date().toISOString(),
    }).eq("id", memberId) as any;
    if (error) { toast.error(error.message); return; }
    toast.success("Membro aprovado!");
    invalidateAll();
  };

  const rejectMember = async (memberId: string) => {
    const { error } = await supabase.from("organization_members" as any).update({
      approval_status: "rejected",
      is_active: false,
    }).eq("id", memberId) as any;
    if (error) { toast.error(error.message); return; }
    toast.success("Solicitação rejeitada.");
    invalidateAll();
  };

  // Link público
  const publicOrigin = (() => {
    if (typeof window === "undefined") return "https://copilotbroker.lovable.app";
    const host = window.location.hostname;
    if (host.includes("id-preview--") || host.endsWith(".lovableproject.com") || host.endsWith(".lovable.dev")) {
      return "https://copilotbroker.lovable.app";
    }
    return window.location.origin;
  })();
  const inviteUrl = activeOrg ? `${publicOrigin}/imobiliaria/${activeOrg.slug}/cadastro` : "";
  const copyInvite = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Link copiado!");
  };

  const limitReached = hasReached("max_brokers");
  const rem = remaining("max_brokers");
  const maxBrokers = asInt("max_brokers");
  const usedBrokers = usage.brokers;

  const allMembers = members ?? [];
  const pendentes = allMembers.filter((m) => m.approval_status === "pending");
  const ativos = allMembers.filter((m) => m.approval_status !== "pending");

  // KPIs por perfil
  const counts = useMemo(() => {
    const c = { manager: 0, leader: 0, broker: 0, owner: 0 } as Record<OrgRole, number>;
    ativos.forEach((m) => {
      if (m.is_active && c[m.role] !== undefined) c[m.role] = (c[m.role] ?? 0) + 1;
    });
    return c;
  }, [ativos]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ativos.filter((m) => {
      if (filter !== "all" && m.role !== filter) return false;
      if (!q) return true;
      const name = (m.full_name ?? "").toLowerCase();
      const email = (m.email ?? "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [ativos, search, filter]);

  const openEdit = (m: MemberRow) => {
    setEditingMember(m);
    setFormOpen(true);
  };
  const openCreate = () => {
    setEditingMember(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/admin/organizacao")}
        className="-ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />Voltar para Organização
      </Button>

      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.07] via-card to-card p-4 sm:p-8">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-5">
          <div className="space-y-1.5 max-w-2xl min-w-0">
            <div className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
              <Users2 className="h-3.5 w-3.5" />
              Equipe da imobiliária
            </div>
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
              Gestão de membros e perfis
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Adicione Gerentes, Líderes e Corretores. Cada perfil já vem com permissões e fluxos de
              trabalho prontos no Copilot Broker.
            </p>
          </div>
          <Button size="lg" onClick={openCreate} disabled={limitReached} className="shadow-lg shadow-primary/20 self-stretch lg:self-auto w-full lg:w-auto">
            <UserPlus className="h-4 w-4 mr-2" />Adicionar membro
          </Button>
        </div>

        {/* KPIs */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <KpiCard label="Gerentes" value={counts.manager} icon={Crown} accent="violet" />
          <KpiCard label="Líderes" value={counts.leader} icon={Star} accent="sky" />
          <KpiCard label="Corretores" value={counts.broker} icon={Target} accent="emerald" />
          <KpiCard
            label="Limite do plano"
            value={`${usedBrokers}/${maxBrokers ?? "∞"}`}
            icon={limitReached ? AlertTriangle : Users2}
            accent={limitReached ? "rose" : "amber"}
            hint={limitReached ? "Limite atingido" : `${rem} vaga(s)`}
          />
        </div>
      </div>

      {/* Link público */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Link2 className="h-4 w-4 text-primary" />
            Link público de auto-cadastro
          </CardTitle>
          <CardDescription className="text-xs">
            Quem se cadastra por este link aparece como pendente para aprovação.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Input readOnly value={inviteUrl} className="font-mono text-xs" />
            <Button variant="outline" onClick={copyInvite}><Copy className="h-4 w-4 mr-2" />Copiar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Pendentes */}
      {pendentes.length > 0 && (
        <Card className="border-amber-400/30 bg-amber-500/[0.03]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Solicitações pendentes
              <Badge variant="outline" className="ml-1">{pendentes.length}</Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Pessoas que se cadastraram via link público aguardando aprovação.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {pendentes.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 p-3"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback
                    className={cn("text-xs font-semibold text-white bg-gradient-to-br", gradientOf(m.email || m.user_id))}
                  >
                    {initialsOf(m.full_name ?? m.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{m.full_name ?? m.email}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{m.email}</div>
                </div>
                <Button size="sm" onClick={() => approveMember(m.id)}>
                  <Check className="h-3.5 w-3.5 mr-1" />Aprovar
                </Button>
                <Button size="sm" variant="outline" onClick={() => rejectMember(m.id)}>
                  <X className="h-3.5 w-3.5 mr-1" />Rejeitar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filtros + busca */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            Todos <span className="opacity-60 ml-1">{ativos.length}</span>
          </FilterChip>
          <FilterChip active={filter === "manager"} onClick={() => setFilter("manager")} accent="violet">
            Gerentes <span className="opacity-60 ml-1">{counts.manager}</span>
          </FilterChip>
          <FilterChip active={filter === "leader"} onClick={() => setFilter("leader")} accent="sky">
            Líderes <span className="opacity-60 ml-1">{counts.leader}</span>
          </FilterChip>
          <FilterChip active={filter === "broker"} onClick={() => setFilter("broker")} accent="emerald">
            Corretores <span className="opacity-60 ml-1">{counts.broker}</span>
          </FilterChip>
        </div>
      </div>

      {/* Grid de membros */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="py-12 text-center">
            <Users2 className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              {search || filter !== "all" ? "Nenhum membro com esses filtros." : "Nenhum membro cadastrado ainda."}
            </p>
            {!search && filter === "all" && (
              <Button size="sm" className="mt-4" onClick={openCreate}>
                <UserPlus className="h-4 w-4 mr-2" />Adicionar primeiro membro
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((m) => (
            <MemberCard key={m.id} member={m} onEdit={() => openEdit(m)} />
          ))}
        </div>
      )}

      {activeOrg && (
        <MemberFormDialog
          open={formOpen}
          onOpenChange={(v) => { setFormOpen(v); if (!v) setEditingMember(null); }}
          organizationId={activeOrg.id}
          member={editingMember}
          onSaved={invalidateAll}
        />
      )}
    </div>
  );
};

/* ───────────── Sub-components ───────────── */

const KpiCard = ({
  label, value, icon: Icon, accent, hint,
}: {
  label: string;
  value: string | number;
  icon: typeof Users2;
  accent: "violet" | "sky" | "emerald" | "amber" | "rose";
  hint?: string;
}) => {
  const accentMap = {
    violet: { bg: "bg-violet-500/10", text: "text-violet-300", ring: "ring-violet-400/20" },
    sky: { bg: "bg-sky-500/10", text: "text-sky-300", ring: "ring-sky-400/20" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-300", ring: "ring-emerald-400/20" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-300", ring: "ring-amber-400/20" },
    rose: { bg: "bg-rose-500/10", text: "text-rose-300", ring: "ring-rose-400/20" },
  }[accent];
  return (
    <div className={cn("rounded-xl border border-border/60 bg-background/40 p-3.5 ring-1", accentMap.ring)}>
      <div className="flex items-center gap-2.5">
        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", accentMap.bg, accentMap.text)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-lg font-bold leading-tight">{value}</div>
          {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
        </div>
      </div>
    </div>
  );
};

const FilterChip = ({
  active, onClick, children, accent,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accent?: "violet" | "sky" | "emerald";
}) => {
  const accentRing = accent
    ? { violet: "ring-violet-400/40", sky: "ring-sky-400/40", emerald: "ring-emerald-400/40" }[accent]
    : "ring-primary/40";
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
        active
          ? cn("bg-background text-foreground border-transparent ring-1", accentRing)
          : "bg-background/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-background/80",
      )}
    >
      {children}
    </button>
  );
};

const MemberCard = ({ member, onEdit }: { member: MemberRow; onEdit: () => void }) => {
  const meta = ROLE_META[member.role] ?? ROLE_META.broker;
  return (
    <button
      type="button"
      onClick={onEdit}
      className={cn(
        "group text-left rounded-xl border border-border/60 bg-card/60 backdrop-blur p-4",
        "transition-all hover:bg-card hover:border-border hover:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-primary/40",
        !member.is_active && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className={cn("h-11 w-11 ring-2 ring-offset-2 ring-offset-background", meta.ring)}>
          <AvatarFallback
            className={cn(
              "text-sm font-semibold text-white bg-gradient-to-br",
              gradientOf(member.email || member.user_id),
            )}
          >
            {initialsOf(member.full_name ?? member.email)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold truncate">{member.full_name ?? member.email}</div>
            {!member.is_active && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 shrink-0">Inativo</Badge>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">{member.email}</div>
          <div className="mt-2 flex items-center gap-2">
            <RoleBadge role={member.role} />
            {member.joined_at && (
              <span className="text-[10px] text-muted-foreground">
                desde {new Date(member.joined_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })}
              </span>
            )}
          </div>
        </div>
        <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
};

export default AdminOrganizationTeam;
