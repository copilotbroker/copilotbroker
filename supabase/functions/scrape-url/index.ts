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

function isValidImageUrl(src: string): boolean {
  if (!src || src.length < 5) return false;
  if (src.startsWith("data:")) return false;
  if (/\.(svg|ico)(\?|$)/i.test(src)) return false;
  if (/1x1|pixel|spacer|tracking|blank|logo.*small|favicon/i.test(src)) return false;
  // Must look like an image URL or be a generic URL (could be an image served dynamically)
  return true;
}

function addImage(src: string, baseUrl: string, seen: Set<string>, images: string[]) {
  if (!isValidImageUrl(src)) return;
  const url = resolveUrl(src.trim(), baseUrl);
  if (url && !seen.has(url)) {
    seen.add(url);
    images.push(url);
  }
}

function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  // 1. OG images (can have multiple)
  const ogRegex = /<meta[^>]+(?:property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']|content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["'])/gi;
  let match;
  while ((match = ogRegex.exec(html)) !== null) {
    addImage(match[1] || match[2], baseUrl, seen, images);
  }

  // 2. Twitter/meta image
  const twitterImg = html.match(/<meta[^>]+(?:name=["']twitter:image["'][^>]+content=["']([^"']+)["']|content=["']([^"']+)["'][^>]+name=["']twitter:image["'])/i);
  if (twitterImg) addImage(twitterImg[1] || twitterImg[2], baseUrl, seen, images);

  // 3. <img> tags — src attribute
  const imgSrcRegex = /<img[^>]+>/gi;
  while ((match = imgSrcRegex.exec(html)) !== null) {
    const tag = match[0];

    // Extract src
    const srcMatch = tag.match(/\bsrc=["']([^"']+)["']/i);
    if (srcMatch) addImage(srcMatch[1], baseUrl, seen, images);

    // Extract data-src, data-lazy-src, data-original, data-full-src, data-zoom-image
    const lazyAttrs = tag.matchAll(/\bdata-(?:src|lazy-src|original|full-src|zoom-image|srcset|hi-res|large-src|bg|image)=["']([^"']+)["']/gi);
    for (const lazyMatch of lazyAttrs) {
      // data-srcset may have multiple URLs separated by comma
      const val = lazyMatch[1];
      if (val.includes(",")) {
        for (const part of val.split(",")) {
          const u = part.trim().split(/\s+/)[0];
          addImage(u, baseUrl, seen, images);
        }
      } else {
        addImage(val, baseUrl, seen, images);
      }
    }

    // Extract srcset
    const srcsetMatch = tag.match(/\bsrcset=["']([^"']+)["']/i);
    if (srcsetMatch) {
      for (const part of srcsetMatch[1].split(",")) {
        const u = part.trim().split(/\s+/)[0];
        addImage(u, baseUrl, seen, images);
      }
    }
  }

  // 4. <source> tags inside <picture>
  const sourceRegex = /<source[^>]+srcset=["']([^"']+)["']/gi;
  while ((match = sourceRegex.exec(html)) !== null) {
    for (const part of match[1].split(",")) {
      const u = part.trim().split(/\s+/)[0];
      addImage(u, baseUrl, seen, images);
    }
  }

  // 5. CSS background-image in inline styles
  const bgRegex = /background(?:-image)?\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
  while ((match = bgRegex.exec(html)) !== null) {
    addImage(match[1], baseUrl, seen, images);
  }

  // 6. JSON-LD structured data images
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const extractFromObj = (obj: any) => {
        if (!obj || typeof obj !== "object") return;
        if (typeof obj.image === "string") addImage(obj.image, baseUrl, seen, images);
        if (Array.isArray(obj.image)) obj.image.forEach((img: any) => {
          if (typeof img === "string") addImage(img, baseUrl, seen, images);
          else if (img?.url) addImage(img.url, baseUrl, seen, images);
        });
        if (obj.image?.url) addImage(obj.image.url, baseUrl, seen, images);
        if (Array.isArray(obj.photo)) obj.photo.forEach((p: any) => {
          if (typeof p === "string") addImage(p, baseUrl, seen, images);
          else if (p?.contentUrl) addImage(p.contentUrl, baseUrl, seen, images);
        });
      };
      if (Array.isArray(data)) data.forEach(extractFromObj);
      else extractFromObj(data);
    } catch { /* ignore malformed JSON-LD */ }
  }

  // 7. Links to image files (sometimes galleries use <a href="image.jpg">)
  const aHrefImgRegex = /<a[^>]+href=["']([^"']+\.(?:jpg|jpeg|png|webp|avif)(?:\?[^"']*)?)["']/gi;
  while ((match = aHrefImgRegex.exec(html)) !== null) {
    addImage(match[1], baseUrl, seen, images);
  }

  return images.slice(0, 50); // Cap at 50 images
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

function extractCity(html: string, rawText: string): string {
  // 1. JSON-LD addressLocality
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const findCity = (obj: any): string | null => {
        if (!obj || typeof obj !== "object") return null;
        if (obj.address?.addressLocality) return obj.address.addressLocality;
        if (obj.addressLocality) return obj.addressLocality;
        if (obj.location?.address?.addressLocality) return obj.location.address.addressLocality;
        if (Array.isArray(obj)) {
          for (const item of obj) { const r = findCity(item); if (r) return r; }
        }
        return null;
      };
      const city = findCity(data);
      if (city) return city.trim();
    } catch { /* ignore */ }
  }

  // 2. Meta geo.placename or geo.region
  const geoPlace = html.match(/<meta[^>]+name=["']geo\.placename["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']geo\.placename["']/i);
  if (geoPlace) return geoPlace[1].trim();

  // 3. Common patterns in text: "Cidade: X", "em CityName - UF", "CityName/UF"
  const cityPatterns = [
    /(?:cidade|localiza[çc][ãa]o|endere[çc]o)\s*:\s*([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i,
    /(?:localizado|situada?|fica)\s+(?:n[oa]|em)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:d[oae]s?\s+)?[A-ZÀ-Ú][a-zà-ú]+)*)\s*[-\/,]\s*[A-Z]{2}/,
    /([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:d[oae]s?\s+)?[A-ZÀ-Ú][a-zà-ú]+)*)\s*[-\/]\s*(?:RS|SC|PR|SP|RJ|MG|BA|CE|PE|GO|DF|ES|MT|MS|PA|AM|MA|PI|RN|PB|SE|AL|TO|RO|AC|AP|RR)\b/,
  ];
  for (const pattern of cityPatterns) {
    const m = rawText.match(pattern);
    if (m && m[1] && m[1].length > 2 && m[1].length < 50) return m[1].trim();
  }

  return "";
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
