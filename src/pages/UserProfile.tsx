// Página de perfil unificada — admin / líder / corretor.
// Reutiliza a linguagem visual da página "Gestão de membros e perfis":
// hero gradiente, RoleBadge, cards border-border/60, status pills.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/use-user-role";
import { useOrganization } from "@/hooks/use-organization";
import { useLogout } from "@/hooks/use-logout";
import { useBrokerWhatsAppStatus } from "@/hooks/use-broker-whatsapp-status";
import { BrokerLayout } from "@/components/broker";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, Wifi, WifiOff, CalendarDays, CheckCircle2, XCircle, AlertCircle,
  MessageSquare, Save, Smartphone, Sparkles, User as UserIcon, Bell, Phone,
} from "lucide-react";
import { toast } from "sonner";
import { ROLE_META, RoleBadge, type OrgRole } from "@/components/admin-org/RoleBadge";
import { cn } from "@/lib/utils";

const AVATAR_GRADIENTS = [
  "from-violet-500 to-fuchsia-600",
  "from-sky-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-indigo-500 to-blue-600",
];

const initialsOf = (name: string) =>
  name.split(" ").map((p) => p.charAt(0)).slice(0, 2).join("").toUpperCase();
const gradientOf = (key: string) =>
  AVATAR_GRADIENTS[(key.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];

interface ProfileData {
  // organization_members
  member_id: string | null;
  member_full_name: string | null;
  member_whatsapp: string | null;
  member_role: OrgRole | null;
  // brokers (may not exist for pure admin/owner)
  broker_id: string | null;
  broker_name: string | null;
  broker_email: string | null;
  broker_whatsapp: string | null;
  broker_slug: string | null;
  broker_show_name_on_global: boolean;
  broker_global_display_name: string | null;
  // auth
  user_id: string;
  user_email: string;
}

export default function UserProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, isLoading: roleLoading, brokerId } = useUserRole();
  const { activeOrgId, activeOrgRole } = useOrganization();
  const handleLogout = useLogout({ silent: true });

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [showNameOnGlobal, setShowNameOnGlobal] = useState(true);
  const [globalDisplayName, setGlobalDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isAdminUI = role === "admin";

  useEffect(() => {
    if (!roleLoading && !role) {
      navigate("/auth", { replace: true });
    }
  }, [role, roleLoading, navigate]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", brokerId, activeOrgId],
    enabled: !roleLoading && !!role,
    queryFn: async (): Promise<ProfileData | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const [brokerRes, memberRes] = await Promise.all([
        supabase
          .from("brokers")
          .select("id, name, email, whatsapp, slug, show_name_on_global, global_display_name")
          .eq("user_id", user.id)
          .maybeSingle(),
        activeOrgId
          ? supabase
              .from("organization_members")
              .select("id, full_name, whatsapp, role")
              .eq("user_id", user.id)
              .eq("organization_id", activeOrgId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const broker: any = brokerRes.data;
      const member: any = (memberRes as any).data;

      return {
        member_id: member?.id ?? null,
        member_full_name: member?.full_name ?? null,
        member_whatsapp: member?.whatsapp ?? null,
        member_role: (member?.role as OrgRole) ?? null,
        broker_id: broker?.id ?? null,
        broker_name: broker?.name ?? null,
        broker_email: broker?.email ?? null,
        broker_whatsapp: broker?.whatsapp ?? null,
        broker_slug: broker?.slug ?? null,
        broker_show_name_on_global: broker?.show_name_on_global ?? true,
        broker_global_display_name: broker?.global_display_name ?? null,
        user_id: user.id,
        user_email: user.email ?? "",
      };
    },
  });

  useEffect(() => {
    if (!profile) return;
    setName(profile.member_full_name || profile.broker_name || "");
    setWhatsapp(profile.member_whatsapp || profile.broker_whatsapp || "");
    setShowNameOnGlobal(profile.broker_show_name_on_global);
    setGlobalDisplayName(profile.broker_global_display_name || "");
  }, [profile]);

  const { data: whatsappStatus } = useBrokerWhatsAppStatus(profile?.broker_id || undefined);
  const { data: calendarConnection } = useQuery({
    queryKey: ["broker-calendar-status", profile?.broker_id],
    enabled: !!profile?.broker_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("google_calendar_connections")
        .select("sync_enabled, google_email")
        .eq("broker_id", profile!.broker_id!)
        .maybeSingle();
      return data;
    },
  });

  const effectiveRole: OrgRole =
    profile?.member_role ??
    (activeOrgRole as OrgRole | null) ??
    (role === "admin" ? "admin" : "broker");

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      // Update organization_members (source of truth → propagates to brokers via trigger)
      if (profile.member_id) {
        const { error } = await supabase
          .from("organization_members" as any)
          .update({
            full_name: name.trim() || null,
            whatsapp: whatsapp.trim() || null,
          })
          .eq("id", profile.member_id);
        if (error) throw error;
      }

      // Also update brokers directly for fields not on members + as fallback
      if (profile.broker_id) {
        const { error } = await supabase
          .from("brokers")
          .update({
            name: name.trim() || profile.broker_name || "",
            whatsapp: whatsapp.trim() || null,
            show_name_on_global: showNameOnGlobal,
            global_display_name: globalDisplayName.trim() || null,
          } as any)
          .eq("id", profile.broker_id);
        if (error) throw error;
      }

      toast.success("Perfil atualizado!");
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  const whatsappConnected = whatsappStatus?.status === "connected";
  const calendarConnected = !!calendarConnection?.sync_enabled;
  const showsAttendantSections = !!profile?.broker_id; // só quem tem broker atende

  const meta = ROLE_META[effectiveRole] ?? ROLE_META.broker;
  const displayName = name || profile?.user_email || "Você";

  const Layout = isAdminUI ? AdminLayout : BrokerLayout;
  const layoutProps: any = isAdminUI
    ? { activeView: "profile", onLogout: handleLogout }
    : {
        viewMode: "kanban",
        onViewChange: (mode: string) => navigate(mode === "list" ? "/corretor/leads" : "/corretor/crm"),
        onLogout: handleLogout,
      };

  if (roleLoading || isLoading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Layout {...layoutProps}>
      <div className="space-y-6 p-6 max-w-5xl mx-auto">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.07] via-card to-card p-6 sm:p-8">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar className={cn("h-16 w-16 ring-2 ring-offset-2 ring-offset-background shrink-0", meta.ring)}>
                <AvatarFallback
                  className={cn(
                    "text-lg font-bold text-white bg-gradient-to-br",
                    gradientOf(profile.user_email || profile.user_id),
                  )}
                >
                  {initialsOf(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1.5 min-w-0">
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
                  <Sparkles className="h-3.5 w-3.5" />
                  Meu perfil
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                  {displayName}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <RoleBadge role={effectiveRole} size="md" />
                  <span className="text-xs text-muted-foreground truncate">{profile.user_email}</span>
                </div>
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleSave}
              disabled={isSaving}
              className="shadow-lg shadow-primary/20 self-start lg:self-auto gap-2"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar alterações
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* IDENTIDADE */}
          <Card className="border-border/60 lg:col-span-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-primary" /> Identidade
              </CardTitle>
              <CardDescription className="text-xs">Como você aparece no sistema.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">Nome completo</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">E-mail</Label>
                <Input value={profile.user_email} disabled className="opacity-70" />
                <p className="text-[11px] text-muted-foreground">O e-mail não pode ser alterado.</p>
              </div>
              {profile.broker_slug && (
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Slug</Label>
                  <Input value={profile.broker_slug} disabled className="opacity-70 font-mono text-xs" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* WHATSAPP NOTIFICAÇÕES */}
          <Card className="border-border/60 lg:col-span-1 ring-1 ring-emerald-400/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-emerald-400" /> WhatsApp para notificações
              </CardTitle>
              <CardDescription className="text-xs">
                Número usado pelo sistema para te avisar sobre transferências de lead, novos atendimentos
                e alertas operacionais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wa" className="text-xs uppercase tracking-wider text-muted-foreground">Seu WhatsApp pessoal</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="wa"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(51) 99999-9999"
                    className="pl-9"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Inclua DDD. Esse é o número onde você <strong className="text-foreground">recebe</strong> os
                  avisos — não é o WhatsApp que você usa para atender clientes.
                </p>
              </div>
              {!whatsapp.trim() && (
                <div className="rounded-lg border border-amber-400/30 bg-amber-500/[0.05] p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-200/90">
                    Sem WhatsApp cadastrado, você não receberá notificações automáticas do sistema.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* INTEGRAÇÕES — só pra quem atende */}
          {showsAttendantSections && (
            <Card className="border-border/60 lg:col-span-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Status das integrações</CardTitle>
                <CardDescription className="text-xs">Suas conexões para atender clientes.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* WhatsApp atendimento */}
                <div className="rounded-xl border border-border/60 bg-background/40 p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                      whatsappConnected ? "bg-emerald-500/10" : "bg-destructive/10",
                    )}>
                      {whatsappConnected
                        ? <Wifi className="h-5 w-5 text-emerald-400" />
                        : <WifiOff className="h-5 w-5 text-destructive" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">WhatsApp Pessoal</p>
                      <p className="text-[11px] text-muted-foreground">Para atender seus leads</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {whatsappConnected ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Conectado
                      </Badge>
                    ) : whatsappStatus ? (
                      <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Off</Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <AlertCircle className="h-3 w-3" /> –
                      </Badge>
                    )}
                    <Button variant="outline" size="sm" className="h-8 text-xs"
                      onClick={() => navigate("/corretor/copiloto")}>
                      {whatsappConnected ? "Gerenciar" : "Conectar"}
                    </Button>
                  </div>
                </div>

                {/* Google Agenda */}
                <div className="rounded-xl border border-border/60 bg-background/40 p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                      calendarConnected ? "bg-emerald-500/10" : "bg-muted",
                    )}>
                      <CalendarDays className={cn("h-5 w-5", calendarConnected ? "text-emerald-400" : "text-muted-foreground")} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">Google Agenda</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {calendarConnection?.google_email || "Sincronize seus compromissos"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {calendarConnected ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Conectado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <AlertCircle className="h-3 w-3" /> –
                      </Badge>
                    )}
                    <Button variant="outline" size="sm" className="h-8 text-xs"
                      onClick={() => navigate("/corretor/agenda")}>
                      {calendarConnected ? "Gerenciar" : "Conectar"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PLANTÃO — só pra quem atende */}
          {showsAttendantSections && (
            <Card className="border-border/60 lg:col-span-2 ring-1 ring-purple-400/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-300" />
                  Identificação no Plantão
                </CardTitle>
                <CardDescription className="text-xs">
                  Como seu nome aparece nas mensagens enviadas pela conexão global (Plantão de Vendas).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Exibir meu nome antes das mensagens</Label>
                    <p className="text-xs text-muted-foreground">
                      Quando ativado, seu nome aparecerá antes de cada mensagem enviada pela conexão global.
                    </p>
                  </div>
                  <Switch checked={showNameOnGlobal} onCheckedChange={setShowNameOnGlobal} />
                </div>

                {showNameOnGlobal && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="gdn" className="text-xs uppercase tracking-wider text-muted-foreground">Nome de exibição</Label>
                      <Input
                        id="gdn"
                        value={globalDisplayName}
                        onChange={(e) => setGlobalDisplayName(e.target.value)}
                        placeholder={name || "Seu nome"}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Se vazio, será usado seu nome padrão: <strong className="text-foreground">{name}</strong>
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Pré-visualização</p>
                      <div className="rounded-lg border border-purple-400/30 bg-purple-900/20 px-3 py-2 text-sm max-w-[320px]">
                        <span className="text-purple-300 text-[10px] flex items-center gap-1 mb-1">
                          <Smartphone className="h-2.5 w-2.5" /> Plantão
                        </span>
                        <p className="text-foreground whitespace-pre-wrap">
                          <strong>{globalDisplayName.trim() || name}:</strong>{"\n"}Olá! Vi que você se interessou pelo empreendimento. Posso ajudar?
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <Separator className="bg-border/60" />

        <div className="flex justify-end pb-6">
          <Button onClick={handleSave} disabled={isSaving} size="lg" className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar alterações
          </Button>
        </div>
      </div>
    </Layout>
  );
}
