import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/security.ts";

interface Body {
  organization_id: string;
  action: "approve" | "reject";
  plan_id?: string;
  rejection_reason?: string;
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "unauthenticated" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleCheck } = await admin
      .from("user_roles").select("role")
      .eq("user_id", user.id).eq("role", "super_admin").maybeSingle();
    if (!roleCheck) return json({ error: "forbidden" }, 403);

    const body: Body = await req.json();
    if (!body.organization_id || !body.action) return json({ error: "missing_fields" }, 400);

    const { data: org, error: orgErr } = await admin
      .from("organizations").select("*")
      .eq("id", body.organization_id).maybeSingle();
    if (orgErr || !org) return json({ error: "org_not_found" }, 404);
    if (org.status !== "pending_approval") return json({ error: "not_pending" }, 400);

    if (body.action === "reject") {
      await admin.from("organizations").update({
        status: "rejected",
        rejection_reason: body.rejection_reason ?? null,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      }).eq("id", org.id);

      await admin.from("organization_members").update({
        approval_status: "rejected",
        rejection_reason: body.rejection_reason ?? null,
      }).eq("organization_id", org.id);

      await admin.from("admin_audit_logs").insert({
        actor_user_id: user.id,
        organization_id: org.id,
        action: "organization.rejected",
        entity: "organization",
        entity_id: org.id,
        metadata: { reason: body.rejection_reason ?? null },
      });

      console.log(`[master-approve] Rejected org ${org.slug} (reason: ${body.rejection_reason ?? "n/a"})`);
      return json({ ok: true, status: "rejected" });
    }

    // APPROVE: pick starter plan if not provided
    let planId = body.plan_id;
    if (!planId) {
      const { data: starter } = await admin.from("plans").select("id").eq("code", "starter").eq("is_active", true).maybeSingle();
      if (!starter) {
        const { data: anyPlan } = await admin.from("plans").select("id").eq("is_active", true).limit(1).maybeSingle();
        if (!anyPlan) return json({ error: "no_active_plan" }, 400);
        planId = anyPlan.id;
      } else {
        planId = starter.id;
      }
    }

    await admin.from("organizations").update({
      status: "active",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      rejection_reason: null,
    }).eq("id", org.id);

    await admin.from("organization_members").update({
      is_active: true,
      approval_status: "approved",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    }).eq("organization_id", org.id).eq("role", "owner");

    // Create subscription if none active
    const { data: existingSub } = await admin
      .from("organization_subscriptions").select("id")
      .eq("organization_id", org.id)
      .in("status", ["active", "trial", "past_due"]).maybeSingle();

    if (!existingSub) {
      await admin.from("organization_subscriptions").insert({
        organization_id: org.id,
        plan_id: planId,
        status: "active",
        started_at: new Date().toISOString(),
      });
    }

    await admin.from("admin_audit_logs").insert({
      actor_user_id: user.id,
      organization_id: org.id,
      action: "organization.approved",
      entity: "organization",
      entity_id: org.id,
      metadata: { plan_id: planId },
    });

    console.log(`[master-approve] Approved org ${org.slug} with plan ${planId}`);
    return json({ ok: true, status: "active", plan_id: planId });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});
