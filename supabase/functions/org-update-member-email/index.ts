// Atualiza o e-mail (auth.users.email) de um membro da organização.
// Apenas owner/admin/manager da org ou super_admin podem chamar.
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/security.ts";

interface Body {
  organization_id: string;
  target_user_id: string;
  new_email: string;
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (status: number, payload: unknown) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json(401, { error: "unauthenticated" });

    const admin = createClient(supabaseUrl, serviceKey);
    const body = (await req.json()) as Body;

    if (!body.organization_id || !body.target_user_id || !body.new_email) {
      return json(400, { error: "missing_fields" });
    }
    const emailNorm = body.new_email.toLowerCase().trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailNorm)) {
      return json(400, { error: "invalid_email" });
    }

    // Autorização
    const [{ data: superRole }, { data: orgRole }] = await Promise.all([
      admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "super_admin").maybeSingle(),
      admin.from("organization_members").select("role")
        .eq("user_id", user.id)
        .eq("organization_id", body.organization_id)
        .eq("is_active", true)
        .maybeSingle(),
    ]);
    const isAuthorized = !!superRole || (orgRole && ["owner", "admin", "manager"].includes(orgRole.role));
    if (!isAuthorized) return json(403, { error: "forbidden" });

    // Confirma que o target pertence à org
    const { data: targetMember } = await admin
      .from("organization_members")
      .select("id")
      .eq("organization_id", body.organization_id)
      .eq("user_id", body.target_user_id)
      .maybeSingle();
    if (!targetMember) return json(404, { error: "member_not_found" });

    // Verifica se o e-mail já está em uso por outro usuário
    const perPage = 200;
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) break;
      const found = data?.users?.find((u: any) => (u.email ?? "").toLowerCase() === emailNorm);
      if (found && found.id !== body.target_user_id) {
        return json(409, { error: "email_already_in_use" });
      }
      if (!data?.users?.length || data.users.length < perPage) break;
    }

    const { error: updErr } = await admin.auth.admin.updateUserById(body.target_user_id, {
      email: emailNorm,
      email_confirm: true,
    });
    if (updErr) return json(400, { error: updErr.message });

    await admin.from("admin_audit_logs").insert({
      actor_user_id: user.id,
      organization_id: body.organization_id,
      action: "member.update_email",
      entity: "auth_user",
      entity_id: body.target_user_id,
      metadata: { new_email: emailNorm },
    });

    return json(200, { ok: true });
  } catch (e: any) {
    return json(500, { error: e?.message ?? "unknown_error" });
  }
});
