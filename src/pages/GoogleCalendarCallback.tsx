import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export default function GoogleCalendarCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");

    if (error) {
      setStatus("error");
      setMessage(error);
      window.opener?.postMessage({ type: "google-calendar-callback", status: "error", message: error }, "*");
      setTimeout(() => window.close(), 2000);
      return;
    }

    // The callback is handled by the edge function directly (it returns HTML that posts a message).
    // This page is a fallback in case the user lands here directly.
    setStatus("success");
    setMessage("Processando...");
    setTimeout(() => window.close(), 3000);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {status === "loading" && (
          <>
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Conectando Google Agenda...</p>
          </>
        )}
        {status === "success" && (
          <p className="text-green-500 font-medium">Conectado! Fechando esta janela...</p>
        )}
        {status === "error" && (
          <p className="text-destructive font-medium">Erro: {message}</p>
        )}
      </div>
    </div>
  );
}
