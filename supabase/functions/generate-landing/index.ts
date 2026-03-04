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
   - Inclua no campo "customSections" como tipo "embed"
   - Use o campo "embedUrl" com a URL EXATA fornecida pelo usuário
   - Para vídeos do YouTube, converta para formato embed: https://www.youtube.com/embed/VIDEO_ID
   - Para Google Maps, use a URL completa fornecida
   - SEMPRE preserve links e URLs fornecidos pelo usuário
9. Se o usuário mencionar FOTOS ou IMAGENS com URLs, inclua como imageUrl nas seções relevantes
10. Crie seções adicionais quando necessário (galeria, mapa, vídeo, depoimentos, planta, estatísticas, etc.)

CAMPOS VISUAIS AVANÇADOS:
- theme.fontFamily: Use "serif" para empreendimentos de luxo/alto padrão para dar elegância tipográfica. Use "sans-serif" para projetos modernos/urbanos.
- hero.backgroundImageUrl: Se o usuário forneceu URLs de imagens do empreendimento, use a melhor imagem como background do hero.
- hero.layout: Use "split" quando há uma imagem forte de destaque (divide a tela em texto + imagem). Use "centered" para layouts clássicos.
- features.layout: Use "list-with-image" quando há uma imagem/render do empreendimento disponível. Isso cria um layout 2 colunas com itens à esquerda e imagem grande à direita. Use "grid" para layout padrão em cards.
- features.imageUrl: URL da imagem para o layout "list-with-image".
- features.closingText: Uma frase italic de fechamento que reforça o valor emocional da seção.

ÍCONES VÁLIDOS (Lucide React):
"MapPin", "Trees", "Shield", "Home", "Star", "Clock", "TrendingUp", "Heart", "Gem", "Mountain", "Waves", "Sun", "Building2", "Car", "Leaf", "Award", "CheckCircle", "Target", "Zap", "Users", "Key", "Compass", "Camera", "Play", "Map", "Phone", "Mail", "Globe", "Wifi", "Lock", "Eye", "Palette", "Dumbbell", "Music", "Coffee", "Utensils", "Baby", "Dog", "Bike", "Plane", "Ship", "Train"

CORES: formato HEX, devem combinar com o estilo do empreendimento.

ESTILOS:
- "luxury": Tons dourados (#C9A961), fundos escuros (#1a1a2e). fontFamily: "serif". Para alto padrão.
- "modern": Tons vibrantes, clean. fontFamily: "sans-serif". Para projetos urbanos e jovens.
- "nature": Tons verdes (#2d6a4f), terrosos (#5a3e2b). Para projetos com natureza/campo.
- "urban": Tons industriais, neutros. fontFamily: "sans-serif". Para projetos em centros urbanos.

REGRAS DE QUALIDADE:
- O warning da urgência deve criar senso REAL de oportunidade perdida com dados específicos
- O quote do CTA deve ser uma frase ASPIRACIONAL memorável que o cliente imagina dizendo
- Features devem ser benefícios, não especificações técnicas
- Use números e dados específicos sempre que possível
- Crie contrastes emocionais: "de X para Y", "enquanto outros... você..."

REGRA CRÍTICA PARA REFINAMENTOS:
Quando o usuário pedir alterações:
- SEMPRE retorne o JSON COMPLETO com todas as seções, mesmo que só uma tenha mudado
- MANTENHA toda a identidade visual e conteúdo das seções não mencionadas
- Se o usuário pedir para "adicionar um mapa", adicione uma customSection SEM remover nenhuma seção existente
- Se o usuário pedir para "mudar a cor", mude APENAS a cor mantendo todo o resto
- Entenda comandos em português: "mais agressivo" = mais urgência e gatilhos mentais, "mais elegante" = tom mais sofisticado e serif
- Se o usuário fornecer uma URL, SEMPRE inclua ela literalmente no embedUrl, NÃO modifique a URL`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { projectData, currentContent, userMessage, chatHistory } = await req.json();

    const messages: { role: string; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (currentContent && userMessage) {
      // Refinement: send full chat history for context
      if (chatHistory && Array.isArray(chatHistory)) {
        for (const msg of chatHistory) {
          if (msg.role === "user" || msg.role === "assistant") {
            messages.push({ role: msg.role, content: msg.content });
          }
        }
      }

      messages.push({
        role: "user",
        content: `O conteúdo ATUAL da landing page é:
\`\`\`json
${JSON.stringify(currentContent, null, 2)}
\`\`\`

O usuário pediu a seguinte alteração: "${userMessage}"

INSTRUÇÕES CRÍTICAS:
- Aplique EXATAMENTE as alterações solicitadas
- Retorne o JSON COMPLETO com TODAS as seções (não omita nenhuma)
- Se o usuário fornecer uma URL (mapa, vídeo, iframe), use-a LITERALMENTE no embedUrl de uma customSection
- Se o usuário pedir para adicionar algo, ADICIONE sem remover conteúdo existente
- Mantenha toda a identidade visual (cores, fontes, layout) exceto o que foi explicitamente pedido para mudar
- Se o usuário pedir algo que não entende, pergunte (mas retorne o JSON atual intacto)`
      });
    } else {
      messages.push({
        role: "user",
        content: `Gere o conteúdo completo para a landing page de um empreendimento imobiliário:

NOME: ${projectData.name}
CIDADE: ${projectData.city}
${projectData.description ? `\nCONTEÚDO COMPLETO FORNECIDO PELO CLIENTE:\n${projectData.description}\n\nANALISE TODO O CONTEÚDO ACIMA E EXTRAIA: diferenciais, público-alvo, argumentos de venda, faixa de preço, infraestrutura, localização e QUALQUER link/URL mencionado (mapas, vídeos, iframes). Links devem ser incluídos como customSections com embedUrl.` : ""}
${projectData.location ? `LOCALIZAÇÃO: ${projectData.location}` : ""}
${projectData.mediaUrls?.length ? `\nMÍDIA DISPONÍVEL (URLs de imagens/vídeos):\n${projectData.mediaUrls.join("\n")}\n\nUse essas imagens: a melhor como hero.backgroundImageUrl, outras como features.imageUrl ou em customSections tipo gallery.` : ""}
STATUS: ${projectData.status || "pre_launch"}

IMPORTANTE:
- Se houver links de mapas interativos ou vídeos no conteúdo, inclua-os como customSections com embedUrl usando a URL EXATA
- Escolha o fontFamily adequado ao estilo do empreendimento
- Use hero.layout "split" se houver imagens disponíveis
- Use features.layout "list-with-image" se houver renders/imagens do empreendimento
- Crie conteúdo ÚNICO, persuasivo e de alta qualidade profissional
- NÃO use templates genéricos — crie algo memorável para ESTE empreendimento`
      });
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
          model: "google/gemini-2.5-pro",
          messages,
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
                        primaryColor: { type: "string", description: "HEX color for primary elements (e.g. #C9A961 for gold)" },
                        accentColor: { type: "string", description: "HEX color for accent/background (e.g. #1a1a2e for dark)" },
                        style: { type: "string", enum: ["luxury", "modern", "nature", "urban"] },
                        fontFamily: { type: "string", enum: ["serif", "sans-serif"], description: "serif for luxury/elegant, sans-serif for modern/clean" },
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
                        backgroundImageUrl: { type: "string", description: "URL of background image for hero section" },
                        layout: { type: "string", enum: ["centered", "split"], description: "centered = classic layout, split = text left + image right" },
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
                        layout: { type: "string", enum: ["grid", "list-with-image"], description: "grid = card grid, list-with-image = items left + large image right" },
                        imageUrl: { type: "string", description: "URL of image for list-with-image layout" },
                        closingText: { type: "string", description: "Italic closing phrase for emotional reinforcement" },
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
                      description: "Additional custom sections: interactive maps, videos, galleries, statistics, etc.",
                      items: {
                        type: "object",
                        properties: {
                          type: { type: "string", enum: ["embed", "gallery", "text", "stats"] },
                          title: { type: "string" },
                          embedUrl: { type: "string", description: "EXACT URL for iframe embed (maps, videos). Use the URL provided by the user LITERALLY." },
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
