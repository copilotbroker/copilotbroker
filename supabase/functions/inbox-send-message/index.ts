import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { getCorsHeaders } from "../_shared/security.ts";

const UAZAPI_INSTANCE_URL = Deno.env.get("UAZAPI_INSTANCE_URL") || "";
const UAZAPI_TOKEN = Deno.env.get("UAZAPI_TOKEN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const formatPhoneForUAZAPI = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
};

const getAuthHeaders = (token: string) => [
  { token },
  { admintoken: token },
  { apikey: token },
  { "x-api-key": token },
  { Authorization: `Bearer ${token}` },
];

async function fetchFileAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const CHUNK_SIZE = 8192;
    let binary = "";
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.subarray(i, i + CHUNK_SIZE);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return btoa(binary);
  } catch (e) {
    console.warn("⚠️ Failed to fetch file for base64:", (e as Error).message);
    return null;
  }
}

async function sendViaUAZAPI(
  instanceToken: string | null,
  phone: string,
  content: string,
  messageType: string = "text",
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const cleanPhone = formatPhoneForUAZAPI(phone);
  const token = instanceToken || UAZAPI_TOKEN;

  let baseUrl = UAZAPI_INSTANCE_URL.replace(/\/$/, "");
  try {
    baseUrl = new URL(baseUrl).origin;
  } catch {}

  const mediaUrl = typeof metadata?.file_url === "string" ? metadata.file_url : undefined;
  const fileName = typeof metadata?.file_name === "string" ? metadata.file_name : undefined;
  const mimeType = typeof metadata?.mime_type === "string" ? metadata.mime_type : undefined;
  const caption = content || "";

  // For media messages, try to fetch the file as base64 for APIs that require it
  let fileBase64: string | null = null;
  if (messageType !== "text" && mediaUrl) {
    fileBase64 = await fetchFileAsBase64(mediaUrl);
  }

  // Audio messages: no caption/text — send as PTT (push-to-talk) for WhatsApp playback
  const isAudio = messageType === "audio";
  const dataUri = fileBase64 ? `data:${mimeType || "application/octet-stream"};base64,${fileBase64}` : undefined;

  const requests = messageType === "text"
    ? [
        { endpoint: "/send/text", body: { number: cleanPhone, text: content } },
        { endpoint: "/chat/send/text", body: { number: cleanPhone, text: content } },
      ]
    : isAudio
    ? [
        // Official UAZAPI shape for media is /send/media with { number, type, file, caption? }
        ...(dataUri ? [
          { endpoint: "/send/media", body: { number: cleanPhone, type: "ptt", file: dataUri } },
          { endpoint: "/send/media", body: { number: cleanPhone, type: "audio", file: dataUri } },
        ] : []),
        ...(mediaUrl ? [
          { endpoint: "/send/media", body: { number: cleanPhone, type: "ptt", file: mediaUrl } },
          { endpoint: "/send/media", body: { number: cleanPhone, type: "audio", file: mediaUrl } },
        ] : []),
        // Legacy fallbacks for installations exposing dedicated audio routes
        ...(dataUri ? [
          { endpoint: "/send/audio", body: { number: cleanPhone, file: dataUri, mimetype: mimeType || "audio/ogg", ptt: true } },
          { endpoint: "/send/ptt", body: { number: cleanPhone, file: dataUri, mimetype: mimeType || "audio/ogg" } },
        ] : []),
      ]
    : [
        // Generic media (image, video, document) — keep caption
        { endpoint: `/send/${messageType}`, body: { number: cleanPhone, url: mediaUrl, text: caption, caption, fileName, mimetype: mimeType } },
        { endpoint: `/chat/send/${messageType}`, body: { number: cleanPhone, url: mediaUrl, text: caption, caption, fileName, mimetype: mimeType } },
        ...(dataUri ? [
          { endpoint: `/send/${messageType}`, body: { number: cleanPhone, file: dataUri, text: caption, caption, fileName, mimetype: mimeType } },
          { endpoint: "/send/media", body: { number: cleanPhone, mediatype: messageType, file: dataUri, text: caption, caption, fileName, mimetype: mimeType } },
          { endpoint: "/chat/send/media", body: { number: cleanPhone, mediatype: messageType, file: dataUri, text: caption, caption, fileName, mimetype: mimeType } },
        ] : []),
        { endpoint: "/send/media", body: { number: cleanPhone, mediatype: messageType, media: mediaUrl, url: mediaUrl, text: caption, caption, fileName, mimetype: mimeType } },
        { endpoint: "/chat/send/media", body: { number: cleanPhone, mediatype: messageType, media: mediaUrl, url: mediaUrl, text: caption, caption, fileName, mimetype: mimeType } },
      ];

  for (const request of requests) {
    for (const authHeader of getAuthHeaders(token)) {
      try {
        const res = await fetch(`${baseUrl}${request.endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify(request.body),
        });

        if (res.status === 401 || res.status === 404 || res.status === 405) {
          await res.text();
          continue;
        }

        const responseText = await res.text();
        if (!res.ok) {
          // For 500 errors, try next endpoint/auth combo instead of giving up
          if (res.status === 500) {
            console.warn(`⚠️ 500 on ${request.endpoint}: ${responseText.substring(0, 200)}`);
            continue;
          }
          return { success: false, error: `HTTP ${res.status}: ${responseText}` };
        }

        let result: Record<string, unknown> = {};
        try { result = JSON.parse(responseText); } catch {}
        if (result.error) return { success: false, error: String(result.error) };

        const messageId = String(result.id || result.messageid || (result.key as Record<string, unknown>)?.id || "");
        if (!messageId && isAudio && request.endpoint === "/send/media") {
          console.warn(`⚠️ /send/media respondeu sem messageId para áudio. Corpo: ${responseText.substring(0, 200)}`);
          continue;
        }
        console.log(`✅ Mensagem ${messageType} enviada via ${request.endpoint} para ${cleanPhone}`);
        return { success: true, messageId };
      } catch (err) {
        console.warn(`⚠️ Falha ${request.endpoint}:`, (err as Error).message);
      }
    }
  }

  return { success: false, error: "Todos os endpoints falharam" };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { conversation_id, content, sent_by, message_type, metadata } = await req.json();
    if (!conversation_id || (!content && !metadata?.file_url)) {
      return new Response(JSON.stringify({ error: "conversation_id and content or file are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Get conversation (include source_instance for routing)
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select("id, broker_id, phone, phone_normalized, lead_id, source_instance")
      .eq("id", conversation_id)
      .single();

    const currentSourceInstance = conv?.source_instance || "personal";

    if (convError || !conv) {
      return new Response(JSON.stringify({ error: "Conversa não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Get broker info for global name prefix
    const { data: brokerInfo } = await supabase
      .from("brokers")
      .select("name, show_name_on_global, global_display_name")
      .eq("id", conv.broker_id)
      .single();

    // 3. Get WhatsApp instance based on source_instance routing
    let instanceToken: string | null = null;

    if (conv.source_instance === "global") {
      // Route through global instance
      const { data: globalConfig } = await supabase
        .from("global_whatsapp_config")
        .select("instance_token, status")
        .limit(1)
        .single();

      if (!globalConfig || globalConfig.status !== "connected") {
        return new Response(
          JSON.stringify({ error: "Instância WhatsApp Global não conectada." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      instanceToken = globalConfig.instance_token;
    } else {
      // Route through broker's personal instance
      const { data: instance } = await supabase
        .from("broker_whatsapp_instances")
        .select("instance_name, instance_token, status")
        .eq("broker_id", conv.broker_id)
        .maybeSingle();

      if (!instance || instance.status !== "connected") {
        return new Response(
          JSON.stringify({ error: "Instância WhatsApp não conectada. Conecte seu WhatsApp primeiro." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      instanceToken = instance.instance_token;
    }

    const normalizedType = typeof message_type === "string" ? message_type : "text";

    // Prepend broker name for global instance text messages
    let finalContent = content || "";
    if (conv.source_instance === "global" && brokerInfo?.show_name_on_global && normalizedType === "text" && finalContent.trim()) {
      const displayName = brokerInfo.global_display_name || brokerInfo.name;
      if (displayName) {
        finalContent = `*${displayName}:*\n${finalContent}`;
      }
    }

    // 4. Send via UAZAPI
    const sendResult = await sendViaUAZAPI(
      instanceToken,
      conv.phone_normalized || conv.phone,
      finalContent,
      normalizedType,
      metadata
    );

    if (!sendResult.success) {
      return new Response(
        JSON.stringify({ error: `Falha ao enviar: ${sendResult.error}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const previewText = normalizedType === "text"
      ? content
      : normalizedType === "audio"
      ? "🎤 Áudio"
      : (typeof metadata?.file_name === "string" ? `📎 ${metadata.file_name}` : "[Mídia]");

    // 5. Save message in conversation_messages
    const enrichedMetadata = { ...(metadata || {}), source_instance: currentSourceInstance };
    const senderName = conv.source_instance === "global" && brokerInfo
      ? (brokerInfo.global_display_name || brokerInfo.name)
      : null;

    const { data: msg, error: msgError } = await supabase
      .from("conversation_messages")
      .insert({
        conversation_id,
        direction: "outbound",
        content: content || previewText,
        sent_by: sent_by || "human",
        sender_name: senderName,
        message_type: normalizedType,
        metadata: enrichedMetadata,
        status: "sent",
        uazapi_message_id: sendResult.messageId || null,
      })
      .select()
      .single();

    if (msgError) {
      console.error("Erro ao salvar mensagem:", msgError);
    }

    // 5. Register in lead_interactions for audit
    if (conv.lead_id) {
      try {
        await supabase.from("lead_interactions").insert({
          lead_id: conv.lead_id,
          interaction_type: "whatsapp_enviada",
          broker_id: conv.broker_id,
          notes: String(previewText || "").substring(0, 200),
          channel: "whatsapp",
          created_by: user.id,
        });
      } catch (e) {
        console.error("Erro ao registrar interação:", e);
      }
    }

    // 6. Update conversation status
    await supabase
      .from("conversations")
      .update({
        status: "attending",
        last_message_at: new Date().toISOString(),
        last_message_preview: String(previewText || "").substring(0, 100),
        last_message_direction: "outbound",
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation_id);

    return new Response(
      JSON.stringify({
        success: true,
        message_id: msg?.id,
        uazapi_message_id: sendResult.messageId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("inbox-send-message error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
