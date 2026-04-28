import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import { useOrganizationLimits } from "@/hooks/use-organization-limits";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle, UserPlus, Copy, Check, X, Link2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { InviteMemberDialog } from "@/components/admin-org/InviteMemberDialog";

const ROLES = ["owner", "admin", "manager", "leader", "broker"] as const;

const AdminOrganizationTeam = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const { isLoading: orgLoading, activeOrg, activeOrgRole, isOwnerOrAdmin, isSuperAdmin } = useOrganization();
  const { hasReached, remaining, features, usage, asInt } = useOrganizationLimits();

  useEffect(() => {
    if (!orgLoading && !isOwnerOrAdmin && !isSuperAdmin) navigate("/corretor/dashboard", { replace: true });
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
        return [] as any[];
      }
      return ((data ?? []) as any[]).map((m) => ({
        ...m,
        profile: { display_name: m.full_name, email: m.email },
      }));
    },
  });

  const updateRole = async (memberId: string, role: string) => {
    const { error } = await supabase.from("organization_members" as any).update({ role }).eq("id", memberId) as any;
    if (error) { toast.error(error.message); return; }
    toast.success("Papel atualizado.");
    queryClient.invalidateQueries({ queryKey: ["org-members", activeOrg?.id] });
  };

  const toggleActive = async (memberId: string, current: boolean) => {
    const { error } = await supabase.from("organization_members" as any).update({ is_active: !current }).eq("id", memberId) as any;
    if (error) { toast.error(error.message); return; }
    toast.success(current ? "Membro desativado." : "Membro reativado.");
    queryClient.invalidateQueries({ queryKey: ["org-members", activeOrg?.id] });
  };

  const approveMember = async (memberId: string) => {
    const { error } = await supabase.from("organization_members" as any).update({
      approval_status: "approved",
      is_active: true,
      approved_at: new Date().toISOString(),
    }).eq("id", memberId) as any;
    if (error) { toast.error(error.message); return; }
    toast.success("Corretor aprovado!");
    queryClient.invalidateQueries({ queryKey: ["org-members", activeOrg?.id] });
  };

  const rejectMember = async (memberId: string) => {
    const { error } = await supabase.from("organization_members" as any).update({
      approval_status: "rejected",
      is_active: false,
    }).eq("id", memberId) as any;
    if (error) { toast.error(error.message); return; }
    toast.success("Solicitação rejeitada.");
    queryClient.invalidateQueries({ queryKey: ["org-members", activeOrg?.id] });
  };

  // Sempre usa o domínio público (não a URL de preview do editor) para o link compartilhável.
  const publicOrigin = (() => {
    if (typeof window === "undefined") return "https://copilotbroker.lovable.app";
    const host = window.location.hostname;
    // Em ambientes de preview/sandbox do editor, força o domínio publicado.
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

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestão da Equipe</h1>
          <p className="text-sm text-muted-foreground">Membros, papéis e limites do plano.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} disabled={limitReached}>
          <UserPlus className="h-4 w-4 mr-2" />Convidar membro
        </Button>
      </div>

      {features.max_brokers && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Limite de Corretores</span>
              {limitReached ? (
                <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Limite atingido</Badge>
              ) : (
                <Badge variant="outline">{rem} vaga(s) disponível(is)</Badge>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Link público de cadastro de corretor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4" />Link público de cadastro
          </CardTitle>
          <CardDescription>
            Compartilhe este link com seus corretores. As solicitações aparecerão abaixo para aprovação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input readOnly value={inviteUrl} className="font-mono text-xs" />
            <Button variant="outline" onClick={copyInvite}><Copy className="h-4 w-4 mr-2" />Copiar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Pendentes */}
      {(() => {
        const pendentes = (members ?? []).filter((m: any) => m.approval_status === "pending");
        if (pendentes.length === 0) return null;
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Solicitações pendentes ({pendentes.length})</CardTitle>
              <CardDescription>Corretores que se cadastraram via link público.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Corretor</TableHead>
                    <TableHead>Solicitado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendentes.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="font-medium">{m.profile?.display_name ?? m.profile?.email ?? m.user_id.slice(0, 8)}</div>
                        {m.profile?.email && m.profile?.display_name && (
                          <div className="text-xs text-muted-foreground">{m.profile.email}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {m.joined_at ? new Date(m.joined_at).toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" onClick={() => approveMember(m.id)}>
                          <Check className="h-3.5 w-3.5 mr-1" />Aprovar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => rejectMember(m.id)}>
                          <X className="h-3.5 w-3.5 mr-1" />Rejeitar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })()}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membros ativos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membro</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entrou em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(members ?? []).filter((m: any) => m.approval_status !== "pending").map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-medium">{m.profile?.display_name ?? m.profile?.email ?? m.user_id.slice(0, 8)}</div>
                      {m.profile?.email && m.profile?.display_name && (
                        <div className="text-xs text-muted-foreground">{m.profile.email}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select value={m.role} onValueChange={(v) => updateRole(m.id, v)} disabled={activeOrgRole !== "owner" && activeOrgRole !== "manager" && !isSuperAdmin}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {m.approval_status === "rejected"
                        ? <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">Rejeitado</Badge>
                        : m.is_active
                        ? <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Ativo</Badge>
                        : <Badge variant="outline">Inativo</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.joined_at ? new Date(m.joined_at).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => toggleActive(m.id, m.is_active)}>
                        {m.is_active ? "Desativar" : "Reativar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {activeOrg && (
        <InviteMemberDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          organizationId={activeOrg.id}
          onInvited={() => queryClient.invalidateQueries({ queryKey: ["org-members", activeOrg.id] })}
        />
      )}
    </div>
  );
};

export default AdminOrganizationTeam;
