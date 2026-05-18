import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { getCorsHeaders } from "../_shared/security.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing required Supabase environment variables");
}

// ─── Working hours helper (BRT = UTC-3) ───
function adjustToWorkingHours(
  scheduledDate: Date,
  workingHoursStart: string,
  workingHoursEnd: string,
): { adjusted: Date; wasAdjusted: boolean } {
  const BRT_OFFSET = -3;
  const brtTime = new Date(scheduledDate.getTime() + BRT_OFFSET * 60 * 60 * 1000);

  const [startH, startM] = workingHoursStart.split(":").map(Number);
  const [endH, endM] = workingHoursEnd.split(":").map(Number);

  const currentMinutes = brtTime.getUTCHours() * 60 + brtTime.getUTCMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
    return { adjusted: scheduledDate, wasAdjusted: false };
  }

  const targetBRT = new Date(brtTime);
  targetBRT.setUTCHours(startH, startM, 0, 0);
  if (currentMinutes > endMinutes) {
    targetBRT.setUTCDate(targetBRT.getUTCDate() + 1);
  }

  const adjustedUTC = new Date(targetBRT.getTime() - BRT_OFFSET * 60 * 60 * 1000);
  return { adjusted: adjustedUTC, wasAdjusted: true };
}

// 60–240s + 0–5s jitter
function getRandomIntervalMs(): number {
  const base = Math.floor(Math.random() * 180) + 60;
  const jitter = Math.floor(Math.random() * 5);
  return (base + jitter) * 1000;
}

function getUserClient(authHeader: string | null): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });
}

async function getBrokerForUser(client: SupabaseClient): Promise<{ brokerId: string; userId: string } | null> {
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;
  const { data: broker } = await client.from("brokers").select("id").eq("user_id", user.id).maybeSingle();
  if (!broker) return null;
  return { brokerId: (broker as { id: string }).id, userId: user.id };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop() || "";
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = getUserClient(authHeader);
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const broker = await getBrokerForUser(userClient);
    if (!broker) {
      return new Response(JSON.stringify({ error: "Broker not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ───────── GET /list ─────────
    if (path === "list" && req.method === "GET") {
      const { data, error } = await adminClient
        .from("whatsapp_message_queue")
        .select(`
          id, message, phone, scheduled_at, step_number, created_at,
          campaign_id,
          lead:lead_id (id, name, whatsapp),
          campaign:campaign_id (id, name)
        `)
        .eq("broker_id", broker.brokerId)
        .eq("status", "paused_by_system")
        .eq("pause_reason", "whatsapp_disconnected")
        .order("scheduled_at", { ascending: true });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ messages: data || [], count: data?.length || 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ───────── POST /reschedule ─────────
    if (path === "reschedule" && req.method === "POST") {
      const startedAt = Date.now();
      const body = await req.json().catch(() => null) as
        | { messageIds?: string[]; strategy?: "now" | "spread" | "datetime"; datetime?: string }
        | null;

      if (!body?.messageIds?.length || !body.strategy) {
        return new Response(JSON.stringify({ error: "messageIds and strategy required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[reschedule] received ${body.messageIds.length} ids, strategy=${body.strategy}`);

      // Fetch instance working hours
      const { data: instance } = await adminClient
        .from("broker_whatsapp_instances")
        .select("working_hours_start, working_hours_end")
        .eq("broker_id", broker.brokerId)
        .maybeSingle();

      const whStart = (instance as { working_hours_start?: string } | null)?.working_hours_start || "09:00";
      const whEnd = (instance as { working_hours_end?: string } | null)?.working_hours_end || "21:00";

      // Validate ownership in chunks of 200
      const idChunks = chunk(body.messageIds, 200);
      const ownedAll: Array<{ id: string; lead_id: string | null }> = [];
      for (const ids of idChunks) {
        const { data } = await adminClient
          .from("whatsapp_message_queue")
          .select("id, lead_id")
          .in("id", ids)
          .eq("broker_id", broker.brokerId)
          .eq("status", "paused_by_system")
          .eq("pause_reason", "whatsapp_disconnected");
        if (data) ownedAll.push(...(data as Array<{ id: string; lead_id: string | null }>));
      }

      if (!ownedAll.length) {
        return new Response(JSON.stringify({ error: "No valid paused messages found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Compute new scheduled times
      const now = new Date();
      let cursor = body.strategy === "datetime" && body.datetime
        ? new Date(body.datetime)
        : now;

      const updates: Array<{ id: string; scheduled_at: string }> = [];
      for (let i = 0; i < ownedAll.length; i++) {
        let target: Date;
        if (body.strategy === "now") {
          target = new Date(now.getTime() + 30 * 1000 + i * 45 * 1000);
        } else if (body.strategy === "spread") {
          if (i === 0) {
            target = new Date(now.getTime() + 30 * 1000);
            cursor = target;
          } else {
            cursor = new Date(cursor.getTime() + getRandomIntervalMs());
            target = cursor;
          }
        } else {
          if (i === 0) {
            target = cursor;
          } else {
            cursor = new Date(cursor.getTime() + getRandomIntervalMs());
            target = cursor;
          }
        }

        const { adjusted } = adjustToWorkingHours(target, whStart, whEnd);
        updates.push({ id: ownedAll[i].id, scheduled_at: adjusted.toISOString() });
      }

      // Apply updates in parallel chunks of 50 (preserves individual scheduled_at)
      const updateChunks = chunk(updates, 50);
      for (const group of updateChunks) {
        await Promise.all(group.map((u) =>
          adminClient
            .from("whatsapp_message_queue")
            .update({
              status: "scheduled",
              pause_reason: null,
              scheduled_at: u.scheduled_at,
              updated_at: new Date().toISOString(),
            })
            .eq("id", u.id)
        ));
      }

      // Log per-lead interaction (batches of 500)
      const leadIds = Array.from(new Set(ownedAll.map((m) => m.lead_id).filter(Boolean) as string[]));
      if (leadIds.length) {
        const interactions = leadIds.map((leadId) => ({
          lead_id: leadId,
          broker_id: broker.brokerId,
          interaction_type: "note_added" as const,
          notes: "🔄 Cadência reativada manualmente após reconexão do WhatsApp",
          created_by: broker.userId,
        }));
        for (const batch of chunk(interactions, 500)) {
          await adminClient.from("lead_interactions").insert(batch);
        }
      }

      console.log(`[reschedule] done ${updates.length} updates in ${Date.now() - startedAt}ms`);
      return new Response(JSON.stringify({ success: true, rescheduled: updates.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ───────── POST /discard ─────────
    if (path === "discard" && req.method === "POST") {
      const startedAt = Date.now();
      const body = await req.json().catch(() => null) as
        | { messageIds?: string[]; all?: boolean }
        | null;

      if (!body || (!body.all && !body.messageIds?.length)) {
        return new Response(JSON.stringify({ error: "messageIds or all required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Fast path: discard ALL paused messages for this broker ──
      if (body.all) {
        console.log(`[discard] fast path: all=true for broker ${broker.brokerId}`);

        const { data: affected } = await adminClient
          .from("whatsapp_message_queue")
          .select("lead_id")
          .eq("broker_id", broker.brokerId)
          .eq("status", "paused_by_system")
          .eq("pause_reason", "whatsapp_disconnected");

        const { error: updateError } = await adminClient
          .from("whatsapp_message_queue")
          .update({
            status: "cancelled",
            pause_reason: "discarded_after_disconnect",
            error_message: "Descartada pelo corretor após reconexão",
            updated_at: new Date().toISOString(),
          })
          .eq("broker_id", broker.brokerId)
          .eq("status", "paused_by_system")
          .eq("pause_reason", "whatsapp_disconnected");

        if (updateError) {
          return new Response(JSON.stringify({ error: updateError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const leadIds = Array.from(
          new Set((affected || []).map((r) => (r as { lead_id: string | null }).lead_id).filter(Boolean) as string[]),
        );
        if (leadIds.length) {
          const interactions = leadIds.map((leadId) => ({
            lead_id: leadId,
            broker_id: broker.brokerId,
            interaction_type: "note_added" as const,
            notes: "🗑️ Mensagem(ns) descartada(s) pelo corretor após desconexão do WhatsApp",
            created_by: broker.userId,
          }));
          for (const batch of chunk(interactions, 500)) {
            await adminClient.from("lead_interactions").insert(batch);
          }
        }

        console.log(`[discard] all done in ${Date.now() - startedAt}ms, affected ${affected?.length ?? 0}`);
        return new Response(JSON.stringify({ success: true, discarded: affected?.length ?? 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Standard path: discard provided IDs (chunked) ──
      console.log(`[discard] received ${body.messageIds!.length} ids`);
      const idChunks = chunk(body.messageIds!, 200);
      const ownedAll: Array<{ id: string; lead_id: string | null }> = [];
      for (const ids of idChunks) {
        const { data } = await adminClient
          .from("whatsapp_message_queue")
          .select("id, lead_id")
          .in("id", ids)
          .eq("broker_id", broker.brokerId)
          .eq("status", "paused_by_system")
          .eq("pause_reason", "whatsapp_disconnected");
        if (data) ownedAll.push(...(data as Array<{ id: string; lead_id: string | null }>));
      }

      if (!ownedAll.length) {
        return new Response(JSON.stringify({ error: "No valid paused messages found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const ownedIds = ownedAll.map((m) => m.id);
      for (const ids of chunk(ownedIds, 200)) {
        await adminClient
          .from("whatsapp_message_queue")
          .update({
            status: "cancelled",
            pause_reason: "discarded_after_disconnect",
            error_message: "Descartada pelo corretor após reconexão",
            updated_at: new Date().toISOString(),
          })
          .in("id", ids);
      }

      const leadIds = Array.from(new Set(ownedAll.map((m) => m.lead_id).filter(Boolean) as string[]));
      if (leadIds.length) {
        const interactions = leadIds.map((leadId) => ({
          lead_id: leadId,
          broker_id: broker.brokerId,
          interaction_type: "note_added" as const,
          notes: "🗑️ Mensagem(ns) descartada(s) pelo corretor após desconexão do WhatsApp",
          created_by: broker.userId,
        }));
        for (const batch of chunk(interactions, 500)) {
          await adminClient.from("lead_interactions").insert(batch);
        }
      }

      console.log(`[discard] done ${ownedAll.length} in ${Date.now() - startedAt}ms`);
      return new Response(JSON.stringify({ success: true, discarded: ownedAll.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[whatsapp-paused-messages] Error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
