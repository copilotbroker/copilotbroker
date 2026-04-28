import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

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
  if (f.feature_type === "boolean") return f.feature_value === "true" ? "✓ Habilitado" : "✗ Desabilitado";
  return f.feature_value ?? "—";
};

const FEATURE_PRESETS = [
  { key: "max_brokers", label: "Limite de corretores", type: "limit" },
  { key: "max_whatsapp_instances", label: "Limite de instâncias WhatsApp", type: "limit" },
  { key: "max_landing_pages", label: "Limite de landing pages", type: "limit" },
  { key: "feature.copilot_ai", label: "Copilot AI", type: "boolean" },
  { key: "feature.automations", label: "Automações", type: "boolean" },
  { key: "feature.dashboards_advanced", label: "Dashboards avançados", type: "boolean" },
  { key: "feature.whatsapp_global", label: "WhatsApp Global / Plantão", type: "boolean" },
];

const PlanFormDialog = ({ plan, onClose }: { plan?: any; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    code: plan?.code ?? "",
    name: plan?.name ?? "",
    description: plan?.description ?? "",
    price_cents: plan?.price_cents ?? 0,
    billing_period: plan?.billing_period ?? "monthly",
    is_public: plan?.is_public ?? true,
    is_active: plan?.is_active ?? true,
    sort_order: plan?.sort_order ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const payload = { ...form, price_cents: Number(form.price_cents) || 0, sort_order: Number(form.sort_order) || 0 };
    const { error } = plan
      ? await (supabase.from("plans" as any).update(payload).eq("id", plan.id) as any)
      : await (supabase.from("plans" as any).insert(payload) as any);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(plan ? "Plano atualizado." : "Plano criado.");
    queryClient.invalidateQueries({ queryKey: ["master-plans"] });
    onClose();
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{plan ? "Editar plano" : "Novo plano"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Código</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="starter" /></div>
          <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Starter" /></div>
        </div>
        <div><Label>Descrição</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Preço (R$)</Label><Input type="number" value={Number(form.price_cents) / 100} onChange={(e) => setForm({ ...form, price_cents: Math.round(Number(e.target.value) * 100) })} /></div>
          <div>
            <Label>Período</Label>
            <Select value={form.billing_period} onValueChange={(v) => setForm({ ...form, billing_period: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
                <SelectItem value="custom">Customizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Ordem</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_public} onCheckedChange={(c) => setForm({ ...form, is_public: c })} /> Público</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} /> Ativo</label>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar</Button>
      </DialogFooter>
    </DialogContent>
  );
};

const FeatureEditor = ({ planId, features }: { planId: string; features: any[] }) => {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [presetKey, setPresetKey] = useState("");
  const [customKey, setCustomKey] = useState("");
  const [value, setValue] = useState("");
  const [type, setType] = useState<"limit" | "boolean" | "text">("limit");

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["master-plans"] });

  const usingPreset = presetKey && presetKey !== "__custom__";
  const finalKey = usingPreset ? presetKey : customKey.trim();
  const finalType = usingPreset ? FEATURE_PRESETS.find((p) => p.key === presetKey)?.type ?? "limit" : type;

  const addFeature = async () => {
    if (!finalKey) return toast.error("Informe a chave da feature.");
    if (!value) return toast.error("Informe o valor.");
    const finalValue = finalType === "boolean" ? (value === "true" ? "true" : "false") : value;
    const { error } = await (supabase.from("plan_features" as any).insert({
      plan_id: planId, feature_key: finalKey, feature_value: finalValue, feature_type: finalType,
    }) as any);
    if (error) return toast.error(error.message);
    toast.success("Feature adicionada.");
    setAdding(false); setPresetKey(""); setCustomKey(""); setValue(""); setType("limit");
    refresh();
  };

  const updateFeature = async (id: string, newValue: string) => {
    const { error } = await (supabase.from("plan_features" as any).update({ feature_value: newValue }).eq("id", id) as any);
    if (error) return toast.error(error.message);
    toast.success("Atualizado.");
    refresh();
  };

  const deleteFeature = async (id: string) => {
    const { error } = await (supabase.from("plan_features" as any).delete().eq("id", id) as any);
    if (error) return toast.error(error.message);
    refresh();
  };

  return (
    <div className="space-y-2">
      {features.map((f) => (
        <div key={f.id} className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground flex-1 truncate">{f.feature_key}</span>
          {f.feature_type === "boolean" ? (
            <Switch checked={f.feature_value === "true"} onCheckedChange={(c) => updateFeature(f.id, c ? "true" : "false")} />
          ) : (
            <Input className="h-7 w-24" defaultValue={f.feature_value} onBlur={(e) => e.target.value !== f.feature_value && updateFeature(f.id, e.target.value)} />
          )}
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteFeature(f.id)}><X className="h-3 w-3" /></Button>
        </div>
      ))}
      {adding ? (
        <div className="space-y-2 border-t pt-2">
          <Select value={presetKey} onValueChange={(v) => { setPresetKey(v); if (v !== "__custom__") { const p = FEATURE_PRESETS.find((x) => x.key === v); if (p) setType(p.type as any); } }}>
            <SelectTrigger className="h-8"><SelectValue placeholder="Selecione uma feature" /></SelectTrigger>
            <SelectContent>
              {FEATURE_PRESETS.filter((p) => !features.some((f) => f.feature_key === p.key)).map((p) => (
                <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
              ))}
              <SelectItem value="__custom__">Customizada…</SelectItem>
            </SelectContent>
          </Select>
          {presetKey === "__custom__" && (
            <div className="flex gap-2">
              <Input className="h-8" placeholder="feature.minha_chave" value={customKey} onChange={(e) => setCustomKey(e.target.value)} />
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="limit">Número</SelectItem>
                  <SelectItem value="boolean">Booleano</SelectItem>
                  <SelectItem value="text">Texto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {finalType === "boolean" ? (
            <Select value={value} onValueChange={setValue}>
              <SelectTrigger className="h-8"><SelectValue placeholder="Valor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Habilitado</SelectItem>
                <SelectItem value="false">Desabilitado</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input className="h-8" placeholder="Valor" value={value} onChange={(e) => setValue(e.target.value)} />
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={addFeature}>Adicionar</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="w-full" onClick={() => setAdding(true)}><Plus className="h-3 w-3 mr-1" /> Feature</Button>
      )}
    </div>
  );
};

const MasterPlans = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["master-plans"], queryFn: fetchPlans });
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const deletePlan = async (id: string) => {
    if (!confirm("Excluir este plano? Organizações que o usam continuarão vinculadas.")) return;
    const { error } = await (supabase.from("plans" as any).delete().eq("id", id) as any);
    if (error) return toast.error(error.message);
    toast.success("Plano removido.");
    queryClient.invalidateQueries({ queryKey: ["master-plans"] });
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planos</h1>
          <p className="text-sm text-muted-foreground">Catálogo de planos, limites e recursos.</p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Novo plano</Button></DialogTrigger>
          {creating && <PlanFormDialog onClose={() => setCreating(false)} />}
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.plans.map((p: any) => (
          <Card key={p.id} className={!p.is_active ? "opacity-60" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{p.name}</span>
                <div className="flex gap-1">
                  {!p.is_public && <Badge variant="secondary">Interno</Badge>}
                  {!p.is_active && <Badge variant="outline">Inativo</Badge>}
                </div>
              </CardTitle>
              <p className="text-xs text-muted-foreground">{p.code}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold">
                R$ {(p.price_cents / 100).toLocaleString("pt-BR")}
                <span className="text-sm text-muted-foreground font-normal"> / {p.billing_period}</span>
              </div>
              {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
              <div className="border-t pt-3">
                <FeatureEditor planId={p.id} features={data.featuresByPlan[p.id] ?? []} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditing(p)}><Pencil className="h-3 w-3 mr-1" /> Editar</Button>
                <Button size="sm" variant="ghost" onClick={() => deletePlan(p.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {data?.plans.length === 0 && <p className="text-sm text-muted-foreground col-span-full">Nenhum plano cadastrado.</p>}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && <PlanFormDialog plan={editing} onClose={() => setEditing(null)} />}
      </Dialog>
    </div>
  );
};

export default MasterPlans;
