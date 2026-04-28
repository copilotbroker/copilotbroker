import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/security.ts";

interface Body {
  organization_name: string;
  slug: string;
  contact_email: string;
  contact_phone?: string;
  owner_name: string;
  owner_password: string;
}

const slugRegex = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

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
    const name = (body.organization_name || "").trim();
    const slug = (body.slug || "").trim().toLowerCase();
    const email = (body.contact_email || "").trim().toLowerCase();
    const ownerName = (body.owner_name || "").trim();
    const password = body.owner_password || "";

    if (!name || !slug || !email || !ownerName || !password) {
      return json({ error: "missing_fields" }, 400);
    }
    if (!slugRegex.test(slug) || slug.length < 3 || slug.length > 40) {
      return json({ error: "invalid_slug" }, 400);
    }
    if (password.length < 8) {
      return json({ error: "weak_password" }, 400);
    }

    // Check slug not taken
    const { data: existingOrg } = await admin
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existingOrg) return json({ error: "slug_taken" }, 409);

    // Create / find user
    const { data: usersList } = await admin.auth.admin.listUsers();
    let user = usersList.users.find((u) => u.email?.toLowerCase() === email);

    if (!user) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: ownerName },
      });
      if (createErr) return json({ error: createErr.message }, 400);
      user = created.user!;
    }

    // Create organization in pending_approval
    const { data: org, error: orgErr } = await admin
      .from("organizations")
      .insert({
        name,
        slug,
        status: "pending_approval",
        contact_email: email,
        contact_phone: body.contact_phone ?? null,
        requested_by_user_id: user.id,
      })
      .select()
      .single();
    if (orgErr) return json({ error: orgErr.message }, 400);

    // Link user as owner but inactive (until approval)
    await admin.from("organization_members").insert({
      organization_id: org.id,
      user_id: user.id,
      role: "owner",
      is_active: false,
      approval_status: "pending",
      joined_at: new Date().toISOString(),
    });

    await admin.from("admin_audit_logs").insert({
      organization_id: org.id,
      action: "organization.signup_requested",
      entity: "organization",
      entity_id: org.id,
      metadata: { name, slug, contact_email: email },
    });

    // TODO: send notification email to super admins (email domain not configured yet)
    console.log(`[org-public-signup] New pending organization: ${name} (${slug}) by ${email}`);

    return json({ ok: true, organization_id: org.id });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});
