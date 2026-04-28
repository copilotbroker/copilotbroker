import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { CreateOrganizationDialog } from "@/components/master/CreateOrganizationDialog";

const fetchOrgs = async () => {
  const { data, error } = await supabase
    .from("organizations" as any)
    .select(`
      id, name, slug, status, created_at,
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
};

const MasterOrganizations = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { data, isLoading, refetch } = useQuery({ queryKey: ["master-orgs"], queryFn: fetchOrgs });

  const filtered = (data ?? []).filter((o: any) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Imobiliárias</h1>
          <p className="text-sm text-muted-foreground">Gerencie todos os tenants da plataforma.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Nova imobiliária</Button>
      </div>

      <Input placeholder="Buscar por nome ou slug..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

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
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma imobiliária encontrada.</TableCell></TableRow>
            ) : filtered.map((o: any) => (
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

      <CreateOrganizationDialog open={open} onOpenChange={setOpen} onCreated={() => refetch()} />
    </div>
  );
};

export default MasterOrganizations;
