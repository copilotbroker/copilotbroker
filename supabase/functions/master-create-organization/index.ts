import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/security.ts";

interface Body {
  name: string;
  slug: string;
  plan_id: string;
  owner_email?: string | null;
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    // Verify caller is super_admin
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleCheck } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "super_admin").maybeSingle();
    if (!roleCheck) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });

    const body: Body = await req.json();
    if (!body.name || !body.slug || !body.plan_id) {
      return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Create org
    const { data: org, error: orgErr } = await admin.from("organizations").insert({
      name: body.name, slug: body.slug, status: "active",
    }).select().single();
    if (orgErr) return new Response(JSON.stringify({ error: orgErr.message }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

    // Subscription
    await admin.from("organization_subscriptions").insert({
      organization_id: org.id, plan_id: body.plan_id, status: "active", started_at: new Date().toISOString(),
    });

    // Owner if exists
    if (body.owner_email) {
      const { data: existingUser } = await admin.auth.admin.listUsers();
      const found = existingUser.users.find((u) => u.email?.toLowerCase() === body.owner_email!.toLowerCase());
      if (found) {
        await admin.from("organization_members").insert({
          organization_id: org.id, user_id: found.id, role: "owner", is_active: true, joined_at: new Date().toISOString(),
        });
      }
    }

    await admin.from("admin_audit_logs").insert({
      actor_user_id: user.id, organization_id: org.id, action: "organization.create", entity: "organization", entity_id: org.id,
      metadata: { name: body.name, slug: body.slug, plan_id: body.plan_id },
    });

    return new Response(JSON.stringify({ organization: org }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
