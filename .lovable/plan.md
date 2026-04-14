

## Análise dos Botões de Ação do WhatsApp

### Estado atual: 4 botões quando conectado
**Reiniciar | Webhook | Desconectar | Deletar**

### Análise de cada botão

1. **Reiniciar** — Reinicia a instância na UAZAPI e **já reconfigura o webhook automaticamente** (linha 1184-1187 da edge function). Útil para resolver problemas de conexão.

2. **Webhook** — Chama `/configure-webhook` que faz exatamente o que o Reiniciar já faz internamente. Foi criado como ferramenta de debug, mas é **redundante** já que o Reiniciar já inclui essa lógica.

3. **Desconectar** — Faz logout do WhatsApp na UAZAPI. O corretor precisará escanear QR novamente. Útil se quiser trocar de número.

4. **Deletar** — Funcionalidade **real e implementada**: apaga a instância na UAZAPI, limpa a fila de mensagens (`whatsapp_message_queue`) e remove o registro do banco. Porém é uma ação **muito destrutiva** e raramente necessária — geralmente só o admin deveria usar.

### Proposta de simplificação

- **Remover o botão "Webhook"** — redundante com Reiniciar
- **Manter Reiniciar** — resolve 99% dos problemas
- **Manter Desconectar** — útil para troca de número
- **Remover "Deletar" da interface do corretor** — manter apenas para admins na aba de visão global, ou esconder completamente (o corretor nunca deveria deletar sua própria instância)

Resultado: corretor vê apenas **Reiniciar | Desconectar** (interface limpa e segura).

### Arquivos a alterar

1. **`src/components/whatsapp/ConnectionTab.tsx`** — Remover botão Webhook e botão Deletar (com todo o AlertDialog)
2. **`src/hooks/use-whatsapp-instance.ts`** — Pode manter `configureWebhook` e `deleteInstance` no hook (usados internamente/admin), apenas não expor na UI do corretor

