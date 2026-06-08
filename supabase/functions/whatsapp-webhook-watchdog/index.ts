// Watchdog que detecta instâncias WhatsApp com webhook ausente/incorreto na UAZAPI
// e reconfigura automaticamente. Pode ser chamado via pg_cron ou manualmente.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { getCorsHeaders } from "../_shared/security.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const UAZAPI_BASE_URL = (Deno.env.get("UAZAPI_INSTANCE_URL") || "").replace(/\/+$/g, "");
const UAZAPI_TOKEN = Deno.env.get("UAZAPI_TOKEN") || "";
const UAZAPI_ADMIN_TOKEN = Deno.env.get("UAZAPI_ADMIN_TOKEN") || "";
const UAZAPI_DEFAULT_TOKEN = UAZAPI_ADMIN_TOKEN || UAZAPI_TOKEN;
const WEBHOOK_SECRET = Deno.env.get("UAZAPI_WEBHOOK_SECRET") || "";

const EXPECTED_WEBHOOK_URL = WEBHOOK_SECRET
  ? `${SUPABASE_URL}/functions/v1/whatsapp-webhook/${WEBHOOK_SECRET}`
  : `${SUPABASE_URL}/functions/v1/whatsapp-webhook`;

const EXPECTED_EVENTS = ["messages", "connection", "messages_update"];

type CheckResult = {
  instance_name: string;
  broker_id: string;
  current_webhook: string | null;
  action: "ok" | "reconfigured" | "failed";
  error?: string;
};

async function fetchWebhookConfig(token: string): Promise<{ url: string | null; enabled: boolean; reachable: boolean } | null> {
  try {
    const r = await fetch(`${UAZAPI_BASE_URL}/webhook`, {
      method: "GET",
      headers: { token },
    });
    if (!r.ok) return null;
    const body = await r.json().catch(() => null);
    // UAZAPI can return null, a single object, or an array of webhook entries
    if (body == null) return { url: null, enabled: false, reachable: true };
    const entry = Array.isArray(body) ? body[0] : body;
    if (!entry || typeof entry !== "object") return { url: null, enabled: false, reachable: true };
    return {
      url: (entry as any).url ?? null,
      enabled: (entry as any).enabled !== false,
      reachable: true,
    };
  } catch {
    return null;
  }
}

async function setWebhook(token: string): Promise<{ success: boolean; details?: string }> {
  try {
    const r = await fetch(`${UAZAPI_BASE_URL}/webhook`, {
      method: "POST",
      headers: { token, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: EXPECTED_WEBHOOK_URL,
        enabled: true,
        events: EXPECTED_EVENTS,
        excludeMessages: ["wasSentByApi"],
      }),
    });
    if (r.ok) return { success: true };
    const text = await r.text().catch(() => "");
    return { success: false, details: text.substring(0, 200) };
  } catch (err) {
    return { success: false, details: (err as Error).message };
  }
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  if (!UAZAPI_BASE_URL || !SUPABASE_URL || !SERVICE_ROLE) {
    return new Response(JSON.stringify({ error: "missing_config" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Optional: filter by broker_id (manual single-instance run)
  let onlyBroker: string | null = null;
  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => null);
      onlyBroker = body?.broker_id ?? null;
    }
  } catch { /* ignore */ }

  let query = supabase
    .from("broker_whatsapp_instances")
    .select("id, broker_id, instance_name, instance_token, status");

  if (onlyBroker) query = query.eq("broker_id", onlyBroker);

  const { data: instances, error } = await query;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const results: CheckResult[] = [];

  for (const inst of instances ?? []) {
    const token = (inst as any).instance_token || UAZAPI_DEFAULT_TOKEN;
    if (!token) {
      results.push({
        instance_name: (inst as any).instance_name,
        broker_id: (inst as any).broker_id,
        current_webhook: null,
        action: "failed",
        error: "no_token",
      });
      continue;
    }

    const cfg = await fetchWebhookConfig(token);
    const currentUrl = cfg?.url ?? null;
    const isCorrect =
      cfg !== null &&
      cfg.enabled &&
      typeof currentUrl === "string" &&
      currentUrl === EXPECTED_WEBHOOK_URL;

    if (isCorrect) {
      results.push({
        instance_name: (inst as any).instance_name,
        broker_id: (inst as any).broker_id,
        current_webhook: currentUrl,
        action: "ok",
      });
      continue;
    }

    const fix = await setWebhook(token);
    results.push({
      instance_name: (inst as any).instance_name,
      broker_id: (inst as any).broker_id,
      current_webhook: currentUrl,
      action: fix.success ? "reconfigured" : "failed",
      error: fix.success ? undefined : fix.details,
    });

    if (fix.success) {
      console.log(`[WATCHDOG] Reconfigured webhook for ${(inst as any).instance_name}`);
    } else {
      console.error(`[WATCHDOG] Failed for ${(inst as any).instance_name}: ${fix.details}`);
    }
  }

  const summary = {
    total: results.length,
    ok: results.filter((r) => r.action === "ok").length,
    reconfigured: results.filter((r) => r.action === "reconfigured").length,
    failed: results.filter((r) => r.action === "failed").length,
  };

  console.log(`[WATCHDOG] Run complete:`, summary);

  return new Response(JSON.stringify({ summary, results }), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
