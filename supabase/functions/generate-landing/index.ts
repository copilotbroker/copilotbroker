import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um ART DIRECTOR sênior de uma agência premium especializada em landing pages de imóveis de alto padrão. Seu trabalho não é só escrever copy — é também tomar decisões VISUAIS sofisticadas (composição, paleta, tipografia, ritmo) como um designer de Awwwards faria.

PRINCÍPIO #1 — DESIGN ÚNICO POR PROJETO
Nada de templates genéricos. Cada empreendimento ganha uma identidade visual específica que reflete sua personalidade (luxo silencioso vs. urbano tech vs. natureza orgânica vs. editorial sofisticado).

═══════════════════════════════════════════
ETAPA 1 — ESCOLHA A "STYLE FAMILY"
═══════════════════════════════════════════
Você DEVE escolher EXATAMENTE UMA das 4 famílias visuais abaixo. Cada uma tem um vocabulário visual radicalmente diferente:

1. "editorial" — Revista impressa / editorial sofisticado
   • Quando usar: empreendimentos com história, projetos arquitetônicos autorais, lançamentos premiados, perfil cultural/intelectual
   • Vocabulário: títulos display gigantes (clamp 2.5rem→7rem), grid quebrado tipo revista, números grandes (01, 02), filetes finos, alta legibilidade, fotos full-bleed alternadas
   • Tipografia recomendada: display "Fraunces" ou "Instrument Serif" + body "Inter" ou "Archivo"
   • Paleta típica: bg quase-branco quente (#fafaf7), accent preto profundo (#111), primary cor de assinatura

2. "luxury-noir" — Luxo silencioso e cinematográfico
   • Quando usar: alto padrão, mansões, coberturas, condomínios de elite, empreendimentos contemplativos
   • Vocabulário: fundo preto profundo, ouro/champagne em traços finos, espaçamento generosíssimo, serif elegante, reveals lentos, layout centralizado e respirado
   • Tipografia recomendada: display "Cormorant Garamond" ou "Playfair Display" + body "Manrope" ou "Inter"
   • Paleta típica: bg "#08080a", surface "#101014", primary tom dourado/champagne (#c9a961, #d4af7a), muted "#a09887"

3. "modern-glass" — Tech contemporâneo, urbano, dinâmico
   • Quando usar: projetos urbanos modernos, smart-buildings, perfil jovem/investidor, tecnologia, lançamentos modernos
   • Vocabulário: mesh gradients vibrantes, glassmorphism, bento grid assimétrico, sans display geométrico, animações expressivas, alto contraste cromático
   • Tipografia recomendada: display "Space Grotesk" ou "Bricolage Grotesque" + body "DM Sans" ou "Inter"
   • Paleta típica: bg "#0a0a1a" ou "#0d0d1f", primary saturado (índigo #4f46e5, mint #2dd4a8, coral #ff6b6b)

4. "nature-organic" — Natureza, calma, materialidade orgânica
   • Quando usar: condomínios de terrenos, campo, serra, projetos verdes, lifestyle desacelerado, vinícolas, casas de praia
   • Vocabulário: bordas orgânicas (border-radius assimétrico), tons terrosos/sage, tipografia humanista, composição assimétrica calma, blobs suaves
   • Tipografia recomendada: display "Lora" ou "Fraunces" + body "Nunito Sans" ou "Outfit"
   • Paleta típica: bg sand "#f5f0e8", accent verde escuro (#2d3b2a, #1a3c2a), primary terracota/sage (#8b7355, #87a878)

═══════════════════════════════════════════
ETAPA 2 — CALIBRE A PALETA (7 TOKENS HSL/HEX)
═══════════════════════════════════════════
Devolva uma paleta completa em "theme.palette":
- bg: fundo principal da página
- surface: fundo de cards e seções alternadas (sutilmente diferente de bg)
- primary: cor de assinatura (botões, destaques, números)
- primaryFg: cor de TEXTO sobre o primary (precisa ter contraste AA)
- muted: cor de texto secundário/parágrafos
- accent: cor de destaque secundária (geralmente o oposto de bg)
- border: cor de bordas e divisores (muito sutil)

REGRA DE CONTRASTE: garanta legibilidade. Texto principal sobre bg deve ter contraste mínimo 4.5:1.

═══════════════════════════════════════════
ETAPA 3 — TIPOGRAFIA
═══════════════════════════════════════════
Escolha um par "theme.typography" de Google Fonts da lista curada:
- Serifs display: "Fraunces", "Instrument Serif", "Cormorant Garamond", "Playfair Display", "Lora", "DM Serif Display"
- Sans display: "Space Grotesk", "Bricolage Grotesque", "Archivo", "Sora", "Outfit"
- Body sans: "Inter", "DM Sans", "Manrope", "Nunito Sans", "Work Sans"
NUNCA repita o mesmo par em todos os projetos — varie.

═══════════════════════════════════════════
ETAPA 4 — COPY (mantenha o nível atual)
═══════════════════════════════════════════
- Títulos impactantes (máx 8 palavras), curiosidade ou desejo imediato.
- Subtítulos com benefício concreto.
- Parágrafos do "about" contam uma HISTÓRIA, não listam features.
- Use gatilhos mentais (escassez, exclusividade, autoridade, prova social) com elegância.
- Adapte o tom à styleFamily: luxury-noir = contemplativo e sofisticado; modern-glass = enérgico e direto; editorial = autoral e cultural; nature-organic = poético e sensorial.

═══════════════════════════════════════════
CAMPOS LEGADOS (manter por compatibilidade)
═══════════════════════════════════════════
Continue preenchendo "theme.primaryColor" e "theme.accentColor" (HEX) — devem espelhar palette.primary e palette.accent.
"theme.style" e "theme.fontFamily" continuam existindo, mas o que MANDA agora é styleFamily + palette + typography.

CAPACIDADES ESPECIAIS
- Se o usuário forneceu links de mapas, vídeos YouTube, iframes → use em customSections tipo "embed" com a URL EXATA (YouTube → https://www.youtube.com/embed/VIDEO_ID).
- Se houver 3+ imagens, crie customSection tipo "gallery" com TODAS.
- Se houver render forte, use em hero.backgroundImageUrl.

ÍCONES VÁLIDOS (Lucide):
"MapPin", "Trees", "Shield", "Home", "Star", "Clock", "TrendingUp", "Heart", "Gem", "Mountain", "Waves", "Sun", "Building2", "Car", "Leaf", "Award", "CheckCircle", "Target", "Zap", "Users", "Key", "Compass", "Camera", "Map", "Phone", "Mail", "Globe", "Wifi", "Lock", "Eye", "Palette", "Dumbbell", "Coffee", "Sparkles", "Crown", "Diamond", "Ruler", "Landmark", "Palmtree", "Fence", "Droplets", "Wind", "Trophy", "Lightbulb", "ShoppingBag", "GraduationCap", "Footprints"

REGRA CRÍTICA PARA REFINAMENTOS:
- Sempre retorne o JSON COMPLETO com todas as seções.
- Mantenha styleFamily e palette atuais, EXCETO se o usuário pediu mudança de estilo ("mais luxuoso" → luxury-noir; "mais editorial" → editorial; "mais tech" → modern-glass; "mais natural" → nature-organic).
- Preserve URLs fornecidas pelo usuário literalmente.`;

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
${projectData.scrapedContent ? `\nCONTEÚDO IMPORTADO AUTOMATICAMENTE DE: ${projectData.scrapedContent.sourceUrl}
TÍTULO ORIGINAL: ${projectData.scrapedContent.originalTitle || "N/A"}
DESCRIÇÃO ORIGINAL: ${projectData.scrapedContent.originalDescription || "N/A"}
TEXTO EXTRAÍDO DA PÁGINA:\n${projectData.scrapedContent.rawText?.slice(0, 6000) || ""}
${projectData.scrapedContent.videoUrls?.length ? `\nVÍDEOS ENCONTRADOS:\n${projectData.scrapedContent.videoUrls.join("\n")}` : ""}

INSTRUÇÃO CRÍTICA PARA CONTEÚDO IMPORTADO:
- O texto acima foi extraído automaticamente de um anúncio/site. TRANSFORME este conteúdo em copywriting COMERCIAL altamente persuasivo e de alta conversão.
- NÃO copie o texto original — reescreva completamente com foco em DESEJO, EXCLUSIVIDADE e URGÊNCIA.
- Crie um título comercial FORTE e memorável (diferente do título original).
- Os argumentos de venda devem ser emocionais e aspiracionais, não descritivos.
- Se houver vídeos, inclua como customSections com embedUrl.` : ""}
${projectData.mediaUrls?.length ? `\nMÍDIA DISPONÍVEL (URLs de imagens/vídeos):\n${projectData.mediaUrls.join("\n")}\n\nIMPORTANTE SOBRE MÍDIAS: Use a melhor imagem como hero.backgroundImageUrl. Outras como features.imageUrl ou em customSections tipo gallery. REGRA CRÍTICA: Se houver 3 ou mais imagens, CRIE uma customSection tipo "gallery" incluindo TODAS as imagens — não omita nenhuma. Cada item deve ter imageUrl e text descritivo.` : ""}
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
          model: "openai/gpt-5",
          messages,
          tools: [
            {
              type: "function",
              function: {
                name: "generate_landing_content",
                description: "Generate the complete landing page content AND visual design system as structured JSON",
                parameters: {
                  type: "object",
                  properties: {
                    theme: {
                      type: "object",
                      properties: {
                        primaryColor: { type: "string", description: "HEX (legacy). Espelha palette.primary." },
                        accentColor: { type: "string", description: "HEX (legacy). Espelha palette.accent." },
                        style: { type: "string", enum: ["luxury", "modern", "nature", "urban"] },
                        fontFamily: { type: "string", enum: ["serif", "sans-serif"] },
                        styleFamily: { type: "string", enum: ["editorial", "luxury-noir", "modern-glass", "nature-organic"], description: "OBRIGATÓRIO. A família visual da landing." },
                        palette: {
                          type: "object",
                          description: "OBRIGATÓRIO. Paleta completa em HEX, 7 tokens.",
                          properties: {
                            bg: { type: "string" },
                            surface: { type: "string" },
                            primary: { type: "string" },
                            primaryFg: { type: "string", description: "Cor do texto sobre primary, com contraste AA" },
                            muted: { type: "string" },
                            accent: { type: "string" },
                            border: { type: "string" },
                          },
                          required: ["bg", "surface", "primary", "primaryFg", "muted", "accent", "border"],
                          additionalProperties: false,
                        },
                        typography: {
                          type: "object",
                          description: "OBRIGATÓRIO. Par de Google Fonts para display + body.",
                          properties: {
                            display: { type: "string", description: "Ex: Fraunces, Cormorant Garamond, Space Grotesk, Lora" },
                            body: { type: "string", description: "Ex: Inter, DM Sans, Manrope, Nunito Sans" },
                            displayWeight: { type: "number" },
                            bodyWeight: { type: "number" },
                          },
                          required: ["display", "body"],
                          additionalProperties: false,
                        },
                        motion: { type: "string", enum: ["subtle", "expressive", "cinematic"] },
                        density: { type: "string", enum: ["airy", "balanced", "dense"] },
                      },
                      required: ["primaryColor", "accentColor", "style", "styleFamily", "palette", "typography"],
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
