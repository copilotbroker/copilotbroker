## Diagnóstico atual

Não parece ser apenas “resto” do erro anterior. O webhook voltou a receber mensagens da instância do Gabriel (`enove_gabriel_witt`) e não encontrei indício atual de queda geral de infraestrutura. O problema que aparece agora é mais específico na lógica de cadências/campanhas.

O que encontrei:

1. **Rodrigo Goerg**
   - Ele respondeu em 27/04 às 10:49.
   - O sistema registrou a resposta em `whatsapp_lead_replies`.
   - A etapa futura que ainda estava pendente foi cancelada.
   - Porém, a campanha “Follow up reconetctar com o cliente” já havia enviado 9 de 10 etapas antes da resposta porque os delays dessa campanha estão configurados de forma não progressiva/cumulativa, com várias etapas caindo praticamente no mesmo período.

2. **Filipe Schuvarts**
   - Não encontrei mensagem inbound registrada dele na conversa do Gabriel.
   - O que aparece depois da cadência são mensagens outbound manuais do Gabriel para o Filipe.
   - Portanto, para esse caso específico, o sistema não tinha uma “resposta do cliente” registrada para cancelar automaticamente.

3. **Marcelo S Saldanha**
   - Não encontrei mensagem inbound registrada depois dessa campanha.
   - Ainda existe uma etapa futura agendada para 28/04 porque, do ponto de vista do sistema, não houve resposta do cliente.

4. **Infraestrutura**
   - O webhook do WhatsApp está recebendo eventos da instância do Gabriel agora.
   - Há eventos recentes com HTTP 200 e logs da instância dele.
   - Não encontrei erro atual de boot/503 como no problema anterior.

## Causa principal

Há dois pontos que precisam ser corrigidos para uma solução definitiva:

1. **Cancelamento dependente demais de um único registro (`whatsapp_lead_replies`)**
   - Hoje o sender previne envios futuros se encontrar registro de resposta na tabela de replies ou uma mensagem já cancelada por resposta.
   - Se a resposta foi processada no Inbox (`conversation_messages`) mas não gerou/achou o registro exato em `whatsapp_lead_replies`, o envio futuro pode escapar.
   - Também há risco de falha por variação de telefone (`+55...`, `55...`, sem DDI).

2. **Campanhas com delays não progressivos**
   - A campanha do Gabriel tem etapas com delay cumulativo menor depois de etapas maiores, e várias etapas com o mesmo delay.
   - Isso faz várias mensagens saírem antes que o cliente tenha tempo real de responder, dando a impressão de que “não cancelou”, quando na prática quase tudo já tinha sido enviado antes da resposta.

## Plano de correção

### 1. Fortalecer o cancelamento no webhook

Alterar `whatsapp-webhook` para, ao receber qualquer mensagem inbound de um cliente:

- Localizar campanhas ativas desse broker/telefone/lead, não apenas campanhas encontradas nos últimos envios `sent`.
- Usar variações normalizadas do telefone para evitar falha por formato.
- Cancelar todas as mensagens futuras da mesma campanha/lead/telefone com `send_if_replied = false`.
- Registrar a resposta com chave normalizada também, para o sender conseguir reconhecer depois.

### 2. Fortalecer a prevenção no sender antes de enviar

Alterar `whatsapp-message-sender` para, antes de enviar qualquer etapa `step_number > 1` com `send_if_replied = false`:

- Verificar se existe `conversation_messages.direction = inbound` para o mesmo broker + lead/telefone depois do início/envio da campanha.
- Se existir, cancelar a mensagem em vez de enviar.
- Usar variações de telefone no lookup de `whatsapp_lead_replies`.
- Fazer uma reconciliação curta a cada execução para cancelar pendências que ficaram para trás por falha anterior.

Esse ponto é o “cinto de segurança”: mesmo que o webhook falhe parcialmente, o sender não deve deixar passar uma etapa futura se já houver resposta registrada no Inbox.

### 3. Corrigir campanhas com delays inconsistentes na criação

Na criação de campanhas/cadências:

- Validar que os delays cumulativos sejam progressivos por etapa.
- Bloquear ou avisar quando uma etapa posterior tiver delay menor/igual de forma que gere disparos fora de ordem ou em lote acidental.
- Manter a regra atual do projeto: o delay é cumulativo desde a primeira mensagem.

Isso evita campanhas como a do Gabriel, onde etapas 9 e 10 foram agendadas antes de etapas 3-8, e várias etapas ficaram no mesmo bloco de horário.

### 4. Corrigir dados atuais com segurança

Depois da correção, executar uma reconciliação nos dados atuais para:

- Cancelar qualquer mensagem futura `scheduled/queued` de campanhas ativas quando já existir resposta inbound registrada para aquele lead/telefone.
- Não cancelar mensagens de leads que não têm inbound registrado, para evitar falso positivo.
- Revisar especificamente a campanha “Follow up reconetctar com o cliente” do Gabriel.

### 5. Validar

Validar com:

- Logs do `whatsapp-webhook` para nova resposta inbound.
- Logs do `whatsapp-message-sender` confirmando cancelamento preventivo quando houver resposta.
- Consulta no banco para conferir que mensagens futuras ficam como `cancelled` com motivo `Lead respondeu`.
- Conferência dos casos Rodrigo, Filipe Schuvarts e Marcelo Saldanha.

## Resultado esperado

Após a correção:

- Se o cliente responder, qualquer etapa futura marcada como “não enviar se respondeu” será cancelada.
- Mesmo se o registro auxiliar de resposta falhar, o sender usará o histórico real do Inbox como fonte de verdade.
- Campanhas novas não poderão ser criadas com delays que gerem disparos fora de ordem/acúmulo involuntário.
- Se houver nova falha de infraestrutura do webhook, o sistema terá uma segunda barreira no sender e ficará mais resiliente.