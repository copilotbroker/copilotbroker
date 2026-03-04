import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um expert de altíssimo nível em copywriting imobiliário, design de landing pages e marketing digital. Sua missão é gerar conteúdo de QUALIDADE PROFISSIONAL para landing pages de empreendimentos imobiliários — no mesmo nível de uma agência de marketing premium.

REGRAS FUNDAMENTAIS:
1. NUNCA use textos genéricos ou clichês. Cada projeto deve ter uma identidade ÚNICA e memorável.
2. Escreva como um copywriter sênior: use gatilhos mentais (escassez, exclusividade, urgência, prova social, autoridade), storytelling emocional e linguagem persuasiva.
3. ADAPTE o tom conforme o conteúdo fornecido: luxo para alto padrão, acolhedor para famílias, moderno para investidores jovens.
4. Títulos IMPACTANTES: máximo 8 palavras, crie curiosidade ou desejo imediato.
5. Subtítulos: complementem com benefício CONCRETO e tangível.
6. Parágrafos do "about": conte uma HISTÓRIA, crie uma visão de vida, não liste features.
7. Cada seção deve ter propósito de conversão: mover o visitante para a ação.

CAPACIDADES AVANÇADAS — IMPORTANTE:
8. Se o usuário fornecer links de MAPAS INTERATIVOS, VÍDEOS DO YOUTUBE, ou qualquer URL externa:
   - Inclua no campo "customSections" como iframes ou embeds
   - Use o campo "embedUrl" para mapas e vídeos
   - O sistema renderizará automaticamente como iframe responsivo
9. Se o usuário mencionar FOTOS ou IMAGENS com URLs, inclua no campo "mediaUrls" da seção relevante
10. Crie seções adicionais quando necessário (galeria, mapa, vídeo, depoimentos, planta, etc.)

ÍCONES VÁLIDOS (Lucide React):
"MapPin", "Trees", "Shield", "Home", "Star", "Clock", "TrendingUp", "Heart", "Gem", "Mountain", "Waves", "Sun", "Building2", "Car", "Leaf", "Award", "CheckCircle", "Target", "Zap", "Users", "Key", "Compass", "Camera", "Play", "Map", "Phone", "Mail", "Globe", "Wifi", "Lock", "Eye", "Palette", "Dumbbell", "Music", "Coffee", "Utensils", "Baby", "Dog", "Bike", "Plane", "Ship", "Train"

CORES: formato HEX, devem combinar com o estilo do empreendimento.

ESTILOS:
- "luxury": Tons dourados, escuros, tipografia elegante. Para alto padrão.
- "modern": Tons vibrantes, clean. Para projetos urbanos e jovens.
- "nature": Tons verdes, terrosos. Para projetos com natureza/campo.
- "urban": Tons industriais, neutros. Para projetos em centros urbanos.

REGRAS DE QUALIDADE:
- O warning da urgência deve criar senso REAL de oportunidade perdida com dados específicos
- O quote do CTA deve ser uma frase ASPIRACIONAL memorável que o cliente imagina dizendo
- Features devem ser benefícios, não especificações técnicas
- Use números e dados específicos sempre que possível
- Crie contrastes emocionais: "de X para Y", "enquanto outros... você..."`;

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
      userPrompt = `O conteúdo atual da landing page é:
\`\`\`json
${JSON.stringify(currentContent, null, 2)}
\`\`\`

O usuário pediu a seguinte alteração: "${userMessage}"

INSTRUÇÕES:
- Aplique as alterações solicitadas mantendo o resto intacto
- Se o usuário pedir para adicionar mapa interativo, vídeo, galeria ou qualquer elemento externo, use o campo "customSections"
- Se o usuário fornecer uma URL, inclua como "embedUrl" em uma customSection
- Retorne o JSON completo atualizado com TODAS as seções`;
    } else {
      userPrompt = `Gere o conteúdo completo para a landing page de um empreendimento imobiliário:

NOME: ${projectData.name}
CIDADE: ${projectData.city}
${projectData.description ? `\nCONTEÚDO COMPLETO FORNECIDO PELO CLIENTE:\n${projectData.description}\n\nANALISE TODO O CONTEÚDO ACIMA E EXTRAIA: diferenciais, público-alvo, argumentos de venda, faixa de preço, infraestrutura, localização e qualquer link/URL mencionado.` : ""}
${projectData.location ? `LOCALIZAÇÃO: ${projectData.location}` : ""}
${projectData.mediaUrls?.length ? `\nMÍDIA DISPONÍVEL (URLs de imagens/vídeos):\n${projectData.mediaUrls.join("\n")}` : ""}
STATUS: ${projectData.status || "pre_launch"}

IMPORTANTE:
- Se houver links de mapas interativos ou vídeos no conteúdo, inclua-os como customSections com embedUrl
- Crie conteúdo ÚNICO, persuasivo e de alta qualidade profissional
- NÃO use templates genéricos — crie algo memorável para ESTE empreendimento`;
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
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_landing_content",
                description: "Generate the complete landing page content as structured JSON",
                parameters: {
                  type: "object",
                  properties: {
                    theme: {
                      type: "object",
                      properties: {
                        primaryColor: { type: "string", description: "HEX color for primary elements" },
                        accentColor: { type: "string", description: "HEX color for accent/background" },
                        style: { type: "string", enum: ["luxury", "modern", "nature", "urban"] },
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
                      required: ["badge", "title", "subtitle", "description", "ctaText"],
                      additionalProperties: false,
                    },
                    about: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        paragraphs: { type: "array", items: { type: "string" } },
                        highlights: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: { icon: { type: "string" }, text: { type: "string" } },
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
                            properties: { icon: { type: "string" }, text: { type: "string" } },
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
                            properties: { icon: { type: "string" }, text: { type: "string" } },
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
                            properties: { icon: { type: "string" }, text: { type: "string" } },
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
                            properties: { icon: { type: "string" }, text: { type: "string" } },
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
                    customSections: {
                      type: "array",
                      description: "Additional custom sections like maps, videos, galleries, etc.",
                      items: {
                        type: "object",
                        properties: {
                          type: { type: "string", enum: ["embed", "gallery", "text", "stats"] },
                          title: { type: "string" },
                          embedUrl: { type: "string", description: "URL for iframe embed (maps, videos)" },
                          description: { type: "string" },
                          items: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                icon: { type: "string" },
                                text: { type: "string" },
                                value: { type: "string" },
                                imageUrl: { type: "string" },
                              },
                              required: ["text"],
                              additionalProperties: false,
                            },
                          },
                        },
                        required: ["type", "title"],
                        additionalProperties: false,
                      },
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
                  required: ["theme", "hero", "about", "features", "urgency", "benefits", "cta", "footer"],
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
