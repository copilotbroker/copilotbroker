import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractTitle(html: string): string {
  // Try og:title first
  const ogMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  if (ogMatch) return ogMatch[1].trim();

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1].trim();

  return "";
}

function extractDescription(html: string): string {
  const ogMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
  if (ogMatch) return ogMatch[1].trim();

  const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  if (metaMatch) return metaMatch[1].trim();

  return "";
}

function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  // OG image
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch) {
    const url = resolveUrl(ogMatch[1], baseUrl);
    if (url && !seen.has(url)) { seen.add(url); images.push(url); }
  }

  // img tags
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    // Skip tiny icons, tracking pixels, svgs, data URIs
    if (src.startsWith("data:")) continue;
    if (/\.(svg|ico)(\?|$)/i.test(src)) continue;
    if (/1x1|pixel|spacer|tracking|blank/i.test(src)) continue;

    const url = resolveUrl(src, baseUrl);
    if (url && !seen.has(url)) {
      seen.add(url);
      images.push(url);
    }
  }

  // Also check srcset and data-src
  const dataSrcRegex = /data-src=["']([^"']+)["']/gi;
  while ((match = dataSrcRegex.exec(html)) !== null) {
    const src = match[1];
    if (src.startsWith("data:")) continue;
    if (/\.(svg|ico)(\?|$)/i.test(src)) continue;
    const url = resolveUrl(src, baseUrl);
    if (url && !seen.has(url)) {
      seen.add(url);
      images.push(url);
    }
  }

  return images.slice(0, 30); // Cap at 30 images
}

function extractVideos(html: string, baseUrl: string): string[] {
  const videos: string[] = [];
  const seen = new Set<string>();

  // YouTube embeds
  const ytRegex = /(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([\w-]+)/gi;
  let match;
  while ((match = ytRegex.exec(html)) !== null) {
    const url = `https://www.youtube.com/embed/${match[1]}`;
    if (!seen.has(url)) { seen.add(url); videos.push(url); }
  }

  // Vimeo
  const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/gi;
  while ((match = vimeoRegex.exec(html)) !== null) {
    const url = `https://player.vimeo.com/video/${match[1]}`;
    if (!seen.has(url)) { seen.add(url); videos.push(url); }
  }

  // Video tags
  const videoSrcRegex = /<(?:video|source)[^>]+src=["']([^"']+)["']/gi;
  while ((match = videoSrcRegex.exec(html)) !== null) {
    const url = resolveUrl(match[1], baseUrl);
    if (url && !seen.has(url)) { seen.add(url); videos.push(url); }
  }

  return videos.slice(0, 10);
}

function extractTextContent(html: string): string {
  // Remove scripts and styles
  let clean = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  clean = clean.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  clean = clean.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "");
  clean = clean.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");
  clean = clean.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "");

  // Extract text from headings and paragraphs
  const textParts: string[] = [];
  const contentRegex = /<(?:h[1-6]|p|li|td|span|div|article|section)[^>]*>([\s\S]*?)<\/(?:h[1-6]|p|li|td|span|div|article|section)>/gi;
  let match;
  while ((match = contentRegex.exec(clean)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, "").trim();
    if (text.length > 10) textParts.push(text);
  }

  // Deduplicate and limit
  const unique = [...new Set(textParts)];
  return unique.join("\n\n").slice(0, 8000);
}

function resolveUrl(src: string, baseUrl: string): string | null {
  try {
    if (src.startsWith("//")) return `https:${src}`;
    if (src.startsWith("http")) return src;
    const base = new URL(baseUrl);
    return new URL(src, base).href;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "URL é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // Validate URL
    try {
      new URL(formattedUrl);
    } catch {
      return new Response(
        JSON.stringify({ error: "URL inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Scraping URL:", formattedUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(formattedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Não foi possível acessar o link (status ${response.status})` }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();

    const title = extractTitle(html);
    const description = extractDescription(html);
    const images = extractImages(html, formattedUrl);
    const videos = extractVideos(html, formattedUrl);
    const rawText = extractTextContent(html);

    const result = {
      title,
      description,
      images,
      videos,
      rawText,
      url: formattedUrl,
      extractedAt: new Date().toISOString(),
    };

    console.log(`Scraped: title="${title}", ${images.length} images, ${videos.length} videos, ${rawText.length} chars text`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scrape-url error:", e);
    const message = e instanceof Error && e.name === "AbortError"
      ? "O site demorou muito para responder. Tente outro link."
      : e instanceof Error ? e.message : "Erro ao ler o link";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
