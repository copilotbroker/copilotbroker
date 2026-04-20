

## Pausa automática de cadências em desconexão do WhatsApp

Quando o WhatsApp do corretor cair, **todas as mensagens programadas serão pausadas automaticamente** e ficarão aguardando uma decisão manual. Ao reconectar, o corretor verá um aviso destacado com a lista de mensagens pausadas e poderá escolher, uma a uma (ou em lote), quais reativar e quais descartar.

### Fluxo do corretor

```text
1. WhatsApp desconecta (logout, queda, sessão expirada)
        │
        ▼
2. Sistema detecta a mudança de status → "disconnected"
        │
        ▼
3. Todas mensagens com status "scheduled"/"queued" do corretor
   são marcadas como "paused_by_system" (motivo: desconexão)
        │
        ▼
4. Corretor reconecta o WhatsApp
        │
        ▼
5. Banner amarelo aparece: "Você tem N mensagens pausadas
   aguardando sua decisão" → botão "Revisar mensagens"
        │
        ▼
6. Modal lista cada mensagem pausada com:
   - Nome do lead + preview da mensagem
   - Etapa da cadência + horário original
   - Ações: [Reagendar agora] [Reagendar em...] [Descartar]
        │
        ▼
7. Reagendamento respeita janela de horário comercial
   e aplica delay anti-spam entre mensagens
```

### O que muda no backend

**1. Detecção da desconexão (gatilho da pausa)**
Hoje, `whatsapp-instance-manager` já atualiza o status para `disconnected` em três pontos: `/status` (linha ~685), `/logout` (linha ~1093) e `/sync-all`. Vamos adicionar nesses três pontos uma chamada que:
- Marca todas as mensagens `scheduled`/`queued` daquele `broker_id` como `paused_by_system`.
- Grava `pause_reason = 'whatsapp_disconnected'` numa nova coluna `pause_reason` em `whatsapp_message_queue` (já existe campo similar no instance, mas precisamos rastrear por mensagem para diferenciar pausa manual vs. desconexão).
- Cria 1 notificação (tabela `notifications`) para o `user_id` do corretor: tipo `whatsapp_disconnected_pause` com a contagem.

**2. Não retomar automaticamente ao reconectar**
Hoje o `/reset-daily` faz `UPDATE ... SET status='scheduled' WHERE status='paused_by_system'` (linha ~1091 do `whatsapp-message-sender`). Vamos restringir isso para **não** descongelar mensagens com `pause_reason='whatsapp_disconnected'` — essas só voltam por ação manual do corretor.

**3. Endpoint de revisão e reagendamento**
Nova edge function `whatsapp-paused-messages` com três rotas:
- `GET /list` — retorna mensagens pausadas por desconexão do corretor logado, com dados do lead e da campanha.
- `POST /reschedule` — recebe `{ messageIds[], strategy: 'now' | 'spread' | 'datetime', datetime? }`. Aplica horário comercial e jitter anti-spam (60–240s entre mensagens) e devolve para `scheduled`.
- `POST /discard` — recebe `{ messageIds[] }`, marca como `cancelled` com motivo `discarded_after_disconnect` e registra em `lead_interactions`.

### O que muda no frontend

**1. Banner de aviso (`WhatsAppDisconnectedBanner.tsx` já existe)**
Hoje só aparece quando desconectado. Vamos adicionar uma **segunda variante** (vermelho-âmbar) que aparece **após reconexão** enquanto houver mensagens com `pause_reason='whatsapp_disconnected'`. Texto: *"Você tem N mensagens que ficaram pausadas durante a desconexão. Revise e escolha o que fazer."* + botão **"Revisar mensagens"**.

**2. Novo modal `PausedMessagesReviewModal`**
Aberto pelo banner, listando mensagens agrupadas por lead. Cada item mostra:
- Avatar + nome do lead, preview da mensagem (truncado).
- Etapa N da cadência "[nome]", horário programado original.
- Checkbox para seleção em lote.
- Ações individuais: **Reagendar agora**, **Reagendar para...** (popover com calendário/hora), **Descartar**.

Barra inferior com ações em lote: **Reagendar todas selecionadas (escalonado)**, **Descartar selecionadas**.

**3. Indicador na tela "Fila de Envio" (`QueueTab.tsx`)**
Nova seção colapsável **"Pausadas por desconexão"** acima das outras, com badge de aviso, para o corretor poder revisar também por lá.

### Detalhes técnicos

- **Migração de schema**: adicionar `pause_reason text` em `whatsapp_message_queue` (nullable). Indexar `(broker_id, status, pause_reason)` para listagem rápida.
- **RLS**: política existente já cobre — corretor só vê suas próprias mensagens via `broker_id = get_my_broker_id()`.
- **Reagendamento "spread"**: distribui as N mensagens a partir de `now()` com intervalos aleatórios de 60–240s (regra anti-spam já existente em `getRandomInterval`), respeitando `working_hours_start`/`end` da instância (reaproveita `adjustToWorkingHours` já existente em `whatsapp-message-sender`).
- **`lead_interactions`**: registrar nota tipo "Cadência reativada após reconexão" ou "Mensagem descartada após desconexão" para rastreabilidade no timeline do lead.
- **Hook React Query**: `usePausedMessages(brokerId)` com `refetchInterval: 30s` para atualizar contador no banner.
- **Edge case — pausa manual existente**: se o corretor já tinha pausado manualmente a instância (via aba Segurança), aquelas mensagens mantêm `pause_reason=null` e continuam sob o fluxo atual de retomada manual via "Despausar". Não confundimos os dois fluxos.

### Arquivos afetados

**Backend (edge functions)**
- `supabase/functions/whatsapp-instance-manager/index.ts` — disparar pausa nos pontos de detecção de desconexão.
- `supabase/functions/whatsapp-message-sender/index.ts` — `/reset-daily` ignora mensagens pausadas por desconexão.
- `supabase/functions/whatsapp-paused-messages/index.ts` — **nova** função (list/reschedule/discard).
- 1 migração SQL para adicionar `pause_reason` em `whatsapp_message_queue` + índice.

**Frontend**
- `src/components/broker/WhatsAppDisconnectedBanner.tsx` — adicionar variante "tem mensagens pausadas para revisar".
- `src/components/whatsapp/PausedMessagesReviewModal.tsx` — **novo**.
- `src/components/whatsapp/QueueTab.tsx` — nova seção "Pausadas por desconexão".
- `src/hooks/use-paused-messages.ts` — **novo** hook.

