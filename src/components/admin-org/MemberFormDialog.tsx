// Modal premium para criar (convite ou direto) e editar membros da imobiliária.
// Usa apenas tokens semânticos do design system + acentos pontuais por perfil (RoleBadge).
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { WhatsAppInput } from "@/components/ui/whatsapp-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Copy,
  Loader2,
  Mail,
  KeyRound,
  Check,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_META, type OrgRole } from "./RoleBadge";

type EditableRole = Exclude<OrgRole, "owner" | "admin">;
const SELECTABLE_ROLES: EditableRole[] = ["manager", "leader", "broker"];

interface MemberInput {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: OrgRole;
  is_active: boolean;
  whatsapp?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  organizationId: string;
  member?: MemberInput | null;
  onSaved?: () => void;
}

const generatePassword = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

export const MemberFormDialog = ({ open, onOpenChange, organizationId, member, onSaved }: Props) => {
  const isEdit = !!member;

  // Modo de criação: convite por email OU criação direta
  const [mode, setMode] = useState<"invite" | "direct">("invite");

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [role, setRole] = useState<EditableRole>("broker");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [acceptUrl, setAcceptUrl] = useState<string | null>(null);
  const [existsConfirm, setExistsConfirm] = useState(false);

  // Reset ao abrir/fechar
  useEffect(() => {
    if (!open) return;
    setExistsConfirm(false);
    if (member) {
      setFullName(member.full_name ?? "");
      setEmail(member.email);
      setWhatsapp(member.whatsapp ?? "");
      setPassword("");
      setRole((SELECTABLE_ROLES as readonly string[]).includes(member.role) ? (member.role as EditableRole) : "broker");
      setIsActive(member.is_active);
      setMode("invite");
      setAcceptUrl(null);
    } else {
      setFullName("");
      setEmail("");
      setWhatsapp("");
      setPassword(generatePassword());
      setRole("broker");
      setIsActive(true);
      setMode("invite");
      setAcceptUrl(null);
    }
  }, [open, member]);

  const submitEdit = async () => {
    if (!member) return;
    setLoading(true);
    try {
      const patch: Record<string, any> = {};
      if (member.role !== role) patch.role = role;
      if (member.is_active !== isActive) patch.is_active = isActive;
      if ((member.full_name ?? "") !== fullName.trim()) patch.full_name = fullName.trim() || null;
      if ((member.whatsapp ?? "") !== whatsapp.trim()) patch.whatsapp = whatsapp.trim() || null;

      if (Object.keys(patch).length > 0) {
        const { error } = await supabase
          .from("organization_members" as any)
          .update(patch)
          .eq("id", member.id) as any;
        if (error) throw error;
      }

      // Atualização de e-mail (auth.users) — somente se mudou
      const newEmail = email.trim().toLowerCase();
      if (newEmail && newEmail !== (member.email ?? "").toLowerCase()) {
        const { data: emailRes, error: emailErr } = await supabase.functions.invoke(
          "org-update-member-email",
          {
            body: {
              organization_id: organizationId,
              target_user_id: member.user_id,
              new_email: newEmail,
            },
          },
        );
        if (emailErr || (emailRes as any)?.error) {
          const code = (emailRes as any)?.error;
          const msg =
            code === "email_already_in_use"
              ? "Esse e-mail já está em uso por outra conta."
              : code === "invalid_email"
              ? "E-mail inválido."
              : code || emailErr?.message || "Erro ao atualizar e-mail.";
          throw new Error(msg);
        }
      }

      toast.success("Membro atualizado.");
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao atualizar membro.");
    } finally {
      setLoading(false);
    }
  };

  const submitInvite = async () => {
    if (!email.trim()) {
      toast.error("Informe o e-mail.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("master-invite-user", {
        body: { organization_id: organizationId, email: email.trim(), role },
      });
      if (error || (data as any)?.error) {
        const code = (data as any)?.error;
        const msg =
          code === "plan_limit_reached"
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
          if (
            host.includes("id-preview--") ||
            host.endsWith(".lovableproject.com") ||
            host.endsWith(".lovable.dev") ||
            (host.endsWith(".lovable.app") && host !== "copilotbroker.lovable.app")
          ) {
            return `https://copilotbroker.lovable.app${u.pathname}${u.search}`;
          }
          return rawUrl;
        } catch {
          return rawUrl;
        }
      })();
      setAcceptUrl(normalized);
      toast.success("Convite criado. Compartilhe o link.");
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar convite.");
    } finally {
      setLoading(false);
    }
  };

  const callDirect = async (linkExisting: boolean) => {
    const { data, error } = await supabase.functions.invoke("org-create-member-direct", {
      body: {
        organization_id: organizationId,
        email: email.trim(),
        full_name: fullName.trim(),
        password,
        role,
        link_existing: linkExisting,
        whatsapp: whatsapp.trim() || undefined,
      },
    });
    return { data: data as any, error };
  };

  const submitDirect = async () => {
    if (!email.trim() || !fullName.trim() || !password.trim()) {
      toast.error("Preencha nome, e-mail e senha.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await callDirect(false);
      if (error || data?.error) {
        const code = data?.error;
        if (code === "user_already_exists") {
          setExistsConfirm(true);
          return;
        }
        const msg =
          code === "plan_limit_reached"
            ? `Limite do plano atingido (${data.limit} corretores). Faça upgrade.`
            : code === "password_too_short"
            ? "Senha precisa ter no mínimo 6 caracteres."
            : code === "invalid_email"
            ? "E-mail inválido."
            : code || error?.message || "Erro ao criar membro.";
        toast.error(msg);
        return;
      }
      toast.success(`${fullName} foi adicionado(a) à imobiliária.`);
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar membro.");
    } finally {
      setLoading(false);
    }
  };

  const confirmLinkExisting = async () => {
    setLoading(true);
    try {
      const { data, error } = await callDirect(true);
      if (error || data?.error) {
        toast.error(data?.error || error?.message || "Erro ao vincular conta.");
        return;
      }
      toast.success("Conta existente vinculada à imobiliária. A senha atual do usuário foi preservada.");
      setExistsConfirm(false);
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao vincular conta.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (txt: string) => {
    await navigator.clipboard.writeText(txt);
    toast.success("Copiado!");
  };

  const headerTitle = isEdit
    ? `Editar ${member?.full_name || member?.email}`
    : "Adicionar novo membro";

  const headerDesc = isEdit
    ? "Altere o perfil e o status do membro nesta imobiliária."
    : "Defina o perfil e como o acesso será concedido.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100vw-1.5rem)] sm:w-full p-0 gap-0 overflow-hidden border-border/60 bg-card">
        {/* Hero header */}
        <div className="relative px-4 sm:px-7 pt-5 sm:pt-7 pb-4 sm:pb-5 border-b border-border/50 bg-gradient-to-br from-primary/5 via-card to-card overflow-hidden">
          <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
              <Sparkles className="h-3.5 w-3.5" />
              {isEdit ? "Edição de membro" : "Convidar para a equipe"}
            </div>
            <DialogTitle className="text-lg sm:text-xl font-semibold mt-1.5">{headerTitle}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">{headerDesc}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-4 sm:px-7 py-5 sm:py-6 space-y-5 sm:space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Seleção de perfil — destaque visual */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Perfil de acesso
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SELECTABLE_ROLES.map((r) => {
                const meta = ROLE_META[r];
                const Icon = meta.icon;
                const selected = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "group relative text-left rounded-xl border p-3.5 transition-all",
                      "border-border/60 bg-background/40 hover:border-border hover:bg-background/80",
                      selected && "border-transparent ring-2 ring-offset-0",
                      selected && meta.ring,
                      selected && meta.glow,
                    )}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div
                        className={cn(
                          "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
                          meta.bg,
                          meta.text,
                        )}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      {selected && (
                        <div className={cn("h-5 w-5 rounded-full flex items-center justify-center", meta.bg, meta.text)}>
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <div className={cn("font-semibold text-sm", selected ? meta.text : "text-foreground")}>
                      {meta.label}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-snug mt-1 line-clamp-3">
                      {meta.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Edição: dados pessoais + status */}
          {isEdit && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nome completo</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Maria Silva"
                  />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1.5">
                    WhatsApp pessoal
                    <span className="text-[10px] font-normal text-muted-foreground">(notificações)</span>
                  </Label>
                  <WhatsAppInput
                    value={whatsapp}
                    onChange={setWhatsapp}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">E-mail de acesso</Label>
                <Input
                  type="email"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pessoa@empresa.com"
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Alterar o e-mail muda o login do membro. A senha atual é preservada.
                </p>
              </div>

              <p className="text-[11px] text-muted-foreground -mt-1">
                O WhatsApp é usado pelo sistema para enviar avisos de transferência de lead e novos atendimentos a este membro.
              </p>

              <div className="rounded-xl border border-border/60 bg-background/40 p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Acesso ativo</div>
                  <div className="text-xs text-muted-foreground">
                    Quando desativado, o membro não consegue mais entrar na imobiliária.
                  </div>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          )}

          {/* Criação: alternar convite vs direto */}
          {!isEdit && !acceptUrl && (
            <Tabs value={mode} onValueChange={(v) => setMode(v as "invite" | "direct")}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="invite" className="gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  Convite por e-mail
                </TabsTrigger>
                <TabsTrigger value="direct" className="gap-2">
                  <KeyRound className="h-3.5 w-3.5" />
                  Criar com senha
                </TabsTrigger>
              </TabsList>

              <TabsContent value="invite" className="space-y-3 pt-4">
                <div>
                  <Label className="text-xs">E-mail do convidado</Label>
                  <Input
                    type="email"
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pessoa@empresa.com"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    A pessoa recebe um link de aceite. Ao confirmar, entra como{" "}
                    <strong className="text-foreground">{ROLE_META[role].label}</strong>.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="direct" className="space-y-3 pt-4">
                <div>
                  <Label className="text-xs">Nome completo</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Maria Silva"
                  />
                </div>
                <div>
                  <Label className="text-xs">E-mail de acesso</Label>
                  <Input
                    type="email"
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maria@empresa.com"
                  />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1.5">
                    WhatsApp pessoal
                    <span className="text-[10px] font-normal text-muted-foreground">(opcional — notificações)</span>
                  </Label>
                  <Input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(51) 99999-9999"
                  />
                </div>
                <div>
                  <Label className="text-xs">Senha provisória</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="mín. 6 caracteres"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowPwd((v) => !v)}>
                      {showPwd ? "Ocultar" : "Ver"}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => copy(password)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    A pessoa entra imediatamente com este e-mail/senha. Compartilhe de forma segura.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Resultado do convite */}
          {!isEdit && acceptUrl && (
            <div className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Link do convite (válido por 7 dias)
              </div>
              <div className="flex gap-2">
                <Input readOnly value={acceptUrl} className="font-mono text-xs" />
                <Button onClick={() => copy(acceptUrl)} size="icon" variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Envie esse link ao convidado. Ele precisa fazer login com o mesmo e-mail.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="px-4 sm:px-7 py-3 sm:py-4 border-t border-border/50 bg-muted/20 gap-2 flex-col sm:flex-row">
          {isEdit ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={submitEdit} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar alterações
              </Button>
            </>
          ) : acceptUrl ? (
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={mode === "invite" ? submitInvite : submitDirect} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {mode === "invite" ? "Gerar convite" : "Criar membro"}
                {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={existsConfirm} onOpenChange={setExistsConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Esse e-mail já tem conta no Copilot Broker</AlertDialogTitle>
            <AlertDialogDescription>
              Já existe um usuário com <strong className="text-foreground">{email}</strong>. Por segurança, não vamos sobrescrever a senha dele.
              <br /><br />
              Você pode <strong className="text-foreground">vincular essa conta existente</strong> a esta imobiliária — ele entrará no CRM com a mesma senha que já usa. Se ele esqueceu, pode redefinir em <code>/auth</code> usando "Esqueci minha senha".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLinkExisting} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Vincular conta existente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
