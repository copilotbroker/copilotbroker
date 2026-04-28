import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Loader2 } from "lucide-react";

const ROLES = ["admin", "manager", "leader", "broker"] as const;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  organizationId: string;
  onInvited?: () => void;
}

export const InviteMemberDialog = ({ open, onOpenChange, organizationId, onInvited }: Props) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<typeof ROLES[number]>("broker");
  const [loading, setLoading] = useState(false);
  const [acceptUrl, setAcceptUrl] = useState<string | null>(null);

  const submit = async () => {
    if (!email) { toast.error("Informe o e-mail."); return; }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("master-invite-user", {
      body: { organization_id: organizationId, email, role },
    });
    setLoading(false);
    if (error || (data as any)?.error) {
      const code = (data as any)?.error;
      const msg = code === "plan_limit_reached"
        ? `Limite do plano atingido (${(data as any).limit} corretores). Faça upgrade.`
        : code || error?.message || "Erro ao criar convite.";
      toast.error(msg);
      return;
    }
    const rawUrl: string = (data as any).accept_url || "";
    const normalized = (() => {
      try {
        const u = new URL(rawUrl);
        const host = u.hostname;
        if (host.includes("id-preview--") || host.endsWith(".lovableproject.com") || host.endsWith(".lovable.dev") || host.endsWith(".lovable.app") && host !== "copilotbroker.lovable.app") {
          return `https://copilotbroker.lovable.app${u.pathname}${u.search}`;
        }
        return rawUrl;
      } catch {
        return rawUrl;
      }
    })();
    setAcceptUrl(normalized);
    toast.success("Convite criado. Compartilhe o link abaixo.");
    onInvited?.();
  };

  const reset = () => { setEmail(""); setRole("broker"); setAcceptUrl(null); };

  const copy = async () => {
    if (!acceptUrl) return;
    await navigator.clipboard.writeText(acceptUrl);
    toast.success("Link copiado!");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar membro</DialogTitle>
          <DialogDescription>Envia o link de aceite para o e-mail informado entrar na imobiliária.</DialogDescription>
        </DialogHeader>

        {!acceptUrl ? (
          <div className="space-y-3">
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@empresa.com" />
            </div>
            <div>
              <Label>Papel</Label>
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Link do convite (válido por 7 dias)</Label>
            <div className="flex gap-2">
              <Input readOnly value={acceptUrl} />
              <Button onClick={copy} size="icon" variant="outline"><Copy className="h-4 w-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground">Envie esse link para o convidado. Ele precisa fazer login com o mesmo e-mail.</p>
          </div>
        )}

        <DialogFooter>
          {!acceptUrl ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={submit} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Criar convite
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
