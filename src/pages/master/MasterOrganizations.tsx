import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Check, X, Clock } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { CreateOrganizationDialog } from "@/components/master/CreateOrganizationDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

const fetchOrgs = async () => {
  const { data, error } = await supabase
    .from("organizations" as any)
    .select(`
      id, name, slug, status, created_at, contact_email, contact_phone,
      subscription:organization_subscriptions(status, plan:plans(name)),
      members:organization_members(count)
    `)
    .order("created_at", { ascending: false }) as any;
  if (error) throw error;
  return data as any[];
};

const statusColor: Record<string, string> = {
  active: "bg-green-500/10 text-green-600 border-green-500/30",
  trial: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  suspended: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  canceled: "bg-red-500/10 text-red-600 border-red-500/30",
  pending_approval: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  rejected: "bg-red-500/10 text-red-600 border-red-500/30",
};

const MasterOrganizations = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("active");
  const queryClient = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data, isLoading, refetch } = useQuery({ queryKey: ["master-orgs"], queryFn: fetchOrgs });

  const list = data ?? [];
  const pending = list.filter((o: any) => o.status === "pending_approval");
  const others = list.filter((o: any) => o.status !== "pending_approval");

  const filterText = (arr: any[]) =>
    arr.filter((o: any) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase())
    );

  const approve = async (orgId: string) => {
    setBusyId(orgId);
    const { data: res, error } = await supabase.functions.invoke("master-approve-organization", {
      body: { organization_id: orgId, action: "approve" },
    });
    setBusyId(null);
    if (error || (res as any)?.error) {
      toast.error((res as any)?.error ?? error?.message ?? "Erro ao aprovar");
      return;
    }
    toast.success("Imobiliária aprovada!");
    queryClient.invalidateQueries({ queryKey: ["master-orgs"] });
  };

  const reject = async () => {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id);
    const { data: res, error } = await supabase.functions.invoke("master-approve-organization", {
      body: { organization_id: rejectTarget.id, action: "reject", rejection_reason: rejectReason || null },
    });
    setBusyId(null);
    if (error || (res as any)?.error) {
      toast.error((res as any)?.error ?? error?.message ?? "Erro ao rejeitar");
      return;
    }
    toast.success("Imobiliária rejeitada.");
    setRejectTarget(null);
    setRejectReason("");
    queryClient.invalidateQueries({ queryKey: ["master-orgs"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Imobiliárias</h1>
          <p className="text-sm text-muted-foreground">Gerencie todos os tenants da plataforma.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Nova imobiliária</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">Ativas / Outras ({others.length})</TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-3.5 w-3.5" />
            Pendentes
            {pending.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5">{pending.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <Input placeholder="Buscar por nome ou slug..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm my-4" />

        <TabsContent value="active">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Membros</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
                ) : filterText(others).length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma imobiliária encontrada.</TableCell></TableRow>
                ) : filterText(others).map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className="font-medium">{o.name}</div>
                      <div className="text-xs text-muted-foreground">{o.slug}</div>
                    </TableCell>
                    <TableCell>{o.subscription?.[0]?.plan?.name ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColor[o.status]}>{o.status}</Badge></TableCell>
                    <TableCell>{o.members?.[0]?.count ?? 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost"><Link to={`/master/imobiliarias/${o.id}`}>Detalhes</Link></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Solicitada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
                ) : filterText(pending).length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma solicitação pendente.</TableCell></TableRow>
                ) : filterText(pending).map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className="font-medium">{o.name}</div>
                      <div className="text-xs text-muted-foreground">{o.slug}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{o.contact_email ?? "—"}</div>
                      <div className="text-muted-foreground">{o.contact_phone ?? ""}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="default" disabled={busyId === o.id} onClick={() => approve(o.id)}>
                        {busyId === o.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                        Aprovar
                      </Button>
                      <Button size="sm" variant="outline" disabled={busyId === o.id} onClick={() => setRejectTarget({ id: o.id, name: o.name })}>
                        <X className="h-3.5 w-3.5 mr-1" />Rejeitar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <CreateOrganizationDialog open={open} onOpenChange={setOpen} onCreated={() => refetch()} />

      <AlertDialog open={!!rejectTarget} onOpenChange={(v) => !v && setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar {rejectTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              A imobiliária ficará marcada como rejeitada e o responsável não poderá acessar a plataforma.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Motivo da rejeição (opcional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={reject}>Rejeitar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MasterOrganizations;
