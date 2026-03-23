

# Adicionar Meta Pixel ao Monaco (4261464794069997)

O Monaco é a única landing page sem rastreamento do Meta Pixel. Vou seguir o mesmo padrão já usado nas páginas GoldenView, NAU e Maurício Cardoso.

## Alterações

### 1. Meta Pixel no `<Helmet>` da página
**Arquivo: `src/pages/monaco/MonacoLandingPage.tsx`**

Adicionar dentro do `<Helmet>` o script do Facebook Pixel (init + PageView) e o noscript fallback, usando o pixel ID `4261464794069997`.

### 2. Disparo do evento Lead + CAPI no formulário
**Arquivo: `src/components/monaco/MonacoFormSection.tsx`**

Após o insert do lead no banco, adicionar:
- Disparo client-side: `fbq('track', 'Lead')` com `eventID` único
- Disparo server-side: chamada à edge function `meta-conversions-api` com `pixel_id: "4261464794069997"`, dados do usuário (phone + name hasheados no server), e o mesmo `eventID` para deduplicação

### 3. Registrar o pixel na edge function
**Arquivo: `supabase/functions/meta-conversions-api/index.ts`**

Adicionar entrada no `PIXEL_CONFIGS` para o pixel `4261464794069997` com:
- `tokenEnv`: variável de ambiente para o token da API de Conversões (ex: `META_CONVERSIONS_API_TOKEN_MONACO`)
- `defaultUrl`: `https://onovocondominio.com.br/xangrila/monaco`

### 4. Secret do token
Será necessário cadastrar o secret `META_CONVERSIONS_API_TOKEN_MONACO` com o token de acesso da API de Conversões do Meta para este pixel.

