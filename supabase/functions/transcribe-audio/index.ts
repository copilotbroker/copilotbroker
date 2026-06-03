// Transcribes a WhatsApp audio message using Lovable AI (Gemini Flash)
// and stores the result inside conversation_messages.metadata.transcription.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const MODEL = "google/gemini-2.5-flash";

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

async function updateTranscription(
  supabase: ReturnType<typeof createClient>,
  messageId: string,
  existingMeta: Record<string, unknown>,
  patch: Record<string, unknown>,
) {
  const next = { ...(existingMeta || {}), transcription: { ...(existingMeta?.transcription as object || {}), ...patch } };
  await supabase.from("conversation_messages").update({ metadata: next }).eq("id", messageId);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message_id } = await req.json().catch(() => ({}));
    if (!message_id || typeof message_id !== "string") {
      return new Response(JSON.stringify({ error: "message_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: msg, error: msgErr } = await supabase
      .from("conversation_messages")
      .select("id, message_type, metadata")
      .eq("id", message_id)
      .maybeSingle();

    if (msgErr || !msg) {
      return new Response(JSON.stringify({ error: "message not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (msg.message_type !== "audio") {
      return new Response(JSON.stringify({ skipped: "not audio" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const meta = (msg.metadata || {}) as Record<string, any>;
    const existing = meta.transcription as { status?: string; text?: string } | undefined;
    if (existing?.status === "done" && existing.text) {
      return new Response(JSON.stringify({ ok: true, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const storagePath = typeof meta.storage_path === "string" ? meta.storage_path : null;
    const fileUrl = typeof meta.file_url === "string" ? meta.file_url : null;
    let mimeType = typeof meta.mime_type === "string" ? meta.mime_type : "audio/ogg";

    // Mark as pending
    await updateTranscription(supabase, message_id, meta, { status: "pending", started_at: new Date().toISOString() });

    let bytes: Uint8Array | null = null;
    if (storagePath) {
      const { data: file, error: dlErr } = await supabase.storage.from("project-media").download(storagePath);
      if (!dlErr && file) {
        bytes = new Uint8Array(await file.arrayBuffer());
        if (file.type) mimeType = file.type;
      }
    }
    if (!bytes && fileUrl) {
      const r = await fetch(fileUrl);
      if (r.ok) {
        bytes = new Uint8Array(await r.arrayBuffer());
        const ct = r.headers.get("content-type");
        if (ct) mimeType = ct;
      }
    }
    if (!bytes) {
      await updateTranscription(supabase, message_id, meta, { status: "failed", error: "audio not accessible" });
      return new Response(JSON.stringify({ error: "audio not accessible" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gemini expects standard audio mime types. Normalize unknown ones.
    if (!mimeType.startsWith("audio/")) mimeType = "audio/ogg";
    const b64 = bytesToBase64(bytes);

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "Você transcreve áudios de WhatsApp em português brasileiro. Devolva APENAS o texto transcrito, sem comentários, sem cabeçalhos, sem rótulos como 'Transcrição:'. Mantenha a pontuação natural.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcreva fielmente este áudio." },
              {
                type: "input_audio",
                input_audio: { data: b64, format: mimeType.split("/")[1]?.split(";")[0] || "ogg" },
              },
            ],
          },
        ],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text().catch(() => "");
      const status = aiResp.status === 429 ? "rate_limited" : aiResp.status === 402 ? "rate_limited" : "failed";
      await updateTranscription(supabase, message_id, meta, {
        status, error: `${aiResp.status}: ${errText.slice(0, 200)}`,
      });
      return new Response(JSON.stringify({ error: errText || "ai error", code: aiResp.status }), {
        status: aiResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const text: string = data?.choices?.[0]?.message?.content?.toString?.().trim() || "";
    if (!text) {
      await updateTranscription(supabase, message_id, meta, { status: "failed", error: "empty response" });
      return new Response(JSON.stringify({ error: "empty response" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await updateTranscription(supabase, message_id, meta, {
      status: "done",
      text,
      model: MODEL,
      generated_at: new Date().toISOString(),
      error: null,
    });

    return new Response(JSON.stringify({ ok: true, text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("transcribe-audio error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
