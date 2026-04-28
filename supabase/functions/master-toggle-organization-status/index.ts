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

    const { organization_id, status } = await req.json();
    const valid = ["active", "suspended", "canceled", "trial"];
    if (!organization_id || !valid.includes(status)) {
      return new Response(JSON.stringify({ error: "invalid_input" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { error } = await admin.from("organizations").update({ status }).eq("id", organization_id);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

    await admin.from("admin_audit_logs").insert({
      actor_user_id: user.id, organization_id, action: `organization.${status}`, entity: "organization", entity_id: organization_id,
    });

    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
