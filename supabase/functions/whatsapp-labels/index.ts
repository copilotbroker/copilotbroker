import { Hono } from "https://deno.land/x/hono@v3.12.11/mod.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { getCorsHeaders } from "../_shared/security.ts";

const app = new Hono().basePath("/whatsapp-labels");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const UAZAPI_BASE_URL = (Deno.env.get("UAZAPI_INSTANCE_URL") || "").replace(/\/+$/g, "");
const UAZAPI_ADMIN_TOKEN = Deno.env.get("UAZAPI_ADMIN_TOKEN") || Deno.env.get("UAZAPI_TOKEN") || "";

function getHonoCors(c: { req: { header: (name: string) => string | undefined } }) {
  const origin = c.req.header("origin") || "";
  return getCorsHeaders(new Request("https://dummy", { headers: { origin } }));
}

app.use("*", async (c, next) => {
  await next();
  const cors = getHonoCors(c);
  Object.entries(cors).forEach(([key, value]) => c.res.headers.set(key, value));
});

app.options("/*", (c) => c.json({}, 200, getHonoCors(c)));

const getSupabaseClient = (authHeader?: string): SupabaseClient<any, any, any> => {
  if (authHeader) {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
};

const normalizePhone = (phone?: string | null) => (phone || "").replace(/\D/g, "");

const upsertLocalLabels = async (
  supabase: SupabaseClient<any, any, any>,
  brokerId: string,
  labels: Array<{ external_id?: string | null; name: string; color?: string | null }>,
) => {
  if (labels.length === 0) return [];

  const payload = labels.map((label) => ({
    broker_id: brokerId,
    external_id: label.external_id || null,
    name: label.name,
    color: label.color || null,
    source: "whatsapp",
    last_synced_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from("whatsapp_labels")
    .upsert(payload, { onConflict: "broker_id,name" })
    .select("id, external_id, name");

  if (error) throw error;
  return data || [];
};

const tryFetchRemoteLabels = async (instanceName?: string | null, instanceToken?: string | null) => {
  if (!UAZAPI_BASE_URL || !instanceName || !(instanceToken || UAZAPI_ADMIN_TOKEN)) {
    return [] as Array<{ external_id?: string | null; name: string; color?: string | null }>;
  }

  const authToken = instanceToken || UAZAPI_ADMIN_TOKEN;
  const candidates = [
    `${UAZAPI_BASE_URL}/instance/labels?instance=${encodeURIComponent(instanceName)}`,
    `${UAZAPI_BASE_URL}/instance/label/list?instance=${encodeURIComponent(instanceName)}`,
    `${UAZAPI_BASE_URL}/chat/labels?instance=${encodeURIComponent(instanceName)}`,
    `${UAZAPI_BASE_URL}/labels?instance=${encodeURIComponent(instanceName)}`,
  ];

  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          token: authToken,
          admintoken: authToken,
        },
      });

      if (!response.ok) continue;
      const json = await response.json();
      const items = Array.isArray(json)
        ? json
        : Array.isArray(json?.labels)
        ? json.labels
        : Array.isArray(json?.data)
        ? json.data
        : [];

      const parsed = items
        .map((item: any) => ({
          external_id: String(item?.id ?? item?.labelId ?? item?.uuid ?? "") || null,
          name: String(item?.name ?? item?.label ?? item?.title ?? "").trim(),
          color: typeof item?.color === "string" ? item.color : null,
        }))
        .filter((item: { name: string }) => item.name);

      if (parsed.length > 0) return parsed;
    } catch {
      // fallback to local-only sync if provider shape differs
    }
  }

  return [] as Array<{ external_id?: string | null; name: string; color?: string | null }>;
};

const tryApplyRemoteLabel = async (
  params: { instanceName?: string | null; instanceToken?: string | null; phone?: string | null; externalId?: string | null; mode: "apply" | "remove" },
) => {
  const { instanceName, instanceToken, phone, externalId, mode } = params;
  if (!UAZAPI_BASE_URL || !instanceName || !phone || !externalId || !(instanceToken || UAZAPI_ADMIN_TOKEN)) {
    return false;
  }

  const authToken = instanceToken || UAZAPI_ADMIN_TOKEN;
  const phoneDigits = normalizePhone(phone);
  const chatId = `${phoneDigits}@s.whatsapp.net`;
  const body = JSON.stringify({
    instance: instanceName,
    chatId,
    labelId: externalId,
    labels: mode === "apply" ? [externalId] : [],
  });

  const candidates = mode === "apply"
    ? [
        `${UAZAPI_BASE_URL}/chat/labels/add`,
        `${UAZAPI_BASE_URL}/labels/chats/${encodeURIComponent(chatId)}`,
        `${UAZAPI_BASE_URL}/chat/label`,
      ]
    : [
        `${UAZAPI_BASE_URL}/chat/labels/remove`,
        `${UAZAPI_BASE_URL}/labels/chats/${encodeURIComponent(chatId)}`,
        `${UAZAPI_BASE_URL}/chat/label/remove`,
      ];

  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        method: mode === "remove" && url.includes("/labels/chats/") ? "PUT" : "POST",
        headers: {
          token: authToken,
          admintoken: authToken,
          "Content-Type": "application/json",
        },
        body,
      });

      if (response.ok) return true;
    } catch {
      // local persistence still succeeds
    }
  }

  return false;
};

app.post("/", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const supabase = getSupabaseClient(authHeader);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401, getHonoCors(c));
    }

    const body = await c.req.json();
    const action = body?.action as "sync" | "apply" | "remove";
    const leadId = body?.leadId as string | undefined;
    const labelId = body?.labelId as string | undefined;
    const phone = body?.phone as string | undefined;

    if (!action || !leadId) {
      return c.json({ error: "Missing action or leadId" }, 400, getHonoCors(c));
    }

    const { data: broker } = await supabase
      .from("brokers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!broker?.id) {
      return c.json({ error: "Broker not found" }, 404, getHonoCors(c));
    }

    const brokerId = broker.id as string;

    const { data: instance } = await supabase
      .from("broker_whatsapp_instances")
      .select("instance_name, instance_token")
      .eq("broker_id", brokerId)
      .maybeSingle();

    if (action === "sync") {
      const remoteLabels = await tryFetchRemoteLabels(instance?.instance_name, instance?.instance_token);
      if (remoteLabels.length > 0) {
        await upsertLocalLabels(supabase, brokerId, remoteLabels);
      }

      return c.json({ success: true, synced: remoteLabels.length }, 200, getHonoCors(c));
    }

    if (!labelId) {
      return c.json({ error: "Missing labelId" }, 400, getHonoCors(c));
    }

    const { data: label, error: labelError } = await supabase
      .from("whatsapp_labels")
      .select("id, external_id")
      .eq("id", labelId)
      .eq("broker_id", brokerId)
      .maybeSingle();

    if (labelError || !label) {
      return c.json({ error: "Label not found" }, 404, getHonoCors(c));
    }

    if (action === "apply") {
      const { error } = await supabase
        .from("lead_whatsapp_labels")
        .upsert({
          lead_id: leadId,
          label_id: labelId,
          broker_id: brokerId,
          applied_via: "crm",
          external_chat_id: phone ? `${normalizePhone(phone)}@s.whatsapp.net` : null,
        }, { onConflict: "lead_id,label_id" });

      if (error) throw error;
      await tryApplyRemoteLabel({
        instanceName: instance?.instance_name,
        instanceToken: instance?.instance_token,
        phone,
        externalId: label.external_id,
        mode: "apply",
      });

      return c.json({ success: true }, 200, getHonoCors(c));
    }

    const { error } = await supabase
      .from("lead_whatsapp_labels")
      .delete()
      .eq("lead_id", leadId)
      .eq("label_id", labelId)
      .eq("broker_id", brokerId);

    if (error) throw error;
    await tryApplyRemoteLabel({
      instanceName: instance?.instance_name,
      instanceToken: instance?.instance_token,
      phone,
      externalId: label.external_id,
      mode: "remove",
    });

    return c.json({ success: true }, 200, getHonoCors(c));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("whatsapp-labels error:", message);
    return c.json({ error: message }, 500, getHonoCors(c));
  }
});

Deno.serve(app.fetch);
