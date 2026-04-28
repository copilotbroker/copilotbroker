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

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleCheck } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "super_admin").maybeSingle();
    if (!roleCheck) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });

    const { organization_id, plan_id } = await req.json();
    if (!organization_id || !plan_id) {
      return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Strategy: if there's an existing active/trial/past_due subscription, update it in place
    // (avoids racing the partial unique index). Otherwise insert a fresh one.
    const { data: current, error: curErr } = await admin
      .from("organization_subscriptions")
      .select("id")
      .eq("organization_id", organization_id)
      .in("status", ["active", "trial", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (curErr) {
      return new Response(JSON.stringify({ error: `lookup_failed: ${curErr.message}` }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (current?.id) {
      const { error: updErr } = await admin
        .from("organization_subscriptions")
        .update({ plan_id, status: "active", canceled_at: null })
        .eq("id", current.id);
      if (updErr) return new Response(JSON.stringify({ error: updErr.message }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    } else {
      const { error: insErr } = await admin
        .from("organization_subscriptions")
        .insert({ organization_id, plan_id, status: "active", started_at: new Date().toISOString() });
      if (insErr) return new Response(JSON.stringify({ error: insErr.message }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    await admin.from("admin_audit_logs").insert({
      actor_user_id: user.id, organization_id, action: "subscription.change_plan", entity: "subscription", metadata: { plan_id },
    });

    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
