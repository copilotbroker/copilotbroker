

# Fix: Áudio outbound sem processamento de mídia

## Problema

Quando a Kely envia um áudio pelo WhatsApp do celular (não pelo inbox), o webhook registra a mensagem como `outbound` mas **não processa a mídia** — a URL do WhatsApp CDN (`mmg.whatsapp.net`) expira em poucas horas e o áudio fica com "Aguardando processamento da mídia para visualização inline".

A causa está na linha 1824 do webhook:
```typescript
if (!msg.fromMe) {  // ← só processa mídia para inbound
    mediaMetadata = await persistInboundMediaIfNeeded(...);
}
```

Mensagens outbound vindas do celular ficam sem `storage_path` e `is_inline_ready`.

## Solução

### 1. Webhook: processar mídia também para outbound (arquivo principal)

**`supabase/functions/whatsapp-webhook/index.ts`**

Remover a condição `if (!msg.fromMe)` e chamar `persistInboundMediaIfNeeded` para TODAS as mensagens que tenham mídia, independente da direção. A mudança é simples — trocar:

```typescript
if (!msg.fromMe) {
    mediaMetadata = await persistInboundMediaIfNeeded(supabase, payload, phone, resolvedMessageType, mediaMetadata);
}
```

Por:

```typescript
if (resolvedMessageType !== "text") {
    mediaMetadata = await persistInboundMediaIfNeeded(supabase, payload, phone, resolvedMessageType, mediaMetadata);
}
```

Isso garante que áudios, imagens, vídeos e documentos enviados pelo celular da corretora também sejam persistidos no bucket antes de serem arquivados na conversa.

### 2. Nenhuma mudança no frontend

O `MessageMedia.tsx` já funciona corretamente — ele verifica `storage_path` ou `is_inline_ready` para renderizar o player inline. Com a mídia sendo persistida no backend, o frontend passa a funcionar automaticamente.

## Impacto

- Todas as mídias outbound futuras serão persistidas no bucket
- Mensagens já existentes com URLs expiradas continuarão sem preview (não há re-processamento retroativo)

## Arquivo alterado

| Arquivo | Alteração |
|---|---|
| `supabase/functions/whatsapp-webhook/index.ts` | Chamar `persistInboundMediaIfNeeded` para mensagens de mídia em ambas as direções |

