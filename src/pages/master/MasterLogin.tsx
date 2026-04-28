// Página de login dedicada e exclusiva para super_admins do Copilot Broker.
// Separada do /auth (corretores/imobiliárias) por requisito de segurança e branding.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";

const MasterLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Se já estiver logado E for super_admin, redireciona direto.
  // Se estiver logado mas NÃO for super_admin, faz logout (não permite acesso aqui).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session) {
        setIsCheckingAuth(false);
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", session.user.id) as any;
      const isSuper = ((roles ?? []) as any[]).some((r) => r.role === "super_admin");
      if (isSuper) {
        navigate("/master/overview", { replace: true });
      } else {
        // Conta não-super_admin não tem acesso a este portal
        await supabase.auth.signOut();
        queryClient.clear();
        setIsCheckingAuth(false);
      }
    })();
    return () => { cancelled = true; };
  }, [navigate, queryClient]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Sessão inválida");

      // Valida que é super_admin
      const { data: roles } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", data.user.id) as any;
      const isSuper = ((roles ?? []) as any[]).some((r) => r.role === "super_admin");

      if (!isSuper) {
        await supabase.auth.signOut();
        queryClient.clear();
        toast.error("Acesso restrito ao Copilot Broker Master.");
        return;
      }

      toast.success("Acesso autorizado.");
      navigate("/master/overview", { replace: true });
    } catch (error: any) {
      console.error("[MasterLogin] erro:", error);
      const code = error?.code || "";
      const msg = (error?.message || "").toLowerCase();
      if (code === "invalid_credentials" || msg.includes("invalid login")) {
        toast.error("Credenciais inválidas.");
      } else {
        toast.error(error?.message || "Erro ao autenticar.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Copilot Broker — Master Access</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <main className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0f] px-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="h-14 w-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Copilot Broker Master</h1>
            <p className="text-sm text-muted-foreground mt-1">Portal restrito ao operador da plataforma</p>
          </div>

          <form
            onSubmit={handleLogin}
            className="bg-[#111114] border border-[#1e1e22] rounded-xl p-6 space-y-4 shadow-2xl"
          >
            <div className="space-y-2">
              <Label htmlFor="ml-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="ml-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-9 bg-[#0a0a0f] border-[#1e1e22]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ml-password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="ml-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 bg-[#0a0a0f] border-[#1e1e22]"
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar no Master"}
            </Button>

            <p className="text-xs text-center text-muted-foreground pt-2">
              Não é super-admin?{" "}
              <a href="/auth" className="text-primary hover:underline">
                Acesse a área da imobiliária
              </a>
            </p>
          </form>

          <p className="text-[10px] text-center text-muted-foreground/60 mt-6">
            Acessos são auditados. Tentativas indevidas podem resultar em bloqueio.
          </p>
        </div>
      </main>
    </>
  );
};

export default MasterLogin;
