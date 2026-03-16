
Objetivo

Fazer com que imagens novas recebidas do lead apareçam inline na Inbox e abram corretamente, sem depender de download manual.

Diagnóstico

- O frontend já tenta renderizar imagem inline quando a mensagem vem com `message_type = "image"` e `metadata.file_url`.
- No banco, as mensagens inbound recentes já estão chegando com `file_url` público do bucket e `storage_path`.
- O problema real está antes da UI: o webhook está copiando para o bucket o conteúdo bruto vindo de URLs `mmg.whatsapp.net ... .enc`.
- Essas URLs são de mídia criptografada/temporária. Hoje o código faz `fetch(sourceUrl)` e sobe o binário retornado como se fosse JPG/WEBP.
- Evidência: a URL pública salva existe, mas ao abrir diretamente ela não renderiza a imagem; o arquivo hospedado ficou inutilizável para preview.
- Há também um warning de `ref` envolvendo `MessageMedia`/`Dialog`, que não parece ser a causa principal da imagem quebrada, mas vale corrigir junto.

Plano

1. Corrigir a origem da mídia no webhook
- Revisar `persistInboundMediaIfNeeded` para parar de tratar a URL `.enc` como arquivo final renderizável.
- Priorizar uma fonte de mídia decodificada do provedor:
  - usar payload já resolvido se vier binário/base64/url final
  - senão chamar o endpoint correto do provedor para download de mídia real, com os fallbacks de autenticação já usados no projeto
- Só fazer upload para `project-media` quando o retorno for mídia válida de verdade.

2. Validar o arquivo antes de salvar
- Antes do upload, validar:
  - `content-type` real
  - extensão coerente
  - assinatura básica do arquivo para imagem (`jpg/png/webp`) quando aplicável
- Se vier conteúdo inválido/encriptado:
  - não salvar `file_url` pública “quebrada”
  - registrar log claro para depuração
  - manter metadados de fallback sem fingir que a mídia está pronta para preview

3. Endurecer os metadados salvos
- Garantir que novas mensagens só saiam do webhook com preview inline quando houver:
  - `metadata.file_url` válido
  - `metadata.storage_path`
  - `metadata.mime_type`
  - `metadata.file_name`
  - `metadata.is_inline_ready = true`
- Se não houver mídia renderizável, deixar isso explícito nos metadados para o frontend cair num fallback consistente.

4. Melhorar a renderização no chat
- Ajustar `MessageMedia` para:
  - confiar primeiro em arquivos marcados como inline-ready
  - lidar melhor com falha de carregamento
  - mostrar fallback inline claro quando a URL não for exibível
- Corrigir o uso do viewer/modal para remover o warning de `ref` e evitar interferência no clique/abertura.

5. Validar ponta a ponta
- Enviar uma nova imagem pelo WhatsApp após a correção.
- Confirmar:
  - miniatura aparece na bolha
  - clique abre a imagem ampliada
  - abrir em nova aba funciona
  - download funciona
- Como você escolheu “só novas”, mensagens antigas já salvas com binário inválido não serão restauradas automaticamente.

Arquivos envolvidos

- `supabase/functions/whatsapp-webhook/index.ts`
- `src/components/inbox/MessageMedia.tsx`
- `src/components/inbox/ConversationThread.tsx`

Detalhes técnicos

- Não vejo necessidade de mudar banco, RLS ou bucket neste ajuste.
- O bucket `project-media` já é público; o problema não é permissão, e sim que o arquivo salvo nele está vindo da fonte errada.
- Gerar signed URL não resolve este caso específico, porque a URL pública já existe; o arquivo armazenado é que está inválido para renderização.
