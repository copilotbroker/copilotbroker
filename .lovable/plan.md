
Objetivo
- Fazer todas as mídias novas da Inbox funcionarem inline, no estilo WhatsApp: imagem abre como miniatura no chat, vídeo toca no próprio chat, áudio toca no próprio chat e documentos exibem um card consistente.
- Eliminar os casos em que a mídia chega mas não abre, não baixa e não renderiza.

O que confirmei
- O chat já tenta renderizar inline quando existe `metadata.file_url`.
- O webhook já tenta copiar a mídia recebida para o bucket público `project-media`.
- Mesmo assim, há falha prática no fluxo: a miniatura continua quebrando e, em alguns casos, nem o clique funciona.
- O replay mostra que em pelo menos alguns casos a imagem já chegou com URL pública do bucket e renderizou inline, então o problema atual é de robustez/inconsistência, não de ausência total do recurso.
- Há também warnings de React sobre `ref` em componentes de função, incluindo `MessageMedia`, então vou aproveitar para endurecer o componente e remover esse ruído que pode afetar wrappers do Radix/UI.

Plano de implementação

1. Reforçar o pipeline de mídia no webhook
- Revisar o ponto onde a mídia inbound é persistida para garantir que novas mensagens sempre saiam com:
  - `message_type` correto
  - `metadata.file_url`
  - `metadata.storage_path`
  - `metadata.mime_type`
  - `metadata.file_name`
- Melhorar fallback quando a URL externa não puder ser buscada:
  - registrar claramente no log o motivo
  - manter metadados coerentes para o frontend decidir como exibir
- Garantir que imagens, vídeos e áudios não caiam como `document` por erro de classificação.

2. Padronizar URLs exibíveis no frontend
- No `ConversationThread`, criar uma resolução única da mídia:
  - priorizar URL pública do bucket
  - aceitar `thumbnail_url` apenas como apoio visual
  - evitar depender de links temporários ou formatos não exibíveis no navegador
- Se houver mídia válida mas sem preview possível, mostrar um card inline consistente com ação explícita de abrir.

3. Melhorar a experiência inline “estilo WhatsApp”
- Imagem:
  - bolha com miniatura real
  - clique para abrir visualização ampliada em modal/lightbox dentro da própria interface
  - opção secundária de abrir em nova aba / baixar
- Vídeo:
  - player inline com poster/thumbnail quando houver
- Áudio:
  - player inline mais estável
- Documento:
  - card inline com nome, tipo e ação de abrir/baixar

4. Adicionar viewer inline para mídia
- Criar um visualizador simples no `ConversationThread` para abrir imagem/vídeo sem sair da conversa.
- Isso evita o comportamento atual de “clicar e nada útil acontecer” ou depender de download do navegador.

5. Tornar o componente de mídia mais resiliente
- Refatorar `MessageMedia` para lidar melhor com:
  - ausência parcial de metadados
  - MIME inconsistente
  - conteúdo/caption junto da mídia
  - erro de carregamento de imagem
- Quando uma miniatura falhar ao carregar, cair para um card inline com ação de abrir, em vez de sumir.

6. Limpar warnings de ref relacionados ao chat
- Revisar o uso de componentes dentro de `ConversationThread` e `CreateLeadFromChatModal` que hoje recebem `ref` sem `forwardRef`.
- Isso não é a causa principal da mídia, mas reduzirá ruído e risco de comportamento estranho em wrappers de diálogo/renderização.

Arquivos envolvidos
- `supabase/functions/whatsapp-webhook/index.ts`
- `src/components/inbox/ConversationThread.tsx`
- possivelmente `src/components/inbox/CreateLeadFromChatModal.tsx`
- possivelmente `src/components/ui/aspect-ratio.tsx` ou outro wrapper UI caso seja o componente sem `forwardRef`

Resultado esperado
- Para novas mídias recebidas:
  - foto aparece como miniatura na conversa
  - clique abre visualização inline ampliada
  - vídeo e áudio funcionam inline
  - documento continua acessível com card claro
  - o corretor não depende de baixar arquivo para ver a mídia

Detalhes técnicos
- Não vou planejar correção retroativa do histórico antigo, apenas das novas mídias, conforme sua escolha.
- O bucket `project-media` já é público, então o foco está em robustez do salvamento e da renderização, não em infraestrutura nova.
- Vou manter o caminho persistente no storage como fonte principal, evitando depender de URLs externas instáveis ou expiradas.
