import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Activity, AlertCircle, PauseCircle, CreditCard, Loader2 } from "lucide-react";

const fetchOverview = async () => {
  const [orgsRes, brokersRes, subsRes] = await Promise.all([
    supabase.from("organizations" as any).select("id,status,created_at") as any,
    supabase.from("brokers" as any).select("id", { count: "exact", head: true }).eq("is_active", true) as any,
    supabase.from("organization_subscriptions" as any).select("status,plan:plans(price_cents,billing_period)") as any,
  ]);

  const orgs = (orgsRes.data ?? []) as Array<{ status: string; created_at: string }>;
  const subs = (subsRes.data ?? []) as Array<{ status: string; plan: { price_cents: number; billing_period: string } | null }>;

  const counters = {
    total: orgs.length,
    active: orgs.filter((o) => o.status === "active").length,
    trial: orgs.filter((o) => o.status === "trial").length,
    suspended: orgs.filter((o) => o.status === "suspended").length,
    canceled: orgs.filter((o) => o.status === "canceled").length,
    inactive: orgs.filter((o) => o.status === "suspended" || o.status === "canceled").length,
    delinquent: subs.filter((s) => s.status === "past_due").length,
  };

  const mrrCents = subs.reduce((sum, s) => {
    if (s.status !== "active" || !s.plan) return sum;
    const monthly = s.plan.billing_period === "yearly" ? s.plan.price_cents / 12 : s.plan.price_cents;
    return sum + monthly;
  }, 0);

  return { counters, brokers: brokersRes.count ?? 0, mrr: mrrCents / 100 };
};

const KpiCard = ({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string | number; hint?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </CardContent>
  </Card>
);

const MasterOverview = () => {
  const { data, isLoading } = useQuery({ queryKey: ["master-overview"], queryFn: fetchOverview });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const c = data?.counters;
  const health = c?.total ? Math.round(((c.active + c.trial) / c.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Visão Geral</h1>
        <p className="text-sm text-muted-foreground">KPIs globais da operação Copilot Broker.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard icon={Building2} label="Imobiliárias" value={c?.total ?? 0} hint={`${c?.active ?? 0} ativas`} />
        <KpiCard icon={Activity} label="Em Trial" value={c?.trial ?? 0} />
        <KpiCard icon={Users} label="Corretores ativos" value={data?.brokers ?? 0} />
        <KpiCard icon={PauseCircle} label="Inativas" value={c?.inactive ?? 0} hint={`${c?.suspended ?? 0} suspensas · ${c?.canceled ?? 0} canceladas`} />
        <KpiCard icon={CreditCard} label="Inadimplentes" value={c?.delinquent ?? 0} hint="assinaturas em past_due" />
        <KpiCard icon={AlertCircle} label="Saúde da base" value={`${health}%`} hint="ativas + trial / total" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MRR Estimado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">R$ {(data?.mrr ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
          <p className="text-xs text-muted-foreground mt-1">Soma das assinaturas ativas (mensalizado).</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MasterOverview;
