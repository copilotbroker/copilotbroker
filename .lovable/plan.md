## Diagnóstico

A aba **Novos** do Meu WhatsApp pessoal está zerada porque hoje ela considera “Novo” apenas conversa pessoal **sem `lead_id`**.

Para a Bibiana, a instância pessoal está conectada, mas as conversas que deveriam aparecer como novas já possuem um lead vinculado com status `new`. Por isso o frontend joga tudo para **Atendimento** ou não destaca como “Novo”, mesmo ainda sem atendimento real.

Também encontrei outro ponto de risco: as conversas pessoais recentes não estão chegando no banco desde 08/05, apesar da instância constar conectada. Isso indica provável webhook da instância pessoal não disparando/arquivando mensagens novas, mas a correção principal da aba é no critério de classificação.

## Plano de correção

1. **Ajustar a regra da aba Novos no Meu WhatsApp pessoal**
   - Em `BrokerInbox.tsx`, classificar como **Novos** as conversas pessoais ativas que:
     - não têm `lead_id`; ou
     - têm lead vinculado com status `new` e ainda não foram assumidas como atendimento.
   - Manter em **Atendimento** as conversas com lead em andamento ou já atendidas.

2. **Evitar duplicidade entre Novos e Atendimento**
   - A aba **Atendimento** passa a excluir as conversas classificadas como **Novos**.
   - Assim a contagem e a lista ficam consistentes.

3. **Preservar o fluxo de iniciar atendimento**
   - Quando o usuário abrir uma conversa em **Novos**, o botão/estado de “Iniciar atendimento” deve continuar aparecendo.
   - Para conversas que já têm `lead_id`, iniciar atendimento não deve criar outro lead; deve apenas marcar o lead/conversa como atendimento iniciado e mover para **Atendimento**.

4. **Aplicar o mesmo critério na visão administrativa equivalente**
   - `AdminInbox.tsx` usa a mesma separação e deve receber a mesma regra para não ficar divergente.

5. **Investigar e reforçar o webhook da instância pessoal**
   - Conferir no `whatsapp-instance-manager` se a ação de “configurar webhook” está usando o token/base corretos da instância.
   - Se necessário, ajustar o endpoint de configuração para garantir que a instância pessoal envie eventos para `whatsapp-webhook`.
   - Isso trata a parte “ela tem dezenas de conversas novas na instância pessoal, mas elas não chegam no Meu WhatsApp”.

## Resultado esperado

- Leads/conversas pessoais com status `new` aparecem na aba **Novos**.
- Ao iniciar atendimento, a conversa sai de **Novos** e entra em **Atendimento** sem criar lead duplicado.
- A instância pessoal conectada continua com o webhook configurável para que novas mensagens entrem no sistema.