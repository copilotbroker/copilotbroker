import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/security.ts";

interface Body {
  organization_id: string;
  email: string;
  role: "owner" | "admin" | "manager" | "leader" | "broker";
}

const VALID_ROLES = ["owner", "admin", "manager", "leader", "broker"];

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
    const body: Body = await req.json();

    if (!body.organization_id || !body.email || !VALID_ROLES.includes(body.role)) {
      return new Response(JSON.stringify({ error: "invalid_input" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Authorization: super_admin OR owner/admin of this org
    const [{ data: superRole }, { data: orgRole }] = await Promise.all([
      admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "super_admin").maybeSingle(),
      admin.from("organization_members").select("role").eq("user_id", user.id)
        .eq("organization_id", body.organization_id).eq("is_active", true).maybeSingle(),
    ]);

    const isAuthorized = !!superRole || (orgRole && ["owner", "admin"].includes(orgRole.role));
    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Plan limit check (soft) — only for broker role
    if (body.role === "broker") {
      const [{ data: sub }, { count }] = await Promise.all([
        admin.from("organization_subscriptions").select("plan_id")
          .eq("organization_id", body.organization_id).in("status", ["active", "trial", "past_due"])
          .order("started_at", { ascending: false }).limit(1).maybeSingle(),
        admin.from("brokers").select("id", { count: "exact", head: true })
          .eq("organization_id", body.organization_id).eq("is_active", true),
      ]);
      if (sub?.plan_id) {
        const { data: feat } = await admin.from("plan_features").select("value_int")
          .eq("plan_id", sub.plan_id).eq("feature_key", "max_brokers").maybeSingle();
        if (feat?.value_int != null && (count ?? 0) >= feat.value_int) {
          return new Response(JSON.stringify({ error: "plan_limit_reached", limit: feat.value_int }), {
            status: 409, headers: { ...cors, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Generate token + expiry (7 days)
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: invite, error: insErr } = await admin.from("organization_invites").insert({
      organization_id: body.organization_id,
      email: body.email.toLowerCase().trim(),
      role: body.role,
      token,
      expires_at: expiresAt,
    }).select().single();

    if (insErr) return new Response(JSON.stringify({ error: insErr.message }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

    // Build accept URL using request origin (fallback to publishable preview)
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    const baseUrl = origin ? new URL(origin).origin : "";
    const acceptUrl = `${baseUrl}/convite/aceitar?token=${token}`;

    await admin.from("admin_audit_logs").insert({
      actor_user_id: user.id, organization_id: body.organization_id,
      action: "invite.create", entity: "invite", entity_id: invite.id,
      metadata: { email: body.email, role: body.role },
    });

    return new Response(JSON.stringify({ invite, accept_url: acceptUrl }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
