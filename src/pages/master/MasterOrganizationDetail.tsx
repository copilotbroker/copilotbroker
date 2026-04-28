import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const fetchOrgDetail = async (id: string) => {
  const [orgRes, subRes, membersRes, auditRes, plansRes, overridesRes] = await Promise.all([
    supabase.from("organizations" as any).select("*").eq("id", id).single() as any,
    supabase.from("organization_subscriptions" as any).select("*, plan:plans(*)").eq("organization_id", id).order("started_at", { ascending: false }).limit(1).maybeSingle() as any,
    supabase.from("organization_members" as any).select("*").eq("organization_id", id) as any,
    supabase.from("admin_audit_logs" as any).select("*").eq("organization_id", id).order("created_at", { ascending: false }).limit(50) as any,
    supabase.from("plans" as any).select("id,name").eq("is_active", true).order("sort_order") as any,
    supabase.from("organization_feature_overrides" as any).select("*").eq("organization_id", id).order("created_at", { ascending: false }) as any,
  ]);

  const planId = subRes.data?.plan_id ?? null;
  let features: any[] = [];
  if (planId) {
    const fr = await supabase.from("plan_features" as any).select("*").eq("plan_id", planId) as any;
    features = fr.data ?? [];
  }

  const memberUserIds = (membersRes.data ?? []).map((m: any) => m.user_id);
  const [brokersByUserRes, emailsRes] = await Promise.all([
    memberUserIds.length
      ? (supabase.from("brokers" as any).select("user_id,name,email").in("user_id", memberUserIds) as any)
      : Promise.resolve({ data: [] }),
    memberUserIds.length
      ? (supabase.rpc("get_users_emails" as any, { _user_ids: memberUserIds }) as any)
      : Promise.resolve({ data: [] }),
  ]);
  const brokerMap = new Map<string, { name: string; email: string }>();
  (brokersByUserRes.data ?? []).forEach((b: any) => brokerMap.set(b.user_id, { name: b.name, email: b.email }));
  const emailMap = new Map<string, string>();
  (emailsRes.data ?? []).forEach((r: any) => emailMap.set(r.user_id, r.email));
  const enrichedMembers = (membersRes.data ?? []).map((m: any) => ({
    ...m,
    broker: brokerMap.get(m.user_id) ?? null,
    email: brokerMap.get(m.user_id)?.email ?? emailMap.get(m.user_id) ?? null,
  }));

  const [brokersC, instancesC, projectsC] = await Promise.all([
    supabase.from("brokers" as any).select("id", { count: "exact", head: true }).eq("organization_id", id).eq("is_active", true) as any,
    supabase.from("broker_whatsapp_instances" as any).select("id", { count: "exact", head: true }).eq("organization_id", id) as any,
    supabase.from("projects" as any).select("id", { count: "exact", head: true }).eq("organization_id", id) as any,
  ]);

  return {
    org: orgRes.data,
    subscription: subRes.data,
    members: enrichedMembers,
    audit: auditRes.data ?? [],
    plans: plansRes.data ?? [],
    features,
    overrides: overridesRes.data ?? [],
    usage: { brokers: brokersC.count ?? 0, whatsapp: instancesC.count ?? 0, projects: projectsC.count ?? 0 },
  };
};

const featureLabel = (k: string) => ({
  max_brokers: "Corretores",
  max_whatsapp_instances: "Instâncias WhatsApp",
  max_landing_pages: "Landing Pages",
  "feature.copilot_ai": "Copilot AI",
  "feature.automations": "Automações",
  "feature.dashboards_advanced": "Dashboards avançados",
  "feature.whatsapp_global": "WhatsApp Global",
}[k] ?? k);

const usageFor = (k: string, u: any) => ({
  max_brokers: u.brokers,
  max_whatsapp_instances: u.whatsapp,
  max_landing_pages: u.projects,
}[k] ?? 0);

const OVERRIDE_OPTIONS = [
  { key: "max_brokers", label: "Corretores", type: "limit" },
  { key: "max_whatsapp_instances", label: "Instâncias WhatsApp", type: "limit" },
  { key: "max_landing_pages", label: "Landing Pages", type: "limit" },
  { key: "feature.copilot_ai", label: "Copilot AI", type: "boolean" },
  { key: "feature.automations", label: "Automações", type: "boolean" },
  { key: "feature.dashboards_advanced", label: "Dashboards avançados", type: "boolean" },
  { key: "feature.whatsapp_global", label: "WhatsApp Global", type: "boolean" },
];

const MasterOrganizationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["master-org", id], queryFn: () => fetchOrgDetail(id!), enabled: !!id });
  const [newPlan, setNewPlan] = useState("");

  // Override form
  const [ovrKey, setOvrKey] = useState("");
  const [ovrValue, setOvrValue] = useState("");
  const [ovrExpires, setOvrExpires] = useState("");
  const [ovrReason, setOvrReason] = useState("");

  if (isLoading || !data) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const callServer = async (fn: string, body: any, successMsg: string) => {
    const { data: res, error } = await supabase.functions.invoke(fn, { body });
    if (error || (res as any)?.error) {
      toast.error((res as any)?.error || error?.message || "Erro");
      return;
    }
    toast.success(successMsg);
    queryClient.invalidateQueries({ queryKey: ["master-org", id] });
    queryClient.invalidateQueries({ queryKey: ["master-orgs"] });
  };

  const toggleStatus = (newStatus: "active" | "suspended" | "canceled") =>
    callServer("master-toggle-organization-status", { organization_id: id, status: newStatus }, `Status alterado para ${newStatus}.`);

  const changePlan = () => {
    if (!newPlan) return;
    callServer("master-update-subscription", { organization_id: id, plan_id: newPlan }, "Plano atualizado.");
  };

  const addOverride = async () => {
    if (!ovrKey || !ovrValue) return toast.error("Selecione a feature e o valor.");
    const { data: userData } = await supabase.auth.getUser();
    const payload: any = {
      organization_id: id,
      feature_key: ovrKey,
      feature_value: ovrValue,
      reason: ovrReason || null,
      expires_at: ovrExpires ? new Date(ovrExpires).toISOString() : null,
      granted_by: userData.user?.id ?? null,
    };
    const { error } = await (supabase.from("organization_feature_overrides" as any).insert(payload) as any);
    if (error) return toast.error(error.message);
    await supabase.from("admin_audit_logs" as any).insert({
      actor_user_id: userData.user?.id, organization_id: id,
      action: "feature_override_granted", entity: "organization_feature_overrides",
      metadata: { feature_key: ovrKey, feature_value: ovrValue, expires_at: payload.expires_at, reason: ovrReason || null },
    } as any);
    toast.success("Override aplicado.");
    setOvrKey(""); setOvrValue(""); setOvrExpires(""); setOvrReason("");
    queryClient.invalidateQueries({ queryKey: ["master-org", id] });
  };

  const removeOverride = async (overrideId: string, fkey: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await (supabase.from("organization_feature_overrides" as any).delete().eq("id", overrideId) as any);
    if (error) return toast.error(error.message);
    await supabase.from("admin_audit_logs" as any).insert({
      actor_user_id: userData.user?.id, organization_id: id,
      action: "feature_override_revoked", entity: "organization_feature_overrides",
      entity_id: overrideId, metadata: { feature_key: fkey },
    } as any);
    toast.success("Override removido.");
    queryClient.invalidateQueries({ queryKey: ["master-org", id] });
  };

  const ovrType = OVERRIDE_OPTIONS.find((o) => o.key === ovrKey)?.type ?? "limit";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{data.org.name}</h1>
          <p className="text-sm text-muted-foreground">{data.org.slug}</p>
        </div>
        <Badge variant="outline">{data.org.status}</Badge>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="members">Usuários ({data.members.length})</TabsTrigger>
          <TabsTrigger value="plan">Plano</TabsTrigger>
          <TabsTrigger value="overrides">Overrides ({data.overrides.length})</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
          <TabsTrigger value="danger">Ações Perigosas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Plano e Uso</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">Plano atual: <span className="font-semibold">{data.subscription?.plan?.name ?? "—"}</span></div>
              {data.features.filter((f: any) => f.feature_type === "limit").map((f: any) => {
                const limit = parseInt(f.feature_value, 10) || 0;
                const used = usageFor(f.feature_key, data.usage);
                const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
                return (
                  <div key={f.feature_key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{featureLabel(f.feature_key)}</span>
                      <span className="text-muted-foreground">{used} / {limit}</span>
                    </div>
                    <Progress value={pct} />
                  </div>
                );
              })}
              {data.features.filter((f: any) => f.feature_type === "boolean").length > 0 && (
                <div className="border-t pt-3 space-y-1">
                  {data.features.filter((f: any) => f.feature_type === "boolean").map((f: any) => (
                    <div key={f.feature_key} className="flex justify-between text-sm">
                      <span>{featureLabel(f.feature_key)}</span>
                      <span className={f.feature_value === "true" ? "text-primary" : "text-muted-foreground"}>
                        {f.feature_value === "true" ? "Habilitado" : "Desabilitado"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardContent className="pt-6 space-y-2">
              {data.members.map((m: any) => (
                <div key={m.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <div className="font-medium">{m.broker?.name ?? m.broker?.email ?? m.user_id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.broker?.email ? `${m.broker.email} · ` : ""}{m.role} · {m.is_active ? "ativo" : "inativo"}
                    </div>
                  </div>
                </div>
              ))}
              {data.members.length === 0 && <p className="text-sm text-muted-foreground">Sem membros ainda.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan">
          <Card>
            <CardHeader><CardTitle>Trocar Plano</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger className="w-72"><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
                <SelectContent>
                  {data.plans.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={changePlan} disabled={!newPlan}>Aplicar mudança</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overrides" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Liberações manuais (add-ons)</CardTitle>
              <p className="text-sm text-muted-foreground">Sobrescreve o limite/feature do plano para esta organização. Pode ter prazo de validade.</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.overrides.map((o: any) => {
                const expired = o.expires_at && new Date(o.expires_at) < new Date();
                return (
                  <div key={o.id} className="flex items-start justify-between border rounded-md p-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{featureLabel(o.feature_key)}</span>
                        <Badge variant={expired ? "outline" : "default"}>{o.feature_value}</Badge>
                        {expired && <Badge variant="destructive">Expirado</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {o.expires_at ? `Expira: ${new Date(o.expires_at).toLocaleString("pt-BR")}` : "Sem prazo"}
                        {o.reason && ` · ${o.reason}`}
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeOverride(o.id, o.feature_key)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                );
              })}
              {data.overrides.length === 0 && <p className="text-sm text-muted-foreground">Sem overrides ativos.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Adicionar override</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Feature</Label>
                  <Select value={ovrKey} onValueChange={(v) => { setOvrKey(v); setOvrValue(""); }}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {OVERRIDE_OPTIONS.map((o) => (
                        <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor</Label>
                  {ovrType === "boolean" ? (
                    <Select value={ovrValue} onValueChange={setOvrValue}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Habilitado</SelectItem>
                        <SelectItem value="false">Desabilitado</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input type="number" value={ovrValue} onChange={(e) => setOvrValue(e.target.value)} placeholder="Ex.: 12" />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Expira em (opcional)</Label>
                  <Input type="datetime-local" value={ovrExpires} onChange={(e) => setOvrExpires(e.target.value)} />
                </div>
                <div>
                  <Label>Motivo</Label>
                  <Input value={ovrReason} onChange={(e) => setOvrReason(e.target.value)} placeholder="Ex.: cortesia onboarding" />
                </div>
              </div>
              <Button onClick={addOverride} disabled={!ovrKey || !ovrValue}><Plus className="h-4 w-4 mr-2" /> Aplicar override</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardContent className="pt-6 space-y-2">
              {data.audit.map((a: any) => (
                <div key={a.id} className="border-b pb-2 text-sm">
                  <div className="font-medium">{a.action} {a.entity ? `· ${a.entity}` : ""}</div>
                  <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-BR")}</div>
                </div>
              ))}
              {data.audit.length === 0 && <p className="text-sm text-muted-foreground">Sem registros.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="space-y-3">
          <Card>
            <CardHeader><CardTitle className="text-destructive">Ações Perigosas</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" onClick={() => toggleStatus("suspended")}>Suspender acesso</Button>
              <Button variant="outline" onClick={() => toggleStatus("active")}>Reativar</Button>
              <Button variant="destructive" onClick={() => toggleStatus("canceled")}>Cancelar conta</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MasterOrganizationDetail;
