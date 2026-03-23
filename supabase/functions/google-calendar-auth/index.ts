import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/security.ts";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const SCOPES = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    const clientId = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: "Google OAuth not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── AUTHORIZE ───
    if (action === "authorize") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabase = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get broker_id
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

      const body = await req.json().catch(() => ({}));
      const redirectUri = body.redirect_uri;

      if (!redirectUri) {
        return new Response(JSON.stringify({ error: "redirect_uri required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const state = JSON.stringify({ broker_id: broker.id, redirect_uri: redirectUri });
      const stateEncoded = btoa(state);

      // Build callback URL (edge function URL)
      const callbackUrl = `${supabaseUrl}/functions/v1/google-calendar-auth?action=callback`;

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: "code",
        scope: SCOPES,
        access_type: "offline",
        prompt: "consent",
        state: stateEncoded,
      });

      const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;

      return new Response(JSON.stringify({ url: authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── CALLBACK ───
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const stateParam = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      if (error) {
        return new Response(buildCallbackHtml("error", error), {
          headers: { "Content-Type": "text/html" },
        });
      }

      if (!code || !stateParam) {
        return new Response(buildCallbackHtml("error", "Missing code or state"), {
          headers: { "Content-Type": "text/html" },
        });
      }

      let state: { broker_id: string; redirect_uri: string };
      try {
        state = JSON.parse(atob(stateParam));
      } catch {
        return new Response(buildCallbackHtml("error", "Invalid state"), {
          headers: { "Content-Type": "text/html" },
        });
      }

      const callbackUrl = `${supabaseUrl}/functions/v1/google-calendar-auth?action=callback`;

      // Exchange code for tokens
      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.access_token) {
        console.error("Token exchange failed:", tokenData);
        return new Response(buildCallbackHtml("error", "Token exchange failed"), {
          headers: { "Content-Type": "text/html" },
        });
      }

      // Get user email
      const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const userInfo = await userInfoRes.json();

      // Save to database using service role
      const adminClient = createClient(supabaseUrl, serviceRoleKey);

      const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();

      const { error: upsertError } = await adminClient
        .from("google_calendar_connections")
        .upsert(
          {
            broker_id: state.broker_id,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || null,
            token_expires_at: expiresAt,
            google_email: userInfo.email || null,
            sync_enabled: true,
            last_sync_at: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "broker_id" }
        );

      if (upsertError) {
        console.error("Upsert error:", upsertError);
        return new Response(buildCallbackHtml("error", "Failed to save connection"), {
          headers: { "Content-Type": "text/html" },
        });
      }

      return new Response(buildCallbackHtml("success", "connected"), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // ─── DISCONNECT ───
    if (action === "disconnect") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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

      // Get token to revoke
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const { data: connection } = await adminClient
        .from("google_calendar_connections")
        .select("access_token")
        .eq("broker_id", broker.id)
        .single();

      if (connection?.access_token) {
        // Try to revoke, but don't fail if it doesn't work
        await fetch(`${GOOGLE_REVOKE_URL}?token=${connection.access_token}`, {
          method: "POST",
        }).catch(() => {});
      }

      // Delete connection
      await adminClient
        .from("google_calendar_connections")
        .delete()
        .eq("broker_id", broker.id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("google-calendar-auth error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});

function buildCallbackHtml(status: string, message: string): string {
  return `<!DOCTYPE html>
<html>
<head><title>Google Calendar</title></head>
<body>
<script>
  window.opener && window.opener.postMessage({ type: "google-calendar-callback", status: "${status}", message: "${message}" }, "*");
  setTimeout(() => window.close(), 1500);
</script>
<p>${status === "success" ? "Conectado com sucesso! Fechando..." : "Erro: " + message}</p>
</body>
</html>`;
}
