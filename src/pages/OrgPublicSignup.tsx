import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, CheckCircle2 } from "lucide-react";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

const OrgPublicSignup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    organization_name: "",
    slug: "",
    contact_email: "",
    contact_phone: "",
    owner_name: "",
    owner_password: "",
  });

  const update = (k: keyof typeof form, v: string) => {
    setForm((p) => ({
      ...p,
      [k]: v,
      ...(k === "organization_name" && !p.slug ? { slug: slugify(v) } : {}),
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.organization_name || !form.slug || !form.contact_email || !form.owner_name || !form.owner_password) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (form.owner_password.length < 8) {
      toast.error("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("org-public-signup", {
        body: { ...form, slug: slugify(form.slug) },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.message ?? "Erro desconhecido";
      if (msg.includes("slug_taken")) toast.error("Este identificador já está em uso. Escolha outro.");
      else if (msg.includes("invalid_slug")) toast.error("Identificador inválido (use apenas letras, números e hífens).");
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Helmet><title>Solicitação enviada</title></Helmet>
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
              <CardTitle>Solicitação enviada!</CardTitle>
              <CardDescription>
                Sua imobiliária está aguardando aprovação. Entraremos em contato pelo email <strong>{form.contact_email}</strong> assim que for analisada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate("/auth")}>Voltar ao login</Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cadastrar imobiliária</title>
        <meta name="description" content="Cadastre sua imobiliária na plataforma e gerencie sua equipe de corretores." />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <CardTitle>Cadastrar imobiliária</CardTitle>
            </div>
            <CardDescription>
              Solicite o cadastro da sua imobiliária. Após análise, você receberá acesso ao painel administrativo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Nome da imobiliária *</Label>
                <Input id="org-name" value={form.organization_name} onChange={(e) => update("organization_name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Identificador (URL) *</Label>
                <Input id="slug" value={form.slug} onChange={(e) => update("slug", slugify(e.target.value))} placeholder="minha-imobiliaria" required />
                <p className="text-xs text-muted-foreground">Será usado como: /imobiliaria/<strong>{form.slug || "exemplo"}</strong>/cadastro</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="email">Email de contato *</Label>
                  <Input id="email" type="email" value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-name">Seu nome (responsável) *</Label>
                <Input id="owner-name" value={form.owner_name} onChange={(e) => update("owner_name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha de acesso (min. 8) *</Label>
                <Input id="password" type="password" value={form.owner_password} onChange={(e) => update("owner_password", e.target.value)} required minLength={8} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Enviar solicitação
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Já tem cadastro? <Link to="/auth" className="text-primary hover:underline">Entrar</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default OrgPublicSignup;
