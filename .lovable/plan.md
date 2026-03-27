

# Roteamento de instância WhatsApp + "Puxar para meu WhatsApp"

## Problema
Quando um corretor responde a um lead no Plantão (instância global), a mensagem sai pela instância pessoal do corretor. O lead recebe a resposta de um número diferente do que usou para contato.

## Solução

### 1. Edge Function `inbox-send-message` — rotear pela instância correta

Atualmente (linha 122-148), a function sempre busca `broker_whatsapp_instances` do broker. A mudança:

- Incluir `source_instance` no SELECT da conversa (linha 125)
- Se `source_instance === 'global'`: buscar credenciais da tabela `global_whatsapp_config` em vez de `broker_whatsapp_instances`
- Se `source_instance` é null ou `'personal'`: manter comportamento atual (instância do broker)

### 2. Botão "Puxar para meu WhatsApp" no `ConversationThread`

Adicionar uma nova prop `onPullToPersonal` ao componente. Quando a conversa é `source_instance = 'global'` e já tem `attendance_started = true`, exibir um botão no header para migrar a conversa para a instância pessoal.

O botão:
- Atualiza `conversations.source_instance` de `'global'` para `'personal'`
- A conversa desaparece do Plantão e aparece no Inbox pessoal do corretor
- A partir daí, mensagens saem pela instância pessoal

### 3. Handler em `BrokerPlantao.tsx`

Implementar `handlePullToPersonal`:
- `UPDATE conversations SET source_instance = 'personal' WHERE id = ...`
- Toast de confirmação
- Navegar para `/corretor/inbox?conversationId=...`

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `supabase/functions/inbox-send-message/index.ts` | Adicionar lógica de roteamento por `source_instance` |
| `src/components/inbox/ConversationThread.tsx` | Nova prop `onPullToPersonal`, botão no header |
| `src/pages/BrokerPlantao.tsx` | Handler `handlePullToPersonal` |

