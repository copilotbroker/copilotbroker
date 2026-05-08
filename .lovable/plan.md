## Objetivo

Impedir que o corretor envie a **primeira mensagem** (contato frio) pela sua **instância pessoal de WhatsApp** durante as primeiras **24 horas** após conectar o QR Code. Resposta a mensagens recebidas continua liberada. A instância **global da imobiliária** continua funcionando normalmente.

## Regra de negócio

Para uma conversa rotear pela instância **pessoal** (`conversations.source_instance = 'personal'`), o envio só é permitido se **alguma** das condições for verdadeira:

1. Já se passaram **≥ 24 horas** desde `broker_whatsapp_instances.connected_at`; **ou**
2. A conversa **já recebeu pelo menos uma mensagem inbound** do cliente (cliente "abriu" o canal). Tecnicamente: existe uma `conversation_messages` com `direction = 'inbound'` para essa `conversation_id` cuja origem foi a instância pessoal — ou simplesmente `conversations.last_message_direction` já passou por `inbound` em algum momento (ver detalhes técnicos).

Casos cobertos:

- **Bloqueia:** corretor recém-conectado tenta mandar a 1ª mensagem para um lead novo pela pessoal.
- **Bloqueia:** "Puxar para meu WhatsApp pessoal" pode ser feito (conversão para personal liberada), mas o envio fica travado até o cliente responder ou completarem 24 h.
- **Libera:** cliente já mandou mensagem para o corretor → pode responder mesmo dentro das 24 h.
- **Libera:** envio pela instância **global** da imobiliária (sempre permitido).
- **Libera:** após 24 h da conexão, contato frio liberado normalmente.

Se o corretor desconectar e reconectar, o relógio reinicia (novo `connected_at`).

## Mudanças

### 1. Backend — `supabase/functions/inbox-send-message/index.ts`
No bloco onde `conv.source_instance !== 'global'` (envio pela pessoal), antes de chamar UAZAPI:

- Buscar `connected_at` da `broker_whatsapp_instances` do corretor.
- Se `connected_at` existe e `now - connected_at < 24h`:
  - Verificar se essa conversa tem alguma `conversation_messages` com `direction = 'inbound'` (consulta `select id ... limit 1`).
  - Se **não** tem inbound → retornar `403` com payload `{ error, code: "PERSONAL_INSTANCE_COOLDOWN", unlocks_at: <iso>, hours_remaining: <num> }`.

### 2. Backend — `supabase/functions/whatsapp-message-sender/index.ts` (cadências)
Aplicar a mesma trava antes de disparar mensagens da fila pela instância pessoal. Para cada item da queue:
- Se a conversa/lead vai sair pela pessoal e o corretor está dentro da janela de 24 h **e** não houve inbound da lead ainda → marcar a mensagem como `paused_by_system` com `error_message = 'personal_instance_cooldown'` (consistente com o sistema de pausados existente). Não falha a mensagem; reaparece na revisão pós-janela.

### 3. Frontend — UX no Inbox
- `src/components/inbox/ConversationThread.tsx` (componente de envio): hook novo `useBrokerPersonalCooldown(brokerId)` que retorna `{ active, unlocksAt, hoursRemaining }` consultando `broker_whatsapp_instances.connected_at`.
- Quando `source_instance === 'personal'` **e** cooldown ativo **e** a conversa não tem nenhum `inbound` (deriva do `messages` já carregado na thread):
  - Desabilitar input de envio com tooltip: *"Proteção anti-bloqueio: aguarde X h após conectar para iniciar contatos pelo seu WhatsApp pessoal. Você pode responder normalmente assim que o cliente enviar a primeira mensagem."*
  - Banner discreto no topo da thread com countdown.
- Tratar erro `PERSONAL_INSTANCE_COOLDOWN` retornado da edge function exibindo o mesmo aviso (toast).

### 4. Frontend — "Puxar para meu WhatsApp pessoal"
Manter a ação habilitada (a conversa pode ser convertida), mas após o pull, se cooldown ativo e sem inbound, a thread permanece com input bloqueado pelo mesmo mecanismo do item 3.

### 5. Aviso pós-conexão
Em `src/components/whatsapp/ConnectionTab.tsx`, ao detectar `status === 'connected'` e `connected_at` < 24 h, mostrar card informativo:
> *"Para proteger seu número, novos contatos pelo seu WhatsApp pessoal só serão liberados em X h. Respostas a mensagens recebidas continuam liberadas."*

## Detalhes técnicos

- **Sem mudança de schema.** Usa `broker_whatsapp_instances.connected_at` (já existe e já é atualizado a cada conexão) e `conversation_messages.direction`.
- **Definição de "houve inbound":** `select 1 from conversation_messages where conversation_id = $1 and direction = 'inbound' limit 1`. Robusto contra reaberturas e independente de `last_message_direction`.
- **Constante:** `PERSONAL_COOLDOWN_HOURS = 24` em `supabase/functions/_shared/` (criar `cooldown.ts` exportando a constante e helper `isPersonalCooldownActive(connectedAt)`); reutilizado pelo inbox-send-message e pelo message-sender.
- **Instância global** (`source_instance = 'global'`): sem alteração, fluxo atual permanece.
- **Erro estruturado** com `code` permite o frontend mostrar mensagem amigável sem string-matching.
- **Cadências pausadas** entram no fluxo já existente de "mensagens pausadas para revisão" (`PausedMessagesReviewModal`), exibindo motivo "aguardando liberação do WhatsApp pessoal (24 h)".
- **Reconectar zera o timer:** comportamento esperado pois o `connected_at` é regravado a cada nova conexão (já implementado no `whatsapp-instance-manager`).

## Fora do escopo
- Não altera regras de janela de atendimento, warmup, nem rate limits horários/diários.
- Não cria nova tabela; tudo derivado de dados já existentes.