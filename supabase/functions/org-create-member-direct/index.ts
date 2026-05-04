// Cria um usuário no auth + vincula como membro aprovado/ativo da organização.
// Se o e-mail já existir no auth.users, NÃO cria novo nem altera a senha:
// retorna 409 user_already_exists. O cliente pode reenviar com link_existing=true
// para vincular a conta existente sem mexer em senha (preserva segurança).
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/security.ts";

interface Body {
  organization_id: string;
  email: string;
  full_name: string;
  password: string;
  role: "manager" | "leader" | "broker";
  link_existing?: boolean;
  whatsapp?: string;
}

const VALID_ROLES = ["manager", "leader", "broker"];

const findUserIdByEmail = async (admin: any, email: string): Promise<string | null> => {
  // Tenta paginar listUsers até encontrar (admin API não expõe filtro por email diretamente).
  const perPage = 200;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) return null;
    const found = data?.users?.find((u: any) => (u.email ?? "").toLowerCase() === email);
    if (found) return found.id;
    if (!data?.users?.length || data.users.length < perPage) break;
  }
  return null;
};

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

    if (!body.organization_id || !body.email || !body.full_name) {
      return json(400, { error: "missing_fields" });
    }
    if (!VALID_ROLES.includes(body.role)) {
      return json(400, { error: "invalid_role" });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) {
      return json(400, { error: "invalid_email" });
    }

    const linkExisting = body.link_existing === true;

    if (!linkExisting) {
      if (!body.password) return json(400, { error: "missing_fields" });
      if (body.password.length < 6) return json(400, { error: "password_too_short" });
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

    // Lookup prévio: o usuário já existe?
    const existingUserId = await findUserIdByEmail(admin, emailNorm);

    let userId: string | null = null;
    let linked = false;

    if (existingUserId) {
      if (!linkExisting) {
        return json(409, {
          error: "user_already_exists",
          existing_user_id: existingUserId,
          message: "Já existe uma conta com esse e-mail. Confirme se deseja vincular sem alterar a senha.",
        });
      }
      userId = existingUserId;
      linked = true;
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: emailNorm,
        password: body.password,
        email_confirm: true,
        user_metadata: { full_name: body.full_name.trim() },
      });
      if (createErr) {
        // Race: alguém criou no meio do caminho — tenta achar e tratar como link_existing exigido
        const retryId = await findUserIdByEmail(admin, emailNorm);
        if (retryId) {
          return json(409, {
            error: "user_already_exists",
            existing_user_id: retryId,
            message: "Já existe uma conta com esse e-mail. Confirme se deseja vincular sem alterar a senha.",
          });
        }
        return json(400, { error: createErr.message });
      }
      userId = created.user?.id ?? null;
    }

    if (!userId) return json(500, { error: "user_id_unresolved" });

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
          full_name: body.full_name.trim() || null,
          whatsapp: body.whatsapp?.trim() || null,
        },
        { onConflict: "organization_id,user_id,role" },
      );
    if (memberErr) return json(400, { error: memberErr.message });

    await admin.from("admin_audit_logs").insert({
      actor_user_id: user.id,
      organization_id: body.organization_id,
      action: linked ? "member.link_existing" : "member.create_direct",
      entity: "organization_member",
      entity_id: userId,
      metadata: { email: emailNorm, role: body.role, full_name: body.full_name.trim(), linked },
    });

    return json(200, { ok: true, user_id: userId, linked });
  } catch (e: any) {
    return json(500, { error: e?.message ?? "unknown_error" });
  }
});
