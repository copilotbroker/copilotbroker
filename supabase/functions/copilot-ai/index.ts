import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { getCorsHeaders } from "../_shared/security.ts";

const DEFAULT_SYSTEM_PROMPT = `Você é um Copiloto de vendas imobiliárias inteligente.
{personalidade}
{regra_emojis}
Nível de persuasão: {nivel_persuasao}/100.

REGRAS:
- Responda SEMPRE em português do Brasil
- Seja conciso (máximo 3 parágrafos)
- Foque em avançar o lead no funil de vendas
- Considere o contexto do lead e histórico de conversa
- Sugira próximos passos estratégicos
- Se o lead demonstrar objeção, trate com empatia e argumente com valor
- NUNCA invente dados sobre o empreendimento que não foram fornecidos

Seu Papel e Identidade
Você é um assistente imobiliário digital altamente capacitado e conversacional, atuando em conjunto com os corretores da Enove Imobiliária. Seu objetivo é interagir com potenciais clientes (leads), entender profundamente suas necessidades, criar conexão humana e avançar o atendimento pelas etapas do nosso funil (Kanban) de forma natural, sem nunca parecer um robô ou um vendedor insistente.

Seu Tom de Voz e Personalidade
- Humano e Empático: Aja como um consultor de confiança. Use uma linguagem natural, amigável e acolhedora. Evite jargões técnicos excessivos.
- Consultivo e Persuasivo: Sua persuasão não vem da pressão, mas da clareza. Você ajuda o cliente a descobrir o que ele realmente precisa fazendo as perguntas certas.
- Paciente: Respeite o tempo do cliente. Nunca force um agendamento de visita se o cliente ainda não estiver pronto.

Você deve guiar a conversa sutilmente, faça no máximo uma pergunta por mensagem para não parecer um interrogatório.

Tente sempre identificar se o cliente é da cidade do imóvel que ele pediu informações. Esta pergunta é importante para saber quanto enfoque damos sobre a localização.
Tente sempre identificar se a compra é para Investimento ou Moradia.

Seu Objetivo: Consultar objetivo da conversa de acordo com empreendimento. Alguns empreendimentos o objetivo é agendar uma visita no plantão da incorporadora, outras é agendar uma visita na imobiliária, outras é visita no imóvel, ou ainda, agendar uma visita com o especialista nesse produto (corretor).

Diretrizes Críticas (O que NÃO fazer)
- Não envie blocos de texto gigantes. Responda de forma concisa (máximo de 3 parágrafos curtos).
- Não invente características de imóveis que você não tem certeza. Se não souber, tente direcionar o atendimento para um bate papo com o corretor.
- Não peça documentos ou dados sensíveis (como renda exata) logo no início. Deixe isso para o corretor humano em uma etapa avançada.

{contexto_empreendimento}
{contexto_lead}`;

const PERSONALITY_MAP: Record<string, string> = {
  formal: "Seja formal, profissional e direto ao ponto.",
  consultivo: "Seja consultivo, empático e estratégico. Guie o cliente com perguntas inteligentes.",
  agressivo: "Seja persuasivo e orientado ao fechamento. Use gatilhos mentais de urgência e escassez.",
  tecnico: "Seja técnico e informativo. Apresente dados e especificações com precisão.",
  premium: "Seja sofisticado e exclusivo. Transmita luxo e exclusividade em cada palavra.",
};

function buildSystemPrompt(
  config: Record<string, unknown>,
  leadContext?: Record<string, unknown>,
  projectAiPrompt?: string | null,
  brokerName?: string | null,
): string {
  const customPrompt = (config.custom_system_prompt as string) || DEFAULT_SYSTEM_PROMPT;

  const personality = PERSONALITY_MAP[(config.personality as string) || "consultivo"] || PERSONALITY_MAP.consultivo;
  const emojiRule = config.allow_emojis !== false ? "Use emojis com moderação para humanizar." : "Não use emojis.";
  const persuasionLevel = (config.persuasion_level as number) || 50;

  // Build context blocks
  let leadBlock = "";
  if (leadContext) {
    leadBlock = `\nCONTEXTO DO LEAD:
- Nome: ${leadContext.name || "Não informado"}
- Status no funil: ${leadContext.status || "Não informado"}
- Empreendimento: ${leadContext.project || "Não informado"}
- Origem: ${leadContext.origin || "Não informado"}
- Última interação: ${leadContext.last_interaction || "Não informado"}
- Notas: ${leadContext.notes || "Nenhuma"}`;
  }

  let projectBlock = "";
  if (projectAiPrompt) {
    projectBlock = `\nINFORMAÇÕES DO EMPREENDIMENTO:\n${projectAiPrompt}`;
  }

  // Replace variables
  let prompt = customPrompt
    .replace(/\{personalidade\}/g, personality)
    .replace(/\{regra_emojis\}/g, emojiRule)
    .replace(/\{nivel_persuasao\}/g, String(persuasionLevel))
    .replace(/\{nome_corretor\}/g, brokerName || "Corretor")
    .replace(/\{contexto_lead\}/g, leadBlock)
    .replace(/\{contexto_empreendimento\}/g, projectBlock);

  // Append extra rules from config
  if (config.use_mental_triggers) {
    prompt += "\n- Use gatilhos mentais sutis (escassez, urgência, prova social)";
  }
  if (config.incentive_visit) {
    prompt += "\n- Incentive visitas ao empreendimento quando fizer sentido";
  }
  if (config.incentive_call) {
    prompt += "\n- Sugira ligações quando o lead parecer interessado";
  }

  return prompt;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // Auth check
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

    const { action, conversation_id, lead_context, messages, copilot_config } = await req.json();

    // Fetch broker info
    const { data: broker } = await supabase
      .from("brokers")
      .select("id, name")
      .eq("user_id", user.id)
      .maybeSingle();

    // Fetch copilot config from DB if not provided inline
    let config = copilot_config || {};
    if (broker?.id && !config.custom_system_prompt) {
      const { data: dbConfig } = await supabase
        .from("copilot_configs")
        .select("*")
        .eq("broker_id", broker.id)
        .maybeSingle();
      if (dbConfig) {
        config = { ...dbConfig, ...config };
      }
    }

    // Fetch project ai_prompt if lead has a project
    let projectAiPrompt: string | null = null;
    if (lead_context?.project_id) {
      const { data: project } = await supabase
        .from("projects")
        .select("ai_prompt")
        .eq("id", lead_context.project_id)
        .maybeSingle();
      if (project?.ai_prompt) {
        projectAiPrompt = project.ai_prompt;
      }
    }

    const systemPrompt = buildSystemPrompt(config, lead_context, projectAiPrompt, broker?.name);

    // Add action-specific instructions
    let finalPrompt = systemPrompt;
    if (action === "suggest_response") {
      finalPrompt += `\n\nSua tarefa: Sugira UMA resposta estratégica para enviar ao lead baseado no histórico da conversa. A resposta deve ser natural, como se fosse o corretor falando diretamente com o cliente via WhatsApp.`;
    } else if (action === "analyze_risk") {
      finalPrompt += `\n\nSua tarefa: Analise o risco de perder este lead. Avalie: tempo sem interação, tom das respostas, objeções não tratadas. Responda em formato JSON com campos: risk_level (baixo/medio/alto), reason (string), suggested_action (string), suggested_message (string).`;
    } else if (action === "suggest_next_step") {
      finalPrompt += `\n\nSua tarefa: Sugira o próximo passo estratégico para este lead. Considere: avançar etapa no funil, agendar visita, enviar proposta, ou reengajar. Seja específico e acionável.`;
    }

    const aiMessages = [
      { role: "system", content: finalPrompt },
      ...(messages || []),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Track suggestion count
    if (conversation_id) {
      Promise.resolve(supabase.rpc("increment_copilot_count", { _conversation_id: conversation_id })).catch(() => {});
    }

    return new Response(JSON.stringify({ suggestion: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("copilot-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
