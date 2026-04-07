

## Diagnóstico: Mensagens do WhatsApp do Plantão não chegam ao sistema

### Problema identificado

Sua mensagem de teste (número 97010323) **nunca chegou ao sistema**. Verifiquei os logs do webhook e não há nenhum registro de mensagem recebida da instância global (`enove_global_1774904515037`). Todas as mensagens nos logs recentes são de instâncias pessoais de corretores (ex: `enove_jaqueline_panigo`, `enove_fabiane_witt`).

Isso significa que a **instância global do WhatsApp na UAZAPI não está com a URL de webhook configurada** para enviar os eventos ao sistema. As mensagens chegam no WhatsApp do Plantão, mas a UAZAPI não repassa para o CRM.

### Causa raiz

O código do `whatsapp-global-instance-manager` não configura automaticamente a URL do webhook na UAZAPI quando a instância é criada/conectada. Isso precisa ser feito manualmente no painel UAZAPI ou adicionado ao código.

### Solução proposta

Adicionar a configuração automática do webhook no `whatsapp-global-instance-manager`, assim como já é feito para instâncias de corretores (padrão existente). Quando a instância global for conectada ou reconectada, o sistema irá:

1. Chamar a API da UAZAPI para configurar a URL do webhook apontando para `https://nckzxwxxtyeydolmdijn.supabase.co/functions/v1/whatsapp-webhook/{WEBHOOK_SECRET}`
2. Configurar os eventos que devem ser encaminhados (messages, connection.update, messages_update)

**Arquivo: `supabase/functions/whatsapp-global-instance-manager/index.ts`**

- Criar uma função `configureWebhookUrl` que faz POST para a UAZAPI configurando a URL de callback
- Chamar essa função automaticamente após conexão bem-sucedida (no handler de `/connect` e `/status` quando detecta status "connected")

### Ação imediata necessária

Enquanto o fix automático não é deployado, a URL do webhook precisa ser configurada **manualmente** na UAZAPI para a instância `enove_global_1774904515037`. A URL correta é:

```
https://nckzxwxxtyeydolmdijn.supabase.co/functions/v1/whatsapp-webhook/{SEU_WEBHOOK_SECRET}
```

Os eventos que devem estar habilitados: `messages`, `messages_update`, `connection`.

