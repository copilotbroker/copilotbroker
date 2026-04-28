import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const fetchAudit = async () => {
  const { data } = await supabase
    .from("admin_audit_logs" as any)
    .select("*, organization:organizations(name)")
    .order("created_at", { ascending: false })
    .limit(200) as any;
  return data ?? [];
};

const MasterAudit = () => {
  const { data, isLoading } = useQuery({ queryKey: ["master-audit"], queryFn: fetchAudit });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Auditoria</h1>
        <p className="text-sm text-muted-foreground">Últimas 200 ações administrativas.</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-2">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          ) : data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sem registros.</p>
          ) : data.map((a: any) => (
            <div key={a.id} className="border-b pb-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{a.action}{a.entity ? ` · ${a.entity}` : ""}</span>
                <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-BR")}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {a.organization?.name ?? "Global"}
                {a.metadata && Object.keys(a.metadata).length > 0 && (
                  <span className="ml-2">· {JSON.stringify(a.metadata)}</span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default MasterAudit;
