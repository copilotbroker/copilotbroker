import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { getCorsHeaders, maskPhone } from "../_shared/security.ts";

/**
 * autopilot-followup — Cron-driven Edge Function (every 30 min)
 * Detects conversations in ai_active mode where the lead hasn't replied,
 * and sends AI-generated re-engagement messages with increasing intervals.
 *
 * Uses the broker's custom_system_prompt (from copilot_configs) as the core
 * of the AI prompt — same logic used by copilot-ai for manual suggestions.
 */

const PERSONALITY_MAP: Record<string, string> = {
  formal: "Seja formal, profissional e direto ao ponto.",
  consultivo: "Seja consultivo, empático e estratégico. Guie o cliente com perguntas inteligentes.",
  agressivo: "Seja persuasivo e orientado ao fechamento. Use gatilhos mentais de urgência e escassez.",
  tecnico: "Seja técnico e informativo. Apresente dados e especificações com precisão.",
  premium: "Seja sofisticado e exclusivo. Transmita luxo e exclusividade em cada palavra.",
};

const DEFAULT_SYSTEM_PROMPT = `Você é um Copiloto de vendas imobiliárias inteligente.
{personalidade}
{regra_emojis}
Nível de persuasão: {nivel_persuasao}/100.

REGRAS:
- Responda SEMPRE em português do Brasil
- Seja conciso (máximo 3 parágrafos)
- Foque em avançar o lead no funil de vendas
- Considere o contexto do lead e histórico de conversa
- NUNCA invente dados sobre o empreendimento que não foram fornecidos

{contexto_empreendimento}
{contexto_lead}`;

function buildModeInstruction(mode: string, brokerName: string): string {
  if (mode === "autonomo") {
    return `\n\nMODO DE ATUAÇÃO: Você está agindo COMO SE FOSSE o próprio corretor ${brokerName}. O cliente não sabe que é uma IA. Fale em primeira pessoa como se fosse o ${brokerName}. NUNCA revele que é uma IA ou assistente virtual.`;
  }
  return `\n\nMODO DE ATUAÇÃO: Você é o ASSISTENTE do corretor ${brokerName}. Apresente-se como assistente.`;
}

function buildSystemPrompt(
  config: Record<string, any>,
  leadContext: Record<string, any> | null,
  projectAiPrompt: string | null,
  brokerName: string,
): string {
  const customPrompt = (config.custom_system_prompt as string) || DEFAULT_SYSTEM_PROMPT;
  const personality = PERSONALITY_MAP[(config.personality as string) || "consultivo"] || PERSONALITY_MAP.consultivo;
  const emojiRule = config.allow_emojis !== false ? "Use emojis com moderação para humanizar." : "Não use emojis.";
  const persuasionLevel = (config.persuasion_level as number) || 50;

  let leadBlock = "";
  if (leadContext) {
    leadBlock = `\nCONTEXTO DO LEAD:
- Nome: ${leadContext.name || "Não informado"}
- Status no funil: ${leadContext.status || "Não informado"}
- Empreendimento: ${leadContext.project || "Não informado"}
- Origem: ${leadContext.origin || "Não informado"}
- Notas: ${leadContext.notes || "Nenhuma"}`;
  }

  let projectBlock = "";
  if (projectAiPrompt) {
    projectBlock = `\nINFORMAÇÕES DO EMPREENDIMENTO:\n${projectAiPrompt}`;
  }

  let prompt = customPrompt
    .replace(/\{personalidade\}/g, personality)
    .replace(/\{regra_emojis\}/g, emojiRule)
    .replace(/\{nivel_persuasao\}/g, String(persuasionLevel))
    .replace(/\{nome_corretor\}/g, brokerName)
    .replace(/\{contexto_lead\}/g, leadBlock)
    .replace(/\{contexto_empreendimento\}/g, projectBlock);

  if (config.use_mental_triggers) prompt += "\n- Use gatilhos mentais sutis (escassez, urgência, prova social)";
  if (config.incentive_visit) prompt += "\n- Incentive visitas ao empreendimento quando fizer sentido";
  if (config.incentive_call) prompt += "\n- Sugira ligações quando o lead parecer interessado";

  const mode = (config.copilot_mode as string) || "assistente";
  prompt += buildModeInstruction(mode, brokerName);

  return prompt;
}

function buildReengagementBlock(
  attemptNumber: number,
  maxAttempts: number,
  daysSinceLastMessage: number,
  previousFollowups: string,
): string {
  let toneHint = "";
  if (attemptNumber <= 2) toneHint = "Pergunta leve e amigável (ex: 'E aí, conseguiu pensar sobre o que conversamos?')";
  else if (attemptNumber <= 4) toneHint = "Traga uma novidade ou informação útil sobre o empreendimento";
  else if (attemptNumber <= 6) toneHint = "Lembrete sutil de benefício, condição ou prazo";
  else toneHint = "Mensagem de encerramento amigável (ex: 'Fico à disposição quando quiser retomar')";

  return `

============================
CONTEXTO DE REENGAJAMENTO (FOLLOW-UP AUTOMÁTICO)
============================
O lead não respondeu sua última mensagem há ${daysSinceLastMessage} dia(s).
Esta é a tentativa ${attemptNumber} de ${maxAttempts} de reengajamento automático.

REGRAS OBRIGATÓRIAS DESTE FOLLOW-UP:
- Envie UMA mensagem curta, natural e não invasiva para retomar o contato.
- Varie a abordagem a cada tentativa — NÃO repita mensagens anteriores.
- NÃO seja insistente ou agressivo.
- Máximo 2 parágrafos curtos.
- Responda APENAS com o texto da mensagem a enviar, sem explicações, prefixos ou aspas.

ABORDAGEM SUGERIDA PARA ESTA TENTATIVA (${attemptNumber}/${maxAttempts}):
${toneHint}

MENSAGENS QUE VOCÊ JÁ ENVIOU NESTE FOLLOW-UP (NÃO REPITA):
${previousFollowups || "(nenhuma ainda — esta é a primeira tentativa)"}
`;
}

function getAttemptDelayHours(attemptNumber: number, maxAttempts: number, periodDays: number): number {
  const totalHours = periodDays * 24;
  const weights: number[] = [];
  for (let i = 1; i <= maxAttempts; i++) weights.push(Math.ceil(i / 2));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let cumulativeHours = 0;
  for (let i = 0; i < attemptNumber; i++) cumulativeHours += (weights[i] / totalWeight) * totalHours;
  return cumulativeHours;
}

function isWithinWorkingHours(startStr: string | null, endStr: string | null): boolean {
  if (!startStr || !endStr) return true;
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

    console.log(`[autopilot-followup] === Run started at ${new Date().toISOString()} ===`);

    // 1. Find candidate conversations
    const { data: candidates, error: candidatesError } = await supabase
      .from("conversations")
      .select("id, broker_id, phone, phone_normalized, last_message_at, last_message_direction, lead_id")
      .eq("ai_mode", "ai_active")
      .eq("last_message_direction", "outbound")
      .eq("is_archived", false)
      .not("last_message_at", "is", null);

    if (candidatesError) throw candidatesError;

    if (!candidates || candidates.length === 0) {
      console.log("[autopilot-followup] No candidate conversations (ai_mode=ai_active + last outbound)");
      return new Response(JSON.stringify({ processed: 0, message: "No candidates" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[autopilot-followup] Found ${candidates.length} candidate conversations`);

    const brokerIds = [...new Set(candidates.map((c) => c.broker_id))];

    // 2. Configs (only enabled)
    const { data: configs } = await supabase
      .from("copilot_configs")
      .select("*")
      .in("broker_id", brokerIds)
      .eq("followup_enabled", true);

    const configMap = new Map((configs || []).map((c: any) => [c.broker_id, c]));
    console.log(`[autopilot-followup] ${configMap.size}/${brokerIds.length} brokers have followup_enabled=true`);

    // 3. Broker instances (connected only)
    const { data: instances } = await supabase
      .from("broker_whatsapp_instances")
      .select("broker_id, instance_name, instance_token, status, working_hours_start, working_hours_end, is_paused")
      .in("broker_id", brokerIds);

    const instanceMap = new Map((instances || []).map((i: any) => [i.broker_id, i]));

    // 4. Brokers (for name)
    const { data: brokers } = await supabase
      .from("brokers")
      .select("id, name")
      .in("id", brokerIds);
    const brokerMap = new Map((brokers || []).map((b: any) => [b.id, b]));

    // 5. Existing followups
    const conversationIds = candidates.map((c) => c.id);
    const { data: existingFollowups } = await supabase
      .from("autopilot_followups")
      .select("conversation_id, attempt_number, sent_at")
      .in("conversation_id", conversationIds);

    const followupMap = new Map<string, { count: number; lastSentAt: string }>();
    for (const f of existingFollowups || []) {
      const existing = followupMap.get(f.conversation_id);
      if (!existing || f.attempt_number > existing.count) {
        followupMap.set(f.conversation_id, { count: f.attempt_number, lastSentAt: f.sent_at });
      }
    }

    // 6. Optouts
    const phones = candidates.map((c) => c.phone_normalized);
    const { data: optouts } = await supabase
      .from("whatsapp_optouts")
      .select("phone")
      .in("phone", phones);
    const optoutSet = new Set((optouts || []).map((o: any) => o.phone));

    let processed = 0;
    let sent = 0;
    const skipReasons: Record<string, number> = {};
    const bumpSkip = (reason: string) => { skipReasons[reason] = (skipReasons[reason] || 0) + 1; };

    for (const conv of candidates) {
      const config = configMap.get(conv.broker_id);
      if (!config) {
        bumpSkip("no_config_or_followup_disabled");
        continue;
      }

      const instance = instanceMap.get(conv.broker_id);
      if (!instance) {
        bumpSkip("no_whatsapp_instance");
        continue;
      }
      if (instance.status !== "connected") {
        bumpSkip(`instance_${instance.status}`);
        continue;
      }
      if (instance.is_paused) {
        bumpSkip("instance_paused");
        continue;
      }

      if (!isWithinWorkingHours(instance.working_hours_start, instance.working_hours_end)) {
        bumpSkip("outside_working_hours");
        continue;
      }

      if (optoutSet.has(conv.phone_normalized)) {
        bumpSkip("optout");
        continue;
      }

      const maxAttempts = config.followup_max_attempts || 7;
      const periodDays = config.followup_period_days || 10;
      const existing = followupMap.get(conv.id);
      const attemptsDone = existing?.count || 0;

      if (attemptsDone >= maxAttempts) {
        bumpSkip("max_attempts_reached");
        continue;
      }

      const nextAttempt = attemptsDone + 1;

      const lastMessageAt = new Date(conv.last_message_at!).getTime();
      const requiredDelayHours = getAttemptDelayHours(nextAttempt, maxAttempts, periodDays);
      const requiredTime = lastMessageAt + requiredDelayHours * 60 * 60 * 1000;
      const now = Date.now();

      if (now < requiredTime) {
        bumpSkip("delay_not_reached");
        continue;
      }

      // Rate limit: 4h between followups for the same conversation
      if (existing?.lastSentAt) {
        const lastSent = new Date(existing.lastSentAt).getTime();
        if (now - lastSent < 4 * 60 * 60 * 1000) {
          bumpSkip("rate_limit_4h");
          continue;
        }
      }

      processed++;

      // Recent messages
      const { data: recentMessages } = await supabase
        .from("conversation_messages")
        .select("direction, content, created_at")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(10);
      const reversedMessages = (recentMessages || []).reverse();

      const broker = brokerMap.get(conv.broker_id);
      const brokerName = broker?.name || "Corretor";

      // Lead context (with fallback to conversation display_name when no lead is linked)
      let leadContext: Record<string, any> | null = null;
      let projectAiPrompt: string | null = null;
      if (conv.lead_id) {
        const { data: lead } = await supabase
          .from("leads")
          .select("name, status, notes, lead_origin, project_id")
          .eq("id", conv.lead_id)
          .maybeSingle();

        if (lead) {
          leadContext = {
            name: lead.name,
            status: lead.status,
            origin: lead.lead_origin,
            notes: lead.notes,
          };

          if (lead.project_id) {
            const { data: project } = await supabase
              .from("projects")
              .select("ai_prompt, name")
              .eq("id", lead.project_id)
              .maybeSingle();
            if (project?.ai_prompt) projectAiPrompt = project.ai_prompt;
            if (project?.name) leadContext.project = project.name;
          }
        }
      }

      if (!leadContext) {
        const { data: convDetail } = await supabase
          .from("conversations")
          .select("display_name")
          .eq("id", conv.id)
          .maybeSingle();
        leadContext = {
          name: convDetail?.display_name || null,
          status: null,
          origin: null,
          notes: null,
        };
      }

      // Previous followup messages for this conv
      const { data: prevFollowups } = await supabase
        .from("autopilot_followups")
        .select("message_preview")
        .eq("conversation_id", conv.id)
        .order("attempt_number", { ascending: true });
      const previousFollowupsText = (prevFollowups || [])
        .map((f: any, idx: number) => `${idx + 1}. ${f.message_preview}`)
        .join("\n");

      const daysSinceLastMessage = Math.max(1, Math.round((now - lastMessageAt) / (1000 * 60 * 60 * 24)));

      // Build the FULL system prompt = custom prompt (with placeholders) + reengagement block
      const baseSystemPrompt = buildSystemPrompt(config, leadContext, projectAiPrompt, brokerName);
      const reengagementBlock = buildReengagementBlock(nextAttempt, maxAttempts, daysSinceLastMessage, previousFollowupsText);
      const systemPrompt = baseSystemPrompt + reengagementBlock;

      const aiMessages = [
        { role: "system", content: systemPrompt },
        ...reversedMessages.map((m: any) => ({
          role: m.direction === "inbound" ? "user" : "assistant",
          content: m.content,
        })),
        { role: "user", content: "[SISTEMA: Gere a próxima mensagem de reengajamento agora, seguindo TODAS as regras acima.]" },
      ];

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

        // Send via UAZAPI — use origin of UAZAPI_INSTANCE_URL and broker's instance_token
        const sendPhone = conv.phone_normalized.replace(/\D/g, "");
        let baseUrl = UAZAPI_INSTANCE_URL.replace(/\/$/, "");
        try { baseUrl = new URL(baseUrl).origin; } catch { /* keep as is */ }
        const sendToken = instance.instance_token || UAZAPI_TOKEN;

        const uazapiResponse = await fetch(`${baseUrl}/send/text`, {
          method: "POST",
          headers: { "Content-Type": "application/json", token: sendToken },
          body: JSON.stringify({ number: sendPhone, text: messageText }),
        });

        if (!uazapiResponse.ok) {
          const retryResponse = await fetch(`${baseUrl}/chat/send/text`, {
            method: "POST",
            headers: { "Content-Type": "application/json", token: sendToken },
            body: JSON.stringify({ number: sendPhone, text: messageText }),
          });
          if (!retryResponse.ok) {
            const errBody = await retryResponse.text().catch(() => "");
            console.error(`[autopilot-followup] UAZAPI send failed for ${maskPhone(sendPhone)} — status=${retryResponse.status} body=${errBody.substring(0, 200)}`);
            continue;
          }
        }

        await supabase.from("autopilot_followups").insert({
          conversation_id: conv.id,
          broker_id: conv.broker_id,
          attempt_number: nextAttempt,
          message_preview: messageText.substring(0, 200),
        });

        await supabase.from("conversation_messages").insert({
          conversation_id: conv.id,
          content: messageText,
          direction: "outbound",
          message_type: "text",
          sender_name: "Copiloto (Follow-up)",
          status: "sent",
        });

        console.log(`[autopilot-followup] ✓ Sent attempt ${nextAttempt}/${maxAttempts} for conv ${conv.id} (${maskPhone(sendPhone)}) — broker: ${brokerName}`);
        sent++;
      } catch (aiErr) {
        console.error(`[autopilot-followup] Error processing conv ${conv.id}:`, aiErr);
        continue;
      }
    }

    console.log(`[autopilot-followup] === Run finished — processed: ${processed}, sent: ${sent} ===`);
    console.log(`[autopilot-followup] Skip reasons:`, JSON.stringify(skipReasons));

    return new Response(
      JSON.stringify({
        processed,
        sent,
        total_candidates: candidates.length,
        skip_reasons: skipReasons,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[autopilot-followup] Fatal error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
