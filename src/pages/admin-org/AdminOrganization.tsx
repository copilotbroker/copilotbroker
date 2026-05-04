import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import { useOrganizationLimits } from "@/hooks/use-organization-limits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Settings, Palette, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const featureLabel = (k: string) => ({
  max_brokers: "Corretores",
  max_whatsapp_instances: "Instâncias WhatsApp",
  max_landing_pages: "Landing Pages",
}[k] ?? k);

const usageFor = (k: string, u: any) => ({
  max_brokers: u.brokers,
  max_whatsapp_instances: u.whatsapp_instances,
  max_landing_pages: u.landing_pages,
}[k] ?? 0);

const AdminOrganization = () => {
  const navigate = useNavigate();
  const { isLoading: orgLoading, activeOrg, isOwnerOrAdmin, isSuperAdmin } = useOrganization();
  const { isLoading: limLoading, planName, features, usage } = useOrganizationLimits();

  useEffect(() => {
    if (!orgLoading && !isOwnerOrAdmin && !isSuperAdmin) {
      navigate("/corretor/dashboard", { replace: true });
    }
  }, [orgLoading, isOwnerOrAdmin, isSuperAdmin, navigate]);

  const { data: subscription } = useQuery({
    queryKey: ["org-subscription", activeOrg?.id],
    enabled: !!activeOrg,
    queryFn: async () => {
      const { data } = await supabase
        .from("organization_subscriptions" as any)
        .select("*, plan:plans(name)")
        .eq("organization_id", activeOrg!.id)
        .in("status", ["active", "trial", "past_due"])
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle() as any;
      return data;
    },
  });

  if (orgLoading || limLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!activeOrg) {
    return <div className="p-6 text-muted-foreground">Sem organização ativa.</div>;
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/admin/crm")}
        className="-ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />Voltar para o início
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{activeOrg.name}</h1>
          <p className="text-sm text-muted-foreground">{activeOrg.slug}</p>
        </div>
        <Badge variant="outline">{activeOrg.status}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Plano Atual</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">{planName ?? "—"}</div>
            <div className="text-sm text-muted-foreground">
              Status: {subscription?.status ?? "—"}
            </div>
            {subscription?.current_period_end && (
              <div className="text-xs text-muted-foreground">
                Renovação: {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Atalhos</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/organizacao/equipe"><Users className="h-4 w-4 mr-2" />Gestão da Equipe</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/organizacao/branding"><Palette className="h-4 w-4 mr-2" />Identidade Visual</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/organizacao/permissoes"><Settings className="h-4 w-4 mr-2" />Papéis e Permissões</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Uso vs Limites do Plano</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {Object.values(features).filter((f: any) => f.feature_type === "limit").length === 0 && (
            <p className="text-sm text-muted-foreground">Plano sem limites numéricos definidos.</p>
          )}
          {Object.values(features).filter((f: any) => f.feature_type === "limit").map((f: any) => {
            const limit = parseInt(f.feature_value, 10) || 0;
            const used = usageFor(f.feature_key, usage);
            const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
            const overLimit = limit > 0 && used >= limit;
            return (
              <div key={f.feature_key}>
                <div className="flex justify-between text-sm mb-1">
                  <span>
                    {featureLabel(f.feature_key)}
                    {f.source === "override" && <span className="ml-2 text-xs text-primary">(add-on)</span>}
                  </span>
                  <span className={overLimit ? "text-destructive font-semibold" : "text-muted-foreground"}>{used} / {limit}</span>
                </div>
                <Progress value={pct} />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOrganization;
