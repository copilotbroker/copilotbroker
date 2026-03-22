

# Alertar Corretor sobre WhatsApp Desconectado

## Resumo
Implementar um sistema de alertas em 3 camadas para notificar o corretor quando sua instância WhatsApp estiver desconectada.

## Mudanças

### 1. Banner visual no CRM do corretor
**Arquivo**: `src/components/broker/BrokerLayout.tsx`

- Criar um componente `WhatsAppDisconnectedBanner` que consulta `broker_whatsapp_instances` para o broker logado
- Se `status !== 'connected'`, exibir um banner vermelho/amarelo fixo no topo do layout com mensagem "Seu WhatsApp está desconectado" e botão para ir à página de conexão (`/corretor/whatsapp`)
- Usar `useQuery` com polling a cada 60s para manter atualizado
- Banner aparece acima do conteúdo principal, dentro do `BrokerLayout`

### 2. Notificação no sistema (sino)
**Arquivo**: `supabase/functions/roleta-distribuir/index.ts`

- Após o passo 7 (criar notificação de novo lead), adicionar verificação: buscar `broker_whatsapp_instances` do corretor atribuído
- Se `status !== 'connected'`, inserir uma notificação adicional do tipo `whatsapp_disconnected` com título "WhatsApp Desconectado" e mensagem alertando que leads estão chegando mas a cadência não será ativada

### 3. WhatsApp via instância global
**Arquivo**: `supabase/functions/roleta-distribuir/index.ts`

- Após o passo 8 (notificação WhatsApp do lead), adicionar verificação da instância do corretor
- Se a instância estiver desconectada, enviar mensagem adicional via instância global para o WhatsApp pessoal do corretor: "⚠️ Sua instância WhatsApp do CRM está desconectada. Leads estão chegando mas a cadência automática não será ativada. Reconecte em: [link]"

### 4. Hook de status da instância
**Arquivo**: `src/hooks/use-broker-whatsapp-status.ts` (novo)

- Hook simples que retorna `{ isConnected, status, isLoading }` para o broker logado
- Consulta `broker_whatsapp_instances` filtrando por `broker_id`
- Reutilizável no banner e em outros pontos do CRM

## Detalhes técnicos

### Banner (novo componente)
```text
src/components/broker/WhatsAppDisconnectedBanner.tsx
- useQuery("broker-whatsapp-status") → broker_whatsapp_instances
- Se desconectado: banner fixo com ícone WifiOff, texto, botão "Reconectar"
- Link para /corretor/whatsapp
```

### Edge Function (roleta-distribuir) - verificação adicional
```text
// Após passo 7, antes do passo 8:
// Buscar instância do corretor
const { data: brokerInstance } = await supabase
  .from("broker_whatsapp_instances")
  .select("status")
  .eq("broker_id", assignedBrokerId)
  .single();

// Se desconectado → notificação extra + WhatsApp global de alerta
```

