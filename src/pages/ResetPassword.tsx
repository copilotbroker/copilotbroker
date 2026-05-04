import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import logoEnove from "@/assets/logo-enove.png";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase auto-processes the recovery hash; verify session exists.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setHasRecoverySession(true);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasRecoverySession(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso!");
      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar senha.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Redefinir senha - Enove</title></Helmet>
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logoEnove} alt="Enove" className="h-12 mx-auto mb-6" />
            <h1 className="font-serif text-3xl font-bold text-white mb-2">Redefinir senha</h1>
          </div>
          <div className="bg-[#1e1e22] border border-[#2a2a2e] rounded-2xl p-8 shadow-2xl">
            {!hasRecoverySession ? (
              <p className="text-slate-400 text-center text-sm">
                Link inválido ou expirado. Solicite um novo link em "Esqueci minha senha".
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nova senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-[#0f0f12] border border-[#2a2a2e] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FFFF00]/50 focus:ring-2 focus:ring-[#FFFF00]/20"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirmar senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-[#0f0f12] border border-[#2a2a2e] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FFFF00]/50 focus:ring-2 focus:ring-[#FFFF00]/20"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-[#FFFF00] text-black font-bold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(255,255,0,0.4)] disabled:opacity-50"
                >
                  {isLoading ? "Salvando..." : "Salvar nova senha"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
