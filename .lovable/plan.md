

## Timeout para conversas do WhatsApp Global sem lead criado

### Problema identificado
O timeout da roleta (10 minutos) só funciona para leads que entram por landing pages, pois a função `roleta-timeout` consulta exclusivamente a tabela `leads` verificando `reserva_expira_em`. Conversas do WhatsApp Global que ainda não tiveram "Iniciar Atendimento" clicado não possuem registro na tabela `leads` — logo o timeout nunca as processa.

### Solução
Estender o mecanismo de timeout para incluir conversas globais sem atendimento iniciado, usando campos na própria tabela `conversations`.

### Alterações

**1. Migração: adicionar campos de controle na tabela `conversations`**
- `reserva_expira_em` (timestamptz, nullable) — quando a reserva expira
- `atribuido_em` (timestamptz, nullable) — quando o broker foi atribuído

**2. Atualizar `roleta-distribuir` (edge function)**
Quando distribui uma conversa global para um broker, além de atualizar `broker_id`, definir `reserva_expira_em` = now() + tempo_reserva_minutos e `atribuido_em` = now() na conversa.

**3. Atualizar `roleta-timeout` (edge function)**
Adicionar uma segunda seção que busca conversas globais expiradas:
- Query: `conversations` onde `source_instance = 'global'`, `attendance_started = false`, `reserva_expira_em <= now()`
- Para cada conversa expirada: buscar a roleta global ativa, encontrar o próximo membro com check-in, reatribuir `broker_id` na conversa, atualizar `reserva_expira_em`, e registrar log em `roletas_log`
- Aplicar a mesma lógica de loop breaker (max 6 reassinações)

**4. Atualizar trigger/webhook de criação de conversa global**
Quando o webhook WhatsApp cria uma conversa global e aciona `roleta-distribuir`, garantir que os novos campos sejam populados.

**5. Limpar reserva ao iniciar atendimento**
Quando `attendance_started` muda para `true` (via "Iniciar Atendimento"), limpar `reserva_expira_em` para parar o ciclo de timeout.

### Detalhes Técnicos
- A migração adiciona 2 colunas à tabela `conversations` (sem breaking changes)
- O `roleta-distribuir` já recebe `lead_id` — para conversas globais sem lead, o fluxo será via webhook que cria a conversa e chama a distribuição
- O cron job existente (`* * * * *`) já chama `roleta-timeout` a cada minuto — nenhuma alteração necessária no cron
- O loop breaker contará reassinações no `roletas_log` filtrando por `motivo LIKE '%conversation%'` ou por um campo adicional `conversation_id` no log

