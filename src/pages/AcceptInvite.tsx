import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, MailQuestion } from "lucide-react";

type State =
  | { kind: "loading" }
  | { kind: "needs_auth"; token: string }
  | { kind: "error"; message: string }
  | { kind: "success" };

const AcceptInvite = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "error", message: "Convite inválido: token ausente." });
      return;
    }
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState({ kind: "needs_auth", token });
        return;
      }
      const { data, error } = await supabase.functions.invoke("accept-organization-invite", { body: { token } });
      if (error || (data as any)?.error) {
        const msg = (data as any)?.error === "email_mismatch"
          ? `Este convite é para o e-mail ${(data as any).expected}. Faça login com a conta correta.`
          : (data as any)?.error || error?.message || "Falha ao aceitar convite.";
        setState({ kind: "error", message: msg });
        return;
      }
      setState({ kind: "success" });
      setTimeout(() => navigate("/admin/organizacao", { replace: true }), 1500);
    };
    run();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailQuestion className="h-5 w-5" />
            Convite para Imobiliária
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.kind === "loading" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Validando convite...
            </div>
          )}
          {state.kind === "needs_auth" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Faça login (ou crie sua conta) com o e-mail que recebeu este convite para continuar.
              </p>
              <Button onClick={() => navigate(`/auth?redirect=${encodeURIComponent(`/convite/aceitar?token=${state.token}`)}`)}>
                Fazer login
              </Button>
            </div>
          )}
          {state.kind === "success" && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" /> Convite aceito! Redirecionando...
            </div>
          )}
          {state.kind === "error" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" /> {state.message}
              </div>
              <Button variant="outline" onClick={() => navigate("/")}>Voltar ao início</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvite;
