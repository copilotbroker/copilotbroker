import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um especialista em copywriting imobiliário e design de landing pages de altíssima qualidade. Sua missão é gerar conteúdo persuasivo, emocional e altamente personalizado para landing pages de empreendimentos imobiliários.

REGRAS CRÍTICAS:
1. NUNCA use textos genéricos. Cada projeto deve ter uma identidade única.
2. Use gatilhos mentais: escassez, exclusividade, urgência, prova social, autoridade.
3. O tom deve variar conforme o público: luxo para alto padrão, acessível para famílias, moderno para jovens investidores.
4. Títulos devem ser impactantes e curtos (máximo 8 palavras).
5. Subtítulos devem complementar com benefício concreto.
6. Parágrafos do "about" devem contar uma história, não listar features.
7. Ícones devem ser nomes válidos do Lucide React (ex: "MapPin", "Trees", "Shield", "Home", "Star", "Clock", "TrendingUp", "Heart", "Gem", "Mountain", "Waves", "Sun", "Building2", "Car", "Leaf", "Award", "CheckCircle", "Target", "Zap", "Users").
8. Cores devem ser em formato HEX e combinar com o estilo do empreendimento.
9. O warning da urgência deve criar senso real de oportunidade perdida.
10. O quote do CTA deve ser uma frase aspiracional memorável.

ESTILOS DISPONÍVEIS:
- "luxury": Tons dourados, escuros, tipografia elegante. Para alto padrão.
- "modern": Tons vibrantes, clean. Para projetos urbanos e jovens.
- "nature": Tons verdes, terrosos. Para projetos com natureza/campo.
- "urban": Tons industriais, neutros. Para projetos em centros urbanos.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { projectData, currentContent, userMessage } = await req.json();

    let userPrompt: string;

    if (currentContent && userMessage) {
      // Refinement mode
      userPrompt = `O conteúdo atual da landing page é:
\`\`\`json
${JSON.stringify(currentContent, null, 2)}
\`\`\`

O usuário pediu a seguinte alteração: "${userMessage}"

Aplique APENAS as alterações solicitadas, mantendo todo o resto intacto. Retorne o JSON completo atualizado.`;
    } else {
      // First generation
      userPrompt = `Gere o conteúdo completo para a landing page de um empreendimento imobiliário com as seguintes características:

NOME: ${projectData.name}
CIDADE: ${projectData.city}
${projectData.description ? `DESCRIÇÃO: ${projectData.description}` : ""}
${projectData.projectType ? `TIPO: ${projectData.projectType}` : ""}
${projectData.targetAudience ? `PÚBLICO-ALVO: ${projectData.targetAudience}` : ""}
${projectData.tone ? `TOM DE COMUNICAÇÃO: ${projectData.tone}` : ""}
${projectData.sellingPoints ? `ARGUMENTOS DE VENDA: ${projectData.sellingPoints}` : ""}
${projectData.priceRange ? `FAIXA DE PREÇO: ${projectData.priceRange}` : ""}
${projectData.differentials ? `DIFERENCIAIS: ${projectData.differentials}` : ""}
${projectData.location ? `LOCALIZAÇÃO/ENDEREÇO: ${projectData.location}` : ""}
STATUS: ${projectData.status || "pre_launch"}

Crie um conteúdo ÚNICO, persuasivo e altamente personalizado para este empreendimento específico. NÃO use templates genéricos.`;
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_landing_content",
                description:
                  "Generate the complete landing page content as structured JSON",
                parameters: {
                  type: "object",
                  properties: {
                    theme: {
                      type: "object",
                      properties: {
                        primaryColor: {
                          type: "string",
                          description: "HEX color for primary elements",
                        },
                        accentColor: {
                          type: "string",
                          description: "HEX color for accent/background",
                        },
                        style: {
                          type: "string",
                          enum: ["luxury", "modern", "nature", "urban"],
                        },
                      },
                      required: ["primaryColor", "accentColor", "style"],
                      additionalProperties: false,
                    },
                    hero: {
                      type: "object",
                      properties: {
                        badge: { type: "string" },
                        title: { type: "string" },
                        subtitle: { type: "string" },
                        description: { type: "string" },
                        ctaText: { type: "string" },
                      },
                      required: [
                        "badge",
                        "title",
                        "subtitle",
                        "description",
                        "ctaText",
                      ],
                      additionalProperties: false,
                    },
                    about: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        paragraphs: {
                          type: "array",
                          items: { type: "string" },
                        },
                        highlights: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              icon: { type: "string" },
                              text: { type: "string" },
                            },
                            required: ["icon", "text"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["title", "paragraphs", "highlights"],
                      additionalProperties: false,
                    },
                    features: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        items: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              icon: { type: "string" },
                              text: { type: "string" },
                            },
                            required: ["icon", "text"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["title", "items"],
                      additionalProperties: false,
                    },
                    urgency: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        items: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              icon: { type: "string" },
                              text: { type: "string" },
                            },
                            required: ["icon", "text"],
                            additionalProperties: false,
                          },
                        },
                        warning: { type: "string" },
                      },
                      required: ["title", "items", "warning"],
                      additionalProperties: false,
                    },
                    benefits: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        items: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              icon: { type: "string" },
                              text: { type: "string" },
                            },
                            required: ["icon", "text"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["title", "items"],
                      additionalProperties: false,
                    },
                    cta: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        features: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              icon: { type: "string" },
                              text: { type: "string" },
                            },
                            required: ["icon", "text"],
                            additionalProperties: false,
                          },
                        },
                        quote: { type: "string" },
                        buttonText: { type: "string" },
                      },
                      required: ["title", "features", "quote", "buttonText"],
                      additionalProperties: false,
                    },
                    footer: {
                      type: "object",
                      properties: {
                        companyName: { type: "string" },
                        disclaimer: { type: "string" },
                      },
                      required: ["companyName", "disclaimer"],
                      additionalProperties: false,
                    },
                  },
                  required: [
                    "theme",
                    "hero",
                    "about",
                    "features",
                    "urgency",
                    "benefits",
                    "cta",
                    "footer",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "generate_landing_content" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar conteúdo da landing page." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "A IA não retornou o formato esperado." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const landingContent = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ landing_content: landingContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-landing error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
