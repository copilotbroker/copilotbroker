import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const fetchPlans = async () => {
  const { data: plans } = await supabase.from("plans" as any).select("*").order("sort_order") as any;
  const { data: features } = await supabase.from("plan_features" as any).select("*") as any;
  const featuresByPlan: Record<string, any[]> = {};
  for (const f of features ?? []) {
    (featuresByPlan[f.plan_id] ??= []).push(f);
  }
  return { plans: plans ?? [], featuresByPlan };
};

const fmtFeatureValue = (f: any) => {
  if (f.value_int != null) return f.value_int.toString();
  if (f.value_bool != null) return f.value_bool ? "✓ Habilitado" : "✗ Desabilitado";
  return f.value_text ?? "—";
};

const MasterPlans = () => {
  const { data, isLoading } = useQuery({ queryKey: ["master-plans"], queryFn: fetchPlans });

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Planos</h1>
        <p className="text-sm text-muted-foreground">Catálogo de planos e seus limites/recursos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.plans.map((p: any) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {p.name}
                {!p.is_public && <Badge variant="secondary">Interno</Badge>}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{p.code}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">
                R$ {(p.price_cents / 100).toLocaleString("pt-BR")}
                <span className="text-sm text-muted-foreground"> / {p.billing_period}</span>
              </div>
              {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
              <div className="border-t pt-2 mt-2 space-y-1">
                {(data.featuresByPlan[p.id] ?? []).map((f) => (
                  <div key={f.feature_key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{f.feature_key}</span>
                    <span className="font-medium">{fmtFeatureValue(f)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MasterPlans;
