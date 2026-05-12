import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const matrix = [
  { perm: "Atender leads (Inbox + Copiloto)", roles: { manager: true, leader: true, broker: true } },
  { perm: "Ver dashboard pessoal", roles: { manager: true, leader: true, broker: true } },
  { perm: "Ver leads próprios", roles: { manager: true, leader: true, broker: true } },
  { perm: "Ver leads da equipe", roles: { manager: true, leader: true, broker: false } },
  { perm: "Ver leads de toda a imobiliária", roles: { manager: true, leader: false, broker: false } },
  { perm: "Gerenciar corretores e equipes", roles: { manager: true, leader: false, broker: false } },
  { perm: "Configurar roletas e distribuição", roles: { manager: true, leader: false, broker: false } },
  { perm: "Gerenciar empreendimentos e landing pages", roles: { manager: true, leader: false, broker: false } },
  { perm: "Configurar WhatsApp global da imobiliária", roles: { manager: true, leader: false, broker: false } },
  { perm: "Ver dashboard e performance da equipe", roles: { manager: true, leader: true, broker: false } },
  { perm: "Trocar plano e dados de cobrança", roles: { manager: true, leader: false, broker: false } },
];

const roles = ["manager", "leader", "broker"] as const;
const roleLabels: Record<typeof roles[number], string> = {
  manager: "Gerente",
  leader: "Líder",
  broker: "Corretor",
};

const AdminOrganizationPermissions = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-4 p-6 pt-safe max-w-5xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/admin/organizacao")}
        className="-ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />Voltar para Organização
      </Button>

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
                {roles.map((r) => <TableHead key={r} className="text-center">{roleLabels[r]}</TableHead>)}
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
