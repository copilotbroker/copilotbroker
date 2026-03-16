
Objetivo

Fazer a Inbox exibir imagens recebidas inline como no WhatsApp, priorizando a imagem completa quando possível e caindo para uma prévia leve em WEBP quando o provedor não entregar o arquivo final.

O que identifiquei

- Não parece ser falta de espaço no banco. As mensagens estão sendo salvas normalmente e o bucket já existe/publicado.
- O problema está no pipeline da mídia recebida:
  - várias mensagens novas ainda estão sendo gravadas com `metadata.file_url` apontando para `mmg.whatsapp.net ... .enc` ou URL temporária do provedor;
  - essas mensagens chegam com `is_inline_ready: false`, então o frontend não tem um arquivo renderizável de verdade;
  - em pelo menos um caso funcionou parcialmente porque foi salvo um fallback `preview_only` no bucket, mas isso ainda não está consistente.
- O payload do webhook traz campos úteis como `mediaKey`, `directPath`, `fileSHA256`, dimensões e às vezes thumbnail embutida. O código atual ainda não resolve isso de forma confiável para todas as imagens.

Abordagem aprovada a implementar

1. Corrigir a extração real da imagem no webhook
- Revisar o fluxo de `persistInboundMediaIfNeeded` para não considerar URL temporária/encriptada como arquivo final.
- Tentar obter a mídia completa do provedor usando os dados do payload e autenticação existente.
- Só marcar `is_inline_ready = true` quando houver um arquivo real hospedado no bucket.

2. Implementar fallback consistente “Ambos”
- Se a imagem completa for recuperada:
  - converter/salvar em WEBP otimizado no bucket;
  - usar essa URL para miniatura e para abrir inline.
- Se a imagem completa falhar:
  - usar a thumbnail embutida do payload;
  - convertê-la/salvá-la também em WEBP;
  - marcar como `preview_only` para o frontend saber que é uma prévia, mas ainda abrir inline.

3. Tratar e salvar em WEBP
- Padronizar imagens inbound em WEBP para ficarem leves e rápidas no chat.
- Manter metadados claros:
  - `file_url`
  - `storage_path`
  - `mime_type: image/webp`
  - `file_name`
  - `is_inline_ready`
  - `preview_only`
  - `preview_source`

4. Ajustar a UI para experiência “igual WhatsApp”
- No `MessageMedia`, abrir inline a imagem hospedada no bucket, não a URL original do provedor.
- Quando for `preview_only`, ainda abrir normalmente no visualizador, mas com comportamento estável.
- Manter card de fallback apenas quando realmente não existir nenhuma imagem renderizável.

5. Melhorar observabilidade
- Adicionar logs objetivos no webhook para cada etapa:
  - original recuperada
  - thumbnail usada
  - conversão para WEBP concluída
  - upload concluído
  - motivo da falha
- Isso evita novas tentativas “no escuro”.

Arquivos envolvidos

- `supabase/functions/whatsapp-webhook/index.ts`
- `src/components/inbox/MessageMedia.tsx`
- possivelmente `src/components/inbox/ConversationThread.tsx`

Resultado esperado

- Nova imagem recebida aparece inline na conversa.
- Toque/clique abre a imagem dentro da própria Inbox.
- Quando a imagem completa não vier do provedor, a Inbox usa uma prévia WEBP leve e funcional.
- O sistema deixa de depender de URLs temporárias quebradas do WhatsApp.

Detalhes técnicos

- O problema não é o banco “sem espaço”; é a origem/transformação da mídia antes do frontend renderizar.
- Vou seguir o fallback que você escolheu: usar original completa quando disponível e cair para thumbnail processada em WEBP quando necessário.
- Não vou prometer correção retroativa do histórico antigo; o foco é estabilizar as novas mensagens recebidas.
