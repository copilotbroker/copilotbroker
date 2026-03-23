

# Integração Google Calendar — Plano Completo

A infraestrutura de banco já existe (tabelas `calendar_events` e `google_calendar_connections`). Agora vamos implementar o fluxo OAuth completo e a sincronização bidirecional.

## Arquitetura

```text
Frontend (GoogleConnectCard)
  ↓ clica "Conectar"
  ↓ chama edge function google-calendar-auth?action=authorize
  ↓ recebe URL de redirect do Google
  ↓ abre popup/redirect
  ↓ Google redireciona para callback URL
  ↓ edge function google-calendar-auth?action=callback
  ↓ troca code por tokens, salva na tabela google_calendar_connections
  ↓ frontend detecta conexão e atualiza UI

Sync bidirecional:
  edge function google-calendar-sync
  ↓ lê tokens da tabela
  ↓ busca eventos do Google Calendar API
  ↓ insere/atualiza calendar_events com google_event_id
  ↓ envia eventos locais sem google_event_id para o Google
```

## Implementação

### 1. Secrets necessários
Cadastrar dois secrets via `add_secret`:
- `GOOGLE_CALENDAR_CLIENT_ID` — Client ID do OAuth 2.0
- `GOOGLE_CALENDAR_CLIENT_SECRET` — Client Secret do OAuth 2.0

### 2. Edge Function: `google-calendar-auth`
**Arquivo:** `supabase/functions/google-calendar-auth/index.ts`

Três ações via query param `action`:
- **`authorize`**: Gera URL de autorização do Google com scopes `calendar.events` e `calendar.readonly`. Requer JWT do usuário autenticado. Retorna URL para redirect.
- **`callback`**: Recebe `code` do Google, troca por `access_token` + `refresh_token` via `https://oauth2.googleapis.com/token`. Busca email via `googleapis.com/oauth2/v2/userinfo`. Salva tudo em `google_calendar_connections` usando service role key.
- **`disconnect`**: Remove a conexão da tabela. Revoga token no Google.

### 3. Edge Function: `google-calendar-sync`
**Arquivo:** `supabase/functions/google-calendar-sync/index.ts`

- Busca conexão ativa do broker na tabela
- Refresh automático do token se expirado
- **Google → Sistema**: Lista eventos do Google Calendar API, faz upsert em `calendar_events` usando `google_event_id` como chave
- **Sistema → Google**: Envia eventos locais sem `google_event_id` para o Google Calendar API, salva o `google_event_id` retornado
- Atualiza `last_sync_at` na conexão
- Deduplicação por `google_event_id`

### 4. Atualizar `GoogleConnectCard.tsx`
- Botão "Conectar" chama a edge function `google-calendar-auth?action=authorize`, abre popup com a URL retornada
- Listener de mensagem para detectar callback e fechar popup
- Quando conectado: botões funcionais de Sincronizar (chama `google-calendar-sync`), Reconectar e Desconectar
- Exibir email, status e última sincronização

### 5. Atualizar `use-calendar-events.ts`
- Adicionar função `syncGoogle()` que invoca a edge function `google-calendar-sync`
- Adicionar `disconnectGoogle()` e `connectGoogle()`
- Expor essas funções no retorno do hook

### 6. Callback page
**Arquivo:** `src/pages/GoogleCalendarCallback.tsx`
- Página simples que captura o `code` da URL, envia para a edge function `google-calendar-auth?action=callback`, e fecha a janela/popup via `window.close()` + `postMessage` para o parent

### 7. Rota no App.tsx
- Adicionar rota `/google-calendar/callback` apontando para `GoogleCalendarCallback`

## Segurança
- Tokens OAuth armazenados apenas no banco (nunca expostos ao frontend)
- Edge functions validam JWT do usuário autenticado
- Service role key usada apenas server-side para escrita de tokens
- Refresh token com rotação automática
- CORS dinâmico via `_shared/security.ts`

