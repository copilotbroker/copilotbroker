// Cria um usuário no auth + vincula como membro aprovado/ativo da organização.
// A trigger sync_broker_from_member materializa automaticamente em public.brokers.
// Autorização: super_admin OU owner/admin/manager da organização-alvo.
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/security.ts";

interface Body {
  organization_id: string;
  email: string;
  full_name: string;
  password: string;
  role: "manager" | "leader" | "broker";
}

const VALID_ROLES = ["manager", "leader", "broker"];

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

    // Validação básica
    if (!body.organization_id || !body.email || !body.password || !body.full_name) {
      return json(400, { error: "missing_fields" });
    }
    if (!VALID_ROLES.includes(body.role)) {
      return json(400, { error: "invalid_role" });
    }
    if (body.password.length < 6) {
      return json(400, { error: "password_too_short" });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) {
      return json(400, { error: "invalid_email" });
    }

    // Autorização: super_admin OU owner/admin/manager da org
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

    // Limite do plano (soft) para broker
    if (body.role === "broker") {
      const { data: limitRes } = await admin.rpc("check_organization_limit", {
        _org_id: body.organization_id,
        _feature_key: "max_brokers",
      });
      if ((limitRes as any)?.allowed === false) {
        return json(409, {
          error: "plan_limit_reached",
          limit: (limitRes as any)?.limit,
          current: (limitRes as any)?.current,
        });
      }
    }

    const emailNorm = body.email.toLowerCase().trim();

    // Tenta criar o usuário; se já existe, busca o existente
    let userId: string | null = null;
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: emailNorm,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: body.full_name.trim() },
    });

    if (createErr) {
      const msg = (createErr.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        // Usuário já existe — localizamos pelo email (paginação simples)
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const found = list?.users?.find((u) => (u.email ?? "").toLowerCase() === emailNorm);
        if (!found) return json(409, { error: "user_exists_not_listable" });
        userId = found.id;
      } else {
        return json(400, { error: createErr.message });
      }
    } else {
      userId = created.user?.id ?? null;
    }

    if (!userId) return json(500, { error: "user_id_unresolved" });

    // Inserir/atualizar organization_members (UNIQUE em organization_id, user_id, role)
    const { error: memberErr } = await admin
      .from("organization_members")
      .upsert(
        {
          user_id: userId,
          organization_id: body.organization_id,
          role: body.role,
          is_active: true,
          approval_status: "approved",
          approved_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,user_id,role" },
      );
    if (memberErr) return json(400, { error: memberErr.message });

    await admin.from("admin_audit_logs").insert({
      actor_user_id: user.id,
      organization_id: body.organization_id,
      action: "member.create_direct",
      entity: "organization_member",
      entity_id: userId,
      metadata: { email: emailNorm, role: body.role, full_name: body.full_name.trim() },
    });

    return json(200, { ok: true, user_id: userId });
  } catch (e: any) {
    return json(500, { error: e?.message ?? "unknown_error" });
  }
});
