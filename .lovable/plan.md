
Objetivo
- Fazer imagens recebidas do lead aparecerem como miniatura inline na conversa, mantendo também a opção de abrir/baixar.

O que identifiquei
- O componente do chat já sabe renderizar miniatura quando a mensagem chega com:
  - `message_type = "image"`
  - `metadata.file_url`
- Hoje isso ainda falha em parte dos recebimentos porque o webhook salva a mídia com URL do WhatsApp/UAZAPI (`mmg.whatsapp.net ... .enc`), que normalmente não é exibível direto no navegador.
- Resultado: o frontend cai no comportamento de arquivo/documento, exigindo clique/download em vez de preview inline.

Como vou corrigir
1. Ajustar o webhook de entrada de mídia
- No `whatsapp-webhook`, além de detectar `message.content.URL` e MIME corretamente, vou tratar imagens recebidas de forma especial:
  - baixar a mídia no backend
  - salvar no bucket `project-media`
  - gravar no `metadata.file_url` a URL pública do arquivo salvo
- Vou manter também metadados úteis como `mime_type`, `file_name`, `size_bytes` e, quando existir, `thumbnail_url`.

2. Garantir classificação correta de imagem
- Reforçar a lógica de tipo para reconhecer imagem por:
  - `messageType`
  - `mediaType`
  - `mimetype`
- Isso evita que foto entre como `document`.

3. Melhorar fallback visual no chat
- Mesmo quando faltar algum campo secundário, o `ConversationThread` continuará priorizando renderizar `<img>` para mensagens `image`.
- Vou preservar o clique na miniatura para abrir a imagem em tamanho maior/nova aba, sem remover o comportamento de download.

4. Validar impacto no card da conversa
- Como `last_message_type` e preview já dependem do tipo salvo, a lista deve passar a mostrar mídia de forma mais correta para novas imagens recebidas.

Arquivos envolvidos
- `supabase/functions/whatsapp-webhook/index.ts`
- `src/components/inbox/ConversationThread.tsx`

Abordagem técnica
- Usar o bucket público já existente `project-media`.
- Fazer upload do binário da imagem recebida no backend em vez de confiar na URL criptografada externa.
- Salvar a URL pública final na mensagem arquivada para que a miniatura funcione direto no chat.

Resultado esperado
- Quando o lead enviar uma foto nova:
  - ela aparecerá dentro da bolha da conversa como miniatura
  - o corretor poderá clicar para abrir a imagem
  - não precisará baixar o arquivo só para visualizar

Validação
- Pedir uma nova imagem de teste pelo WhatsApp
- Confirmar no Inbox que a foto aparece inline
- Confirmar que clicar na miniatura abre a imagem
- Confirmar que outras mídias, como áudio e documento, continuam funcionando normalmente
