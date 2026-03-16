
Objetivo
- Fazer o envio da mensagem parecer imediato, sem a sensação de travamento da tela ao clicar em “Enviar”.

Diagnóstico
- Hoje o composer fica preso ao tempo total do envio porque `ConversationThread` espera terminar:
  1. upload do anexo, se houver
  2. chamada da função `inbox-send-message`
  3. resposta da API externa de WhatsApp
  4. gravação da mensagem no backend
- No hook `sendMessage`, a UI só recebe retorno depois que toda essa cadeia termina.
- Isso cria latência percebida, mesmo quando o envio funciona corretamente.

O que vou ajustar
1. UI otimista no chat
- Inserir a mensagem imediatamente na thread ao clicar em enviar, com status visual de “enviando”.
- Limpar o campo de texto na hora, antes de esperar o backend.
- Manter o foco no input para a interface continuar responsiva.

2. Envio assíncrono sem bloquear a experiência
- Fazer `sendMessage` retornar um item otimista instantaneamente e disparar o envio real em segundo plano.
- Quando o backend responder:
  - atualizar a mensagem otimista para `sent`
  - ou marcar erro/falha se o envio não concluir

3. Sincronização segura com realtime/polling
- Reaproveitar o merge por `id` já existente no hook, mas adicionar deduplicação também para mensagens otimistas temporárias.
- Quando a mensagem real chegar via realtime/polling, substituir a temporária sem duplicar no chat.

4. Lista do Inbox mais responsiva
- Atualizar imediatamente preview/horário da conversa ao enviar, sem esperar o backend.
- Depois reconciliar com os dados oficiais que chegam da base.

Arquivos a ajustar
- `src/hooks/use-conversations.ts`
- `src/components/inbox/ConversationThread.tsx`
- possivelmente `src/pages/BrokerInbox.tsx` para refletir preview/estado otimista na conversa selecionada

Abordagem técnica
- Adicionar um objeto de mensagem temporária com `id` local e `status: "pending"`.
- Inserir essa mensagem no estado antes do `supabase.functions.invoke(...)`.
- Rodar a chamada real em background e fazer patch no item temporário quando voltar sucesso/erro.
- Para anexos, manter upload prévio quando necessário, mas sem segurar a limpeza do campo e o render da bolha.
- Evitar toast de erro genérico quando a mensagem já estiver visível; em vez disso, mostrar falha no próprio item.

Resultado esperado
- Ao clicar em enviar, a mensagem aparece instantaneamente na conversa.
- O input responde sem “congelar”.
- O envio real continua acontecendo em segundo plano.
- Se houver atraso da API externa, o usuário vê “enviando” em vez de sentir a página travada.

Validação
- Testar envio de texto e confirmar que a bolha aparece imediatamente.
- Testar nova mensagem em conversa longa para garantir que não duplica.
- Testar falha de envio e confirmar que o item mostra erro de forma clara.
- Verificar que lista do Inbox também atualiza preview/horário sem atraso perceptível.
