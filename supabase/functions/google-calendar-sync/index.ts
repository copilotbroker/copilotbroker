import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/security.ts";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const clientId = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID")!;
    const clientSecret = Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET")!;

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: broker } = await supabase
      .from("brokers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!broker) {
      return new Response(JSON.stringify({ error: "Broker not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get connection
    const { data: connection } = await adminClient
      .from("google_calendar_connections")
      .select("*")
      .eq("broker_id", broker.id)
      .single();

    if (!connection || !connection.access_token) {
      return new Response(JSON.stringify({ error: "Google Calendar not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Refresh token if expired
    let accessToken = connection.access_token;
    if (connection.token_expires_at && new Date(connection.token_expires_at) <= new Date()) {
      if (!connection.refresh_token) {
        return new Response(JSON.stringify({ error: "Refresh token missing, reconnect required" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const refreshRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: connection.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      const refreshData = await refreshRes.json();
      if (!refreshRes.ok || !refreshData.access_token) {
        console.error("Token refresh failed:", refreshData);
        return new Response(JSON.stringify({ error: "Token refresh failed, reconnect required" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      accessToken = refreshData.access_token;
      const newExpires = new Date(Date.now() + (refreshData.expires_in || 3600) * 1000).toISOString();

      await adminClient
        .from("google_calendar_connections")
        .update({
          access_token: accessToken,
          token_expires_at: newExpires,
          updated_at: new Date().toISOString(),
        })
        .eq("broker_id", broker.id);
    }

    // ─── GOOGLE → SISTEMA ───
    const now = new Date();
    const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();

    const eventsRes = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&maxResults=250`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!eventsRes.ok) {
      const errText = await eventsRes.text();
      console.error("Google Calendar API error:", errText);
      return new Response(JSON.stringify({ error: "Failed to fetch Google events" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventsData = await eventsRes.json();
    const googleEvents = eventsData.items || [];

    let importedCount = 0;
    let exportedCount = 0;

    // Import Google events
    for (const ge of googleEvents) {
      if (ge.status === "cancelled") continue;

      const startAt = ge.start?.dateTime || ge.start?.date;
      const endAt = ge.end?.dateTime || ge.end?.date || null;
      const allDay = !ge.start?.dateTime;

      if (!startAt) continue;

      // Check if already exists
      const { data: existing } = await adminClient
        .from("calendar_events")
        .select("id")
        .eq("google_event_id", ge.id)
        .eq("broker_id", broker.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        await adminClient
          .from("calendar_events")
          .update({
            title: ge.summary || "Sem título",
            description: ge.description || null,
            start_at: startAt,
            end_at: endAt,
            all_day: allDay,
            location: ge.location || null,
          })
          .eq("id", existing.id);
      } else {
        // Insert new
        await adminClient
          .from("calendar_events")
          .insert({
            broker_id: broker.id,
            google_event_id: ge.id,
            title: ge.summary || "Sem título",
            description: ge.description || null,
            event_type: "other",
            start_at: startAt,
            end_at: endAt,
            all_day: allDay,
            location: ge.location || null,
          });
        importedCount++;
      }
    }

    // ─── SISTEMA → GOOGLE ───
    const { data: localEvents } = await adminClient
      .from("calendar_events")
      .select("*")
      .eq("broker_id", broker.id)
      .is("google_event_id", null)
      .gte("start_at", timeMin)
      .lte("start_at", timeMax);

    for (const le of localEvents || []) {
      const eventBody: Record<string, unknown> = {
        summary: le.title,
        description: le.description || undefined,
        location: le.location || undefined,
      };

      if (le.all_day) {
        const dateStr = le.start_at.substring(0, 10);
        eventBody.start = { date: dateStr };
        eventBody.end = { date: le.end_at ? le.end_at.substring(0, 10) : dateStr };
      } else {
        eventBody.start = { dateTime: le.start_at, timeZone: "America/Sao_Paulo" };
        eventBody.end = {
          dateTime: le.end_at || new Date(new Date(le.start_at).getTime() + 3600000).toISOString(),
          timeZone: "America/Sao_Paulo",
        };
      }

      const createRes = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      });

      if (createRes.ok) {
        const created = await createRes.json();
        await adminClient
          .from("calendar_events")
          .update({ google_event_id: created.id })
          .eq("id", le.id);
        exportedCount++;
      } else {
        const errText = await createRes.text();
        console.error("Failed to export event:", le.id, errText);
      }
    }

    // Update last_sync_at
    await adminClient
      .from("google_calendar_connections")
      .update({ last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("broker_id", broker.id);

    return new Response(
      JSON.stringify({
        success: true,
        imported: importedCount,
        exported: exportedCount,
        total_google_events: googleEvents.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("google-calendar-sync error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
