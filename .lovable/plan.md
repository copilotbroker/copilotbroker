

## Diagnóstico: Erro de Sincronização

### Causa raiz: CORS bloqueando a requisição

A requisição do preview (`https://...lovableproject.com`) está sendo bloqueada pelo CORS. O arquivo `_shared/security.ts` só permite 3 origens:
- `onovocondominio.com.br`
- `onovocondominio.lovable.app`
- `id-preview--...lovable.app`

O preview atual usa `lovableproject.com`, que não está na lista. O navegador bloqueia a resposta e o frontend recebe "Failed to fetch".

Isso não tem relação com trocar Cloud/Supabase em outro projeto — cada projeto é independente.

### Correção

**Arquivo: `supabase/functions/_shared/security.ts`**

Atualizar `ALLOWED_ORIGINS` para aceitar **qualquer** subdomínio `lovable.app` e `lovableproject.com` dinamicamente, em vez de uma lista hardcoded:

```typescript
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const isAllowed =
    origin === "https://onovocondominio.com.br" ||
    origin.endsWith(".lovable.app") ||
    origin.endsWith(".lovableproject.com");
  
  const allowedOrigin = isAllowed ? origin : "https://onovocondominio.com.br";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, ...",
  };
}
```

Isso corrige o sync-all e também previne futuros problemas de CORS em qualquer Edge Function que use esse shared helper.

### Arquivos alterados
- `supabase/functions/_shared/security.ts` — CORS dinâmico
- Todas as Edge Functions que importam `getCorsHeaders` serão beneficiadas automaticamente (redeploy necessário)

