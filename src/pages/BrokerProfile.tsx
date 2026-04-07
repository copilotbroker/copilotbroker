import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/use-user-role";
import { useLogout } from "@/hooks/use-logout";
import { useBrokerWhatsAppStatus } from "@/hooks/use-broker-whatsapp-status";
import { useQuery } from "@tanstack/react-query";
import { BrokerLayout } from "@/components/broker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, Wifi, WifiOff, CalendarDays, CheckCircle2, XCircle, AlertCircle, MessageSquare, Save, Smartphone } from "lucide-react";
import { toast } from "sonner";

interface BrokerProfile {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  slug: string;
  show_name_on_global: boolean;
  global_display_name: string | null;
}

export default function BrokerProfile() {
  const navigate = useNavigate();
  const { role, isLoading: roleLoading, brokerId } = useUserRole();
  const handleLogout = useLogout({ silent: true });

  const [profile, setProfile] = useState<BrokerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [showNameOnGlobal, setShowNameOnGlobal] = useState(true);
  const [globalDisplayName, setGlobalDisplayName] = useState("");

  // Integration statuses
  const { data: whatsappStatus } = useBrokerWhatsAppStatus(brokerId || undefined);
  
  const { data: calendarConnection } = useQuery({
    queryKey: ["broker-calendar-status", brokerId],
    queryFn: async () => {
      if (!brokerId) return null;
      const { data } = await supabase
        .from("google_calendar_connections")
        .select("sync_enabled, google_email")
        .eq("broker_id", brokerId)
        .maybeSingle();
      return data;
    },
    enabled: !!brokerId,
  });

  useEffect(() => {
    if (!roleLoading && role !== "broker" && role !== "admin") {
      navigate("/auth");
    }
  }, [role, roleLoading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!brokerId) return;
      const { data } = await supabase
        .from("brokers")
        .select("id, name, email, whatsapp, slug, show_name_on_global, global_display_name")
        .eq("id", brokerId)
        .single();
      
      if (data) {
        const p = data as any as BrokerProfile;
        setProfile(p);
        setName(p.name);
        setWhatsapp(p.whatsapp || "");
        setShowNameOnGlobal(p.show_name_on_global);
        setGlobalDisplayName(p.global_display_name || "");
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, [brokerId]);

  const handleSave = async () => {
    if (!brokerId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("brokers")
        .update({
          name: name.trim(),
          whatsapp: whatsapp.trim() || null,
          show_name_on_global: showNameOnGlobal,
          global_display_name: globalDisplayName.trim() || null,
        } as any)
        .eq("id", brokerId);

      if (error) throw error;
      toast.success("Perfil atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar perfil");
    } finally {
      setIsSaving(false);
    }
  };

  if (roleLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const whatsappConnected = whatsappStatus?.status === "connected";
  const calendarConnected = !!calendarConnection?.sync_enabled;

  return (
    <BrokerLayout
      viewMode="kanban"
      onViewChange={(mode) => navigate(mode === "list" ? "/corretor/leads" : "/corretor/crm")}
      onLogout={handleLogout}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <User className="w-5 h-5" />
            Perfil e Configurações
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie suas informações e integrações
          </p>
        </div>

        {/* Profile Info */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Informações Pessoais</CardTitle>
            <CardDescription>Seus dados de contato e identificação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                value={profile?.email || ""}
                disabled
                className="bg-muted/50 opacity-70"
              />
              <p className="text-[11px] text-muted-foreground">O e-mail não pode ser alterado</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp (pessoal)</Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(51) 99999-9999"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label>Slug do corretor</Label>
              <Input
                value={profile?.slug || ""}
                disabled
                className="bg-muted/50 opacity-70"
              />
            </div>
          </CardContent>
        </Card>

        {/* Integration Status */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Status das Integrações</CardTitle>
            <CardDescription>Verifique se suas conexões estão ativas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* WhatsApp Instance */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${whatsappConnected ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
                  {whatsappConnected ? (
                    <Wifi className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">WhatsApp Pessoal</p>
                  <p className="text-xs text-muted-foreground">Instância de mensagens individuais</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {whatsappConnected ? (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Conectado
                  </Badge>
                ) : whatsappStatus ? (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" /> Desconectado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <AlertCircle className="h-3 w-3" /> Não configurado
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => navigate("/corretor/copiloto")}
                >
                  {whatsappConnected ? "Gerenciar" : "Conectar"}
                </Button>
              </div>
            </div>

            {/* Google Calendar */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${calendarConnected ? "bg-emerald-500/10" : "bg-muted"}`}>
                  <CalendarDays className={`h-5 w-5 ${calendarConnected ? "text-emerald-500" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Google Agenda</p>
                  <p className="text-xs text-muted-foreground">
                    {calendarConnection?.google_email || "Sincronize seus compromissos"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {calendarConnected ? (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Conectado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <AlertCircle className="h-3 w-3" /> Não conectado
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => navigate("/corretor/agenda")}
                >
                  {calendarConnected ? "Gerenciar" : "Conectar"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Global Instance Name Config */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Identificação no Plantão
            </CardTitle>
            <CardDescription>
              Configure como seu nome aparece nas mensagens enviadas pela instância global (Plantão de Vendas)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-name-toggle" className="text-sm font-medium">
                  Exibir meu nome antes das mensagens
                </Label>
                <p className="text-xs text-muted-foreground">
                  Quando ativado, seu nome aparecerá antes de cada mensagem enviada pela conexão global
                </p>
              </div>
              <Switch
                id="show-name-toggle"
                checked={showNameOnGlobal}
                onCheckedChange={setShowNameOnGlobal}
              />
            </div>

            {showNameOnGlobal && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="global-display-name">Nome de exibição</Label>
                  <Input
                    id="global-display-name"
                    value={globalDisplayName}
                    onChange={(e) => setGlobalDisplayName(e.target.value)}
                    placeholder={name || "Seu nome"}
                    className="bg-background"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Se vazio, será usado seu nome padrão: <strong>{name}</strong>
                  </p>
                </div>

                {/* Preview */}
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Pré-visualização</p>
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-900/20 px-3 py-2 text-sm max-w-[280px]">
                    <span className="text-emerald-400 text-[10px] flex items-center gap-1 mb-1">
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

        {/* Save Button */}
        <div className="flex justify-end pb-6">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Alterações
          </Button>
        </div>
      </div>
    </BrokerLayout>
  );
}
