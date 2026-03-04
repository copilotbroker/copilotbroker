import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { getCorsHeaders, maskPhone, validateServiceRoleKey } from "../_shared/security.ts";

/**
 * autopilot-followup — Cron-driven Edge Function (every 30 min)
 * Detects conversations in ai_active mode where the lead hasn't replied,
 * and sends AI-generated re-engagement messages with increasing intervals.
 */

const PERSONALITY_MAP: Record<string, string> = {
  formal: "Seja formal, profissional e direto ao ponto.",
  consultivo: "Seja consultivo, empático e estratégico.",
  agressivo: "Seja persuasivo e orientado ao fechamento.",
  tecnico: "Seja técnico e informativo.",
  premium: "Seja sofisticado e exclusivo.",
};

/**
 * Calculate the delay in hours for a given attempt number,
 * distributed across the configured period.
 */
function getAttemptDelayHours(attemptNumber: number, maxAttempts: number, periodDays: number): number {
  const totalHours = periodDays * 24;
  // Increasing intervals: weight grows with attempt number
  // e.g. for 7 attempts: weights 1,1,2,2,3,3,4 = total 16
  const weights: number[] = [];
  for (let i = 1; i <= maxAttempts; i++) {
    weights.push(Math.ceil(i / 2));
  }
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  
  // Cumulative hours up to this attempt
  let cumulativeHours = 0;
  for (let i = 0; i < attemptNumber; i++) {
    cumulativeHours += (weights[i] / totalWeight) * totalHours;
  }
  return cumulativeHours;
}

function isWithinWorkingHours(startStr: string | null, endStr: string | null): boolean {
  if (!startStr || !endStr) return true;
  // Convert UTC now to BRT (UTC-3)
  const now = new Date();
  const brtHour = (now.getUTCHours() - 3 + 24) % 24;
  const brtMinutes = now.getUTCMinutes();
  const currentMinutes = brtHour * 60 + brtMinutes;

  const [sh, sm] = startStr.split(":").map(Number);
  const [eh, em] = endStr.split(":").map(Number);
  const startMinutes = sh * 60 + (sm || 0);
  const endMinutes = eh * 60 + (em || 0);

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";
    const UAZAPI_INSTANCE_URL = Deno.env.get("UAZAPI_INSTANCE_URL") || "";
    const UAZAPI_TOKEN = Deno.env.get("UAZAPI_TOKEN") || "";
    const UAZAPI_ADMIN_TOKEN = Deno.env.get("UAZAPI_ADMIN_TOKEN") || "";

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Find all conversations with ai_mode = 'ai_active' and last message outbound
    const { data: candidates, error: candidatesError } = await supabase
      .from("conversations")
      .select("id, broker_id, phone, phone_normalized, last_message_at, last_message_direction")
      .eq("ai_mode", "ai_active")
      .eq("last_message_direction", "outbound")
      .eq("is_archived", false)
      .not("last_message_at", "is", null);

    if (candidatesError) {
      console.error("Error fetching candidates:", candidatesError);
      throw candidatesError;
    }

    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No candidates" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[autopilot-followup] Found ${candidates.length} candidate conversations`);

    // 2. Get unique broker IDs and fetch their configs
    const brokerIds = [...new Set(candidates.map((c) => c.broker_id))];
    const { data: configs } = await supabase
      .from("copilot_configs")
      .select("*")
      .in("broker_id", brokerIds)
      .eq("followup_enabled", true);

    const configMap = new Map((configs || []).map((c: any) => [c.broker_id, c]));

    // 3. Get broker WhatsApp instances for working hours
    const { data: instances } = await supabase
      .from("broker_whatsapp_instances")
      .select("broker_id, instance_name, instance_token, status, working_hours_start, working_hours_end, is_paused")
      .in("broker_id", brokerIds)
      .eq("status", "connected");

    const instanceMap = new Map((instances || []).map((i: any) => [i.broker_id, i]));

    // 4. Get existing followups for these conversations
    const conversationIds = candidates.map((c) => c.id);
    const { data: existingFollowups } = await supabase
      .from("autopilot_followups")
      .select("conversation_id, attempt_number, sent_at")
      .in("conversation_id", conversationIds);

    const followupMap = new Map<string, { count: number; lastSentAt: string }>();
    for (const f of existingFollowups || []) {
      const existing = followupMap.get(f.conversation_id);
      if (!existing || f.attempt_number > existing.count) {
        followupMap.set(f.conversation_id, {
          count: f.attempt_number,
          lastSentAt: f.sent_at,
        });
      }
    }

    // 5. Check optouts
    const phones = candidates.map((c) => c.phone_normalized);
    const { data: optouts } = await supabase
      .from("whatsapp_optouts")
      .select("phone")
      .in("phone", phones);

    const optoutSet = new Set((optouts || []).map((o: any) => o.phone));

    let processed = 0;
    let sent = 0;

    for (const conv of candidates) {
      const config = configMap.get(conv.broker_id);
      if (!config) continue; // followup not enabled or no config

      const instance = instanceMap.get(conv.broker_id);
      if (!instance || instance.is_paused) continue;

      // Check working hours
      if (!isWithinWorkingHours(instance.working_hours_start, instance.working_hours_end)) continue;

      // Check optout
      if (optoutSet.has(conv.phone_normalized)) continue;

      const maxAttempts = config.followup_max_attempts || 7;
      const periodDays = config.followup_period_days || 10;
      const existing = followupMap.get(conv.id);
      const attemptsDone = existing?.count || 0;

      if (attemptsDone >= maxAttempts) continue;

      const nextAttempt = attemptsDone + 1;

      // Calculate required delay from last outbound message
      const lastMessageAt = new Date(conv.last_message_at).getTime();
      const requiredDelayHours = getAttemptDelayHours(nextAttempt, maxAttempts, periodDays);
      const requiredTime = lastMessageAt + requiredDelayHours * 60 * 60 * 1000;
      const now = Date.now();

      if (now < requiredTime) continue;

      // Rate limit: don't send if a followup was sent less than 4 hours ago
      if (existing?.lastSentAt) {
        const lastSent = new Date(existing.lastSentAt).getTime();
        if (now - lastSent < 4 * 60 * 60 * 1000) continue;
      }

      processed++;

      // 6. Fetch recent messages for context
      const { data: recentMessages } = await supabase
        .from("conversation_messages")
        .select("direction, content, created_at")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(10);

      const reversedMessages = (recentMessages || []).reverse();

      // 7. Get broker name
      const { data: broker } = await supabase
        .from("brokers")
        .select("name")
        .eq("id", conv.broker_id)
        .single();

      // 8. Build AI prompt for re-engagement
      const daysSinceLastMessage = Math.round((now - lastMessageAt) / (1000 * 60 * 60 * 24));
      const personality = PERSONALITY_MAP[config.personality] || PERSONALITY_MAP.consultivo;
      const emojiRule = config.allow_emojis ? "Use emojis com moderação." : "Não use emojis.";
      const modeInstruction = config.copilot_mode === "autonomo"
        ? `Você está agindo COMO SE FOSSE o corretor ${broker?.name || "Corretor"}. O cliente não sabe que é uma IA. Fale em primeira pessoa.`
        : `Você é o assistente do corretor ${broker?.name || "Corretor"}.`;

      // Get project context if lead is linked
      let projectContext = "";
      if (conv.lead_id) {
        const { data: lead } = await supabase
          .from("leads")
          .select("name, project_id, status")
          .eq("id", conv.lead_id)
          .maybeSingle();

        if (lead?.project_id) {
          const { data: project } = await supabase
            .from("projects")
            .select("ai_prompt, name")
            .eq("id", lead.project_id)
            .maybeSingle();

          if (project?.ai_prompt) {
            projectContext = `\nINFORMAÇÕES DO EMPREENDIMENTO (${project.name}):\n${project.ai_prompt}`;
          }
        }
      }

      const previousFollowupMessages = reversedMessages
        .filter((m: any) => m.direction === "outbound")
        .slice(-3)
        .map((m: any) => m.content)
        .join("\n---\n");

      const systemPrompt = `${personality}
${emojiRule}
${modeInstruction}

CONTEXTO DE REENGAJAMENTO:
O lead não respondeu sua última mensagem há ${daysSinceLastMessage} dia(s).
Esta é a tentativa ${nextAttempt} de ${maxAttempts} de reengajamento.

REGRAS OBRIGATÓRIAS:
- Envie UMA mensagem curta, natural e não invasiva para retomar o contato
- Varie a abordagem a cada tentativa (pergunta, novidade, lembrete sutil, mensagem informal)
- NÃO repita mensagens anteriores
- NÃO seja insistente ou agressivo
- Máximo 2 parágrafos curtos
- Responda APENAS com a mensagem a enviar, sem explicações
- Responda em português do Brasil

Mensagens anteriores que VOCÊ já enviou (NÃO repita):
${previousFollowupMessages || "Nenhuma"}

${projectContext}

Sugestões de abordagem por tentativa:
- Tentativa 1-2: Pergunta leve ("E aí, conseguiu pensar sobre...?")
- Tentativa 3-4: Novidade ou informação útil
- Tentativa 5-6: Lembrete sutil de benefício ou prazo
- Tentativa 7+: Mensagem de encerramento amigável ("Fico à disposição quando quiser...")`;

      const aiMessages = [
        { role: "system", content: systemPrompt },
        ...reversedMessages.map((m: any) => ({
          role: m.direction === "inbound" ? "user" : "assistant",
          content: m.content,
        })),
        { role: "user", content: "[SISTEMA: Gere a próxima mensagem de reengajamento]" },
      ];

      // 9. Call AI
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: aiMessages,
            stream: false,
          }),
        });

        if (!aiResponse.ok) {
          console.error(`[autopilot-followup] AI error for conv ${conv.id}: ${aiResponse.status}`);
          continue;
        }

        const aiData = await aiResponse.json();
        const messageText = aiData.choices?.[0]?.message?.content?.trim();

        if (!messageText) {
          console.error(`[autopilot-followup] Empty AI response for conv ${conv.id}`);
          continue;
        }

        // 10. Send via UAZAPI using broker's instance
        const sendPhone = conv.phone_normalized.replace(/\D/g, "");
        const instanceUrl = UAZAPI_INSTANCE_URL;
        
        // Try broker's own instance first
        let sendUrl = instanceUrl;
        let sendToken = UAZAPI_TOKEN;

        if (instance.instance_token && instance.instance_name) {
          // Build instance-specific URL
          const baseUrl = instanceUrl.replace(/\/[^/]+\/?$/, "");
          sendUrl = `${baseUrl}/${instance.instance_name}`;
          sendToken = instance.instance_token;
        }

        const uazapiResponse = await fetch(`${sendUrl}/send/text`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": sendToken,
          },
          body: JSON.stringify({
            phone: sendPhone,
            message: messageText,
          }),
        });

        if (!uazapiResponse.ok) {
          // Try with admin token
          const retryResponse = await fetch(`${sendUrl}/send/text`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "admintoken": UAZAPI_ADMIN_TOKEN,
            },
            body: JSON.stringify({
              phone: sendPhone,
              message: messageText,
            }),
          });

          if (!retryResponse.ok) {
            console.error(`[autopilot-followup] UAZAPI send failed for ${maskPhone(sendPhone)}`);
            continue;
          }
        }

        // 11. Record the followup attempt
        await supabase.from("autopilot_followups").insert({
          conversation_id: conv.id,
          broker_id: conv.broker_id,
          attempt_number: nextAttempt,
          message_preview: messageText.substring(0, 200),
        });

        // 12. Save message in conversation_messages
        await supabase.from("conversation_messages").insert({
          conversation_id: conv.id,
          content: messageText,
          direction: "outbound",
          message_type: "text",
          sender_name: "Copiloto (Follow-up)",
          status: "sent",
        });

        console.log(`[autopilot-followup] Sent attempt ${nextAttempt}/${maxAttempts} for conv ${conv.id} to ${maskPhone(sendPhone)}`);
        sent++;
      } catch (aiErr) {
        console.error(`[autopilot-followup] Error processing conv ${conv.id}:`, aiErr);
        continue;
      }
    }

    return new Response(JSON.stringify({ processed, sent, total_candidates: candidates.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[autopilot-followup] Fatal error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
