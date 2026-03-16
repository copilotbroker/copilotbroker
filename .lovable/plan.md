
Objetivo
- Mostrar miniaturas no Inbox para mídias recebidas/enviadas:
  - imagem com preview visível
  - vídeo com thumbnail
- Manter a lista leve e sem quebrar o layout atual.

O que já existe
- A thread da conversa já renderiza imagem e vídeo usando `metadata.file_url` e `metadata.thumbnail_url`.
- O webhook já tenta salvar `file_url` e `thumbnail_url` no `metadata`.
- A lista (`ConversationList.tsx`) hoje mostra apenas texto/emoji no preview da última mensagem.

Plano de implementação
1. Melhorar o card da conversa no Inbox
- Atualizar `ConversationList.tsx` para detectar quando `last_message_type` for `image` ou `video`.
- Exibir uma miniatura pequena no preview do card:
  - imagem: usar `file_url` ou `thumbnail_url`
  - vídeo: priorizar `thumbnail_url`; se não houver, mostrar fallback visual de vídeo
- Manter o texto ao lado/abaixo da thumbnail para legenda/nome do arquivo quando existir.

2. Levar os metadados da última mídia para a lista
- Revisar `useConversations` para garantir que a lista tenha acesso não só a `last_message_type` e `last_message_preview`, mas também aos metadados da última mensagem (`file_url`, `thumbnail_url`, `file_name`).
- Se hoje a tabela `conversations` não guarda isso diretamente, buscar junto da última mensagem na carga das conversas e anexar ao objeto exibido na UI.

3. Padronizar fallbacks
- Imagem sem URL válida: mostrar placeholder com ícone de foto.
- Vídeo sem thumbnail: mostrar card com ícone de play/filme.
- Documento/áudio continuam com o comportamento atual, sem thumbnail real.

4. Preservar performance
- Thumbnail pequena, com `object-cover`, dimensões fixas e `loading="lazy"` quando aplicável.
- Não carregar galeria nem mídia completa no card; só a miniatura necessária.
- Continuar priorizando ordenação, unread badge e horário sem deslocar o layout.

5. Compatibilizar com mensagens antigas e novas
- Novas mensagens devem aproveitar os metadados já gravados pelo webhook.
- Mensagens antigas sem `thumbnail_url` ainda terão fallback visual, sem quebrar a interface.

Arquivos envolvidos
- `src/components/inbox/ConversationList.tsx`
- `src/hooks/use-conversations.ts`
- possivelmente `src/components/inbox/ConversationThread.tsx` apenas para reaproveitar helpers visuais
- possivelmente `supabase/functions/whatsapp-webhook/index.ts` se eu identificar necessidade de enriquecer thumbnail para vídeos recebidos

Resultado esperado
- Na lista do Inbox, quando a última mensagem for foto, aparece uma miniatura da imagem.
- Quando for vídeo, aparece uma thumbnail do vídeo ou um fallback visual consistente.
- O usuário consegue identificar rapidamente do que se trata a mídia antes de abrir a conversa.

Detalhe técnico
- O ponto principal não é a thread, e sim fazer a lista conhecer os metadados da última mensagem.
- Vou seguir uma abordagem segura: enriquecer o objeto da conversa com dados da última mensagem e renderizar um preview compacto no card, sem alterar a lógica principal do chat.
