

# Por que você não está vendo mudanças visuais na Inbox

## O que foi implementado

As mudanças implementadas são de **três naturezas diferentes**, e apenas uma delas é visível imediatamente na UI:

### 1. Página de Roletas (visível agora)
- No painel Admin → Roletas, ao clicar em "Nova Roleta", agora existe a opção de selecionar **"WhatsApp Global (plantão)"** como origem, além de "Landing Pages".
- Roletas já criadas com tipo WhatsApp Global exibem um badge verde "WhatsApp Global".
- Você já criou a roleta "Plantão Enove" — confirme se ela aparece com o badge verde na página de Roletas.

### 2. Webhook (backend — invisível na UI)
- A Edge Function `whatsapp-webhook` foi atualizada com toda a lógica de roteamento:
  - Identificar se a mensagem vem da instância global
  - Caso A: lead já tem corretor → roteia direto
  - Caso B: lead novo → distribui via roleta WhatsApp Global → cria lead no CRM
- **Isso só entra em ação quando uma mensagem real chega na instância global.** Não há mudança visual até que isso aconteça.

### 3. Inbox (visual condicional)
- Os ícones Dark/Light do WhatsApp no avatar das conversas **só aparecem em conversas que possuem `source_instance = 'global'`**.
- Como nenhuma mensagem passou pela instância global após a implementação, nenhuma conversa tem esse campo preenchido. Por isso a Inbox parece igual.

## Como testar

Para ver as mudanças funcionando de ponta a ponta:

1. **Verifique a Roleta**: acesse Admin → Roletas e confirme que "Plantão Enove" tem o badge "WhatsApp Global" e membros com check-in ativo.
2. **Envie uma mensagem teste**: de um número que **não** esteja no CRM, envie uma mensagem para o número da instância global. O webhook deve:
   - Criar a conversa com `source_instance = 'global'`
   - Distribuir o lead via roleta para um corretor online
   - Criar o lead no CRM com origem "WhatsApp do plantão"
3. **Verifique a Inbox do corretor atribuído**: a conversa deve aparecer com o ícone WhatsApp escuro (dark).

## Possível problema: webhook não foi redeployado

A Edge Function `whatsapp-webhook` precisa estar deployada com o código atualizado. Posso fazer o deploy agora para garantir que o código mais recente esteja ativo no backend.

## Plano de ação

1. **Fazer deploy da Edge Function `whatsapp-webhook`** para garantir que a versão com roteamento global está ativa
2. **Verificar na página de Roletas** se o badge "WhatsApp Global" aparece na roleta "Plantão Enove"
3. Após deploy, basta enviar uma mensagem teste para a instância global para validar o fluxo completo

