import { Hono } from "https://deno.land/x/hono@v3.12.11/mod.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Image } from "jsr:@matmen/imagescript";

const app = new Hono().basePath("/whatsapp-webhook");

const ALLOWED_ORIGINS = ["https://onovocondominio.com.br", "https://onovocondominio.lovable.app", "https://id-preview--8855e0c5-1ec6-49e7-83f4-12e453004e21.lovable.app"];
function getDynamicCors(origin: string) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return { "Access-Control-Allow-Origin": allowed, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version" };
}
const corsHeaders = getDynamicCors(ALLOWED_ORIGINS[0]);

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// ========================= TYPES =========================

interface UAZAPIv2Payload {
  EventType?: string;
  instanceName?: string;
  token?: string;
  message?: {
    chatid?: string;
    fromMe?: boolean;
    text?: string;
    isGroup?: boolean;
    id?: string;
    timestamp?: number;
    pushName?: string;
    senderName?: string;
    status?: string;
    sender_pn?: string;
    mimetype?: string;
    mediaUrl?: string;
    url?: string;
    type?: string;
    caption?: string;
    fileName?: string;
    mediaName?: string;
  };
  event?: string;
  instance?: string;
  messages?: unknown[];
  data?: Record<string, unknown>;
  connection?: { state?: string };
}

// ========================= OPT-OUT DETECTION =========================

const OPTOUT_PHRASES = [
  "pare de enviar", "parar de enviar", "pare de mandar",
  "não quero receber", "nao quero receber",
  "não quero mais", "nao quero mais",
  "sair da lista", "me tire da lista", "me remova",
  "remover da lista", "cancelar mensagens", "cancelar envio",
  "não mande mais", "nao mande mais",
  "bloquear mensagens", "isso é spam", "isso e spam",
  "stop", "unsubscribe",
  "chega de mensagem", "chega de msg",
  "não me mande", "nao me mande",
  "pare com isso", "para com isso",
];

const OPTOUT_EXACT_WORDS = ["spam", "unsubscribe", "stop"];

function detectOptout(message: string): string | null {
  const lower = message.toLowerCase().trim();
  for (const phrase of OPTOUT_PHRASES) {
    if (lower.includes(phrase)) return phrase;
  }
  for (const word of OPTOUT_EXACT_WORDS) {
    if (lower === word) return word;
  }
  return null;
}

// ========================= AD REFERRAL EXTRACTION =========================

interface AdReferralContext {
  source: string;       // e.g. "FACEBOOK"
  campaign: string;     // campaign name
  headline: string;     // ad body/headline text
  medium: string;       // e.g. "WHATSAPP BUSINESS APP", "ctwa"
  source_url: string;   // e.g. "https://fb.me/..."
  source_id?: string;   // ad id
  source_type?: string; // e.g. "ad", "post"
  thumbnail_url?: string;
}

function extractAdReferralContext(msg: NonNullable<UAZAPIv2Payload["message"]>, payload: UAZAPIv2Payload): AdReferralContext | null {
  // UAZAPI forwards the WhatsApp contextInfo in various locations
  const data = payload.data || {};
  const msgRaw = payload.message as Record<string, unknown> || {};
  
  // Try multiple paths where contextInfo might be
  const contextInfo = (msgRaw.contextInfo as Record<string, unknown>)
    || (data.contextInfo as Record<string, unknown>)
    || ((msgRaw.content as Record<string, unknown>)?.contextInfo as Record<string, unknown>)
    || ((data.message as Record<string, unknown>)?.contextInfo as Record<string, unknown>)
    || null;
  
  const externalAdReply = contextInfo?.externalAdReply as Record<string, unknown> | undefined;
  
  // Also check for entryPointConversionSource (CTWA ads)
  const entryPointSource = (contextInfo?.entryPointConversionSource as string)
    || (data.entryPointConversionSource as string)
    || (msgRaw.entryPointConversionSource as string);
  const entryPointApp = (contextInfo?.entryPointConversionApp as string)
    || (data.entryPointConversionApp as string)
    || (msgRaw.entryPointConversionApp as string);

  // Also check top-level UAZAPI fields for referral info
  const referralInfo = (data.referral as Record<string, unknown>)
    || (msgRaw.referral as Record<string, unknown>);

  if (!externalAdReply && !entryPointSource && !referralInfo) return null;

  const source = (externalAdReply?.title as string)
    || (referralInfo?.source as string)
    || entryPointSource
    || "FACEBOOK";
  
  const headline = (externalAdReply?.body as string)
    || (referralInfo?.headline as string)
    || (referralInfo?.body as string)
    || "";
  
  const sourceUrl = (externalAdReply?.sourceUrl as string)
    || (referralInfo?.url as string)
    || (referralInfo?.source_url as string)
    || "";
  
  const medium = entryPointApp
    || (referralInfo?.source_type as string)
    || (externalAdReply ? "WHATSAPP BUSINESS APP" : "");
  
  const campaign = (referralInfo?.campaign as string)
    || (externalAdReply?.title as string)
    || "";

  const thumbnailUrl = (externalAdReply?.thumbnailUrl as string)
    || (externalAdReply?.mediaUrl as string)
    || "";

  const sourceId = (referralInfo?.source_id as string)
    || (externalAdReply?.sourceId as string)
    || "";

  const sourceType = (referralInfo?.source_type as string)
    || (externalAdReply?.sourceType as string)
    || "";

  return {
    source: source || "FACEBOOK",
    campaign: campaign || "",
    headline: headline || "",
    medium: medium || "",
    source_url: sourceUrl || "",
    source_id: sourceId || undefined,
    source_type: sourceType || undefined,
    thumbnail_url: thumbnailUrl || undefined,
  };
}

// ========================= PHONE UTILITIES =========================

function formatPhoneE164(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("55")) {
    if (cleaned.length === 12) {
      const ddd = cleaned.substring(2, 4);
      const number = cleaned.substring(4);
      return `+55${ddd}9${number}`;
    }
    return `+${cleaned}`;
  }

  if (cleaned.length === 10) {
    const ddd = cleaned.substring(0, 2);
    const number = cleaned.substring(2);
    return `+55${ddd}9${number}`;
  }
  if (cleaned.length === 11) return `+55${cleaned}`;

  return `+${cleaned}`;
}

function getCanonicalPhone(phone: string): string {
  return formatPhoneE164(phone);
}

function getCanonicalPhoneNormalized(phone: string): string {
  return getCanonicalPhone(phone).replace(/\D/g, "");
}

function extractPhoneFromChatId(chatid: string): string {
  return getCanonicalPhone(chatid.split("@")[0]);
}

function getPhoneVariants(phone: string): string[] {
  const canonical = getCanonicalPhone(phone);
  const normalized = canonical.replace(/\D/g, "");
  const variants = new Set<string>([
    canonical,
    normalized,
    normalized.startsWith("55") ? normalized.slice(2) : normalized,
    `+${normalized}`,
  ]);
  return [...variants].filter(Boolean);
}


function inferMessageType(messageText: string, mimeType?: string, rawType?: string): string {
  const lowerMime = mimeType?.toLowerCase() || "";
  const lowerType = rawType?.toLowerCase() || "";

  if (lowerMime.startsWith("image/") || lowerType.includes("image")) return "image";
  if (lowerMime.startsWith("audio/") || lowerType.includes("audio") || lowerType.includes("ptt") || lowerType.includes("voice")) return "audio";
  if (lowerMime.startsWith("video/") || lowerType.includes("video")) return "video";
  if (
    lowerMime.includes("pdf") ||
    lowerMime.includes("officedocument") ||
    lowerMime.includes("msword") ||
    lowerMime.includes("spreadsheet") ||
    lowerMime.startsWith("application/") ||
    lowerType.includes("document") ||
    lowerType.includes("file")
  ) {
    return "document";
  }

  if (!messageText && (lowerMime || lowerType)) return "document";
  return messageText ? "text" : "document";
}

function extractMediaMetadata(msg: NonNullable<UAZAPIv2Payload["message"]>, payload: UAZAPIv2Payload) {
  const data = payload.data || {};
  const content = typeof payload.message === "object" && payload.message && typeof (payload.message as Record<string, unknown>).content === "object"
    ? ((payload.message as Record<string, unknown>).content as Record<string, unknown>)
    : {};

  const mimeType = (typeof msg.mimetype === "string" ? msg.mimetype : undefined)
    || (typeof content.mimetype === "string" ? content.mimetype : undefined)
    || (typeof data.mimetype === "string" ? data.mimetype : undefined)
    || (typeof data.mime_type === "string" ? data.mime_type : undefined);
  const fileUrl = (typeof msg.mediaUrl === "string" ? msg.mediaUrl : undefined)
    || (typeof msg.url === "string" ? msg.url : undefined)
    || (typeof content.URL === "string" ? content.URL : undefined)
    || (typeof content.url === "string" ? content.url : undefined)
    || (typeof data.mediaUrl === "string" ? data.mediaUrl : undefined)
    || (typeof data.url === "string" ? data.url : undefined)
    || (typeof data.file_url === "string" ? data.file_url : undefined);
  const fileName = (typeof msg.fileName === "string" ? msg.fileName : undefined)
    || (typeof msg.mediaName === "string" ? msg.mediaName : undefined)
    || (typeof content.fileName === "string" ? content.fileName : undefined)
    || (typeof content.filename === "string" ? content.filename : undefined)
    || (typeof data.fileName === "string" ? data.fileName : undefined)
    || (typeof data.file_name === "string" ? data.file_name : undefined);
  const rawType = (typeof msg.type === "string" ? msg.type : undefined)
    || (typeof (msg as Record<string, unknown>).mediaType === "string" ? (msg as Record<string, unknown>).mediaType as string : undefined)
    || (typeof (msg as Record<string, unknown>).messageType === "string" ? (msg as Record<string, unknown>).messageType as string : undefined)
    || (typeof content.mediaType === "string" ? content.mediaType : undefined)
    || (typeof content.messageType === "string" ? content.messageType : undefined)
    || (typeof data.type === "string" ? data.type : undefined)
    || (typeof data.mediaType === "string" ? data.mediaType : undefined)
    || (typeof data.messageType === "string" ? data.messageType : undefined);
  const caption = (typeof msg.caption === "string" ? msg.caption : undefined)
    || (typeof content.caption === "string" ? content.caption : undefined)
    || (typeof data.caption === "string" ? data.caption : undefined);
  const durationSeconds = typeof content.seconds === "number"
    ? content.seconds
    : typeof data.duration_seconds === "number"
    ? data.duration_seconds
    : typeof data.seconds === "number"
    ? data.seconds
    : undefined;
  const sizeBytes = typeof content.fileLength === "number"
    ? content.fileLength
    : typeof data.size_bytes === "number"
    ? data.size_bytes
    : typeof data.fileLength === "number"
    ? data.fileLength
    : undefined;
  const thumbnailUrl = (typeof content.thumbnailUrl === "string" ? content.thumbnailUrl : undefined)
    || (typeof content.thumbnail === "string" ? content.thumbnail : undefined)
    || (typeof data.thumbnail_url === "string" ? data.thumbnail_url : undefined)
    || (typeof data.thumb === "string" ? data.thumb : undefined);
  const thumbnailBase64 = (typeof content.JPEGThumbnail === "string" ? content.JPEGThumbnail : undefined)
    || (typeof content.jpegThumbnail === "string" ? content.jpegThumbnail : undefined)
    || (typeof data.JPEGThumbnail === "string" ? data.JPEGThumbnail : undefined)
    || (typeof data.jpegThumbnail === "string" ? data.jpegThumbnail : undefined);
  const mediaKey = (typeof content.mediaKey === "string" ? content.mediaKey : undefined)
    || (typeof data.mediaKey === "string" ? data.mediaKey : undefined);
  const directPath = (typeof content.directPath === "string" ? content.directPath : undefined)
    || (typeof data.directPath === "string" ? data.directPath : undefined);
  const fileSha256 = (typeof content.fileSHA256 === "string" ? content.fileSHA256 : undefined)
    || (typeof data.fileSHA256 === "string" ? data.fileSHA256 : undefined);
  const fileEncSha256 = (typeof content.fileEncSHA256 === "string" ? content.fileEncSHA256 : undefined)
    || (typeof data.fileEncSHA256 === "string" ? data.fileEncSHA256 : undefined);

  return {
    file_url: fileUrl,
    file_name: fileName,
    mime_type: mimeType,
    raw_type: rawType,
    caption,
    duration_seconds: durationSeconds,
    size_bytes: sizeBytes,
    thumbnail_url: thumbnailUrl,
    thumbnail_base64: thumbnailBase64,
    media_key: mediaKey,
    direct_path: directPath,
    file_sha256: fileSha256,
    file_enc_sha256: fileEncSha256,
  };
}

function sanitizeFileName(fileName?: string, fallbackExtension?: string) {
  const base = (fileName || `media-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, "-");
  if (base.includes(".")) return base;
  return fallbackExtension ? `${base}.${fallbackExtension}` : base;
}

function getExtensionFromMimeType(mimeType?: string) {
  if (!mimeType) return undefined;
  const mime = mimeType.toLowerCase();
  if (mime.startsWith("image/jpeg")) return "jpg";
  if (mime.startsWith("image/png")) return "png";
  if (mime.startsWith("image/webp")) return "webp";
  if (mime.startsWith("image/gif")) return "gif";
  if (mime.startsWith("audio/ogg")) return "ogg";
  if (mime.startsWith("audio/mpeg")) return "mp3";
  if (mime.startsWith("audio/mp4") || mime.startsWith("audio/m4a")) return "m4a";
  if (mime.startsWith("audio/wav")) return "wav";
  if (mime.startsWith("video/mp4")) return "mp4";
  if (mime.startsWith("video/quicktime")) return "mov";
  if (mime.includes("pdf")) return "pdf";
  return mime.split("/")[1]?.split(";")[0];
}

function getAuthHeadersForMedia(token?: string) {
  if (!token) return [] as HeadersInit[];
  return [
    { token },
    { admintoken: token },
    { apikey: token },
    { "x-api-key": token },
    { Authorization: `Bearer ${token}` },
  ];
}

function getMimeTypeFromFileName(fileName?: string) {
  const lower = fileName?.toLowerCase() || "";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".ogg")) return "audio/ogg";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".m4a")) return "audio/mp4";
  if (lower.endsWith(".pdf")) return "application/pdf";
  return undefined;
}

function getMimeTypeFromBytes(bytes: Uint8Array) {
  if (bytes.length < 4) return undefined;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image/gif";
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "application/pdf";
  if (bytes.length >= 4 && bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) return "audio/ogg";
  if (bytes.length >= 12 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return "video/mp4";
  return undefined;
}

function decodeBase64ToBytes(value?: string) {
  if (!value) return null;
  try {
    const normalized = (value.includes(",") ? value.split(",").pop() : value)?.replace(/\s+/g, "") || "";
    if (!normalized) return null;
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
}

function getWhatsAppMediaHkdfInfo(messageType: string) {
  switch (messageType) {
    case "image":
      return "WhatsApp Image Keys";
    case "video":
      return "WhatsApp Video Keys";
    case "audio":
      return "WhatsApp Audio Keys";
    case "document":
      return "WhatsApp Document Keys";
    default:
      return "WhatsApp Image Keys";
  }
}

async function deriveWhatsAppMediaKeys(mediaKeyBase64: string, messageType: string) {
  const mediaKeyBytes = decodeBase64ToBytes(mediaKeyBase64);
  if (!mediaKeyBytes) return null;

  const hkdfKey = await crypto.subtle.importKey("raw", mediaKeyBytes, "HKDF", false, ["deriveBits"]);
  const infoBytes = new TextEncoder().encode(getWhatsAppMediaHkdfInfo(messageType));
  const derivedBits = await crypto.subtle.deriveBits({
    name: "HKDF",
    hash: "SHA-256",
    salt: new Uint8Array(32),
    info: infoBytes,
  }, hkdfKey, 896);

  const derived = new Uint8Array(derivedBits);
  return {
    iv: derived.slice(0, 16),
    cipherKey: derived.slice(16, 48),
    macKey: derived.slice(48, 80),
    refKey: derived.slice(80, 112),
  };
}

async function decryptWhatsAppMedia(encBytes: Uint8Array, mediaKeyBase64: string, messageType: string) {
  const keys = await deriveWhatsAppMediaKeys(mediaKeyBase64, messageType);
  if (!keys || encBytes.byteLength <= 10) return null;

  const cipherBytes = encBytes.slice(0, -10);
  const cryptoKey = await crypto.subtle.importKey("raw", keys.cipherKey, { name: "AES-CBC" }, false, ["decrypt"]);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-CBC", iv: keys.iv }, cryptoKey, cipherBytes);
  return new Uint8Array(decrypted);
}

function isLikelyRenderableMimeType(mimeType?: string, messageType?: string) {
  const mime = mimeType?.toLowerCase() || "";
  if (!mime) return false;
  if (messageType === "image") return mime.startsWith("image/");
  if (messageType === "audio") return mime.startsWith("audio/");
  if (messageType === "video") return mime.startsWith("video/");
  if (messageType === "document") return mime.startsWith("application/") || mime.startsWith("text/");
  return /^(image|audio|video|application|text)\//.test(mime);
}

function hasValidBinarySignature(bytes: Uint8Array, mimeType?: string) {
  const mime = mimeType?.toLowerCase() || "";
  if (!bytes.length) return false;
  if (mime.startsWith("image/jpeg")) return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime.startsWith("image/png")) return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (mime.startsWith("image/gif")) return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
  if (mime.startsWith("image/webp")) return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  if (mime.startsWith("application/pdf")) return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  return bytes.length > 32;
}

async function convertImageToWebp(bytes: Uint8Array) {
  const image = await Image.decode(bytes);
  const maxDimension = 1600;
  const width = image.width;
  const height = image.height;
  const largestDimension = Math.max(width, height);

  if (largestDimension > maxDimension) {
    const scale = maxDimension / largestDimension;
    image.resize(Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)));
  }

  return await image.encode(80, Image.WEBP);
}

function isWhatsAppHostedMediaUrl(url?: string) {
  if (!url) return false;
  const normalized = url.toLowerCase();
  return normalized.includes("mmg.whatsapp.net") || normalized.includes("mms.whatsapp.net");
}

async function fetchInboundMedia(sourceUrl: string, tokens: string[]) {
  const authHeaders = [
    ...tokens.flatMap((token) => getAuthHeadersForMedia(token)),
    {},
  ];

  let lastStatus: number | null = null;
  let lastContentType: string | null = null;

  for (const headers of authHeaders) {
    const response = await fetch(sourceUrl, { headers });
    lastStatus = response.status;
    lastContentType = response.headers.get("content-type");
    if (response.ok) {
      return { response, lastStatus, lastContentType, attemptedWithAuth: Object.keys(headers).length > 0 };
    }
    await response.arrayBuffer().catch(() => null);
  }

  return { response: null, lastStatus, lastContentType, attemptedWithAuth: false };
}

async function persistInboundMediaIfNeeded(
  supabase: SupabaseClient,
  payload: UAZAPIv2Payload,
  phone: string,
  messageType: string,
  metadata: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { thumbnail_base64: thumbnailBase64, ...baseMetadata } = metadata;
  const sourceUrl = typeof baseMetadata.file_url === "string" ? baseMetadata.file_url : "";
  if (messageType === "text") return baseMetadata;

  const normalizedPhone = getCanonicalPhoneNormalized(phone);
  const existingStoragePath = typeof baseMetadata.storage_path === "string" ? baseMetadata.storage_path : null;
  const alreadyHosted = sourceUrl.includes("/storage/v1/object/public/project-media/");
  if (alreadyHosted) {
    return {
      ...baseMetadata,
      storage_path: existingStoragePath,
      phone_normalized: normalizedPhone,
      is_inline_ready: true,
    };
  }

  const fallbackMetadata = {
    ...baseMetadata,
    source_file_url: sourceUrl || undefined,
    phone_normalized: normalizedPhone,
    is_inline_ready: false,
  };

  const uploadToBucket = async (
    binary: ArrayBuffer | Uint8Array,
    mimeType: string,
    extraMetadata: Record<string, unknown> = {},
  ) => {
    const normalizedMimeType = messageType === "image" ? "image/webp" : mimeType;
    const extension = getExtensionFromMimeType(normalizedMimeType);
    const originalFileName = typeof baseMetadata.file_name === "string" ? baseMetadata.file_name : undefined;
    const fileName = messageType === "image"
      ? sanitizeFileName(originalFileName?.replace(/\.[^.]+$/, "") || `media-${Date.now()}`, extension)
      : sanitizeFileName(originalFileName, extension);

    let uploadBinary: ArrayBuffer | Uint8Array = binary;
    let sizeBytes = binary instanceof Uint8Array ? binary.byteLength : binary.byteLength;

    if (messageType === "image") {
      try {
        const imageBytes = binary instanceof Uint8Array ? binary : new Uint8Array(binary);
        uploadBinary = await convertImageToWebp(imageBytes);
        sizeBytes = uploadBinary.byteLength;
        console.log("🖼️ Converted inbound image to WEBP", {
          phone: normalizedPhone,
          originalMimeType: mimeType,
          outputMimeType: normalizedMimeType,
          originalSizeBytes: imageBytes.byteLength,
          outputSizeBytes: sizeBytes,
          previewOnly: extraMetadata.preview_only === true,
        });
      } catch (conversionError) {
        console.warn("⚠️ Failed to convert inbound image to WEBP", conversionError, {
          phone: normalizedPhone,
          mimeType,
          sourceUrl,
        });
        return null;
      }
    }

    const path = `inbox/inbound/${normalizedPhone}/${Date.now()}-${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from("project-media")
      .upload(path, uploadBinary, {
        contentType: normalizedMimeType,
        upsert: false,
      });

    if (uploadError) {
      console.warn("⚠️ Could not upload inbound media to bucket", uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage.from("project-media").getPublicUrl(path);
    console.log("📦 Uploaded inbound media to bucket", {
      phone: normalizedPhone,
      path,
      mimeType: normalizedMimeType,
      previewOnly: extraMetadata.preview_only === true,
      sourceUrl,
    });

    return {
      ...baseMetadata,
      ...extraMetadata,
      file_url: publicUrlData.publicUrl,
      thumbnail_url: messageType === "image" ? publicUrlData.publicUrl : baseMetadata.thumbnail_url,
      storage_path: path,
      mime_type: normalizedMimeType,
      file_name: fileName,
      size_bytes: Number(baseMetadata.size_bytes) || sizeBytes,
      source_file_url: sourceUrl || undefined,
      phone_normalized: normalizedPhone,
      is_inline_ready: true,
    };
  };

  const thumbnailBytes = messageType === "image" && typeof thumbnailBase64 === "string"
    ? decodeBase64ToBytes(thumbnailBase64)
    : null;

  const persistThumbnailFallback = async (reason: string) => {
    if (!thumbnailBytes) return fallbackMetadata;
    console.log("🖼️ Using embedded thumbnail fallback for inbound image", {
      reason,
      phone: normalizedPhone,
      sourceUrl,
    });

    const uploadedPreview = await uploadToBucket(thumbnailBytes, "image/jpeg", {
      preview_only: true,
      preview_source: "embedded_thumbnail",
    });

    return uploadedPreview || {
      ...fallbackMetadata,
      mime_type: "image/webp",
      size_bytes: thumbnailBytes.byteLength,
      preview_only: true,
      preview_source: "embedded_thumbnail",
    };
  };

  if (!sourceUrl) {
    return await persistThumbnailFallback("missing_source_url");
  }

  try {
    const tokensToTry = [payload.token, UAZAPI_TOKEN].filter((value): value is string => Boolean(value?.trim()));
    const { response: mediaResponse, lastStatus, lastContentType, attemptedWithAuth } = await fetchInboundMedia(sourceUrl, tokensToTry);

    if (!mediaResponse) {
      console.warn("⚠️ Could not fetch inbound media for preview", {
        sourceUrl,
        messageType,
        phone: normalizedPhone,
        lastStatus,
        lastContentType,
        isWhatsAppHosted: isWhatsAppHostedMediaUrl(sourceUrl),
      });
      return await persistThumbnailFallback("fetch_failed");
    }

    const arrayBuffer = await mediaResponse.arrayBuffer();
    const encryptedBytes = new Uint8Array(arrayBuffer);
    const responseMimeType = mediaResponse.headers.get("content-type") || undefined;
    const metadataMimeType = typeof baseMetadata.mime_type === "string" ? baseMetadata.mime_type : undefined;
    const fileNameMimeType = getMimeTypeFromFileName(typeof baseMetadata.file_name === "string" ? baseMetadata.file_name : undefined);

    let bytes = encryptedBytes;
    let decryptedFromProvider = false;
    const mediaKey = typeof baseMetadata.media_key === "string" ? baseMetadata.media_key : undefined;

    if (mediaKey && isWhatsAppHostedMediaUrl(sourceUrl)) {
      try {
        const decryptedBytes = await decryptWhatsAppMedia(encryptedBytes, mediaKey, messageType);
        if (decryptedBytes && decryptedBytes.byteLength > 0) {
          bytes = decryptedBytes;
          decryptedFromProvider = true;
        }
      } catch (decryptError) {
        console.warn("⚠️ Could not decrypt WhatsApp media", decryptError, { sourceUrl, messageType, phone: normalizedPhone });
      }
    }

    const detectedMimeType = getMimeTypeFromBytes(bytes);
    const mimeType = [metadataMimeType, fileNameMimeType, detectedMimeType, responseMimeType]
      .find((value) => value && value !== "application/octet-stream")
      || detectedMimeType
      || metadataMimeType
      || fileNameMimeType
      || responseMimeType;
    const looksRenderable = isLikelyRenderableMimeType(mimeType, messageType) && hasValidBinarySignature(bytes, mimeType);

    if (!looksRenderable || !mimeType) {
      console.warn("⚠️ Inbound media rejected before upload", {
        sourceUrl,
        messageType,
        mimeType,
        detectedMimeType,
        size: bytes.byteLength,
        encryptedSize: encryptedBytes.byteLength,
        decryptedFromProvider,
        lastStatus,
        lastContentType,
        attemptedWithAuth,
        isWhatsAppHosted: isWhatsAppHostedMediaUrl(sourceUrl),
      });
      const thumbnailFallback = await persistThumbnailFallback("source_not_renderable");
      return thumbnailFallback.is_inline_ready
        ? thumbnailFallback
        : {
            ...fallbackMetadata,
            mime_type: messageType === "image" ? "image/webp" : (mimeType || baseMetadata.mime_type),
            size_bytes: Number(baseMetadata.size_bytes) || bytes.byteLength,
          };
    }

    console.log("✅ Original inbound media fetched", {
      phone: normalizedPhone,
      sourceUrl,
      mimeType,
      size: bytes.byteLength,
      encryptedSize: encryptedBytes.byteLength,
      decryptedFromProvider,
      messageType,
    });

    const uploadedMedia = await uploadToBucket(bytes, mimeType, {
      preview_only: false,
      preview_source: decryptedFromProvider ? "original_media_decrypted" : "original_media",
    });
    return uploadedMedia || await persistThumbnailFallback("webp_conversion_failed");
  } catch (error) {
    console.warn("⚠️ Error while persisting inbound media", error);
    return await persistThumbnailFallback("unexpected_error");
  }
}


async function logError(
  supabase: SupabaseClient,
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`❌ [${context}]`, message, metadata || "");
  
  // Best-effort: log to whatsapp_daily_stats error_count if broker is known
  if (metadata?.broker_id) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: stats } = await supabase
        .from("whatsapp_daily_stats")
        .select("id, error_count")
        .eq("broker_id", metadata.broker_id as string)
        .eq("date", today)
        .maybeSingle();
      
      if (stats) {
        await supabase
          .from("whatsapp_daily_stats")
          .update({ error_count: ((stats as { error_count: number }).error_count || 0) + 1 })
          .eq("id", (stats as { id: string }).id);
      }
    } catch {
      // Swallow - don't let error logging cause more errors
    }
  }
}

// ========================= FOLLOW-UP CANCELLATION =========================

async function cancelFollowUpsOnReply(
  supabase: SupabaseClient,
  phone: string,
  campaignIds: string[]
): Promise<void> {
  if (campaignIds.length === 0) return;
  const phoneVariants = getPhoneVariants(phone);

  for (const campaignId of campaignIds) {
    try {
      const { data: scheduledMsgs } = await supabase
        .from("whatsapp_message_queue")
        .select("id, step_number")
        .in("phone", phoneVariants)
        .eq("campaign_id", campaignId)
        .in("status", ["scheduled", "queued"])
        .gt("step_number", 1);

      if (!scheduledMsgs || scheduledMsgs.length === 0) continue;

      const stepNumbers = scheduledMsgs.map((m: { step_number: number }) => m.step_number);
      const { data: steps } = await supabase
        .from("campaign_steps")
        .select("step_order, send_if_replied")
        .eq("campaign_id", campaignId)
        .in("step_order", stepNumbers);

      if (!steps) continue;

      const cancelSteps = new Set(
        (steps as Array<{ step_order: number; send_if_replied: boolean }>)
          .filter(s => s.send_if_replied === false)
          .map(s => s.step_order)
      );

      const idsToCancel = (scheduledMsgs as Array<{ id: string; step_number: number }>)
        .filter(m => cancelSteps.has(m.step_number))
        .map(m => m.id);

      if (idsToCancel.length > 0) {
        await supabase
          .from("whatsapp_message_queue")
          .update({
            status: "cancelled",
            error_message: "Lead respondeu - follow-up cancelado",
            updated_at: new Date().toISOString()
          })
          .in("id", idsToCancel);

        console.log(`🚫 Cancelled ${idsToCancel.length} follow-ups for ${phone} (campaign ${campaignId})`);
      }
    } catch (err) {
      await logError(supabase, "cancelFollowUps", err, { phone, campaignId });
    }
  }
}

// ========================= REPLY PROCESSING =========================

async function processReply(
  supabase: SupabaseClient,
  phone: string,
  recentMessages: Array<{ campaign_id: string | null; broker_id: string }>
): Promise<void> {
  const firstMsg = recentMessages[0];
  const campaignIds = [...new Set(
    recentMessages
      .map(m => m.campaign_id)
      .filter((id): id is string => id !== null)
  )];

  // Cancel follow-ups where send_if_replied = false
  await cancelFollowUpsOnReply(supabase, phone, campaignIds);

  // Check if campaigns should be marked as completed
  for (const campaignId of campaignIds) {
    try {
      const { count } = await supabase
        .from("whatsapp_message_queue")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaignId)
        .in("status", ["scheduled", "queued"]);

      if (count === 0) {
        // Get campaign lead_id before completing
        const { data: campaignData } = await supabase
          .from("whatsapp_campaigns")
          .select("lead_id, lead_previous_status")
          .eq("id", campaignId)
          .eq("status", "running")
          .maybeSingle();

        await supabase
          .from("whatsapp_campaigns")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", campaignId)
          .eq("status", "running");
        console.log(`✅ Campaign ${campaignId} completed (no remaining messages after reply)`);

        // Move lead back from Copiloto Ativo to Atendimento
        if (campaignData?.lead_id) {
          const { data: lead } = await supabase
            .from("leads")
            .select("status")
            .eq("id", campaignData.lead_id)
            .single();

          if (lead && (lead as { status: string }).status === "awaiting_docs") {
            const restoreStatus = (campaignData as any).lead_previous_status || "info_sent";
            const restoreLabel = restoreStatus === "info_sent" ? "Atendimento" : restoreStatus;

            await supabase
              .from("leads")
              .update({ status: restoreStatus, updated_at: new Date().toISOString() })
              .eq("id", campaignData.lead_id);

            await supabase.from("lead_interactions").insert({
              lead_id: campaignData.lead_id,
              interaction_type: "status_change",
              old_status: "awaiting_docs",
              new_status: restoreStatus,
              notes: `Cadência concluída — lead voltou para ${restoreLabel}`,
            });
            console.log(`Lead ${campaignData.lead_id} restored to ${restoreStatus} after cadence completion`);
          }
        }
      }
    } catch (err) {
      await logError(supabase, "completeCampaign", err, { campaignId });
    }
  }

  // Register reply per-phone per-campaign (deduplicated)
  // Track which campaigns got a NEW reply (not a duplicate)
  const newReplyCampaignIds: string[] = [];
  for (const campaignId of campaignIds) {
    try {
      // Check if this phone already replied to this campaign
      const { data: existing } = await supabase
        .from("whatsapp_lead_replies")
        .select("phone")
        .eq("phone", phone)
        .eq("campaign_id", campaignId)
        .maybeSingle();

      if (!existing) {
        // New unique reply - insert it
        await supabase
          .from("whatsapp_lead_replies")
          .upsert(
            { phone, campaign_id: campaignId, replied_at: new Date().toISOString() },
            { onConflict: "phone,campaign_id" }
          );
        newReplyCampaignIds.push(campaignId);
      }
    } catch (err) {
      await logError(supabase, "registerReply", err, { phone, campaignId });
    }
  }
  console.log(`📝 Registered ${newReplyCampaignIds.length} NEW reply(ies) for ${phone} (${campaignIds.length} campaign(s) checked)`);

  // Update campaign reply counts ONLY for new replies
  for (const campaignId of newReplyCampaignIds) {
    try {
      const { data: campaign } = await supabase
        .from("whatsapp_campaigns")
        .select("reply_count")
        .eq("id", campaignId)
        .single();

      if (campaign) {
        await supabase
          .from("whatsapp_campaigns")
          .update({ reply_count: ((campaign as { reply_count: number }).reply_count || 0) + 1 })
          .eq("id", campaignId);
      }
    } catch (err) {
      await logError(supabase, "updateReplyCount", err, { campaignId });
    }
  }

  // Update daily stats reply_count ONLY if there was at least one new reply
  if (newReplyCampaignIds.length > 0) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: stats } = await supabase
        .from("whatsapp_daily_stats")
        .select("*")
        .eq("broker_id", firstMsg.broker_id)
        .eq("date", today)
        .maybeSingle();

      if (stats) {
        await supabase
          .from("whatsapp_daily_stats")
          .update({ reply_count: ((stats as { reply_count: number }).reply_count || 0) + 1 })
          .eq("id", (stats as { id: string }).id);
      }
    } catch (err) {
      await logError(supabase, "updateDailyReplyStats", err, { broker_id: firstMsg.broker_id });
    }
  }
}

// ========================= OPT-OUT PROCESSING =========================

async function processOptout(
  supabase: SupabaseClient,
  phone: string,
  keyword: string,
  instanceName?: string
): Promise<void> {
  console.log(`🛑 Opt-out detected from ${phone}: "${keyword}"`);
  const phoneVariants = getPhoneVariants(phone);

  try {
    await supabase
      .from("whatsapp_optouts")
      .upsert({
        phone,
        reason: `Auto-detected keyword: "${keyword}"`,
        detected_keyword: keyword,
        created_at: new Date().toISOString()
      }, { onConflict: "phone" });

    await supabase
      .from("whatsapp_message_queue")
      .update({
        status: "cancelled",
        error_message: `Opt-out: ${keyword}`,
        updated_at: new Date().toISOString()
      })
      .in("phone", phoneVariants)
      .in("status", ["queued", "scheduled"]);
  } catch (err) {
    await logError(supabase, "processOptout", err, { phone, keyword });
    return;
  }

  // Update daily stats optout_count
  if (instanceName) {
    try {
      const { data: inst } = await supabase
        .from("broker_whatsapp_instances")
        .select("broker_id")
        .eq("instance_name", instanceName)
        .maybeSingle();

      if (inst) {
        const today = new Date().toISOString().split("T")[0];
        const brokerId = (inst as { broker_id: string }).broker_id;
        const { data: stats } = await supabase
          .from("whatsapp_daily_stats")
          .select("*")
          .eq("broker_id", brokerId)
          .eq("date", today)
          .maybeSingle();

        if (stats) {
          await supabase
            .from("whatsapp_daily_stats")
            .update({ optout_count: ((stats as { optout_count: number }).optout_count || 0) + 1 })
            .eq("id", (stats as { id: string }).id);
        }
      }
    } catch (err) {
      await logError(supabase, "updateOptoutStats", err, { instanceName });
    }
  }
}

// ========================= CONVERSATION ARCHIVING =========================

async function getOrCreateCanonicalConversation(
  supabase: SupabaseClient,
  brokerId: string,
  phone: string,
  leadId?: string | null,
  sourceInstance?: string | null,
  senderName?: string | null,
): Promise<{ id: string } | null> {
  const canonicalPhone = getCanonicalPhone(phone);
  const canonicalNormalized = getCanonicalPhoneNormalized(phone);
  const phoneVariants = getPhoneVariants(phone);

  const { data: existing } = await supabase
    .from("conversations")
    .select("id, lead_id, ai_mode, created_at, phone, phone_normalized, source_instance, display_name, display_name_source")
    .eq("broker_id", brokerId)
    .in("phone_normalized", phoneVariants.map((value) => value.replace(/\D/g, "")))
    .order("created_at", { ascending: true });

  if (existing && existing.length > 0) {
    const primary = existing[0] as { id: string; lead_id: string | null; ai_mode: string; phone: string; phone_normalized: string; source_instance: string | null; display_name: string | null; display_name_source: string | null };
    const duplicateIds = existing.slice(1).map((conv: any) => conv.id);

    // Update display_name from senderName if not already set from a better source
    const shouldUpdateName = senderName && (!primary.display_name || primary.display_name_source === "phone");

    if (duplicateIds.length > 0) {
      await supabase.from("conversation_messages").update({ conversation_id: primary.id }).in("conversation_id", duplicateIds);

      const duplicateWithLead = existing.find((conv: any) => conv.lead_id);
      await supabase
        .from("conversations")
        .update({
          lead_id: primary.lead_id || leadId || duplicateWithLead?.lead_id || null,
          phone: canonicalPhone,
          phone_normalized: canonicalNormalized,
          ai_mode: primary.ai_mode === "ai_active" ? "ai_active" : "copilot",
          is_archived: false,
          source_instance: sourceInstance || primary.source_instance || null,
          ...(shouldUpdateName ? { display_name: senderName, display_name_source: "sender_name" } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", primary.id);

      await supabase.from("conversations").delete().in("id", duplicateIds);
    } else if (primary.phone !== canonicalPhone || primary.phone_normalized !== canonicalNormalized || (!primary.lead_id && leadId) || (sourceInstance && !primary.source_instance) || shouldUpdateName) {
      await supabase
        .from("conversations")
        .update({
          phone: canonicalPhone,
          phone_normalized: canonicalNormalized,
          lead_id: primary.lead_id || leadId || null,
          source_instance: sourceInstance || primary.source_instance || null,
          ...(shouldUpdateName ? { display_name: senderName, display_name_source: "sender_name" } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", primary.id);
    }

    return { id: primary.id };
  }

  // Resolve lead name for display if no senderName
  let resolvedDisplayName = senderName || null;
  let resolvedDisplaySource = senderName ? "sender_name" : null;

  if (!resolvedDisplayName) {
    // Try to find a lead name by phone
    const { data: matchedLead } = await supabase
      .from("leads")
      .select("name")
      .in("whatsapp", phoneVariants)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (matchedLead?.name) {
      resolvedDisplayName = matchedLead.name as string;
      resolvedDisplaySource = "lead";
    }
  }

  const { data: created, error: createError } = await supabase
    .from("conversations")
    .insert({
      broker_id: brokerId,
      lead_id: leadId || null,
      phone: canonicalPhone,
      phone_normalized: canonicalNormalized,
      ai_mode: "copilot",
      status: "active",
      source_instance: sourceInstance || null,
      ...(resolvedDisplayName ? { display_name: resolvedDisplayName, display_name_source: resolvedDisplaySource } : {}),
    })
    .select("id")
    .single();

  if (createError) {
    console.log("Could not create canonical conversation:", createError.message);
    return null;
  }

  return created as { id: string };
}

async function archiveMessageToConversation(
  supabase: SupabaseClient,
  phone: string,
  messageText: string,
  direction: "inbound" | "outbound",
  instanceName?: string,
  senderName?: string,
  sentBy: string = "human",
  uazapiMessageId?: string,
  messageType: string = "text",
  metadata?: Record<string, unknown>,
  overrideBrokerId?: string,
  sourceInstance?: string | null,
): Promise<{ conversationId?: string; brokerId?: string }> {
  if (!instanceName && !overrideBrokerId) return {};

  try {
    let brokerId = overrideBrokerId;

    if (!brokerId) {
      const { data: inst } = await supabase
        .from("broker_whatsapp_instances")
        .select("broker_id")
        .eq("instance_name", instanceName!)
        .maybeSingle();

      if (!inst) return {};
      brokerId = (inst as { broker_id: string }).broker_id;
    }

    // Only use senderName for display_name on inbound messages to avoid overwriting with broker's own name
    const displaySenderName = direction === "inbound" ? senderName : undefined;
    const conv = await getOrCreateCanonicalConversation(supabase, brokerId!, phone, undefined, sourceInstance, displaySenderName);
    if (!conv) return {};

    const enrichedMeta = { ...(metadata || {}), source_instance: sourceInstance || "personal" };

    // Deduplicate outbound messages: if this message was already saved by inbox-send-message, skip insert
    if (direction === "outbound" && uazapiMessageId) {
      const { data: existing } = await supabase
        .from("conversation_messages")
        .select("id")
        .eq("conversation_id", (conv as { id: string }).id)
        .eq("uazapi_message_id", uazapiMessageId)
        .limit(1)
        .maybeSingle();

      if (existing) {
        console.log(`⏭️ Outbound message already exists (uazapi_id=${uazapiMessageId}), skipping duplicate insert`);
        return { conversationId: (conv as { id: string }).id, brokerId };
      }
    }

    await supabase.from("conversation_messages").insert({
      conversation_id: (conv as { id: string }).id,
      direction,
      content: messageText || (messageType === "image" ? "Foto" : messageType === "audio" ? "Áudio" : messageType === "video" ? "Vídeo" : messageType === "document" ? "Documento" : "[Mídia]"),
      message_type: messageType,
      metadata: enrichedMeta,
      sender_name: senderName,
      sent_by: sentBy,
      status: "delivered",
      uazapi_message_id: uazapiMessageId,
    });

    console.log(`📨 Archived ${direction} message to conversation ${(conv as { id: string }).id}`);
    return { conversationId: (conv as { id: string }).id, brokerId };
  } catch (err) {
    console.error("Error archiving message:", err);
    return {};
  }
}

// ========================= UAZAPI SEND =========================

const UAZAPI_INSTANCE_URL = Deno.env.get("UAZAPI_INSTANCE_URL") || "";
const UAZAPI_TOKEN = Deno.env.get("UAZAPI_TOKEN") || "";

function formatPhoneForUAZAPI(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
}

async function sendViaUAZAPI(
  instanceToken: string | null,
  phone: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const cleanPhone = formatPhoneForUAZAPI(phone);
  const token = instanceToken || UAZAPI_TOKEN;

  let baseUrl = UAZAPI_INSTANCE_URL.replace(/\/$/, "");
  try { baseUrl = new URL(baseUrl).origin; } catch { /* keep */ }

  const endpoints = ["/send/text", "/chat/send/text"];
  const authHeaders = [
    { token },
    { admintoken: token },
    { apikey: token },
    { "x-api-key": token },
    { Authorization: `Bearer ${token}` },
  ];

  for (const endpoint of endpoints) {
    for (const authHeader of authHeaders) {
      try {
        const res = await fetch(`${baseUrl}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify({ number: cleanPhone, text }),
        });
        if (res.status === 401 || res.status === 404) { await res.text(); continue; }
        const responseText = await res.text();
        if (!res.ok) return { success: false, error: `HTTP ${res.status}: ${responseText}` };
        let result: Record<string, unknown> = {};
        try { result = JSON.parse(responseText); } catch { /* ok */ }
        if (result.error) return { success: false, error: String(result.error) };
        const messageId = String(result.id || result.messageid || (result.key as Record<string, unknown>)?.id || "");
        return { success: true, messageId };
      } catch (err) {
        console.warn(`⚠️ Auto-send fail ${endpoint}:`, (err as Error).message);
        continue;
      }
    }
  }
  return { success: false, error: "Todos os endpoints falharam" };
}

// ========================= TYPING INDICATOR =========================

async function sendTypingPresence(
  instanceToken: string | null,
  phone: string
): Promise<void> {
  const cleanPhone = formatPhoneForUAZAPI(phone);
  const token = instanceToken || UAZAPI_TOKEN;
  let baseUrl = UAZAPI_INSTANCE_URL.replace(/\/$/, "");
  try { baseUrl = new URL(baseUrl).origin; } catch { /* keep */ }

  // Try common UAZAPI presence endpoints
  const endpoints = ["/chat/presence", "/presence"];
  for (const endpoint of endpoints) {
    try {
      await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", token: token || "" },
        body: JSON.stringify({ number: cleanPhone, presence: "composing" }),
      });
      return; // sent successfully or at least attempted
    } catch { continue; }
  }
}

function calculateTypingDelay(text: string): number {
  // Average human types ~40 words/min on mobile ≈ ~200 chars/min ≈ 3.3 chars/sec
  // We simulate a fast typer: ~6 chars/sec, with min 3s and max 25s
  const chars = text.length;
  const baseDelay = Math.ceil(chars / 6) * 1000;
  return Math.max(3000, Math.min(baseDelay, 25000));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ========================= AUTO RESPONSE (AI PILOT) =========================

async function handleAutoResponse(
  supabase: SupabaseClient,
  brokerId: string,
  phone: string,
  phoneNormalized: string,
  conversationId: string,
  senderName?: string
): Promise<void> {
  // ✅ Piloto Automático REATIVADO

  try {
    // 1. Check conversation ai_mode
    const { data: conv } = await supabase
      .from("conversations")
      .select("ai_mode, lead_id, last_message_at")
      .eq("id", conversationId)
      .single();

    if (!conv || conv.ai_mode !== "ai_active") return;

    // 2. Rate limit: skip if AI sent a message < 30s ago (prevent loops)
    const { data: lastAiMsg } = await supabase
      .from("conversation_messages")
      .select("created_at")
      .eq("conversation_id", conversationId)
      .eq("direction", "outbound")
      .eq("sent_by", "ai")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastAiMsg) {
      const lastAiTime = new Date(lastAiMsg.created_at).getTime();
      if (Date.now() - lastAiTime < 30000) {
        console.log("⏳ Auto-response rate limited (< 30s since last AI message)");
        return;
      }
    }

    // 3. Check broker instance is connected
    const { data: instance } = await supabase
      .from("broker_whatsapp_instances")
      .select("instance_name, instance_token, status, working_hours_start, working_hours_end")
      .eq("broker_id", brokerId)
      .maybeSingle();

    if (!instance || instance.status !== "connected") {
      console.log("⚠️ Auto-response skipped: instance not connected");
      return;
    }

    // 4. Check working hours (UTC-3)
    if (instance.working_hours_start && instance.working_hours_end) {
      const nowBR = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const hhmm = `${String(nowBR.getUTCHours()).padStart(2, "0")}:${String(nowBR.getUTCMinutes()).padStart(2, "0")}`;
      if (hhmm < instance.working_hours_start || hhmm > instance.working_hours_end) {
        console.log(`⏰ Auto-response skipped: outside working hours (${hhmm})`);
        return;
      }
    }

    // 5. Check opt-out
    const phoneVars = getPhoneVariants(phone);
    const { data: optout } = await supabase
      .from("whatsapp_optouts")
      .select("phone")
      .in("phone", phoneVars)
      .maybeSingle();

    if (optout) {
      console.log("🛑 Auto-response skipped: phone is opted out");
      return;
    }

    // 6. Get copilot config
    const { data: copilotConfig } = await supabase
      .from("copilot_configs")
      .select("*")
      .eq("broker_id", brokerId)
      .eq("is_active", true)
      .maybeSingle();

    if (!copilotConfig) {
      console.log("⚠️ Auto-response skipped: no active copilot config");
      return;
    }

    // 7. Get broker name
    const { data: broker } = await supabase
      .from("brokers")
      .select("name")
      .eq("id", brokerId)
      .maybeSingle();
    const brokerName = broker?.name || "o corretor";
    
    // Detect gender from first name (common Portuguese female name endings)
    const firstName = brokerName.split(" ")[0].toLowerCase();
    const femaleEndings = ["a", "e", "ane", "ene", "ine", "one", "une", "ely", "eli", "ali", "ele", "ile"];
    const maleExceptions = ["luca", "josue", "andre", "dante", "jorge", "felipe", "guilherme", "henrique", "vicente", "leopolde"];
    const femaleNames = ["kely", "kelly", "monique", "alice", "ines", "raquel", "mabel", "carmen", "suelen", "miriam", "lilian", "vivian", "marian", "karen", "helen"];
    
    const isFemale = femaleNames.includes(firstName) || 
      (!maleExceptions.includes(firstName) && femaleEndings.some(e => firstName.endsWith(e)));
    
    const brokerArticle = isFemale ? "a" : "o";
    const brokerArticleCap = isFemale ? "A" : "O";
    const brokerPrep = isFemale ? "da" : "do";
    const brokerPrepPro = isFemale ? "pra" : "pro";
    const brokerPronoun = isFemale ? "ela" : "ele";

    // 8. Get last 10 messages for context
    const { data: recentMsgs } = await supabase
      .from("conversation_messages")
      .select("direction, content, sent_by, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(10);

    // 9. Get lead context
    let leadContext: Record<string, string> = {};
    if (conv.lead_id) {
      const { data: lead } = await supabase
        .from("leads")
        .select("name, status, notes, project_id, lead_origin")
        .eq("id", conv.lead_id)
        .maybeSingle();

      if (lead) {
        let projectName = "";
        let projectAiPrompt = "";
        if (lead.project_id) {
          const { data: proj } = await supabase
            .from("projects").select("name, ai_prompt").eq("id", lead.project_id).maybeSingle();
          projectName = proj?.name || "";
          projectAiPrompt = proj?.ai_prompt || "";
        }
        leadContext = {
          name: lead.name || senderName || "Não informado",
          status: lead.status || "Não informado",
          project: projectName || "Não informado",
          origin: lead.lead_origin || "Não informado",
          notes: lead.notes || "Nenhuma",
          projectAiPrompt: projectAiPrompt,
        };
      }
    }
    if (!leadContext.name) leadContext.name = senderName || "Lead";

    // 10. Build AI prompt
    const personalityMap: Record<string, string> = {
      formal: "Seja formal, profissional e direto ao ponto.",
      consultivo: "Seja consultivo, empático e estratégico. Guie o cliente com perguntas inteligentes.",
      agressivo: "Seja persuasivo e orientado ao fechamento. Use gatilhos mentais de urgência e escassez.",
      tecnico: "Seja técnico e informativo. Apresente dados e especificações com precisão.",
      premium: "Seja sofisticado e exclusivo. Transmita luxo e exclusividade em cada palavra.",
    };

    const personality = personalityMap[copilotConfig.personality] || personalityMap.consultivo;
    const emojiRule = copilotConfig.allow_emojis !== false ? "Use emojis com moderação para humanizar." : "Não use emojis.";

    // Check if broker has a custom system prompt
    const customBase = copilotConfig.custom_system_prompt as string | null;

    // Project AI prompt injection
    const projectAiBlock = leadContext.projectAiPrompt
      ? `\nINFORMAÇÕES DO EMPREENDIMENTO:\n${leadContext.projectAiPrompt}`
      : "";

    let systemPrompt: string;

    if (customBase) {
      // Use custom prompt with variable replacement
      systemPrompt = customBase
        .replace(/\{personalidade\}/g, personality)
        .replace(/\{regra_emojis\}/g, emojiRule)
        .replace(/\{nivel_persuasao\}/g, String(copilotConfig.persuasion_level || 50))
        .replace(/\{nome_corretor\}/g, brokerName)
        .replace(/\{contexto_lead\}/g, `\nCONTEXTO DO LEAD:\n- Nome: ${leadContext.name}\n- Status no funil: ${leadContext.status || "Não informado"}\n- Empreendimento: ${leadContext.project || "Não informado"}\n- Origem: ${leadContext.origin || "Não informado"}\n- Notas: ${leadContext.notes || "Nenhuma"}`)
        .replace(/\{contexto_empreendimento\}/g, projectAiBlock);

      // Append WhatsApp-specific rules that must always be present
      systemPrompt += `\n\nREGRAS WHATSAPP (obrigatórias):
- Fale em nome ${brokerPrep} especialista ${brokerName}, como se fosse ${brokerPronoun}
- NUNCA diga que é uma IA, assistente virtual ou bot
- Seja MUITO conciso: máximo 2-3 frases curtas por mensagem (estilo WhatsApp real)
- Use os artigos corretos: "${brokerArticle} ${brokerName}", "${brokerPrep} ${brokerName}"
- NUNCA prometa enviar arquivos (PDFs, tabelas, fotos)
- Se não souber algo, redirecione: "Essa informação ${brokerArticle} especialista ${brokerName} pode te passar com mais detalhes! Quer agendar um bate-papo?"
- Você SÓ pode enviar texto via WhatsApp`;
    } else {
      // Default prompt (original behavior)
      systemPrompt = `Você é o assistente ${brokerPrep} especialista ${brokerName}. Você ajuda ${brokerArticle} ${brokerName} respondendo leads via WhatsApp.
${personality}
${emojiRule}
Nível de persuasão: ${copilotConfig.persuasion_level || 50}/100.
Nível de objetividade: ${copilotConfig.objectivity_level || 50}/100.

REGRAS CRÍTICAS:
- Responda SEMPRE em português do Brasil
- Seja MUITO conciso: máximo 2-3 frases curtas por mensagem (estilo WhatsApp real)
- NUNCA diga que é uma IA, assistente virtual ou bot
- Fale em nome ${brokerPrep} especialista ${brokerName}, como se fosse ${brokerPronoun}
- Sempre se refira ${brokerArticle} ${brokerName} como "especialista" (ex: "${brokerArticleCap} especialista ${brokerName}")
- Use os artigos corretos: "${brokerArticle} ${brokerName}", "${brokerPrep} ${brokerName}", "${brokerPrepPro} ${brokerName}"
- Foque em avançar o lead no funil de vendas
- Se o lead demonstrar objeção, trate com empatia
- Responda de forma natural e humana, como uma conversa real de WhatsApp
- Use frases curtas e informais (como uma pessoa digitando no celular)
- NÃO envie parágrafos longos, listas ou textos formatados
${copilotConfig.use_mental_triggers ? "- Use gatilhos mentais sutis (escassez, urgência, prova social)" : ""}
${copilotConfig.incentive_visit ? "- Incentive visitas ao empreendimento quando fizer sentido" : ""}
${copilotConfig.incentive_call ? "- Sugira ligações quando o lead parecer interessado" : ""}

REGRA FUNDAMENTAL - NUNCA INVENTE INFORMAÇÕES:
- Você NÃO tem acesso a informações detalhadas do empreendimento (preços, metragem, plantas, valores de condomínio, etc.)
- Se o cliente perguntar algo que você NÃO sabe (preço, disponibilidade, detalhes técnicos, financiamento, etc.), NÃO invente
- Quando não souber a resposta, diga algo como: "Essa informação ${brokerArticle} especialista ${brokerName} pode te passar com mais detalhes! Quer agendar um bate-papo? Pode ser por ligação, videochamada ou presencial 😊"
- Sempre ofereça as 3 opções: ligação, videochamada ou presencial
- Você PODE conversar naturalmente, cumprimentar, demonstrar interesse e fazer perguntas ao lead

REGRA ABSOLUTA - NUNCA PROMETA ENVIAR ARQUIVOS:
- Você NÃO pode enviar PDFs, tabelas de preços, fotos, vídeos, documentos ou qualquer arquivo
- NUNCA diga "vou enviar", "vou mandar", "segue o PDF", "segue a tabela", "vou te passar o material"
- Se o cliente pedir um arquivo/PDF/tabela/material, responda: "Para te enviar esse material, vou pedir ${brokerPrepPro} especialista ${brokerName} te mandar diretamente! Quer agendar um bate-papo rápido com ${brokerPronoun}? Pode ser por ligação, videochamada ou presencial 😊"
- Você SÓ pode enviar texto via WhatsApp, nada mais
${projectAiBlock}

CONTEXTO DO LEAD:
- Nome: ${leadContext.name}
- Status no funil: ${leadContext.status || "Não informado"}
- Empreendimento: ${leadContext.project || "Não informado"}
- Origem: ${leadContext.origin || "Não informado"}
- Notas: ${leadContext.notes || "Nenhuma"}`;
    }

    // Inject copilot_mode instruction
    const copilotMode = (copilotConfig.copilot_mode as string) || "autonomo";
    if (copilotMode === "assistente") {
      systemPrompt += `\n\nMODO DE ATUAÇÃO: Você é o ASSISTENTE do corretor ${brokerName}. Apresente-se como assistente. Ex: "Oi! Sou assistente ${brokerPrep} ${brokerName} e vou te ajudar com as informações." Você pode revelar que é um assistente digital, mas sempre direcione para o corretor quando necessário.`;
    } else {
      systemPrompt += `\n\nMODO DE ATUAÇÃO: Você está agindo COMO SE FOSSE ${brokerPronoun} ${brokerName}. O cliente não sabe que é uma IA. Fale em primeira pessoa como se fosse ${brokerPronoun}. NUNCA revele que é uma IA ou assistente virtual.`;
    }

    // Build messages array from conversation history
    const aiMessages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    if (recentMsgs && recentMsgs.length > 0) {
      const sorted = [...recentMsgs].reverse();
      for (const m of sorted) {
        aiMessages.push({
          role: m.direction === "inbound" ? "user" : "assistant",
          content: m.content || "[Mídia]",
        });
      }
    }

    // 11. Call AI Gateway (non-streaming)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("❌ Auto-response: LOVABLE_API_KEY not configured");
      return;
    }

    console.log(`🤖 Generating auto-response for conversation ${conversationId}...`);

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
        max_tokens: 200, // Keep responses short
      }),
    });

    if (!aiResponse.ok) {
      console.error(`❌ AI gateway error: ${aiResponse.status}`);
      return;
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content;

    if (!responseText || responseText.trim().length === 0) {
      console.error("❌ AI returned empty response");
      return;
    }

    // Post-generation safety: remove promises to send files
    let finalText = responseText.trim();
    const filePromisePatterns = [
      /vou (te )?(enviar|mandar|passar) (o |um |a )?(pdf|tabela|material|arquivo|documento|foto|vídeo|video|imagem|planta|book)/gi,
      /segue (o |a )?(pdf|tabela|material|arquivo|documento)/gi,
      /j[aá] te (envio|mando|passo) (o |a )?(pdf|tabela|material)/gi,
    ];
    for (const pattern of filePromisePatterns) {
      if (pattern.test(finalText)) {
        console.warn("⚠️ AI promised to send a file — replacing with fallback");
        finalText = `Para te enviar esse material, vou pedir ${brokerPrepPro} especialista ${brokerName} te mandar diretamente! Quer agendar um bate-papo rápido com ${brokerPronoun}? Pode ser por ligação, videochamada ou presencial 😊`;
        break;
      }
    }

    // 12. Simulate typing: send "composing" presence + wait proportional delay
    const typingDelay = calculateTypingDelay(finalText);
    console.log(`⌨️ Simulating typing for ${typingDelay / 1000}s (${finalText.length} chars)...`);
    
    try {
      await sendTypingPresence(instance.instance_token, phoneNormalized || phone);
    } catch { /* non-critical */ }
    
    await sleep(typingDelay);

    // 13. Send via UAZAPI
    const sendResult = await sendViaUAZAPI(
      instance.instance_token,
      phoneNormalized || phone,
      finalText
    );

    if (!sendResult.success) {
      console.error(`❌ Auto-response send failed: ${sendResult.error}`);
      return;
    }

    // 14. Save message in conversation
    await supabase.from("conversation_messages").insert({
      conversation_id: conversationId,
      direction: "outbound",
      content: finalText,
      sent_by: "ai",
      message_type: "text",
      metadata: { source_instance: sourceInstance || "personal" },
      status: "sent",
      uazapi_message_id: sendResult.messageId || null,
    });

    // 15. Register in lead_interactions
    if (conv.lead_id) {
      await supabase.from("lead_interactions").insert({
        lead_id: conv.lead_id,
        interaction_type: "whatsapp_enviada",
        broker_id: brokerId,
        notes: `[IA Auto] ${finalText.substring(0, 180)}`,
        channel: "whatsapp",
      }).catch(() => {});
    }

    // 16. Increment copilot count
    await supabase.rpc("increment_copilot_count", { _conversation_id: conversationId }).catch(() => {});

    console.log(`✅ Auto-response sent for conversation ${conversationId}: "${finalText.substring(0, 60)}..."`);

  } catch (err) {
    console.error("❌ handleAutoResponse error:", err);
  }
}

// ========================= GLOBAL INSTANCE ROUTING =========================

async function isGlobalInstance(supabase: SupabaseClient, instanceName: string): Promise<boolean> {
  const { data } = await supabase
    .from("global_whatsapp_config")
    .select("id")
    .eq("instance_name", instanceName)
    .maybeSingle();
  return !!data;
}

async function handleGlobalInstanceMessage(
  supabase: SupabaseClient,
  phone: string,
  messageText: string,
  direction: "inbound" | "outbound",
  instanceName: string,
  senderName?: string,
  sentBy: string = "lead",
  uazapiMessageId?: string,
  messageType: string = "text",
  metadata?: Record<string, unknown>,
): Promise<{ brokerId?: string; conversationId?: string }> {
  const phoneVariants = getPhoneVariants(phone);

  // Check if lead already has a broker
  const { data: existingLead } = await supabase
    .from("leads")
    .select("id, broker_id, name")
    .in("whatsapp", phoneVariants)
    .not("broker_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingLead && existingLead.broker_id) {
    // Case A: Lead already has broker → route to them
    console.log(`🔀 Global msg from ${phone} → routed to existing broker ${existingLead.broker_id}`);
    const result = await archiveMessageToConversation(
      supabase, phone, messageText, direction, undefined, senderName, sentBy,
      uazapiMessageId, messageType, metadata,
      existingLead.broker_id as string, "global"
    );
    return { brokerId: existingLead.broker_id as string, conversationId: result.conversationId };
  }

  // Case B: No broker → distribute via whatsapp_global roleta (NO lead creation yet)
  console.log(`🎰 Global msg from ${phone} → entering roleta distribution (pending attendance)`);

  // Check if there's already a global conversation for this phone
  const canonicalPhoneNorm = getCanonicalPhoneNormalized(phone);
  const { data: existingConv } = await supabase
    .from("conversations")
    .select("id, broker_id")
    .eq("phone_normalized", canonicalPhoneNorm)
    .eq("source_instance", "global")
    .eq("attendance_started", false)
    .maybeSingle();

  if (existingConv) {
    // Already pending — just archive the new message to the existing conversation
    console.log(`📥 Additional msg for pending global conv ${existingConv.id}`);
    const result = await archiveMessageToConversation(
      supabase, phone, messageText, direction, undefined, senderName, sentBy,
      uazapiMessageId, messageType, metadata, existingConv.broker_id as string, "global"
    );
    return { brokerId: existingConv.broker_id as string, conversationId: result.conversationId };
  }

  const { data: roleta } = await supabase
    .from("roletas")
    .select(`
      id, lider_id, tempo_reserva_minutos, ultimo_membro_ordem_atribuida, modo_distribuicao,
      membros:roletas_membros(id, corretor_id, ordem, status_checkin, ativo)
    `)
    .eq("ativa", true)
    .eq("tipo_origem", "whatsapp_global")
    .limit(1)
    .maybeSingle();

  if (!roleta) {
    console.warn("⚠️ No active whatsapp_global roleta found. Message will not be distributed.");
    return {};
  }

  const modoDistribuicao = (roleta as any).modo_distribuicao || "fila";
  const membros = ((roleta as any).membros || [])
    .filter((m: any) => m.ativo && m.status_checkin)
    .sort((a: any, b: any) => a.ordem - b.ordem);

  let assignedBrokerId: string;

  if (modoDistribuicao === "disputa") {
    // Disputa mode: assign to leader as placeholder; all checked-in brokers will see it
    assignedBrokerId = roleta.lider_id as string;
    console.log(`🏁 Disputa mode: assigning to leader ${assignedBrokerId} as placeholder`);
  } else {
    // Fila mode: round-robin to specific broker
    if (membros.length === 0) {
      console.log(`⚠️ No checked-in members → fallback to leader ${roleta.lider_id}`);
      assignedBrokerId = roleta.lider_id as string;
    } else {
      const lastOrdem = (roleta.ultimo_membro_ordem_atribuida as number) || 0;
      const nextMembro = membros.find((m: any) => m.ordem > lastOrdem) || membros[0];
      assignedBrokerId = nextMembro.corretor_id;
      await supabase.from("roletas").update({ ultimo_membro_ordem_atribuida: nextMembro.ordem }).eq("id", roleta.id);
    }
  }

  // Archive message — creates conversation with source_instance='global', attendance_started=false (default)
  const result = await archiveMessageToConversation(
    supabase, phone, messageText, direction, undefined, senderName, sentBy,
    uazapiMessageId, messageType, metadata, assignedBrokerId, "global"
  );

  // Set roleta_modo and timeout fields on the conversation
  if (result.conversationId) {
    const now = new Date();
    const timeoutAtivo = (roleta as any).timeout_ativo ?? true;
    const tempoReserva = (roleta as any).tempo_reserva_minutos || 10;
    const shouldSetExpiration = timeoutAtivo && modoDistribuicao === "fila";
    const reservaExpira = shouldSetExpiration
      ? new Date(now.getTime() + tempoReserva * 60 * 1000).toISOString()
      : null;

    await supabase.from("conversations").update({
      roleta_modo: modoDistribuicao,
      atribuido_em: now.toISOString(),
      reserva_expira_em: reservaExpira,
    }).eq("id", result.conversationId);
  }

  // Log distribution (no lead_id yet)
  await supabase.from("roletas_log").insert({
    roleta_id: roleta.id,
    para_corretor_id: assignedBrokerId,
    acao: "atribuicao_inicial",
    motivo: `Distribuição via roleta WhatsApp Global - modo ${modoDistribuicao} (pendente atendimento)`,
  });

  // Notify assigned broker via WhatsApp (fila mode only, no lead data)
  if (modoDistribuicao === "fila") {
    try {
      const { data: globalCfg } = await supabase
        .from("global_whatsapp_config")
        .select("instance_token")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: brokerData } = await supabase
        .from("brokers")
        .select("whatsapp")
        .eq("id", assignedBrokerId)
        .single();

      if (globalCfg?.instance_token && brokerData?.whatsapp) {
        const envUrl = Deno.env.get("UAZAPI_INSTANCE_URL") || "";
        let baseUrl: string;
        try { baseUrl = new URL(envUrl).origin; } catch { baseUrl = envUrl.replace(/\/[^\/]+\/?$/, ""); }

        if (baseUrl) {
          const cleanPhone = (brokerData.whatsapp as string).replace(/\D/g, "");
          const alertMsg = `🔔 *Nova conversa no Plantão*\n\nVocê tem um novo contato aguardando atendimento na aba "Novos" do Plantão.\n\n⚡ Acesse o CRM para iniciar o atendimento.`;

          await fetch(`${baseUrl}/send/text`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "token": globalCfg.instance_token as string },
            body: JSON.stringify({ number: cleanPhone, text: alertMsg }),
          });
          console.log(`📲 WhatsApp notification sent to broker ${assignedBrokerId} (fila mode)`);
        }
      }
    } catch (notifyErr) {
      console.error("WhatsApp fila notification failed (non-critical):", notifyErr);
    }
  }

  console.log(`✅ Global msg distributed (${modoDistribuicao}): phone=${phone} → broker=${assignedBrokerId} (pending attendance)`);
  return { brokerId: assignedBrokerId, conversationId: result.conversationId };
}

async function createGlobalLead(
  supabase: SupabaseClient,
  phone: string,
  senderName: string | undefined,
  brokerId: string,
  roletaId: string,
): Promise<string | null> {
  const canonicalPhone = getCanonicalPhone(phone);
  const phoneVariants = getPhoneVariants(phone);

  // Check for existing lead with this phone (any broker)
  const { data: existingLead } = await supabase
    .from("leads")
    .select("id, broker_id")
    .in("whatsapp", phoneVariants)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingLead) {
    // Update existing lead with broker assignment
    await supabase.from("leads").update({
      broker_id: brokerId,
      lead_origin: "whatsapp_plantao",
      source: "whatsapp_global",
      roleta_id: roletaId,
      status_distribuicao: "atribuicao_inicial",
      atribuido_em: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", existingLead.id);

    // Try unify
    const { data: unifiedId } = await supabase.rpc("unify_lead", { _new_lead_id: existingLead.id });
    return (unifiedId as string) || (existingLead.id as string);
  }

  // Create new lead
  const { data: newLead, error } = await supabase
    .from("leads")
    .insert({
      name: senderName || canonicalPhone,
      whatsapp: canonicalPhone,
      source: "whatsapp_global",
      lead_origin: "whatsapp_plantao",
      broker_id: brokerId,
      roleta_id: roletaId,
      status: "new",
      status_distribuicao: "atribuicao_inicial",
      atribuido_em: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("❌ Failed to create global lead:", error.message);
    return null;
  }

  // Insert attribution
  await supabase.from("lead_attribution").insert({
    lead_id: (newLead as any).id,
    landing_page: "whatsapp_global",
    utm_source: "whatsapp",
    utm_medium: "plantao",
  });

  // Try unify
  const { data: unifiedId } = await supabase.rpc("unify_lead", { _new_lead_id: (newLead as any).id });
  return (unifiedId as string) || (newLead as any).id;
}

// ========================= EVENT HANDLERS =========================

async function handleIncomingMessage(
  supabase: SupabaseClient,
  payload: UAZAPIv2Payload
): Promise<Response> {
  const msg = payload.message;
  const instanceName = payload.instanceName || payload.instance;

  if (!msg) {
    console.log("No message object in payload, skipping");
    return new Response(JSON.stringify({ success: true, event: "messages", skipped: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Skip group messages
  if (msg.isGroup) {
    return new Response(JSON.stringify({ success: true, event: "messages", skipped: "group" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const chatid = msg.chatid;
  if (!chatid || chatid.includes("@g.us")) {
    return new Response(JSON.stringify({ success: true, event: "messages", skipped: "no_chatid_or_group" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Resolve phone number (LID fallback)
  let phone = extractPhoneFromChatId(chatid);
  if (chatid.includes("@lid") && msg.sender_pn) {
    phone = extractPhoneFromChatId(msg.sender_pn);
    console.log(`📱 LID fallback: chatid="${chatid}" → sender_pn="${msg.sender_pn}" → phone="${phone}"`);
  }

  let mediaMetadata = extractMediaMetadata(msg, payload);
  const messageText = msg.text || mediaMetadata.caption || "";
  const resolvedMessageType = inferMessageType(messageText, typeof mediaMetadata.mime_type === "string" ? mediaMetadata.mime_type : undefined, typeof mediaMetadata.raw_type === "string" ? mediaMetadata.raw_type : undefined);
  if (resolvedMessageType !== "text") {
    mediaMetadata = await persistInboundMediaIfNeeded(supabase, payload, phone, resolvedMessageType, mediaMetadata);
  }

  // Extract Facebook CTWA / ad referral context
  const adReferral = extractAdReferralContext(msg, payload);
  if (adReferral) {
    (mediaMetadata as Record<string, unknown>).ad_referral = adReferral;
    console.log(`📢 Ad referral detected: source=${adReferral.source}, headline="${(adReferral.headline || "").substring(0, 60)}"`);
  }

  // Resolve sender name: UAZAPI v2 uses senderName, older versions use pushName, fallback to chat.wa_name
  const chatObj = (payload as any).chat;
  const resolvedSenderName = msg.senderName || msg.pushName || chatObj?.wa_name || chatObj?.name || undefined;

  const direction = msg.fromMe ? "outbound" : "inbound";
  console.log(`📞 ${direction} DM: chatid="${chatid}" | phone="${phone}" | type="${resolvedMessageType}" | sender="${resolvedSenderName || '(unknown)'}" | text="${messageText.substring(0, 50)}"`);
  // Check if this is from the global WhatsApp instance
  let archiveResult: { conversationId?: string; brokerId?: string } = {};
  const isGlobal = instanceName ? await isGlobalInstance(supabase, instanceName) : false;

  if (isGlobal && !msg.fromMe) {
    // Global instance routing
    archiveResult = await handleGlobalInstanceMessage(
      supabase, phone, messageText, direction as "inbound" | "outbound",
      instanceName!, resolvedSenderName, "lead", msg.id, resolvedMessageType, mediaMetadata
    );
  } else if (isGlobal && msg.fromMe) {
    // Outbound from global — try to find which broker owns this lead
    const phoneVariants = getPhoneVariants(phone);
    const { data: lead } = await supabase
      .from("leads")
      .select("broker_id")
      .in("whatsapp", phoneVariants)
      .not("broker_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lead?.broker_id) {
      archiveResult = await archiveMessageToConversation(
        supabase, phone, messageText, "outbound", undefined, resolvedSenderName, "human",
        msg.id, resolvedMessageType, mediaMetadata, lead.broker_id as string, "global"
      );
    }
  } else {
    // Regular broker instance flow
    archiveResult = await archiveMessageToConversation(
      supabase, phone, messageText, direction as "inbound" | "outbound",
      instanceName, resolvedSenderName, msg.fromMe ? "human" : "lead", msg.id, resolvedMessageType, mediaMetadata
    );
  }

  // Skip further processing for outbound messages
  if (msg.fromMe) {
    return new Response(JSON.stringify({ success: true, event: "messages", archived: "outbound" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Find recent campaign messages for this phone
  const phoneVariants = getPhoneVariants(phone);
  const { data: recentMessages } = await supabase
    .from("whatsapp_message_queue")
    .select("campaign_id, broker_id")
    .in("phone", phoneVariants)
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(10);

  // Process reply (follow-up cancellation, stats) for both text and media
  if (recentMessages && recentMessages.length > 0) {
    await processReply(
      supabase,
      phone,
      recentMessages as Array<{ campaign_id: string | null; broker_id: string }>
    );
    console.log(`💬 Reply from ${phone} (${messageText ? "text" : "media"}) - follow-up cancellation processed`);
  }

  // If no text, we're done (media reply already processed above)
  if (!messageText) {
    console.log(`📎 Media reply from ${phone} processed (follow-ups cancelled if applicable)`);
    return new Response(JSON.stringify({ success: true, event: "messages", processed: "media_reply" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Text-based opt-out check (only if phone has campaign history)
  if (recentMessages && recentMessages.length > 0) {
    const detectedKeyword = detectOptout(messageText);
    if (detectedKeyword) {
      await processOptout(supabase, phone, detectedKeyword, instanceName);
    } else {
      console.log(`💬 Text reply from ${phone}: "${messageText.substring(0, 50)}..."`);
    }
  } else {
    console.log(`💬 Regular DM from ${phone} (no campaign history, skipping opt-out check)`);
  }

  // Trigger auto-response if ai_mode is active
  const autoResponseBrokerId = archiveResult.brokerId;
  const autoResponseConvId = archiveResult.conversationId;

  if (autoResponseBrokerId && autoResponseConvId) {
    handleAutoResponse(supabase, autoResponseBrokerId, getCanonicalPhone(phone), getCanonicalPhoneNormalized(phone), autoResponseConvId, resolvedSenderName)
      .catch(err => console.error("Auto-response background error:", err));
  } else if (instanceName && !isGlobal) {
    // Legacy fallback for broker instance
    const { data: inst } = await supabase
      .from("broker_whatsapp_instances")
      .select("broker_id")
      .eq("instance_name", instanceName)
      .maybeSingle();

    if (inst) {
      const brokerId = (inst as { broker_id: string }).broker_id;
      const convForAuto = await getOrCreateCanonicalConversation(supabase, brokerId, phone);
      if (convForAuto) {
        handleAutoResponse(supabase, brokerId, getCanonicalPhone(phone), getCanonicalPhoneNormalized(phone), convForAuto.id, resolvedSenderName)
          .catch(err => console.error("Auto-response background error:", err));
      }
    }
  }

  return new Response(JSON.stringify({ success: true, event: "messages" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleConnectionUpdate(
  supabase: SupabaseClient,
  payload: UAZAPIv2Payload
): Promise<Response> {
  const instanceName = payload.instanceName || payload.instance;
  if (!instanceName) {
    return new Response(JSON.stringify({ success: true, event: "connection.update", skipped: "no_instance" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const state = payload.connection?.state ||
    (payload.data as Record<string, unknown>)?.status as string | undefined;

  if (state) {
    const newStatus = state === "open" ? "connected" :
                     state === "connecting" ? "connecting" :
                     state === "close" ? "disconnected" : null;

    if (newStatus) {
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      if (newStatus === "connected") {
        updateData.connected_at = new Date().toISOString();
        updateData.last_seen_at = new Date().toISOString();
      }
      if (newStatus === "disconnected") {
        updateData.connected_at = null;
      }

      const { error } = await supabase
        .from("broker_whatsapp_instances")
        .update(updateData)
        .eq("instance_name", instanceName);

      if (error) {
        await logError(supabase, "connectionUpdate", error, { instanceName });
      }

      console.log(`Instance ${instanceName} status: ${newStatus}`);
    }
  }

  return new Response(JSON.stringify({ success: true, event: "connection.update" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleMessageStatusUpdate(
  supabase: SupabaseClient,
  payload: UAZAPIv2Payload
): Promise<Response> {
  const msg = payload.message;
  if (!msg) {
    return new Response(JSON.stringify({ success: true, event: "message.update", skipped: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const messageId = msg.id;
  const status = msg.status;

  if (messageId && status) {
    // Update whatsapp_message_queue status
    const { error } = await supabase
      .from("whatsapp_message_queue")
      .update({ updated_at: new Date().toISOString() })
      .eq("uazapi_message_id", messageId);

    if (error) {
      await logError(supabase, "messageStatusUpdate", error, { messageId });
    }

    // Update conversation_messages status
    await supabase
      .from("conversation_messages")
      .update({ status: status })
      .eq("uazapi_message_id", messageId);

    // When status is "read", reset unread_count on the conversation
    if (status === "read") {
      const { data: msgData } = await supabase
        .from("conversation_messages")
        .select("conversation_id")
        .eq("uazapi_message_id", messageId)
        .maybeSingle();

      if (msgData) {
        await supabase
          .from("conversations")
          .update({ unread_count: 0, status: "attending" })
          .eq("id", (msgData as { conversation_id: string }).conversation_id);
        console.log(`✅ Conversation ${(msgData as { conversation_id: string }).conversation_id} marked as read (synced from phone)`);
      }
    }

    console.log(`Message ${messageId} status: ${status}`);
  }

  return new Response(JSON.stringify({ success: true, event: "message.update" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ========================= ROUTES =========================

app.options("/*", (c) => c.json({}, 200, corsHeaders));

// Shared handler for webhook POST requests
async function handleWebhookPost(c: any) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    const payload = await c.req.json() as UAZAPIv2Payload;
    console.log("Webhook received:", JSON.stringify(payload, null, 2));

    const eventType = payload.EventType || payload.event;

    // Route to appropriate handler
    if (eventType === "messages" || eventType === "messages.upsert") {
      return await handleIncomingMessage(supabase, payload);
    }

    if (eventType === "connection" || eventType === "connection.update") {
      return await handleConnectionUpdate(supabase, payload);
    }

    if (eventType === "messages_update" || eventType === "message.update") {
      return await handleMessageStatusUpdate(supabase, payload);
    }

    // Unknown event
    console.log(`Unknown event: ${eventType}`);
    return c.json({ success: true, message: "Event received", event: eventType }, 200, corsHeaders);

  } catch (err) {
    await logError(supabase, "webhookMain", err);
    const error = err as Error;
    return c.json({ success: false, error: error.message }, 200, corsHeaders);
  }
}

// Route with path token validation (preferred)
app.post("/:token", async (c) => {
  const webhookSecret = Deno.env.get("UAZAPI_WEBHOOK_SECRET");
  if (webhookSecret) {
    const provided = c.req.param("token");
    if (provided !== webhookSecret) {
      console.warn("🚫 Webhook rejected: invalid path token");
      return c.json({ error: "Forbidden" }, 403, corsHeaders);
    }
  }
  return handleWebhookPost(c);
});

// Legacy route (backward compatible — validates instance token from body)
app.post("/", async (c) => {
  const webhookSecret = Deno.env.get("UAZAPI_WEBHOOK_SECRET");
  
  // First check if path-level secret is provided via headers
  let headerToken = c.req.header("x-webhook-secret") || c.req.header("token");
  if (headerToken && webhookSecret && headerToken === webhookSecret) {
    return handleWebhookPost(c);
  }

  // Peek at body to get the UAZAPI instance token
  let bodyToken: string | undefined;
  try {
    const cloned = c.req.raw.clone();
    const body = await cloned.json();
    bodyToken = body?.token;
  } catch { /* ignore parse errors */ }

  // Validate: body token must match a known instance token in DB
  if (bodyToken) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: knownInstance } = await supabase
      .from("broker_whatsapp_instances")
      .select("id")
      .eq("instance_token", bodyToken)
      .maybeSingle();

    if (knownInstance) {
      return handleWebhookPost(c);
    }

    // Also check global config
    const { data: globalConfig } = await supabase
      .from("global_whatsapp_config")
      .select("id")
      .eq("instance_token", bodyToken)
      .maybeSingle();

    if (globalConfig) {
      return handleWebhookPost(c);
    }
  }

  // If webhook secret is set, reject unknown tokens
  if (webhookSecret) {
    console.warn("🚫 Webhook request rejected: unknown instance token");
    return c.json({ error: "Forbidden" }, 403, corsHeaders);
  }

  // No secret configured — allow (open mode)
  return handleWebhookPost(c);
});

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() }, 200, corsHeaders);
});

Deno.serve(app.fetch);
