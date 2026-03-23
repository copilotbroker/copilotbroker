import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCalendarEvents, CalendarEvent, CalendarViewMode } from "@/hooks/use-calendar-events";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { DayView } from "./DayView";
import { ListView } from "./ListView";
import { EventModal } from "./EventModal";
import { GoogleConnectCard } from "./GoogleConnectCard";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface AgendaModuleProps {
  brokerId: string | null;
  isAdmin?: boolean;
}

export function AgendaModule({ brokerId, isAdmin }: AgendaModuleProps) {
  const [selectedBrokerId, setSelectedBrokerId] = useState<string | null>(null);
  const [brokers, setBrokers] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date>(new Date());

  const {
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
    refetch,
  } = useCalendarEvents({ brokerId, isAdmin, selectedBrokerId });

  // Fetch brokers for admin filter
  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from("brokers")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => setBrokers(data || []));
  }, [isAdmin]);

  const filteredEvents = events.filter((e) => {
    if (eventTypeFilter !== "all" && e.event_type !== eventTypeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        (e.lead_name || "").toLowerCase().includes(q) ||
        (e.broker_name || "").toLowerCase().includes(q) ||
        (e.description || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDayClick = (date: Date) => {
    if (viewMode === "month") {
      setCurrentDate(date);
      setViewMode("day");
    } else {
      setDefaultDate(date);
      setSelectedEvent(null);
      setModalOpen(true);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleSave = async (payload: any) => {
    if (payload.id) {
      const { id, ...rest } = payload;
      return updateEvent(id, rest);
    }
    return createEvent(payload);
  };

  const effectiveBrokerId = isAdmin && selectedBrokerId ? selectedBrokerId : brokerId;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Agenda
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie seus compromissos e eventos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { setSelectedEvent(null); setDefaultDate(new Date()); setModalOpen(true); }} className="gap-1">
            <Plus className="h-4 w-4" /> Novo evento
          </Button>
          <Button variant="outline" size="sm" onClick={refetch} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </Button>
        </div>
      </div>

      {/* Google Connection Card */}
      <GoogleConnectCard
        connection={googleConnection}
        onConnect={connectGoogle}
        onSync={syncGoogle}
        onDisconnect={disconnectGoogle}
      />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goPrev}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={goToToday}>Hoje</Button>
          <Button variant="outline" size="icon" onClick={goNext}><ChevronRight className="h-4 w-4" /></Button>
          <span className="text-sm font-medium capitalize">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <Select value={selectedBrokerId || "all"} onValueChange={(v) => setSelectedBrokerId(v === "all" ? null : v)}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Todos os corretores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os corretores</SelectItem>
                {brokers.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="visit">Visitas</SelectItem>
              <SelectItem value="meeting">Reuniões</SelectItem>
              <SelectItem value="follow_up">Retornos</SelectItem>
              <SelectItem value="scheduling">Agendamentos</SelectItem>
              <SelectItem value="task">Tarefas</SelectItem>
              <SelectItem value="other">Outros</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-8 w-[180px] text-xs"
              placeholder="Buscar evento, lead..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as CalendarViewMode)}>
            <TabsList className="h-8">
              <TabsTrigger value="day" className="text-xs px-2">Dia</TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-2">Semana</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-2">Mês</TabsTrigger>
              <TabsTrigger value="list" className="text-xs px-2">Lista</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Calendar View */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          Carregando eventos...
        </div>
      ) : (
        <>
          {viewMode === "month" && (
            <MonthView currentDate={currentDate} events={filteredEvents} onDayClick={handleDayClick} onEventClick={handleEventClick} />
          )}
          {viewMode === "week" && (
            <WeekView currentDate={currentDate} events={filteredEvents} onEventClick={handleEventClick} onDayClick={handleDayClick} />
          )}
          {viewMode === "day" && (
            <DayView currentDate={currentDate} events={filteredEvents} onEventClick={handleEventClick} />
          )}
          {viewMode === "list" && (
            <ListView events={filteredEvents} onEventClick={handleEventClick} />
          )}
        </>
      )}

      {/* Event Modal */}
      {effectiveBrokerId && (
        <EventModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedEvent(null); }}
          event={selectedEvent}
          defaultDate={defaultDate}
          brokerId={effectiveBrokerId}
          onSave={handleSave}
          onDelete={deleteEvent}
        />
      )}
    </div>
  );
}
