import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, CheckCircle2, AlertCircle } from "lucide-react";

const OrgBrokerPublicSignup = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [orgLoading, setOrgLoading] = useState(true);
  const [org, setOrg] = useState<{ name: string; logo_url: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", whatsapp: "", password: "" });

  useEffect(() => {
    (async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("organizations" as any)
        .select("name, logo_url, status")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle() as any;
      setOrg(data ?? null);
      setOrgLoading(false);
    })();
  }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (form.password.length < 8) {
      toast.error("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("org-broker-public-signup", {
        body: { org_slug: slug, ...form },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setSuccess(true);
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao enviar solicitação");
    } finally {
      setLoading(false);
    }
  };

  if (orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <CardTitle>Imobiliária não encontrada</CardTitle>
            <CardDescription>O link de cadastro é inválido ou a imobiliária está inativa.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
            <CardTitle>Solicitação enviada!</CardTitle>
            <CardDescription>
              Sua solicitação foi enviada para o admin da <strong>{org.name}</strong>. Você receberá acesso assim que for aprovado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/auth")}>Voltar ao login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Cadastro de corretor — {org.name}</title></Helmet>
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              {org.logo_url ? (
                <img src={org.logo_url} alt={org.name} className="h-10 w-10 rounded object-contain" />
              ) : (
                <UserPlus className="h-6 w-6 text-primary" />
              )}
              <div>
                <CardTitle>Cadastro de corretor</CardTitle>
                <CardDescription>{org.name}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome completo *</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="(51) 9 9999-9999" />
              </div>
              <div className="space-y-2">
                <Label>Senha (min. 8) *</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
              </div>
              <p className="text-xs text-muted-foreground">
                Sua solicitação ficará pendente até o admin da imobiliária aprovar.
              </p>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Solicitar cadastro
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Já tem acesso? <Link to="/auth" className="text-primary hover:underline">Entrar</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default OrgBrokerPublicSignup;
