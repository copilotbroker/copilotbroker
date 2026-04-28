import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

export const CreateOrganizationDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [planId, setPlanId] = useState<string>("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: plans } = useQuery({
    queryKey: ["plans-public"],
    queryFn: async () => {
      const { data } = await supabase.from("plans" as any).select("id,name,code").order("sort_order") as any;
      return data ?? [];
    },
    enabled: open,
  });

  const submit = async () => {
    if (!name || !slug || !planId) {
      toast.error("Preencha nome, slug e plano.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("master-create-organization", {
      body: { name, slug, plan_id: planId, owner_email: ownerEmail || null },
    });
    setLoading(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Erro ao criar imobiliária.");
      return;
    }
    toast.success("Imobiliária criada com sucesso.");
    onOpenChange(false);
    setName(""); setSlug(""); setPlanId(""); setOwnerEmail("");
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Imobiliária</DialogTitle>
          <DialogDescription>Cria o tenant com plano inicial e (opcionalmente) convida o owner.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }} placeholder="Imobiliária Exemplo" />
          </div>
          <div>
            <Label>Slug (URL)</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="imobiliaria-exemplo" />
          </div>
          <div>
            <Label>Plano inicial</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
              <SelectContent>
                {(plans ?? []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>E-mail do owner (opcional)</Label>
            <Input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="owner@empresa.com" />
            <p className="text-xs text-muted-foreground mt-1">Se informado, será adicionado como owner caso já tenha conta.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
