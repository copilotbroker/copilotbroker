import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X } from "lucide-react";

const matrix = [
  { perm: "Ver dashboard", roles: { owner: true, admin: true, manager: true, leader: true, broker: true } },
  { perm: "Gerenciar corretores", roles: { owner: true, admin: true, manager: true, leader: false, broker: false } },
  { perm: "Configurar roletas", roles: { owner: true, admin: true, manager: true, leader: false, broker: false } },
  { perm: "Gerenciar empreendimentos", roles: { owner: true, admin: true, manager: false, leader: false, broker: false } },
  { perm: "Trocar plano da conta", roles: { owner: true, admin: false, manager: false, leader: false, broker: false } },
  { perm: "Ver leads próprios", roles: { owner: true, admin: true, manager: true, leader: true, broker: true } },
  { perm: "Ver leads do time", roles: { owner: true, admin: true, manager: true, leader: true, broker: false } },
  { perm: "Ver leads de toda imobiliária", roles: { owner: true, admin: true, manager: false, leader: false, broker: false } },
];

const roles = ["owner", "admin", "manager", "leader", "broker"] as const;

const AdminOrganizationPermissions = () => {
  return (
    <div className="space-y-4 p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Papéis e Permissões</h1>
        <p className="text-sm text-muted-foreground">Matriz informativa do que cada papel pode fazer.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Matriz de Permissões</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permissão</TableHead>
                {roles.map((r) => <TableHead key={r} className="text-center capitalize">{r}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {matrix.map((row) => (
                <TableRow key={row.perm}>
                  <TableCell className="font-medium">{row.perm}</TableCell>
                  {roles.map((r) => (
                    <TableCell key={r} className="text-center">
                      {row.roles[r]
                        ? <Check className="h-4 w-4 text-green-600 inline" />
                        : <X className="h-4 w-4 text-muted-foreground inline" />}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOrganizationPermissions;
