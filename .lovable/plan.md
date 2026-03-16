
Objetivo
- Corrigir o tratamento de mídia recebida no Inbox para que fotos apareçam como foto, não como “Documento”.
- Garantir que o horário no card da conversa continue aparecendo corretamente quando a última interação for uma mídia.

Diagnóstico confirmado
- O problema principal está no backend que arquiva mensagens recebidas do WhatsApp.
- Nos logs do webhook, a mensagem recebida traz a URL da mídia dentro de `message.content.URL` e o tipo real vem como áudio/foto/mídia.
- Porém a função `whatsapp-webhook` hoje extrai mídia só de campos rasos (`msg.mediaUrl`, `msg.url`, `payload.data...`) e ignora `message.content`.
- Resultado:
  - `file_url` fica ausente no `metadata`
  - o tipo cai em fallback incorreto e/ou vira `document`
  - no chat o `MessageMedia` não consegue renderizar imagem porque depende de `metadata.file_url`
  - a conversa salva `last_message_preview = "Documento"` e isso também impacta o card da lista

Evidências vistas
- No banco, as últimas mensagens da conversa `1c5215bb...` estão sendo gravadas como:
  - `message_type = document`
  - `content = Documento`
  - `metadata = { raw_type: "media" }`
- Ou seja: a mídia está chegando, mas está sendo arquivada sem URL, mime type e nome de arquivo.
- Como o card usa `last_message_at` + `last_message_type`, o horário pode “sumir” visualmente em cenários onde o cabeçalho fica comprimido junto com preview/badges de mídia; preciso reforçar isso também no layout.

O que vou ajustar
1. Corrigir extração de mídia no `whatsapp-webhook`
- Expandir `extractMediaMetadata` para ler também `payload.message.content`.
- Mapear corretamente:
  - `content.URL` -> `file_url`
  - `content.mimetype` -> `mime_type`
  - `content.fileLength` -> `size_bytes`
  - `content.seconds` -> `duration_seconds`
  - demais campos úteis quando existirem
- Ler também `message.mediaType` / `message.messageType` para classificar corretamente imagem, áudio, vídeo e documento.

2. Corrigir classificação do tipo de mensagem
- Ajustar `inferMessageType` para reconhecer melhor:
  - `image` / `ImageMessage`
  - `audio` / `AudioMessage` / `ptt`
  - `video` / `VideoMessage`
  - documentos reais
- Evitar o fallback genérico para `document` quando a mensagem for claramente foto/áudio/vídeo.

3. Preservar preview e card da lista
- Com `message_type` correto, a trigger já deve gerar preview mais adequado (`Foto`, `Áudio`, etc.).
- Vou revisar o layout do timestamp no `ConversationList` para garantir que ele continue visível mesmo com previews de mídia e badges ativos.

4. Compatibilidade com mensagens já salvas incorretamente
- Como as mensagens antigas já estão gravadas sem metadados, o conserto principal valerá para novas mídias.
- Se fizer sentido no fluxo atual, posso incluir um fallback visual no frontend para exibir melhor itens de mídia sem `file_url`, mas o ganho real vem do webhook.

Arquivos envolvidos
- `supabase/functions/whatsapp-webhook/index.ts`
- `src/components/inbox/ConversationList.tsx`
- possivelmente `src/components/inbox/ConversationThread.tsx` apenas para fallback visual leve

Resultado esperado
- Quando o lead enviar uma foto:
  - a mensagem entra como `image`
  - a imagem aparece dentro da conversa
  - o preview do card mostra algo como foto/mídia correta, não “Documento”
  - o horário ao lado do nome continua visível no card

Validação
- Pedir nova foto de teste no `/corretor/inbox`
- Confirmar no chat que a imagem renderiza
- Confirmar no card da conversa que:
  - o preview mudou de “Documento” para o tipo correto
  - o horário aparece ao lado do nome
- Conferir também áudio e vídeo para não quebrar o restante da Inbox

Detalhe técnico
- O problema não parece ser no componente `MessageMedia`; ele já renderiza corretamente se receber `metadata.file_url`.
- O bug está antes: a função que arquiva a mensagem recebida não está montando os metadados certos a partir do payload real da UAZAPI.
