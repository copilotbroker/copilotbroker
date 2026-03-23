import { Calendar, Check, RefreshCw, Unplug, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleCalendarConnection } from "@/hooks/use-calendar-events";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

interface GoogleConnectCardProps {
  connection: GoogleCalendarConnection | null;
  onConnect: () => Promise<void>;
  onSync: () => Promise<void>;
  onDisconnect: () => Promise<void>;
}

export function GoogleConnectCard({ connection, onConnect, onSync, onDisconnect }: GoogleConnectCardProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string, fn: () => Promise<void>) => {
    setLoading(action);
    try {
      await fn();
    } finally {
      setLoading(null);
    }
  };

  if (!connection) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/30">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Conecte sua Google Agenda</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-1">
              Sincronize seus compromissos automaticamente. Visitas, agendamentos e retornos aparecerão diretamente no seu Google Calendar.
            </p>
          </div>
          <Button
            onClick={() => handleAction("connect", onConnect)}
            disabled={loading === "connect"}
            className="gap-2"
          >
            {loading === "connect" ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            Conectar Google Agenda
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-500/30 bg-green-500/5">
      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <Check className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Wifi className="h-3.5 w-3.5 text-green-500" />
              <span className="text-sm font-medium">Google Agenda Conectada</span>
            </div>
            {connection.google_email && (
              <p className="text-xs text-muted-foreground">{connection.google_email}</p>
            )}
            {connection.last_sync_at && (
              <p className="text-xs text-muted-foreground">
                Última sincronização: {format(new Date(connection.last_sync_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction("sync", onSync)}
            disabled={loading === "sync"}
            className="gap-1"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading === "sync" ? "animate-spin" : ""}`} />
            Sincronizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction("reconnect", onConnect)}
            disabled={loading === "reconnect"}
            className="gap-1"
          >
            <Calendar className="h-3.5 w-3.5" />
            Reconectar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAction("disconnect", onDisconnect)}
            disabled={loading === "disconnect"}
            className="gap-1 text-destructive"
          >
            <Unplug className="h-3.5 w-3.5" />
            Desconectar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
