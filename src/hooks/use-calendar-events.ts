import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";

export type CalendarEventType = "visit" | "meeting" | "follow_up" | "task" | "scheduling" | "other";

export interface CalendarEvent {
  id: string;
  broker_id: string;
  lead_id: string | null;
  project_id: string | null;
  title: string;
  description: string | null;
  event_type: CalendarEventType;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  location: string | null;
  google_event_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  lead_name?: string;
  project_name?: string;
  broker_name?: string;
}

export interface GoogleCalendarConnection {
  id: string;
  broker_id: string;
  google_email: string | null;
  last_sync_at: string | null;
  sync_enabled: boolean;
}

export type CalendarViewMode = "day" | "week" | "month" | "list";

interface UseCalendarEventsProps {
  brokerId: string | null;
  isAdmin?: boolean;
  selectedBrokerId?: string | null;
}

export function useCalendarEvents({ brokerId, isAdmin, selectedBrokerId }: UseCalendarEventsProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [googleConnection, setGoogleConnection] = useState<GoogleCalendarConnection | null>(null);
  const { toast } = useToast();

  const targetBrokerId = isAdmin && selectedBrokerId ? selectedBrokerId : brokerId;

  const fetchEvents = useCallback(async () => {
    if (!targetBrokerId && !isAdmin) return;
    setIsLoading(true);

    try {
      const rangeStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      const rangeEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });

      let query = supabase
        .from("calendar_events" as any)
        .select("*, leads!calendar_events_lead_id_fkey(name), projects!calendar_events_project_id_fkey(name), brokers!calendar_events_broker_id_fkey(name)")
        .gte("start_at", rangeStart.toISOString())
        .lte("start_at", rangeEnd.toISOString())
        .order("start_at", { ascending: true });

      if (targetBrokerId && !isAdmin) {
        query = query.eq("broker_id", targetBrokerId);
      } else if (isAdmin && selectedBrokerId) {
        query = query.eq("broker_id", selectedBrokerId);
      }

      const { data, error } = await query as any;
      if (error) throw error;

      const mapped = (data || []).map((e: any) => ({
        ...e,
        lead_name: e.leads?.name || null,
        project_name: e.projects?.name || null,
        broker_name: e.brokers?.name || null,
      }));

      setEvents(mapped);
    } catch (err) {
      console.error("Erro ao buscar eventos:", err);
    } finally {
      setIsLoading(false);
    }
  }, [targetBrokerId, isAdmin, selectedBrokerId, currentDate]);

  const fetchGoogleConnection = useCallback(async () => {
    const bid = targetBrokerId || brokerId;
    if (!bid) return;
    try {
      const { data } = await (supabase
        .from("google_calendar_connections" as any)
        .select("id, broker_id, google_email, last_sync_at, sync_enabled")
        .eq("broker_id", bid)
        .maybeSingle() as any);
      setGoogleConnection(data || null);
    } catch {}
  }, [targetBrokerId, brokerId]);

  useEffect(() => {
    fetchEvents();
    fetchGoogleConnection();
  }, [fetchEvents, fetchGoogleConnection]);

  const createEvent = async (event: Omit<CalendarEvent, "id" | "created_at" | "updated_at" | "lead_name" | "project_name" | "broker_name">) => {
    const { data, error } = await (supabase.from("calendar_events" as any).insert(event).select().single() as any);
    if (error) {
      toast({ title: "Erro ao criar evento", description: error.message, variant: "destructive" });
      return null;
    }
    toast({ title: "Evento criado com sucesso" });
    fetchEvents();
    return data;
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    const { error } = await (supabase.from("calendar_events" as any).update(updates).eq("id", id) as any);
    if (error) {
      toast({ title: "Erro ao atualizar evento", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Evento atualizado" });
    fetchEvents();
    return true;
  };

  const deleteEvent = async (id: string) => {
    const { error } = await (supabase.from("calendar_events" as any).delete().eq("id", id) as any);
    if (error) {
      toast({ title: "Erro ao excluir evento", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Evento excluído" });
    fetchEvents();
    return true;
  };

  // ─── Google Calendar actions ───
  const connectGoogle = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Faça login primeiro", variant: "destructive" });
        return;
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const callbackOrigin = window.location.origin;
      const redirectUri = `https://${projectId}.supabase.co/functions/v1/google-calendar-auth?action=callback`;

      const res = await supabase.functions.invoke("google-calendar-auth", {
        body: { redirect_uri: redirectUri },
        headers: { "x-action": "authorize" },
      });

      // The function is called via query param, so we need to use fetch directly
      const funcUrl = `https://${projectId}.supabase.co/functions/v1/google-calendar-auth?action=authorize`;
      const response = await fetch(funcUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ redirect_uri: redirectUri }),
      });

      const data = await response.json();
      if (!response.ok || !data.url) {
        toast({ title: "Erro ao iniciar conexão", description: data.error || "Tente novamente", variant: "destructive" });
        return;
      }

      // Open popup
      const popup = window.open(data.url, "google-calendar-auth", "width=500,height=600,scrollbars=yes");

      // Listen for callback message
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "google-calendar-callback") {
          window.removeEventListener("message", handleMessage);
          if (event.data.status === "success") {
            toast({ title: "Google Agenda conectada com sucesso!" });
            fetchGoogleConnection();
            fetchEvents();
          } else {
            toast({ title: "Erro na conexão", description: event.data.message, variant: "destructive" });
          }
        }
      };
      window.addEventListener("message", handleMessage);

      // Fallback: poll for connection if popup closes without message
      const pollInterval = setInterval(async () => {
        if (popup?.closed) {
          clearInterval(pollInterval);
          window.removeEventListener("message", handleMessage);
          // Check if connection was established
          await fetchGoogleConnection();
          await fetchEvents();
        }
      }, 1000);

      // Cleanup after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        window.removeEventListener("message", handleMessage);
      }, 300000);
    } catch (err) {
      console.error("connectGoogle error:", err);
      toast({ title: "Erro ao conectar", variant: "destructive" });
    }
  };

  const syncGoogle = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const funcUrl = `https://${projectId}.supabase.co/functions/v1/google-calendar-sync`;
      const response = await fetch(funcUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        toast({ title: "Erro na sincronização", description: data.error, variant: "destructive" });
        return;
      }

      toast({
        title: "Sincronização concluída",
        description: `${data.imported} importados, ${data.exported} exportados`,
      });
      await fetchGoogleConnection();
      await fetchEvents();
    } catch (err) {
      console.error("syncGoogle error:", err);
      toast({ title: "Erro na sincronização", variant: "destructive" });
    }
  };

  const disconnectGoogle = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const funcUrl = `https://${projectId}.supabase.co/functions/v1/google-calendar-auth?action=disconnect`;
      const response = await fetch(funcUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        toast({ title: "Erro ao desconectar", description: data.error, variant: "destructive" });
        return;
      }

      toast({ title: "Google Agenda desconectada" });
      setGoogleConnection(null);
    } catch (err) {
      console.error("disconnectGoogle error:", err);
      toast({ title: "Erro ao desconectar", variant: "destructive" });
    }
  };

  const goToToday = () => setCurrentDate(new Date());
  const goNext = () => setCurrentDate(prev => addMonths(prev, 1));
  const goPrev = () => setCurrentDate(prev => subMonths(prev, 1));

  return {
    events,
    isLoading,
    currentDate,
    setCurrentDate,
    viewMode,
    setViewMode,
    googleConnection,
    createEvent,
    updateEvent,
    deleteEvent,
    connectGoogle,
    syncGoogle,
    disconnectGoogle,
    goToToday,
    goNext,
    goPrev,
    refetch: fetchEvents,
  };
}
