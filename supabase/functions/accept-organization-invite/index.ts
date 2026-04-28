import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/security.ts";

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ error: "missing_token" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: invite } = await admin.from("organization_invites").select("*").eq("token", token).maybeSingle();
    if (!invite) return new Response(JSON.stringify({ error: "invite_not_found" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
    if (invite.accepted_at) return new Response(JSON.stringify({ error: "already_accepted" }), { status: 409, headers: { ...cors, "Content-Type": "application/json" } });
    if (new Date(invite.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "invite_expired" }), { status: 410, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Email match (case-insensitive)
    if ((user.email ?? "").toLowerCase() !== invite.email.toLowerCase()) {
      return new Response(JSON.stringify({ error: "email_mismatch", expected: invite.email }), {
        status: 403, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Upsert membership
    const { error: memErr } = await admin.from("organization_members").upsert({
      organization_id: invite.organization_id,
      user_id: user.id,
      role: invite.role,
      is_active: true,
      joined_at: new Date().toISOString(),
    }, { onConflict: "organization_id,user_id" });

    if (memErr) return new Response(JSON.stringify({ error: memErr.message }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

    await admin.from("organization_invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);

    await admin.from("admin_audit_logs").insert({
      actor_user_id: user.id, organization_id: invite.organization_id,
      action: "invite.accept", entity: "invite", entity_id: invite.id,
      metadata: { role: invite.role },
    });

    return new Response(JSON.stringify({ ok: true, organization_id: invite.organization_id }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
