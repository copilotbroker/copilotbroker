/**
 * Shared security utilities for Edge Functions.
 * - Dynamic CORS with origin validation
 * - Service role key auth for internal calls
 * - PII masking for logs
 */

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const isAllowed =
    origin === "https://onovocondominio.com.br" ||
    origin.endsWith(".lovable.app") ||
    origin.endsWith(".lovableproject.com");

  const allowedOrigin = isAllowed ? origin : "https://onovocondominio.com.br";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

export function validateServiceRoleKey(req: Request): boolean {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  return !!serviceKey && token === serviceKey;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "***";
  return digits.substring(0, 4) + "***" + digits.substring(digits.length - 3);
}
