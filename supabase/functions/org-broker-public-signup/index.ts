import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/security.ts";

interface Body {
  org_slug: string;
  full_name: string;
  email: string;
  whatsapp?: string;
  password: string;
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body: Body = await req.json();
    const slug = (body.org_slug || "").trim().toLowerCase();
    const email = (body.email || "").trim().toLowerCase();
    const fullName = (body.full_name || "").trim();
    const password = body.password || "";

    if (!slug || !email || !fullName || !password) return json({ error: "missing_fields" }, 400);
    if (password.length < 8) return json({ error: "weak_password" }, 400);

    // Find active organization
    const { data: org } = await admin
      .from("organizations").select("id, name, slug, status")
      .eq("slug", slug).maybeSingle();
    if (!org || org.status !== "active") return json({ error: "org_not_found_or_inactive" }, 404);

    // Find or create user
    const { data: usersList } = await admin.auth.admin.listUsers();
    let user = usersList.users.find((u) => u.email?.toLowerCase() === email);
    if (!user) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (createErr) return json({ error: createErr.message }, 400);
      user = created.user!;
    }

    // Check if already member
    const { data: existing } = await admin
      .from("organization_members")
      .select("id, approval_status, is_active")
      .eq("organization_id", org.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return json({ ok: true, already_member: true, status: existing.approval_status });
    }

    const whatsappClean = (body.whatsapp || "").replace(/\D/g, "") || null;

    // Insert as broker, pending approval
    await admin.from("organization_members").insert({
      organization_id: org.id,
      user_id: user.id,
      role: "broker",
      is_active: false,
      approval_status: "pending",
      joined_at: new Date().toISOString(),
      full_name: fullName,
      whatsapp: whatsappClean,
    });

    // Also persist on brokers table if a broker profile already exists
    if (whatsappClean) {
      await admin
        .from("brokers")
        .update({ whatsapp: whatsappClean, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }

    await admin.from("admin_audit_logs").insert({
      organization_id: org.id,
      action: "broker.signup_requested",
      entity: "organization_member",
      entity_id: user.id,
      metadata: { email, full_name: fullName, whatsapp: body.whatsapp ?? null },
    });

    console.log(`[org-broker-public-signup] Pending broker for ${slug}: ${email}`);
    return json({ ok: true, organization_name: org.name });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});
