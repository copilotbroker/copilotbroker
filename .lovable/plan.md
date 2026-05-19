## Objetivo
Fazer o envio de mensagens (plantão + instância pessoal) se comportar como WhatsApp: bolha aparece instantaneamente com 1 tic, evolui para 2 tics quando o backend confirma e para 2 tics azuis quando lida; em caso de falha vira erro com botão "Reenviar". A bolha nunca desaparece após o clique.

## Diagnóstico do estado atual
Já existe optimistic UI parcial em `src/hooks/use-conversations.ts > sendMessage`:
- Cria mensagem `temp:client-...` com `metadata.client_id`, insere via `mergeMessages` (que dedup por `client_id`), limpa input.
- Status atual: `pending` → `sent` (após `inbox-send-message` retornar) ou `failed`.

O que falta vs. o spec:
1. A edge `inbox-send-message` ainda é fire-and-forget mas espera UAZAPI antes de salvar — não há linha em `conversation_messages` enquanto a mensagem está “queued/sending”.
2. Não há coluna `client_message_id` própria — reconciliação depende de `metadata.client_id`, que não tem índice e é frágil contra polling/realtime.
3. Webhook não atualiza status `delivered`/`read`/`failed` em `conversation_messages` (UAZAPI envia ACKs em `messages.update`/`status`).
4. Visual: `pending` cai no `default` do `getMessageStatusIcon` (mostra Clock3) — não há 1 tic cinza; não há diferenciação entre `sent` (1 tic) e `delivered` (2 tics) corretas; não há botão "Reenviar".
5. `fetchNewMessages` (polling 6s) reconcilia por `client_id` em metadata, mas se a row do banco perder `metadata.client_id` (caso o sender não preserve), aparece bolha duplicada.
6. Sem `client_message_id` real, refetches grandes podem sobrescrever bolha otimista que ainda não foi persistida (ex.: erro de rede + refetch).

## Mudanças

### 1. Banco (`supabase/migrations/...`)
- `ALTER TABLE conversation_messages ADD COLUMN client_message_id text` + `CREATE UNIQUE INDEX ux_conv_messages_client_id ON conversation_messages (conversation_id, client_message_id) WHERE client_message_id IS NOT NULL;`
- Permitir status `queued`, `sending`, `delivered`, `read` (já tem `sent`/`failed`). Sem CHECK constraint nova — coluna é text livre.
- Index para webhook ACK: `CREATE INDEX IF NOT EXISTS ix_conv_messages_uazapi_id ON conversation_messages (uazapi_message_id) WHERE uazapi_message_id IS NOT NULL;`

### 2. Edge function `inbox-send-message` (outbox)
Fluxo novo:
1. Validar input (inclui novo campo `client_message_id`).
2. **Insert imediato** em `conversation_messages` com `status='queued'`, `client_message_id`, `metadata` enriquecida.
   - Usar `upsert` por `(conversation_id, client_message_id)` para idempotência em retries do cliente.
3. Atualizar `conversations.last_message_*` e `updated_at`.
4. Retornar 200 com `{ message_id, status: 'queued', client_message_id }` rapidamente (sem aguardar UAZAPI).
5. Chamar UAZAPI em background usando `EdgeRuntime.waitUntil(...)`:
   - Sucesso → `UPDATE conversation_messages SET status='sent', uazapi_message_id=...` pelo id.
   - Falha → `UPDATE ... SET status='failed', metadata = metadata || {error}`.
6. Manter regras existentes: cooldown pessoal, prefix do nome no global, registro em `lead_interactions`.

### 3. Webhook `whatsapp-webhook` (ACKs)
- Tratar evento de status (`messages.update` / `EventType=messages_update` / payload com `status` + `id` em `fromMe=true`):
  - Mapear `SENT`/`DELIVERY_ACK`/`READ`/`PLAYED` → `sent`/`delivered`/`read`/`read`.
  - `UPDATE conversation_messages SET status=<novo> WHERE uazapi_message_id = <id>` somente se transição for monotônica (sent < delivered < read).
- Sem efeito quando a row ainda não tem `uazapi_message_id` (ACK precoce); fica para o próximo evento.

### 4. Frontend — `src/hooks/use-conversations.ts`
- `sendMessage`:
  - Gerar `clientMessageId = crypto.randomUUID()`.
  - Otimista com `status: 'queued'`, `metadata.client_id = clientMessageId`.
  - Enviar para edge com `client_message_id` no body.
  - Ao receber `{ message_id, status }`, reconciliar (mesma lógica de mergeMessages já existe).
  - Em catch: marcar `status: 'failed'` mas NÃO remover; guardar payload para reenvio.
- `mergeMessages`:
  - Acrescentar regra: nunca rebaixar status (`failed`/`read`/`delivered`/`sent` não voltam para `queued`).
  - Proteger bolhas otimistas: se `incoming` não traz a row com mesmo `client_id`, manter a otimista até reconciliar.
- Exportar `resendMessage(clientMessageId)` que re-emite a chamada à edge com o mesmo `client_message_id` (idempotente).
- Realtime: subscrever `postgres_changes` (`INSERT`/`UPDATE`) em `conversation_messages` filtrando por `conversation_id`, propagando via `mergeMessages` — substitui (ou complementa) o polling de 6s para reduzir latência das mudanças de status.

### 5. UI — `src/components/inbox/ConversationThread.tsx`
- `getMessageStatusIcon`:
  - `queued`/`sending`/`pending` → `Check` cinza claro (1 tic), opacidade reduzida.
  - `sent` → `CheckCheck` cinza (2 tics).
  - `delivered` → `CheckCheck` cinza mais escuro (2 tics).
  - `read` → `CheckCheck` azul (mantém `text-primary`).
  - `failed` → `AlertCircle` vermelho + botão inline "Reenviar" que chama `resendMessage(client_id)`.
- Garantir scroll-to-bottom já dispara no `messages` change (já dispara).
- Não desabilitar input enquanto o background processa (já não desabilita).

### 6. Cobertura
- Plantão (`BrokerPlantao`, `AdminPlantao`) e Inbox pessoal (`BrokerInbox`, `AdminInbox`, `LeadPage` quick reply) usam o mesmo `useConversations.sendMessage`, então herdam o comportamento automaticamente.

## Out of scope
- Job queue externo (pg_cron/worker dedicado). O “background” é `EdgeRuntime.waitUntil` dentro da própria invocação, o que já entrega a resposta rápida e isola a chamada UAZAPI.
- Mudança no fluxo de mídia (continua subindo o arquivo no front antes de chamar a edge — a bolha já aparece via preview local).
- Tics azuis dependem do provedor enviar ACK `READ`; se a UAZAPI não emitir, ficará em `delivered`.

## Detalhes técnicos
- `client_message_id` é UUID v4 gerado no cliente, persistido na coluna nova e replicado em `metadata.client_id` para retrocompat com mensagens já em voo durante o deploy.
- Idempotência da edge: `insert ... on conflict (conversation_id, client_message_id) do update set updated_at = now() returning *`.
- Webhook ACK: usar `lt`/`gt` em status via mapa de ordem para evitar regressão (`read` não vira `delivered` depois).
- Realtime exige `ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;` (incluso na migração se ainda não estiver).
