

## Fix: Mensagens Programadas Duplicadas no Inbox/Plantão

### Diagnóstico

Dois componentes exibem dados da mesma tabela `whatsapp_message_queue`:

1. **`CadenceCountdown`** (linha 477) — busca a próxima mensagem com status `queued`/`scheduled` para o lead
2. **Painel "Mensagens programadas"** (linhas 479-501) — busca TODAS as mensagens com status `queued`/`scheduled`/`sending`/`paused_by_system` para o lead

Resultado: a próxima mensagem de cadência aparece duas vezes — uma no countdown e outra no painel.

### Solução

Remover o componente `CadenceCountdown` e incorporar a informação de countdown diretamente no painel de mensagens programadas. A primeira mensagem do painel (a mais próxima) exibirá o timer regressivo inline, eliminando a duplicação.

### Arquivo: `src/components/inbox/ConversationThread.tsx`

- Remover a renderização de `<CadenceCountdown>` (linha 477)
- No painel de `scheduledMessages`, adicionar um indicador de countdown na primeira mensagem (a próxima a ser enviada), mostrando o tempo restante

### Arquivo: `src/components/inbox/ScheduledMessagesPanel.tsx` (novo)

- Extrair o painel de mensagens programadas para um componente próprio
- A primeira mensagem exibe um timer regressivo (lógica extraída do `CadenceCountdown`)
- Inclui os indicadores de `send_if_replied` do `CadenceCountdown` quando aplicável

### O que NÃO muda
- Lógica de fetch de `scheduledMessages` no hook `use-conversations.ts`
- Funcionalidade de cancelar mensagem
- O componente `CadenceCountdown.tsx` permanece no projeto (pode ser usado em outros contextos) mas deixa de ser renderizado no thread

